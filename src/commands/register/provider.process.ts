import inquirer from 'inquirer';

import { ConfigLoader } from '../../common/loader.config';
import { ISpctlService } from '../../services/spctl';
import { getProvider, registerTeeProvider } from '../../services/register/tee.provider';
import { IRegisterProviderAnswers, ProviderRegisterQuestions } from './questions';
import { DEFAULT_PROVIDER_NAME } from '../../common/constant';
import { ILogger } from '../../common/logger';
import { writeToFile } from '../../services/utils/file.utils';

export default async (
  config: ConfigLoader,
  service: ISpctlService,
  logger: ILogger,
): Promise<void> => {
  const accounts = config.loadSection('account');
  const existedProvider = await getProvider(service, accounts.authority);

  if (!existedProvider) {
    const providerInfoConfig = config.loadSection('providerInfo');
    const answers = (await inquirer.prompt(
      ProviderRegisterQuestions.getProviderMetaData(providerInfoConfig),
    )) as IRegisterProviderAnswers;
    config.updateSection('providerInfo', {
      name: answers.getProviderMetaData.providerName,
      ...(answers.getProviderMetaData.providerDescription && {
        description: answers.getProviderMetaData.providerDescription,
      }),
    });
  } else {
    logger.info('Existed provider was found');
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
