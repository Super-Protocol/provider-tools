import { IMemoryInfo, ISshService, IStorageInfo } from '../../../services/ssh';
import { IHardwareInfo } from './types';

const build = (params: { memory: IMemoryInfo; storage: IStorageInfo }): IHardwareInfo => {
  return {
    slotInfo: {
      cpuCores: 35.5, // TODO: should be replaced later, it will be gotten via ssh-service
      ram: params.memory.total * 0.9,
      diskUsage: params.storage.max * 0.8,
      gpuCores: 0,
    },
    optionInfo: {
      bandwidth: 2300000, // TODO: should be replaced later, it will be gotten via ssh-service
      externalPort: Math.round(Math.random()), // TODO: should be replaced later, it will be gotten via ssh-service
      traffic: 321000000, // TODO: should be replaced later, it will be gotten via ssh-service
    },
  };
};

export interface IBuildHardwareInfoParams {
  service: ISshService;
}

export const buildPart = async (params: IBuildHardwareInfoParams): Promise<IHardwareInfo> => {
  const { service } = params;

  const memory = await service.getMemoryInfo();
  const storage = await service.getDiskInfo();

  return build({ memory, storage });
};
