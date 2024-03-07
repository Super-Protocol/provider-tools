import Path from 'path';
import os from 'os';
import inquirer from 'inquirer';

import { removeFileIfExist, writeToFile } from '../../../services/utils/file.utils';
import { processSlot } from './offer-slot.processor';
import { ISpctlService, SpctlOfferType } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import { IHardwareInfo } from '../offer-builder';
import { IUsageAnswers, PriceType } from '../questions/types';
import { slotUsageQuestions } from '../questions/slot.question';
import { OfferType } from '../types';
import { toSpctlOfferType } from '../utils';
import { etherToWei } from '../../../common/utils';

interface ISlotOfferInfo {
  info: IHardwareInfo['slotInfo'];
  usage: IUsageAnswers;
}

const processAutoSlot = async (
  value: IHardwareInfo['slotInfo'],
  offerType: SpctlOfferType = 'tee',
): Promise<ISlotOfferInfo> => {
  const prefix = `Please answer next questions about slot:\n${JSON.stringify(value, null, 2)}\n`;
  const answers = (await inquirer.prompt(
    slotUsageQuestions(offerType).map((q) => ({ ...q, prefix })),
  )) as IUsageAnswers;

  return {
    info: value,
    usage: {
      ...answers,
      price: etherToWei(answers.price.toString()).toString(),
      priceType: answers.priceType ?? PriceType.perHour,
    },
  };
};

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

interface IProcessAutoSlotsParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  offerType: OfferType;
  resources: IHardwareInfo['slotInfo'];
}

export const process = async (params: IProcessAutoSlotsParams): Promise<void> => {
  const slots = splitSlots(params.resources);
  let count = 0;
  for (const slot of slots) {
    count++;
    const data = await processAutoSlot(slot, toSpctlOfferType(params.offerType));

    const tmpFileName = Path.join(os.tmpdir(), `${new Date().valueOf()}-slot-info-${count}.json`);
    await writeToFile(tmpFileName, data);

    try {
      await processSlot({ ...params, pathToSlotInfo: tmpFileName });
    } finally {
      await removeFileIfExist(tmpFileName);
    }
  }
};
