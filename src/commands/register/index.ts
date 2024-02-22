import { Command, Argument } from 'commander';

import { ConfigCommandParam } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { process as processOffer } from './offer-processor';
import processProvider from './provider.processor';
import buildDeployConfig from './deploy-config-builder';
import { OfferType } from './types';

type CommandParams = ConfigCommandParam & {
  backendUrl: string;
  blockchainUrl: string;
  contractAddress: string;
};

const COMMAND_NAME = 'register';
const logger = createLogger().child({ command: COMMAND_NAME });

export const RegisterCommand = new Command()
  .name(COMMAND_NAME)
  .description('register provider and offers')
  .addArgument(new Argument('offerType', 'offer type').choices(['tee', 'data', 'solution']))
  .option('--backend-url <url>', 'backend url')
  .option('--blockchain-url <url>', 'blockchain url')
  .option('--contract-address <address>', 'contract address')
  .action(async (offerType: OfferType, options: CommandParams): Promise<void> => {
    const config = new ConfigLoader(options.config);
    const service = await createSpctlService({
      logger,
      config,
      backendUrl: options.backendUrl,
      blockchainUrl: options.blockchainUrl,
      contractAddress: options.contractAddress,
    });

    await processProvider({ config, service, logger });
    const offerId = await processOffer({ config, service, offerType, logger });
    if (!offerId) {
      return logger.info('Upss...Something went wrong. Offer was not created well.');
    }

    if (offerType === 'tee') {
      const deployConfigPath = await buildDeployConfig({ config });
      logger.info(
        `deploy-config was saved to ${deployConfigPath}. You can edit it manually before run "deploy" command if it's needed.`,
      );
    }
  });
