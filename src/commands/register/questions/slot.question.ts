import { SpctlOfferType } from '../../../services/spctl';
import { nonNegativeIntegerValidator, positiveNumberValidator } from './validators';
import { PriceType } from './types';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const slotUsageQuestions = (offerType: SpctlOfferType): any[] => [
  {
    type: 'number',
    name: 'minTimeMinutes',
    message: 'Please specify min rent time(in minutes):',
    validate: nonNegativeIntegerValidator,
    default: 0,
  },
  {
    type: 'number',
    name: 'maxTimeMinutes',
    message: 'Please specify max rent time(in minutes):',
    validate: nonNegativeIntegerValidator,
    default: 0,
  },
  {
    type: 'list',
    name: 'priceType',
    message: `Please specify the price type:`,
    choices: Object.entries(PriceType).map(([key, value]) => `${key} - ${value}`),
    filter(val: string): string {
      return val.split('-')[1].trim();
    },
    default: PriceType.perHour,
    when: (): boolean => offerType === 'value',
  },
  {
    type: 'number',
    name: 'price',
    message: 'Please specify the price(in TEE tokens):',
    validate: positiveNumberValidator,
    default: 0.0001,
  },
];
