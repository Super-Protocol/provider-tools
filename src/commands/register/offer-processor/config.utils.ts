import { ConfigLoader } from '../../../common/loader.config';
import { ProviderOffer } from '../../../common/config';

export const updateProviderOffers = (
  config: ConfigLoader,
  offerId: string,
  decryptKey: string,
): void => {
  const offers = config.loadSection('providerOffers');
  const providerOfferInfo: ProviderOffer = {
    id: offerId,
    argsPrivateKey: decryptKey,
  };
  const index = offers.findIndex((item) => item.id === offerId);

  index === -1 ? offers.push(providerOfferInfo) : (offers[index] = providerOfferInfo);

  config.updateSection('providerOffers', offers);
};
