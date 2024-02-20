import { Command } from 'commander';
import { processSubCommands, RegisterCommand, SetupCommand } from './commands';
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_VERSION,
  CONFIG_DEFAULT_FILENAME,
  NODE_ENV_DEV,
  SPCTL_SUFFIX,
  TOOL_DIRECTORY_PATH,
} from './common/constant';
import { createLogger } from './common/logger';
import { ConfigLoader } from './common/loader.config';
import { getConfigPath, getRawConfig, KnownTool } from './common/config';
import { checkAndDownloadSpctl } from './services/download';
import { getDownloadUrl, hasUpdates } from './services/checkReleaseVersion';
import path from 'path';

const options = getRawConfig(getConfigPath(), false)?.logger;
const logger = createLogger({
  options: {
    ...options,
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
    const configLoader = new ConfigLoader(configPath);

    if (process.env.NODE_ENV !== NODE_ENV_DEV) {
      const updates = await hasUpdates(configLoader, KnownTool.PROVIDER, APP_VERSION);
      if (updates.hasNewVersion && updates.version) {
        const downloadUrl = getDownloadUrl(updates.version, KnownTool.PROVIDER);

        logger?.warn(
          [
            `New ${KnownTool.PROVIDER} version available! ${APP_VERSION} -> ${updates.version}.`,
            'To download the latest release use commands:',
            `curl -L ${downloadUrl} -o ${KnownTool.PROVIDER}`,
            `chmod +x ./${KnownTool.PROVIDER}`,
          ].join(' '),
        );
      }
    }

    try {
      const destination = path.resolve(TOOL_DIRECTORY_PATH, `${KnownTool.SPCTL}${SPCTL_SUFFIX}`);
      await checkAndDownloadSpctl({
        logger,
        destination: destination,
        configLoader,
      });
    } catch (err) {
      logger.error(err, `download ${KnownTool.PROVIDER} has been failed`);
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
