import { IHardwareInfo } from '../offer-builder';

export enum PriceType {
  perHour = '0',
  fixed = '1',
}

export interface IUsageAnswers {
  priceType: PriceType;
  price: string;
  minTimeMinutes: number;
  maxTimeMinutes: number;
}

export interface IOfferOptionAnswers {
  info: IHardwareInfo['optionInfo'];
  usage: IUsageAnswers;
}
