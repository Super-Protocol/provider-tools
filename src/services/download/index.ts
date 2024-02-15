import * as fs from 'fs';
import semver from 'semver';
import axios from 'axios';
import { getOSAndArch } from './utils';
import { ILogger } from '../../common/logger';
import * as Progress from '../../common/progress';
import { SPCTL_LATEST_RELEASE_URL, SPCTL_MIN_COMPATIBLE_VERSION } from '../../common/constant';
import { PathLike } from 'fs-extra';
import { createSpctlService } from '../spctl';
import { ConfigLoader } from '../../common/loader.config';

const DOWNLOADING_PROGRESS = 'Downloading spctl';

const VERSION_MATCH = '{{version}}';
const OS_MATCH = '{{os}}';
const ARCH_MATCH = '{{arch}}';

const SPCTL_DOWNLOAD_URL_TEMPLATE = `https://github.com/Super-Protocol/ctl/releases/download/v${VERSION_MATCH}/spctl-${OS_MATCH}-${ARCH_MATCH}`;

type DownloadSpctlParams = Omit<CheckAndDownloadSpctlParams, 'configLoader'> & { version: string };
const downloadSPCTL = async (params: DownloadSpctlParams): Promise<void> => {
  const { logger, destination } = params;
  const osAndArch = getOSAndArch();
  const url = SPCTL_DOWNLOAD_URL_TEMPLATE.replace(VERSION_MATCH, params.version)
    .replace(OS_MATCH, osAndArch.platform)
    .replace(ARCH_MATCH, osAndArch.arch);
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
    let currentVersion = '';
    if (fs.existsSync(destination)) {
      logger?.trace(
        `spctl already exists at ${destination}. Making comparison with latest version...`,
      );
      const service = await createSpctlService({
        logger,
        config: params.configLoader,
      });
      currentVersion = (await service.getVersion()).replace('\n', '');
    }
    const updateInfo = await hasNewVersion(currentVersion);
    if (updateInfo.hasNewVersion && updateInfo.version && isCompatible(updateInfo.version)) {
      logger?.debug(`Downloading spctl v.${updateInfo.version} to ${destination}`);
      await downloadSPCTL({
        logger: params.logger,
        destination: params.destination,
        version: updateInfo.version,
      }).catch((err) => {
        logger?.error({ err }, 'Failed to check or download spctl');
      });

      logger?.debug(`Successfully downloaded spctl to ${destination}`);
    } else if (!currentVersion) {
      logger?.error(
        'Resource for downloading was not found and you do not have any downloaded spctl-tool version yet. The program will be closed.',
      );
      process.exit(0);
    } else if (!isCompatible(currentVersion)) {
      logger?.error(
        `Installed spctl v${currentVersion}is not compatible with v${SPCTL_MIN_COMPATIBLE_VERSION}`,
      );
      process.exit(0);
    }
  } catch (err) {
    logger?.error({ err }, 'Failed to check or download spctl');

    throw err;
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

type GasNewVersionReturnType = {
  hasNewVersion: boolean;
  version?: string;
};
export const hasNewVersion = async (currentVersion?: string): Promise<GasNewVersionReturnType> => {
  try {
    const response = await axios.get(SPCTL_LATEST_RELEASE_URL);
    const latestVersion = semver.clean(response.data.tag_name);

    if (!latestVersion) {
      return {
        hasNewVersion: false,
        version: currentVersion,
      };
    }

    return {
      hasNewVersion: !currentVersion || semver.gt(latestVersion, currentVersion),
      version: latestVersion,
    };
  } catch (error) {
    return {
      hasNewVersion: false,
      version: currentVersion,
    };
  }
};
