import inquirer from 'inquirer';

import { ISpctlService, SpctlOfferType } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import { IRegisterProviderAnswers, ProviderRegisterQuestions } from '../questions';

interface IProcessSlotParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  offerType: SpctlOfferType;
  pathToSlotInfo: string;
}

export const processSlot = async (params: IProcessSlotParams): Promise<void> => {
  const { offerId, service, logger, offerType, pathToSlotInfo } = params;
  const slotId = await service.addOfferSlot(pathToSlotInfo, offerId, offerType);
  logger.info(`Slot ${slotId} for offer ${offerId} has been created successfully`);
};

export const process = async (
  params: Omit<IProcessSlotParams, 'pathToSlotInfo'>,
): Promise<void> => {
  const ask = async (): Promise<void> => {
    const createSlotAnswers = (await inquirer.prompt(
      ProviderRegisterQuestions.addSlot,
    )) as IRegisterProviderAnswers;

    await processSlot({ ...params, pathToSlotInfo: createSlotAnswers.addSlot.slotInfo });

    if (createSlotAnswers.addSlot.anymore) {
      await ask();
    }
  };

  await ask();
};
