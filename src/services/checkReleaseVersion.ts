import axios from 'axios';
import semver from 'semver';

import {
  ARCH_MATCH,
  LATEST_RELEASE_URL_TEMPLATE,
  MILLISECONDS_IN_DAY,
  OS_MATCH,
  REPO_DOWNLOAD_URL_TEMPLATE,
  REPO_MATCH,
  TOOL_NAME_MATCH,
  VERSION_MATCH,
} from '../common/constant';
import { ConfigLoader } from '../common/loader.config';
import { getOSAndArch } from './download/utils';
import { KnownTool } from '../common/config';

export const getDownloadUrl = (version: string, repoName: string, toolName: string): string => {
  const osAndArch = getOSAndArch();

  return REPO_DOWNLOAD_URL_TEMPLATE.replace(REPO_MATCH, repoName)
    .replace(VERSION_MATCH, version)
    .replace(TOOL_NAME_MATCH, toolName)
    .replace(OS_MATCH, osAndArch.platform)
    .replace(ARCH_MATCH, osAndArch.arch);
};

export const getLatestReleaseUrl = (repoName: string): string =>
  LATEST_RELEASE_URL_TEMPLATE.replace(REPO_MATCH, repoName);

export type HasNewVersionReturnType = {
  hasNewVersion: boolean;
  version?: string;
};

export const hasUpdates = async (
  configLoader: ConfigLoader,
  repoName: KnownTool,
  currentVersion?: string,
): Promise<HasNewVersionReturnType> => {
  const metadata = configLoader.loadSection('metadata');
  const toolMetadata = metadata?.[repoName];

  if (!toolMetadata || !Number.isSafeInteger(toolMetadata.lastCheckForUpdates)) {
    configLoader.updateSection('metadata', {
      ...metadata,
      [repoName]: {
        lastCheckForUpdates: Date.now(),
      },
    });
  } else if (toolMetadata.lastCheckForUpdates + MILLISECONDS_IN_DAY > Date.now()) {
    return {
      hasNewVersion: false,
      version: currentVersion,
    };
  }

  try {
    const latestReleaseUrl = getLatestReleaseUrl(repoName);
    const response = await axios.get(latestReleaseUrl);
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
  } catch {
    return {
      hasNewVersion: false,
      version: currentVersion,
    };
  }
};
