import { ISpctlService } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import inquirer from 'inquirer';
import { addOptionQuestions, IAddOptionAnswers } from '../questions/option.question';

interface IProcessOptionParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  pathToOption: string;
  offerOptionsIds?: string[];
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
      addOptionQuestions(params.offerOptionsIds),
    )) as IAddOptionAnswers;

    if (createOptionAnswers.needOption || !params.offerOptionsIds?.length) {
      try {
        await processOption({ ...params, pathToOption: createOptionAnswers.optionInfo });
      } catch (err) {
        params.logger.error({ err }, 'Failed on add option');
        await ask();
      }

      if (createOptionAnswers.anymore) {
        await ask();
      }
    }
  };

  await ask();
};
