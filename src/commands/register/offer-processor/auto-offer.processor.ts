import Path from 'path';
import os from 'os';
import inquirer, { Validator } from 'inquirer';
import { BigNumber, utils as ethersUtils } from 'ethers';

import { prepareSshConfig } from '../../deploy';
import { build } from '../offer-builder';
import { createSshService } from '../../../services/ssh';
import { ConfigLoader } from '../../../common/loader.config';
import { IHardwareInfo } from '../offer-builder';
import { removeFileIfExist, writeToFile } from '../../../services/utils/file.utils';
import { processOffer } from './manual-offer.processor';
import { ISpctlService, SpctlOfferType } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import { processSlot } from './offer-slot.processor';
import { processOption } from './offer-option.processor';

const splitSlots = (resources: IHardwareInfo['slotInfo']): IHardwareInfo['slotInfo'][] => {
  const buildSlot = (cpuCores: number): IHardwareInfo['slotInfo'] => {
    return {
      cpuCores,
      ram: Math.floor((cpuCores * resources.ram) / resources.cpuCores),
      diskUsage: Math.floor((cpuCores * resources.diskUsage) / resources.cpuCores),
      gpuCores: 0,
    };
  };
  const slots: IHardwareInfo['slotInfo'][] = [];

  if (resources.cpuCores > 0) {
    slots.push(buildSlot(1));
    if (resources.cpuCores > 2) {
      slots.push(buildSlot(3));
    }
  }

  return slots;
};

const splitOptions = (resources: IHardwareInfo['optionInfo']): IHardwareInfo['optionInfo'][] => {
  const options: IHardwareInfo['optionInfo'][] = [];

  if (resources.externalPort) {
    options.push({
      bandwidth: 0,
      traffic: 0,
      externalPort: 1,
    });
  }
  options.push({
    bandwidth: resources.bandwidth,
    traffic: 15000000,
    externalPort: 0,
  });

  return options;
};

const nonNegativeIntegerValidator: Validator = (input) => {
  const number = parseInt(input);

  if (!Number.isSafeInteger(number) || number < 0) {
    return 'It should be positive integer number. Please try again:';
  }

  return true;
};

const etherToWei = (ether: string): BigNumber => {
  return ethersUtils.parseEther(ether);
};

const nonNegativeNumberValidator: Validator = (input) => {
  const number = parseFloat(input);

  if (Number.isNaN(number) || number < 0) {
    return 'It should be non negative number. Please try again:';
  }

  return true;
};
const positiveNumberValidator: Validator = (input) => {
  const number = parseFloat(input);

  if (Number.isNaN(number) || number <= 0) {
    return 'It should be positive number. Please try again:';
  }

  return true;
};

enum PriceType {
  perHour = '0',
  fixed = '1',
}

interface IUsageAnswers {
  priceType: PriceType;
  price: string;
  minTimeMinutes: number;
  maxTimeMinutes: number;
}

interface IOfferOption {
  info: IHardwareInfo['optionInfo'];
  usage: IUsageAnswers;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const optionQuestions = (optionInfo: IHardwareInfo['optionInfo']): any[] => [
  {
    type: 'number',
    name: 'info.bandwidth',
    message: 'Please adjust the bandwidth value if necessary (in Mbps):',
    validate: nonNegativeNumberValidator,
    filter(val: number): number {
      return Math.floor(val * 1000000);
    },
    default: optionInfo.bandwidth,
    when: (_answers: IOfferOption): boolean => !optionInfo.externalPort,
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
    when: (_answers: IOfferOption): boolean => !optionInfo.externalPort,
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

const processAutoOption = async (value: IHardwareInfo['optionInfo']): Promise<IOfferOption> => {
  const prefix = `Please ask next questions about option:\n${JSON.stringify(value, null, 2)}\n`;
  const answers = (await inquirer.prompt(
    optionQuestions(value).map((q) => ({ ...q, prefix })),
  )) as IOfferOption;

  return {
    info: {
      bandwidth: answers.info?.bandwidth ?? value.bandwidth,
      traffic: answers.info?.traffic ?? value.traffic,
      externalPort: value.externalPort,
    },
    usage: answers.usage,
  };
};

interface IProcessAutoOptionsParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  offerType: SpctlOfferType;
  resources: IHardwareInfo['optionInfo'];
}
const processAutoOptions = async (params: IProcessAutoOptionsParams): Promise<void> => {
  const options = splitOptions(params.resources);
  let count = 0;
  for (const option of options) {
    count++;
    const data = await processAutoOption(option);

    const tmpFileName = Path.join(os.tmpdir(), `${new Date().valueOf()}-option-info-${count}.json`);
    await writeToFile(tmpFileName, data);

    try {
      await processOption({ ...params, pathToOption: tmpFileName });
    } finally {
      await removeFileIfExist(tmpFileName);
    }
  }
};

interface ISlotOfferInfo {
  info: IHardwareInfo['slotInfo'];
  usage: IUsageAnswers;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const slotUsageQuestions = (offerType: SpctlOfferType): any[] => [
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
    filter(val: number): string {
      return etherToWei(val.toString()).toString();
    },
    default: 1,
  },
];

const processAutoSlot = async (
  value: IHardwareInfo['slotInfo'],
  offerType: SpctlOfferType = 'tee',
): Promise<ISlotOfferInfo> => {
  const prefix = `Please ask next questions about slot:\n${JSON.stringify(value, null, 2)}\n`;
  const answers = (await inquirer.prompt(
    slotUsageQuestions(offerType).map((q) => ({ ...q, prefix })),
  )) as IUsageAnswers;

  return {
    info: value,
    usage: {
      ...answers,
      priceType: answers.priceType ?? PriceType.perHour,
    },
  };
};

interface IProcessAutoSlotsParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  offerType: SpctlOfferType;
  resources: IHardwareInfo['slotInfo'];
}
const processAutoSlots = async (params: IProcessAutoSlotsParams): Promise<void> => {
  const slots = splitSlots(params.resources);
  let count = 0;
  for (const slot of slots) {
    count++;
    const data = await processAutoSlot(slot, params.offerType);

    const tmpFileName = Path.join(os.tmpdir(), `${new Date().valueOf()}-slot-info-${count}.json`);
    await writeToFile(tmpFileName, data);

    try {
      await processSlot({ ...params, pathToSlotInfo: tmpFileName });
    } finally {
      await removeFileIfExist(tmpFileName);
    }
  }
};

interface IAutoOfferProcessorParams {
  config: ConfigLoader;
  logger: ILogger;
  offerType: SpctlOfferType;
  service: ISpctlService;
}

export const process = async (params: IAutoOfferProcessorParams): Promise<string> => {
  const { config } = params;

  await prepareSshConfig(config);

  const offerInfo = await build({ service: await createSshService({ config }) });
  const offerId = await processOffer({ ...params, offerInfo });

  await processAutoSlots({ ...params, offerId, resources: offerInfo.hardwareInfo.slotInfo });

  if (params.offerType === 'tee') {
    await processAutoOptions({ ...params, offerId, resources: offerInfo.hardwareInfo.optionInfo });
  }

  return offerId;
};
