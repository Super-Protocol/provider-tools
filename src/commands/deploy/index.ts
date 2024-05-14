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
import { sortOffers } from '../register/deploy-config-builder/utils';

type CommandParams = ConfigCommandParam & {
  tee: boolean;
  path: string;
};

const COMMAND_NAME = 'deploy';

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
    ...(answers.requiredPassphrase && {
      requiredPassphrase: answers.requiredPassphrase,
    }),
  };
};

export const prepareSshConfig = async (
  config: ConfigLoader,
): Promise<IDeployAnswers['giveUsSshConnectionInfo']> => {
  let sshConfig = config.loadSection('sshConfig');
  const answers = (await inquirer.prompt(
    DeployQuestions.giveUsSshConnectionInfo(sshConfig),
  )) as unknown as IDeployAnswers;
  const updatedConfig = updatedSshConfig(answers.giveUsSshConnectionInfo);
  if (Object.keys(updatedConfig).length) {
    sshConfig = config.updateSection('sshConfig', {
      ...sshConfig,
      ...updatedConfig,
    });
  }

  return {
    ...sshConfig,
    ...answers?.giveUsSshConnectionInfo,
  };
};

export const DeployCommand = new Command()
  .name(COMMAND_NAME)
  .description('deploy provider')
  .requiredOption('--tee', 'specified type of provider', false)
  .requiredOption('--path <deploy-config.yaml>', 'path to deploy config file')
  .action(async (options: CommandParams): Promise<void> => {
    const config = new ConfigLoader(options.config);
    const logger = createLogger({
      options: config.loadSection('logger'),
      bindings: { command: COMMAND_NAME },
    });
    if (!options.tee) {
      return logger.error(
        'At least one of supported provider types should be specified. Please try to run command again and have specified the "--tee" param.',
      );
    }

    const { passphrase } = await prepareSshConfig(config);

    const offerIds = config
      .loadSection('providerOffers')
      .sort(sortOffers)
      .map((item) => item.id);

    if (!offerIds.length) {
      return logger.warn(
        `Your config "${options.config}" doesn't have any provider's offer. The program will be closed. Before running current command please try to run "register" command.`,
      );
    }

    const sshService = await createSshService({
      passphrase,
      config,
      logger,
    });

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

    logger.info("Waiting for offers' readiness...");

    const spctlService = await createSpctlService({ logger, config });
    try {
      const predicateItemFn = (value: CheckTeeOffersReadyItemResult): boolean => value.ready;
      const predicateFn = (value: CheckTeeOffersReadyResult): boolean =>
        value.every(predicateItemFn);
      let filteredResult: CheckTeeOffersReadyResult | null = null;
      const method = async (): Promise<CheckTeeOffersReadyResult> => {
        const ids = filteredResult ? filteredResult.map((r) => r.id) : [offerIds[0]];
        const result = await checkTeeOffersReady({
          offerIds: ids,
          service: spctlService,
          logger,
        });

        filteredResult = result.filter((r) => !predicateItemFn(r));
        logger.debug(`${ids.join()} offer(s) still not ready - ${ids.length}/${offerIds.length}`);

        return result;
      };
      const sleepFn = sleepExpFn(3 * DEFAULT_SLEEP_INTERVAL, DEFAULT_SLEEP_MULTIPLIER);
      const errorLoggerFn = (err: Error, attemptNumber: number): void =>
        logger.error({ err }, `waiting for offers' readiness: attempt ${attemptNumber} is failed`);

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
      return logger.error({ err }, `Failed while waiting for offers' readiness`);
    }
  });
