import * as fs from 'fs';
import axios from 'axios';
import { getOSAndArch } from './utils';
import { ILogger } from '../../common/logger';
import * as Progress from '../../common/progress';
import { SPCTL_DOWNLOAD_URL_PREFIX } from '../../common/constant';
import { PathLike } from 'fs-extra';
import { createSpctlService } from '../spctl';
import { ConfigLoader } from '../../common/loader.config';

const DOWNLOADING_PROGRESS = 'Downloading spctl';

type DownloadSpctlParams = Omit<CheckAndDownloadSpctlParams, 'configLoader'>;
const downloadSPCTL = async (params: DownloadSpctlParams): Promise<void> => {
  const { logger, destination } = params;
  const osAndArch = getOSAndArch();
  const url = SPCTL_DOWNLOAD_URL_PREFIX + osAndArch;
  const file = fs.createWriteStream(destination);

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
          fs.chmodSync(destination, 0o755);
          logger?.trace(`Downloaded ${url}`);
          resolve();
        })
        .on('error', reject);
    });
  } catch (err) {
    file.close();
    fs.unlink(destination, (err) => {
      if (err) {
        throw Error(`Failed to delete ${destination}`);
      }
      logger?.trace(`Deleted ${destination}`);
    });
  }
};

export type CheckAndDownloadSpctlParams = {
  logger?: ILogger;
  destination: PathLike;
  configLoader: ConfigLoader;
};

export const checkAndDownloadSpctl = async (params: CheckAndDownloadSpctlParams): Promise<void> => {
  const { logger, destination } = params;
  try {
    if (fs.existsSync(destination)) {
      logger?.trace(
        `spctl already exists at ${destination}. Making comparison with latest version...`,
      );
      const service = await createSpctlService({
        logger,
        config: params.configLoader,
      });
      const version = await service.getVersion();
      logger?.info(`spctl version ${version} will be used`); // TODO: if needed to make update to latest version
    } else {
      logger?.debug(`Downloading spctl to ${destination}`);
      await downloadSPCTL(params).catch((err) => {
        logger?.error({ err }, 'Failed to check or download spctl');
      });

      logger?.debug(`Successfully downloaded spctl to ${destination}`);
    }
  } catch (err) {
    logger?.error({ err }, 'Failed to check or download spctl');

    throw err;
  }
};
