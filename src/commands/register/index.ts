import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigCommandParam } from '../types';
import { createSpctlService, writeToFile } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { registerTeeProvider } from '../../services/register';
import { ProviderRegisterQuestions, IProviderRegisterAnswers } from './questions';
import { getProvider } from '../../services/register/tee.provider';
import { DEFAULT_PROVIDER_NAME } from '../../common/constant';

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

    const accounts = config.loadSection('account');
    const existedProvider = await getProvider(service, accounts.authority);

    if (!existedProvider) {
      const providerInfoConfig = config.loadSection('providerInfo');
      const answers = (await inquirer.prompt(
        ProviderRegisterQuestions.getProviderMetaData(providerInfoConfig),
      )) as IProviderRegisterAnswers;
      config.updateSection('providerInfo', {
        name: answers.getProviderMetaData.providerName,
        ...(answers.getProviderMetaData.providerDescription && {
          description: answers.getProviderMetaData.providerDescription,
        }),
      });
    }

    const providerInfoConfig = config.loadSection('providerInfo');
    const provider =
      existedProvider ||
      (await registerTeeProvider({
        accounts,
        service,
        logger,
        providerName: providerInfoConfig?.name ?? DEFAULT_PROVIDER_NAME,
        providerDescription: providerInfoConfig?.description,
      }));

    logger.info({ provider }, 'here is your provider');

    const answers = (await inquirer.prompt(
      ProviderRegisterQuestions.doYouWantToSaveProvider,
    )) as IProviderRegisterAnswers;
    if (answers.doYouWantToSaveProvider.shouldBeSaved) {
      await writeToFile(answers.doYouWantToSaveProvider.fileName, provider);
    }
  });
