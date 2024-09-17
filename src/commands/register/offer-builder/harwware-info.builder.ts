import { IRemoteHardwareInfo } from '../../../services/ssh';
import { IHardwareInfo } from './types';

const calculateGpuProperty = (
  gpus: IRemoteHardwareInfo['hardware']['gpus'],
  property: 'memory' | 'cores',
): number => {
  return gpus
    .map((gpu) => Math.max(...gpu.instanceProfiles.map((p) => p[property])))
    .reduce((prev, curr) => prev + curr, 0);
};

const build = (params: { hardwareInfo: IRemoteHardwareInfo }): IHardwareInfo => {
  const {
    hardwareInfo: { hardware, network },
  } = params;
  const cpuCores = hardware.sockets * hardware.cpusPerSocket;
  const gpuCores = calculateGpuProperty(hardware.gpus, 'cores');
  const ram = Math.round(hardware.ramTotal * 0.9);
  const vram = Math.round(calculateGpuProperty(hardware.gpus, 'memory') * 0.9);
  const diskUsage = Math.round(hardware.storageMax * 0.8);
  const bandwidth = Math.round(network.bandWidth * 1000 * 1000);
  const externalPort = network.externalPort ? 1 : 0;

  return {
    slotInfo: {
      cpuCores,
      ram,
      vram,
      diskUsage,
      gpuCores,
    },
    optionInfo: {
      bandwidth: bandwidth,
      externalPort,
      traffic: 0,
    },
  };
};

export interface IBuildHardwareInfoParams {
  hardwareInfo: IRemoteHardwareInfo;
}

export const buildPart = async (params: IBuildHardwareInfoParams): Promise<IHardwareInfo> => {
  return build(params);
};
