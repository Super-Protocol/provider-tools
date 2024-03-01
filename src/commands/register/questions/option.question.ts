import { IHardwareInfo } from '../offer-builder';
import {
  nonNegativeNumberValidator,
  nonNegativeIntegerValidator,
  positiveNumberValidator,
} from './validators';
import { IOfferOptionAnswers, PriceType } from './types';
import { MB_TO_BYTES_MULTIPLIER } from '../../../common/constant';
import { Question } from 'inquirer';
import fs from 'fs';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const optionQuestions = (optionInfo: IHardwareInfo['optionInfo']): any[] => [
  {
    type: 'number',
    name: 'info.bandwidth',
    message: 'Please adjust the bandwidth value if necessary (in Mbps):',
    validate: nonNegativeNumberValidator,
    default: Math.floor(optionInfo.bandwidth / MB_TO_BYTES_MULTIPLIER),
    when: (_answers: IOfferOptionAnswers): boolean => !optionInfo.externalPort,
  },
  {
    type: 'number',
    name: 'info.traffic',
    message: 'Please adjust the traffic value if necessary ( in Mb):',
    validate: nonNegativeNumberValidator,
    default: Math.floor(optionInfo.traffic / MB_TO_BYTES_MULTIPLIER),
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
    default: 0.0001,
  },
];

export interface IAddOptionAnswers {
  needOption: boolean;
  optionInfo: string;
  anymore: boolean;
}

export const addOptionQuestions = (ids: string[] = []): Question<IAddOptionAnswers>[] => [
  {
    type: 'confirm',
    name: 'needOption',
    askAnswered: true,
    message: `Current offer has already have next options: [${ids.join()}]. Do you want anymore?`,
    default: true,
    when: () => Boolean(ids.length),
  },
  {
    type: 'input',
    name: 'optionInfo',
    askAnswered: true,
    message: 'Please specify a path to the option info json file: ',
    when: (answers: IAddOptionAnswers) => answers.needOption || !ids.length,
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
    message: 'Do you want to add another option?',
    when: (answers: IAddOptionAnswers) => answers.needOption || !ids.length,
  },
];
