import * as fs from 'fs';
import semver from 'semver';
import axios from 'axios';
import { ILogger } from '../../common/logger';
import * as Progress from '../../common/progress';
import { SPCTL_MIN_COMPATIBLE_VERSION } from '../../common/constant';
import { PathLike } from 'fs-extra';
import { createSpctlService } from '../spctl';
import { ConfigLoader } from '../../common/loader.config';
import { getDownloadUrl, hasUpdates } from '../checkReleaseVersion';
import { KnownTool } from '../../common/config';

const DOWNLOADING_PROGRESS = `Downloading ${KnownTool.SPCTL}`;

type DownloadSpctlParams = Omit<CheckAndDownloadSpctlParams, 'configLoader'> & { version: string };

const downloadSPCTL = async (params: DownloadSpctlParams): Promise<void> => {
  const { logger, destination } = params;
  const url = getDownloadUrl(params.version, KnownTool.SPCTL);
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
  let currentVersion = '';
  if (fs.existsSync(destination)) {
    logger?.trace(
      `${KnownTool.SPCTL} already exists at ${destination}. Making comparison with latest version...`,
    );
    const service = await createSpctlService({
      logger,
      config: params.configLoader,
    });
    currentVersion = (await service.getVersion()).replace('\n', '');
  }
  const updateInfo = await hasUpdates(params.configLoader, KnownTool.SPCTL, currentVersion);
  if (updateInfo.hasNewVersion && updateInfo.version && isCompatible(updateInfo.version)) {
    logger?.debug(`Downloading ${KnownTool.SPCTL} v.${updateInfo.version} to ${destination}`);
    await downloadSPCTL({
      logger: params.logger,
      destination: params.destination,
      version: updateInfo.version,
    }).catch((err) => {
      logger?.error({ err }, `Failed to check or download ${KnownTool.SPCTL}`);
    });

    logger?.debug(`Successfully downloaded ${KnownTool.SPCTL} to ${destination}`);
  } else if (!currentVersion) {
    throw Error(
      `Resource for downloading was not found and you do not have any downloaded ${KnownTool.SPCTL} tool version yet. The program will be closed.`,
    );
  } else if (!isCompatible(currentVersion)) {
    throw Error(
      `Installed ${KnownTool.SPCTL} v${currentVersion} is not compatible with v${SPCTL_MIN_COMPATIBLE_VERSION}`,
    );
  }
};

const isCompatible = (version: string): boolean => {
  const checked = semver.clean(version);
  const compatible = semver.clean(SPCTL_MIN_COMPATIBLE_VERSION);

  if (!(checked && compatible)) {
    return false;
  }

  return semver.gte(checked, compatible);
};
