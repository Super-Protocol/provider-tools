import { IHardwareInfo } from '../offer-builder';
import {
  nonNegativeNumberValidator,
  nonNegativeIntegerValidator,
  positiveNumberValidator,
} from './validators';
import { etherToWei } from '../../../common/utils';
import { IOfferOptionAnswers, PriceType } from './types';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const optionQuestions = (optionInfo: IHardwareInfo['optionInfo']): any[] => [
  {
    type: 'number',
    name: 'info.bandwidth',
    message: 'Please adjust the bandwidth value if necessary (in Mbps):',
    validate: nonNegativeNumberValidator,
    filter(val: number): number {
      return Math.floor(val * 1000000);
    },
    default: optionInfo.bandwidth,
    when: (_answers: IOfferOptionAnswers): boolean => !optionInfo.externalPort,
  },
  {
    type: 'number',
    name: 'info.traffic',
    message: 'Please adjust the traffic value if necessary ( in Mbps):',
    validate: nonNegativeNumberValidator,
    filter(val: number): number {
      return Math.floor(val * 1000000);
    },
    default: optionInfo.traffic,
    when: (_answers: IOfferOptionAnswers): boolean => !optionInfo.externalPort,
  },
  {
    type: 'number',
    name: 'usage.minTimeMinutes',
    message: 'Please specify the min rent time(in minutes):',
    validate: nonNegativeIntegerValidator,
    default: 0,
  },
  {
    type: 'number',
    name: 'usage.maxTimeMinutes',
    message: 'Please specify the max rent time(in minutes):',
    validate: nonNegativeIntegerValidator,
    default: 0,
  },
  {
    type: 'list',
    name: 'usage.priceType',
    message: `Please specify the price type:`,
    choices: Object.entries(PriceType).map(([key, value]) => `${key} - ${value}`),
    filter(val: string): string {
      return val.split('-')[1].trim();
    },
    default: PriceType.fixed,
  },
  {
    type: 'number',
    name: 'usage.price',
    message: 'Please specify the price(in TEE tokens):',
    validate: positiveNumberValidator,
    filter(val: number): string {
      return etherToWei(val.toString()).toString();
    },
    default: 1,
  },
];
