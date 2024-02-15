import { Command } from 'commander';
import { ConfigCommandParam } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { registerTeeProvider } from '../../services/register';

type CommandParams = ConfigCommandParam & {
  tee: boolean;
  backendUrl: string;
  blockchainUrl: string;
  contractAddress: string;
};

const COMMAND_NAME = 'register';
const logger = createLogger().child({ command: COMMAND_NAME });

export const RegisterCommand = new Command()
  .name(COMMAND_NAME)
  .description('register tee-provider')
  .requiredOption('--tee', 'specified type of provider', false)
  .option('--backend-url <url>', 'backend url')
  .option('--blockchain-url <url>', 'blockchain url')
  .option('--contract-address <address>', 'contract address')
  .action(async (options: CommandParams) => {
    if (!options.tee) {
      return logger.error(
        'At least one of supported provider types should be specified. Please try to run command again and have specified the "--tee" param.',
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

    await registerTeeProvider({
      accounts: config.loadSection('account'),
      service,
      logger,
    });
  });
