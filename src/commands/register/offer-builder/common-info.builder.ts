import { ICommonOfferInfo } from './types';

const build = (): ICommonOfferInfo => {
  return {
    name: 'TEE Offer',
    description: 'My TEE offer',
    teeType: '0',
    properties: '0',
    tlb: '',
  };
};

export const buildPart = (): ICommonOfferInfo => {
  return build();
};
