import { ICommonOfferInfo, TeeOfferSubtype } from './types';

const build = (): ICommonOfferInfo => {
  return {
    name: 'TEE Offer',
    description: 'My TEE offer',
    teeType: '0',
    subType: TeeOfferSubtype.Default,
    properties: '0',
  };
};

export const buildPart = (): ICommonOfferInfo => {
  return build();
};
