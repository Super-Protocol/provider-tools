import inquirer from 'inquirer';

import { ConfigLoader } from '../../common/loader.config';
import { ISpctlService } from '../../services/spctl';
import { getProvider, registerProvider } from '../../services/register/provider';
import { IRegisterProviderAnswers, ProviderRegisterQuestions } from './questions';
import { DEFAULT_PROVIDER_NAME } from '../../common/constant';
import { ILogger } from '../../common/logger';
import { writeToFile } from '../../services/utils/file.utils';

interface ProviderProcessParams {
  config: ConfigLoader;
  service: ISpctlService;
  logger: ILogger;
}

export default async (params: ProviderProcessParams): Promise<void> => {
  const { config, service, logger } = params;

  const accounts = config.loadSection('account');
  const existedProvider = await getProvider(service, accounts.authority);

  if (!existedProvider) {
    const providerInfoConfig = config.loadSection('providerInfo');
    const answers = (await inquirer.prompt(
      ProviderRegisterQuestions.getProviderMetaData(providerInfoConfig),
    )) as IRegisterProviderAnswers;
    const name = answers.getProviderMetaData?.providerName || providerInfoConfig?.name;
    const description =
      answers.getProviderMetaData?.providerDescription || providerInfoConfig?.description;

    config.updateSection('providerInfo', {
      name,
      ...(description && { description }),
    });
  } else {
    logger.info('Existed provider was found');
  }

  const providerInfoConfig = config.loadSection('providerInfo');
  const provider =
    existedProvider ||
    (await registerProvider({
      accounts,
      service,
      logger,
      providerName: providerInfoConfig?.name ?? DEFAULT_PROVIDER_NAME,
      providerDescription: providerInfoConfig?.description,
    }));

  logger.info({ provider }, 'Here is your provider');

  const saveProviderAnswers = (await inquirer.prompt(
    ProviderRegisterQuestions.doYouWantToSaveProvider,
  )) as IRegisterProviderAnswers;
  if (saveProviderAnswers.doYouWantToSaveProvider.shouldBeSaved) {
    const fileName = saveProviderAnswers.doYouWantToSaveProvider.fileName;
    await writeToFile(fileName, provider);
    logger.info(`provider data has been successfully saved to ${fileName}`);
  }
};
