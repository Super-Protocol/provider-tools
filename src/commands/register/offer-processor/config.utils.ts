import { ConfigLoader } from '../../../common/loader.config';
import { ProviderOffer, ProviderValueOffer } from '../../../common/config';
import { OfferType } from '../types';

export type ConfigOffersSection =
  | 'providerOffers'
  | 'providerDataOffers'
  | 'providerSolutionOffers';

export const getConfigOffersSection = (offerType: OfferType): ConfigOffersSection => {
  const offerTypeSectionMap: Record<OfferType, ConfigOffersSection> = {
    data: 'providerDataOffers',
    solution: 'providerSolutionOffers',
    tee: 'providerOffers',
  };

  return offerTypeSectionMap[offerType];
};

interface UpdateProviderOffersParams {
  config: ConfigLoader;
  offerId: string;
  offerType: OfferType;
  decryptKey: string;
  resourceFileData: Omit<ProviderValueOffer, 'id'> | null;
}

export const updateProviderOffers = (params: UpdateProviderOffersParams): void => {
  const { config, offerId, offerType, decryptKey } = params;
  const offersSection = getConfigOffersSection(offerType);
  const offers: Array<ProviderOffer | ProviderValueOffer> = config.loadSection(offersSection);
  const getProviderOfferInfo = (): ProviderOffer | ProviderValueOffer => {
    if (offerType === 'tee') {
      return {
        id: offerId,
        argsPrivateKey: decryptKey,
        modifiedAt: Date.now(),
      };
    }

    if (!params.resourceFileData?.encryption || !params.resourceFileData?.resource) {
      throw new Error('There is no required info in resource file');
    }

    return {
      id: offerId,
      argsPrivateKey: decryptKey,
      encryption: params.resourceFileData.encryption,
      resource: params.resourceFileData.resource,
    };
  };

  const providerOfferInfo = getProviderOfferInfo();
  const index = offers.findIndex((item) => item.id === offerId);

  if (index === -1) {
    offers.push(providerOfferInfo);
  } else {
    offers[index] = providerOfferInfo;
  }

  config.updateSection(offersSection, offers);
};
