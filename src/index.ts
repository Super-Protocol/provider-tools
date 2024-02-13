import { Command } from 'commander';
import { processSubCommands, RegisterCommand, SetupCommand } from './commands';
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_VERSION,
  CONFIG_DEFAULT_FILENAME,
  SPCTL_LOCATION_PATH,
} from './common/constant';
import { createLogger } from './common/logger';
import { ConfigLoader } from './common/loader.config';
import { getConfigPath, getRawConfig } from './common/config';
import { checkAndDownloadSpctl } from './services/download';

const logger = createLogger({
  options: {
    ...getRawConfig(getConfigPath(), false)?.logger,
    name: APP_NAME,
  },
});
const main = async (): Promise<void> => {
  await ConfigLoader.init(logger);

  const program = new Command().name(APP_NAME).description(APP_DESCRIPTION).version(APP_VERSION);

  program.hook('preAction', async (_thisCommand, actionCommand): Promise<void> => {
    if (actionCommand.name() === 'setup') {
      return;
    }

    const configPath = actionCommand.opts().config;

    try {
      await checkAndDownloadSpctl({
        logger,
        destination: SPCTL_LOCATION_PATH,
        configLoader: new ConfigLoader(configPath),
      });
    } catch (err) {
      logger.error(err, 'download spctl has been failed');
      throw err;
    }
  });

  program.addCommand(SetupCommand);
  program.addCommand(RegisterCommand);

  processSubCommands(program, (command) => {
    command.helpCommand('--help -h', 'Display help for the command');
    if (!command.commands.length) {
      command.option(
        '--config <configPath>',
        'Path to the configuration file',
        `${CONFIG_DEFAULT_FILENAME}`,
      );
    }
  });

  await program.parseAsync(process.argv);
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err: unknown) => {
    logger.error({ err }, 'Something went wrong');
  });
