import * as path from 'path';
import { removeFileIfExist, writeToFile } from '../utils/file.utils';
import { createLogger, ILogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import {
  SPCTL_BACKEND_URL_DEFAULT,
  SPCTL_BLOCKCHAIN_URL_DEFAULT,
  SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT,
  TOOL_HOME_PATH,
} from '../../common/constant';
import { SpctlConfig } from '../../common/config';
import { ISpctlService, SpctlService, SpctlServiceParams } from './service';
import { createWallet } from '../utils/wallet.utils';

export interface CreateSpctlServiceOptions {
  logger?: ILogger;
  config: ConfigLoader;
  backendUrl?: string;
  blockchainUrl?: string;
  contractAddress?: string;
}
export const createSpctlService = async (
  options: CreateSpctlServiceOptions,
): Promise<ISpctlService> => {
  const prepareSpctl = async (config: SpctlConfig): Promise<void> => {
    const configPath = path.join(TOOL_HOME_PATH, 'config.json');
    await removeFileIfExist(configPath);
    await writeToFile(configPath, config);
    await writeToFile(
      `spctl-config-${createWallet(config.blockchain.authorityAccountPrivateKey).address}.json`,
      config,
    );
  };

  const buildSpctlConfig = (): SpctlConfig => {
    const spctlConfig = options.config.loadSection('spctl');
    const FAR_FUTURE = 1000 * 24 * 60 * 60 * 365;
    const accountConfig = options.config.loadSection('account');
    spctlConfig.backend.url =
      options.backendUrl ?? spctlConfig.backend.url ?? SPCTL_BACKEND_URL_DEFAULT;
    spctlConfig.blockchain.rpcUrl =
      options.blockchainUrl ?? spctlConfig.blockchain.rpcUrl ?? SPCTL_BLOCKCHAIN_URL_DEFAULT;
    spctlConfig.blockchain.smartContractAddress =
      options.contractAddress ??
      spctlConfig.blockchain.smartContractAddress ??
      SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT;
    spctlConfig.blockchain.authorityAccountPrivateKey = accountConfig.authority;
    spctlConfig.blockchain.accountPrivateKey = accountConfig.action;
    spctlConfig.metadata = {
      lastCheckForUpdates: Date.now() + FAR_FUTURE,
    };

    return spctlConfig;
  };

  const config = buildSpctlConfig();
  await prepareSpctl(config);
  const params: SpctlServiceParams = {
    locationPath: TOOL_HOME_PATH,
    logger: createLogger({
      parentLogger: options.logger,
      bindings: { module: SpctlService.name },
    }),
    config,
  };

  return new SpctlService(params);
};
