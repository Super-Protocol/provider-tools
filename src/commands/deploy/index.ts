import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigCommandParam } from '../types';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { DeployQuestions, IDeployAnswers } from './questions';
import { SshConfig } from '../../common/config';
import { createSshService } from '../../services/ssh';
import path from 'path';
import {
  DEFAULT_DEPLOY_DESTINATION_FOLDER_PATH,
  DEFAULT_DESTINATION_DEPLOY_CONFIG_FILE_NAME,
  DEFAULT_SLEEP_INTERVAL,
  DEFAULT_SLEEP_MULTIPLIER,
  DEFAULT_RETRY_COUNT,
} from '../../common/constant';
import { retryByCondition, RetryByConditionError } from '../../services/utils/retry.utils';
import {
  checkTeeOffersReady,
  CheckTeeOffersReadyItemResult,
  CheckTeeOffersReadyResult,
} from '../../services/check-tee-offer-ready';
import { createSpctlService } from '../../services/spctl';
import { sleepExpFn } from '../../services/utils/timer.utils';

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

export const prepareSshConfig = async (config: ConfigLoader): Promise<void> => {
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

    const offerIds = config.loadSection('providerOffers').map((item) => item.id);
    if (!offerIds.length) {
      return logger.warn(
        `Your config "${options.config}" has not any provider's offer. The program will be closed. Before running current command please try to run "register" command.`,
      );
    }

    const sshService = await createSshService({ config });

    try {
      const source = path.resolve(options.path);
      const destination = path.join(
        DEFAULT_DEPLOY_DESTINATION_FOLDER_PATH,
        DEFAULT_DESTINATION_DEPLOY_CONFIG_FILE_NAME,
      );
      await sshService.copyFile(source, destination);
      logger.info(`${options.path} was coped to the remote host`);
    } catch (err) {
      return logger.error({ err }, `Copy file ${options.path} was failed`);
    }

    logger.info("Waiting offers' readiness...");

    const spctlService = await createSpctlService({ logger, config });
    try {
      const predicateItemFn = (value: CheckTeeOffersReadyItemResult): boolean => value.ready;
      const predicateFn = (value: CheckTeeOffersReadyResult): boolean =>
        value.every(predicateItemFn);
      let filteredResult: CheckTeeOffersReadyResult | null = null;
      const method = async (): Promise<CheckTeeOffersReadyResult> => {
        const ids = filteredResult ? filteredResult.map((r) => r.id) : offerIds;
        const result = await checkTeeOffersReady({
          offerIds: ids,
          service: spctlService,
          logger,
        });

        filteredResult = result.filter((r) => !predicateItemFn(r));
        logger.debug(
          `time: ${new Date().toISOString()} -> ${ids.length}/${
            offerIds.length
          } are waiting...${ids.join()}`,
        );

        return result;
      };
      const sleepFn = sleepExpFn(3 * DEFAULT_SLEEP_INTERVAL, DEFAULT_SLEEP_MULTIPLIER);
      const errorLoggerFn = (err: Error, attemptNumber: number): void =>
        logger.error({ err }, `waiting offers' readiness: attempt ${attemptNumber} is failed`);

      await retryByCondition({
        method,
        retryCount: 5 * DEFAULT_RETRY_COUNT,
        sleepFn,
        predicateFn,
        errorLoggerFn,
      });
      logger.info(`Your offers [${offerIds.join()}] are ready to use.`);
    } catch (err) {
      if (err instanceof RetryByConditionError) {
        return logger.warn('Your offers are not ready yet. Please try again');
      }
      return logger.error({ err }, `Failed to wait offers' readiness`);
    }
  });
