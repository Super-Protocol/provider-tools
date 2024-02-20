import { Command } from 'commander';

import { ConfigCommandParam } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import processOffer from './tee.offer.process';
import processProvider from './provider.process';
import buildDeployConfig from './buildDeployConfig';

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
  .option('--tee', 'tee type of provider', false)
  .option('--value', 'value type of provider', false)
  .option('--backend-url <url>', 'backend url')
  .option('--blockchain-url <url>', 'blockchain url')
  .option('--contract-address <address>', 'contract address')
  .action(async (options: CommandParams): Promise<void> => {
    if (!options.tee || !options.value) {
      return logger.error(
        'Please specify at least one of the supported provider types by including either the --tee or --value option when you run the command again.',
      );
    }
    const config = new ConfigLoader(options.config);
    const service = await createSpctlService({
      logger,
      config,
      backendUrl: options.backendUrl,
      blockchainUrl: options.blockchainUrl,
      contractAddress: options.contractAddress,
    });

    await processProvider(config, service, logger);
    const offerId = await processOffer(config, service, logger);
    if (!offerId) {
      return logger.info('Upss...Something went wrong. Offer was not created well.');
    }

    const deployConfigPath = await buildDeployConfig({ config });
    logger.info(
      `deploy-config was saved to ${deployConfigPath}. You can edit it manually before run "deploy" command if it's needed.`,
    );
  });
