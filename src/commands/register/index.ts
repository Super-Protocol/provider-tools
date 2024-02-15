import { Command } from 'commander';
import { ConfigCommandParam } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { registerTeeProvider } from '../../services/register';

type CommandParams = ConfigCommandParam & {
  tee: boolean;
  url: string;
};

const COMMAND_NAME = 'register';
const logger = createLogger().child({ command: COMMAND_NAME });

export const RegisterCommand = new Command()
  .name(COMMAND_NAME)
  .description('register tee-provider')
  .requiredOption('--tee', 'specified type of provider', false)
  .requiredOption('--url <url>', 'backend url')
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
      backendUrl: options.url,
    });

    await registerTeeProvider({
      accounts: config.loadSection('account'),
      service,
      logger,
    });
  });
