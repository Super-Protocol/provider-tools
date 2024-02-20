import { Command, Argument } from 'commander';

import { ConfigCommandParam } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import processTeeOffer from './tee.offer.process';
import processValueOffer from './value.offer.process';
import processProvider from './provider.process';
import buildDeployConfig from './buildDeployConfig';
import { ProviderType } from './types';

type CommandParams = ConfigCommandParam & {
  tee: boolean;
  value: boolean;
  backendUrl: string;
  blockchainUrl: string;
  contractAddress: string;
};

const COMMAND_NAME = 'register';
const logger = createLogger().child({ command: COMMAND_NAME });

export const RegisterCommand = new Command()
  .name(COMMAND_NAME)
  .description('register provider')
  .addArgument(new Argument('providerType', 'provider type').choices(['tee', 'value']))
  .option('--backend-url <url>', 'backend url')
  .option('--blockchain-url <url>', 'blockchain url')
  .option('--contract-address <address>', 'contract address')
  .action(async (providerType: ProviderType, options: CommandParams): Promise<void> => {
    const config = new ConfigLoader(options.config);
    const service = await createSpctlService({
      logger,
      config,
      backendUrl: options.backendUrl,
      blockchainUrl: options.blockchainUrl,
      contractAddress: options.contractAddress,
    });
    const processOffer = providerType === 'value' ? processValueOffer : processTeeOffer;

    await processProvider({ config, service, logger });
    const offerId = await processOffer(config, service, logger);
    if (!offerId) {
      return logger.info('Upss...Something went wrong. Offer was not created well.');
    }

    const deployConfigPath = await buildDeployConfig({ config });
    logger.info(
      `deploy-config was saved to ${deployConfigPath}. You can edit it manually before run "deploy" command if it's needed.`,
    );
  });
