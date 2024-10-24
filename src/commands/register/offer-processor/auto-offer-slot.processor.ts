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
import { OfferType } from '../../types';
import { floor, toSpctlOfferType } from '../utils';
import { etherToWei } from '../../../common/utils';
import { InstanceProfile, IRemoteHardwareInfo } from '../../../services/ssh';

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
    slotUsageQuestions(offerType).map((q, index) => ({ ...q, ...(!index && { prefix }) })),
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

const splitSlots = ({
  slotInfo,
  gpus,
}: Pick<IProcessAutoSlotsParams, 'slotInfo' | 'gpus'>): IHardwareInfo['slotInfo'][] => {
  return gpus.length > 0 ? splitGpuSlots(slotInfo, gpus) : splitNonGpuSlots(slotInfo);
};

const splitNonGpuSlots = (slotInfo: IHardwareInfo['slotInfo']): IHardwareInfo['slotInfo'][] => {
  const buildSlot = (cpuCores: number): IHardwareInfo['slotInfo'] => {
    return {
      cpuCores,
      ram: Math.floor((cpuCores * slotInfo.ram) / slotInfo.cpuCores),
      diskUsage: Math.floor((cpuCores * slotInfo.diskUsage) / slotInfo.cpuCores),
      gpuCores: 0,
      vram: 0,
    };
  };
  const slots: IHardwareInfo['slotInfo'][] = [];

  if (slotInfo.cpuCores > 0) {
    slots.push(buildSlot(1));
    if (slotInfo.cpuCores > 2) {
      slots.push(buildSlot(3));
    }
  }

  return slots;
};

const splitGpuSlots = (
  slotInfo: IHardwareInfo['slotInfo'],
  gpus: IRemoteHardwareInfo['hardware']['gpus'],
): IHardwareInfo['slotInfo'][] => {
  if (gpus.length > 1) {
    throw new Error('Not supported yet for multiple GPUs');
  }

  const buildSlot = (instanceProfile: InstanceProfile): IHardwareInfo['slotInfo'] => {
    return {
      cpuCores: floor(slotInfo.cpuCores / instanceProfile.totalInstances, 4),
      ram: Math.floor(slotInfo.ram / instanceProfile.totalInstances),
      diskUsage: Math.floor(slotInfo.diskUsage / instanceProfile.totalInstances),
      gpuCores: instanceProfile.cores,
      vram: instanceProfile.memory,
    };
  };

  return selectBestInstanceProfiles(gpus[0].instanceProfiles).map(buildSlot);
};

const selectBestInstanceProfiles = (instanceProfiles: InstanceProfile[]): InstanceProfile[] => {
  const profiles: InstanceProfile[] = [];

  for (const instanceProfile of instanceProfiles) {
    const existing = profiles.find((p) => p.memory === instanceProfile.memory);

    if (!existing) {
      profiles.push(instanceProfile);
    } else if (instanceProfile.totalInstances > existing.totalInstances) {
      const idx = profiles.indexOf(existing);
      profiles.splice(idx, 1);
      profiles.push(instanceProfile);
    }
  }

  return profiles;
};

interface IProcessAutoSlotsParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  offerType: OfferType;
  slotInfo: IHardwareInfo['slotInfo'];
  gpus: IRemoteHardwareInfo['hardware']['gpus'];
}

export const process = async (params: IProcessAutoSlotsParams): Promise<void> => {
  const slots = splitSlots(params);

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
