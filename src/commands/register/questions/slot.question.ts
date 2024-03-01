import { SpctlOfferType } from '../../../services/spctl';
import { nonNegativeIntegerValidator, positiveNumberValidator } from './validators';
import { PriceType } from './types';
import { Question } from 'inquirer';
import fs from 'fs';

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

export interface IAddSlotAnswers {
  needSlot: boolean;
  slotInfo: string;
  anymore: boolean;
}

export const addSlotQuestions = (ids: string[] = []): Question<IAddSlotAnswers>[] => [
  {
    type: 'confirm',
    name: 'needSlot',
    askAnswered: true,
    message: `Current offer has already have next slots: [${ids.join()}]. Do you want anymore?`,
    default: true,
    when: () => Boolean(ids.length),
  },
  {
    type: 'input',
    name: 'slotInfo',
    askAnswered: true,
    message: 'Please specify a path to the slot info json file: ',
    when: (answers: IAddSlotAnswers) => answers.needSlot || !ids.length,
    validate(fileName: string): boolean | string {
      if (!fs.existsSync(fileName)) {
        return 'File not found, please specify it again: ';
      }

      return true;
    },
  },
  {
    type: 'confirm',
    name: 'anymore',
    askAnswered: true,
    default: false,
    message: 'Do you want to add another slot?',
    when: (answers: IAddSlotAnswers) => answers.needSlot || !ids.length,
  },
];
