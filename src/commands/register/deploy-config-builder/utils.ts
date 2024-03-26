import { ProviderOffer } from '../../../common/config';

export const sortOffers = (a: ProviderOffer, b: ProviderOffer): number => {
  const a1 = a.modifiedAt ?? 0;
  const b1 = b.modifiedAt ?? 0;
  if (a1 > b1) {
    return -1;
  } else if (a1 < b1) {
    return 1;
  }

  return 0;
};
