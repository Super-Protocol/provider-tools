import { ISpctlService } from '../../../services/spctl';
import inquirer from 'inquirer';
import { IRegisterProviderAnswers, ProviderRegisterQuestions } from '../questions';
import { ILogger } from '../../../common/logger';
import { ConfigLoader } from '../../../common/loader.config';
import { OfferType } from '../types';
import { toSpctlOfferType } from '../utils';
import { updateProviderOffers } from './config.utils';
import { process as processManualOffer } from './manual-offer.processor';
import { process as processAutoOffer } from './auto-offer.processor';
import { readJsonFile } from '../../../services/utils/file.utils';
import { IOfferInfo } from '../offer-builder';

interface OfferProcessParams {
  config: ConfigLoader;
  service: ISpctlService;
  offerType: OfferType;
  logger: ILogger;
}

export const process = async (params: OfferProcessParams): Promise<string | null> => {
  const { config, service } = params;
  const offerType = toSpctlOfferType(params.offerType);

  const deployedOfferIds = config.loadSection('providerOffers').map((item) => item.id);
  const questions = ProviderRegisterQuestions.createOffer(deployedOfferIds, service, offerType);
  const createOfferAnswers = (await inquirer.prompt(questions)) as IRegisterProviderAnswers;

  if (!createOfferAnswers.createOffer.auto && createOfferAnswers.createOffer.offerInfo) {
    const offerInfo = (await readJsonFile(
      createOfferAnswers.createOffer.offerInfo,
    )) as unknown as IOfferInfo;
    return await processManualOffer({
      ...params,
      offerInfo,
      offerType,
    });
  }

  if (
    createOfferAnswers.createOffer.hasOffer &&
    createOfferAnswers.createOffer.offerId &&
    createOfferAnswers.createOffer.pk
  ) {
    const offerId = createOfferAnswers.createOffer.offerId;
    updateProviderOffers(config, offerId, createOfferAnswers.createOffer.pk);

    return offerId;
  }

  if (!createOfferAnswers.createOffer.hasOffer && createOfferAnswers.createOffer.auto) {
    return await processAutoOffer({ ...params, offerType });
  }

  return null;
};
