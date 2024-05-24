import inquirer from 'inquirer';

import { ISpctlService } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import { addSlotQuestions, IAddSlotAnswers } from '../questions/slot.question';
import { toSpctlOfferType } from '../utils';
import { OfferType } from '../../types';

interface IProcessSlotParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  offerType: OfferType;
  pathToSlotInfo: string;
  offerSlotIds?: string[];
}

export const processSlot = async (params: IProcessSlotParams): Promise<void> => {
  const { offerId, service, logger, offerType, pathToSlotInfo } = params;
  const slotId = await service.addOfferSlot(pathToSlotInfo, offerId, toSpctlOfferType(offerType));
  logger.info(`Slot ${slotId} for offer ${offerId} has been created successfully`);
};

export const process = async (
  params: Omit<IProcessSlotParams, 'pathToSlotInfo'>,
): Promise<void> => {
  const ask = async (): Promise<void> => {
    const createSlotAnswers = (await inquirer.prompt(
      addSlotQuestions(params.offerSlotIds),
    )) as IAddSlotAnswers;

    if (createSlotAnswers.needSlot || !params.offerSlotIds?.length) {
      try {
        await processSlot({ ...params, pathToSlotInfo: createSlotAnswers.slotInfo });
      } catch (err) {
        params.logger.error({ err }, 'Failed on add slot');
        await ask();
      }

      if (createSlotAnswers.anymore) {
        await ask();
      }
    }
  };

  await ask();
};
