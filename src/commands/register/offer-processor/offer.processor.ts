import { ISpctlService } from '../../../services/spctl';
import inquirer from 'inquirer';
import { IRegisterProviderAnswers, ProviderRegisterQuestions } from '../questions';
import { ILogger } from '../../../common/logger';
import { ConfigLoader } from '../../../common/loader.config';
import { OfferType } from '../../types';
import { updateProviderOffers } from './config.utils';
import { process as processManualOffer } from './manual-offer.processor';
import { process as processAutoOffer } from './auto-offer.processor';
import { readJsonFile } from '../../../services/utils/file.utils';
import { IOfferInfo } from '../offer-builder';
import { ProviderValueOffer } from '../../../common/config';
import { toSpctlOfferType } from '../utils';
import { process as processSlots } from './offer-slot.processor';
import { process as processOptions } from './offer-option.processor';
import { ITeeOffer } from '../../../services/spctl/types';

interface OfferProcessParams {
  config: ConfigLoader;
  service: ISpctlService;
  offerType: OfferType;
  logger: ILogger;
  resourceFileData: Omit<ProviderValueOffer, 'id'> | null;
}

export const process = async (params: OfferProcessParams): Promise<string | null> => {
  const { config, service } = params;
  const questions = ProviderRegisterQuestions.createOffer(service, params.offerType);
  const createOfferAnswers = (await inquirer.prompt(questions)) as IRegisterProviderAnswers;

  if (!createOfferAnswers.createOffer.auto && createOfferAnswers.createOffer.offerInfo) {
    const offerInfo = (await readJsonFile(
      createOfferAnswers.createOffer.offerInfo,
    )) as unknown as IOfferInfo;
    return await processManualOffer({
      ...params,
      offerInfo,
    });
  }

  if (
    createOfferAnswers.createOffer.hasOffer &&
    createOfferAnswers.createOffer.offerId &&
    createOfferAnswers.createOffer.pk
  ) {
    const offerId = createOfferAnswers.createOffer.offerId;
    const offerSlotAndOptionInfo = await service.getSlotAndOptionIdsByOfferId(
      offerId,
      toSpctlOfferType(params.offerType),
    );
    await processSlots({ ...params, offerId, offerSlotIds: offerSlotAndOptionInfo?.slots });

    if (params.offerType === 'tee') {
      await processOptions({
        ...params,
        offerId,
        offerOptionsIds: (offerSlotAndOptionInfo as ITeeOffer)?.options,
      });
    }
    updateProviderOffers({
      config,
      offerId,
      decryptKey: createOfferAnswers.createOffer.pk,
      offerType: params.offerType,
      resourceFileData: params.resourceFileData,
    });

    return offerId;
  }

  if (!createOfferAnswers.createOffer.hasOffer && createOfferAnswers.createOffer.auto) {
    return processAutoOffer(params);
  }

  return null;
};
