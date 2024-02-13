import * as fs from 'fs-extra';
import * as path from 'path';
import { removeFileIfExist } from './utils';
import { createLogger, ILogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { TOOL_DIRECTORY_PATH } from '../../common/constant';
import { SpctlConfig } from '../../common/config';
import { ISpctlService, SpctlService, SpctlServiceParams } from './service';

export interface CreateSpctlServiceOptions {
  logger?: ILogger;
  config: ConfigLoader;
}
export const createSpctlService = async (
  options: CreateSpctlServiceOptions,
): Promise<ISpctlService> => {
  const prepareSpctl = async (config: SpctlConfig): Promise<void> => {
    const configPath = path.join(TOOL_DIRECTORY_PATH, 'config.json');
    await removeFileIfExist(configPath);
    await fs.outputFile(configPath, JSON.stringify(config));
  };

  const buildSpctlConfig = (): SpctlConfig => {
    const spctlConfig = options.config.loadSection('spctl');
    const accountConfig = options.config.loadSection('account');

    spctlConfig.blockchain.authorityAccountPrivateKey = accountConfig.authority;
    spctlConfig.blockchain.accountPrivateKey = accountConfig.action;

    return spctlConfig;
  };

  const config = buildSpctlConfig();
  await prepareSpctl(config);
  const params: SpctlServiceParams = {
    locationPath: TOOL_DIRECTORY_PATH,
    logger: createLogger({
      parentLogger: options.logger,
      bindings: { module: SpctlService.name },
    }),
    config,
  };

  return new SpctlService(params);
};
