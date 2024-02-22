import { ISpctlService } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import inquirer from 'inquirer';
import { IRegisterProviderAnswers, ProviderRegisterQuestions } from '../questions';

interface IProcessOptionParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  pathToOption: string;
}

export const processOption = async (params: IProcessOptionParams): Promise<void> => {
  const { offerId, service, logger, pathToOption } = params;
  const optionId = await service.addTeeOfferOption(pathToOption, offerId);
  logger.info(`Option ${optionId} for offer ${offerId} has been created successfully`);
};

export const process = async (
  params: Omit<IProcessOptionParams, 'pathToOption'>,
): Promise<void> => {
  const ask = async (): Promise<void> => {
    const createOptionAnswers = (await inquirer.prompt(
      ProviderRegisterQuestions.addOption,
    )) as IRegisterProviderAnswers;

    await processOption({ ...params, pathToOption: createOptionAnswers.addOption.optionInfo });

    if (createOptionAnswers.addOption.anymore) {
      await ask();
    }
  };

  await ask();
};
