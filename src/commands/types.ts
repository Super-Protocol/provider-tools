import { supportedOfferTypes } from './utils';

export type ConfigCommandParam = {
  config: string;
};

export type OfferType = (typeof supportedOfferTypes)[number];
