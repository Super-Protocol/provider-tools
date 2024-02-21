import { SpctlOfferType } from '../../services/spctl/types';
import { OfferType } from './types';

export const toSpctlOfferType = (offerType: OfferType): SpctlOfferType => {
  if (offerType === 'tee') {
    return 'tee';
  }

  return 'value';
};
