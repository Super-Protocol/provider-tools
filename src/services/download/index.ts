import * as fs from 'fs';
import axios from 'axios';
import { getOSAndArch } from './utils';
import { ILogger } from '../../common/logger';
import * as Progress from '../../common/progress';

const SPCTL_URL = 'https://github.com/Super-Protocol/ctl/releases/download/v0.8.6/spctl-';
const SPCTL_PATH = './tool/spctl';
const DOWNLOADING_PROGRESS = 'Downloading spctl';

const downloadSPCTL = async (logger?: ILogger): Promise<void> => {
  const osAndArch = getOSAndArch();
  const url = SPCTL_URL + osAndArch;
  const file = fs.createWriteStream(SPCTL_PATH);

  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const fileSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    Progress.start(DOWNLOADING_PROGRESS, fileSize, downloadedSize);

    response.data.on('data', (chunk: Buffer) => {
      downloadedSize += chunk.length;
      Progress.start(DOWNLOADING_PROGRESS, fileSize, downloadedSize);
    });
    response.data.pipe(file);

    return new Promise((resolve, reject): void => {
      file
        .on('finish', () => {
          file.close();
          Progress.stop();
          fs.chmodSync(SPCTL_PATH, 0o755);
          logger?.trace(`Downloaded ${url}`);
          resolve();
        })
        .on('error', reject);
    });
  } catch (err) {
    file.close();
    fs.unlink(SPCTL_PATH, (err) => {
      if (err) {
        throw Error(`Failed to delete ${SPCTL_PATH}`);
      }
      logger?.trace(`Deleted ${SPCTL_PATH}`);
    });
  }
};

export const checkAndDownloadSPCTL = async (logger?: ILogger): Promise<void> => {
  try {
    if (fs.existsSync(SPCTL_PATH)) {
      logger?.debug(`spctl already exists at ${SPCTL_PATH}`);
    } else {
      logger?.debug(`Downloading spctl to ${SPCTL_PATH}`);
      await downloadSPCTL(logger).catch((err) => {
        logger?.error({ err }, 'Failed to check or download spctl');
      });

      logger?.debug(`Successfully downloaded spctl to ${SPCTL_PATH}`);
    }
  } catch (err) {
    logger?.error({ err }, 'Failed to check or download spctl');

    throw err;
  }
};
