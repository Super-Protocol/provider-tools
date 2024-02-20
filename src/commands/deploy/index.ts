import { Command } from 'commander';

import { ConfigCommandParam } from '../types';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import inquirer from 'inquirer';
import { DeployQuestions, IDeployAnswers } from './questions';
import { SshConfig } from '../../common/config';
import { createSshService } from '../../services/ssh';
import path from 'path';
import { DEFAULT_DEPLOY_DESTINATION_FOLDER_PATH } from '../../common/constant';

type CommandParams = ConfigCommandParam & {
  tee: boolean;
  path: string;
};

const COMMAND_NAME = 'deploy';
const logger = createLogger().child({ command: COMMAND_NAME });

const updatedSshConfig = (
  answers: Partial<IDeployAnswers['giveUsSshConnectionInfo']> = {},
): Partial<SshConfig> => {
  return {
    ...(answers.pathToPrivateKey && {
      pathToPrivateKey: answers.pathToPrivateKey,
    }),
    ...(answers.user && {
      user: answers.user,
    }),
    ...(answers.port && {
      port: Number.parseInt(answers.port),
    }),
    ...(answers.host && {
      host: answers.host,
    }),
  };
};

const prepareSshConfig = async (config: ConfigLoader): Promise<void> => {
  const sshConfig = config.loadSection('sshConfig');
  const answers = (await inquirer.prompt(
    DeployQuestions.giveUsSshConnectionInfo(sshConfig),
  )) as IDeployAnswers;
  const updatedConfig = updatedSshConfig(answers.giveUsSshConnectionInfo);
  if (Object.keys(updatedConfig).length) {
    config.updateSection('sshConfig', {
      ...sshConfig,
      ...updatedConfig,
    });
  }
};

export const DeployCommand = new Command()
  .name(COMMAND_NAME)
  .description('deploy provider')
  .requiredOption('--tee', 'specified type of provider', false)
  .requiredOption('--path <deploy-config.yaml>', 'path to deploy config file')
  .action(async (options: CommandParams): Promise<void> => {
    if (!options.tee) {
      return logger.error(
        'At least one of supported provider types should be specified. Please try to run command again and have specified the "--tee" param.',
      );
    }
    const config = new ConfigLoader(options.config);

    await prepareSshConfig(config);

    const service = await createSshService({ config });

    try {
      const source = path.resolve(options.path);
      const filename = path.basename(source);
      const destination = path.join(DEFAULT_DEPLOY_DESTINATION_FOLDER_PATH, filename);
      await service.copyFile(source, destination);
      logger.info(`${options.path} was coped to the remote host`);
    } catch (err) {
      logger.error({ err }, `Copy file ${options.path} was failed`);
    }
  });
