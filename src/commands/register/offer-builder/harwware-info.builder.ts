import { IRemoteHardwareInfo, ISshService } from '../../../services/ssh';
import { IHardwareInfo } from './types';

const build = (params: { hardwareInfo: IRemoteHardwareInfo }): IHardwareInfo => {
  const {
    hardwareInfo: { hardware, network },
  } = params;
  const cpuCores = hardware.sockets * hardware.cpusPerSocket;
  const ram = Math.round(hardware.ramTotal * 0.9);
  const diskUsage = Math.round(hardware.storageMax * 0.8);
  const bandwidth = Math.round(network.bandWidth * 1000 * 1000);
  const externalPort = network.externalPort ? 1 : 0;

  return {
    slotInfo: {
      cpuCores,
      ram,
      diskUsage,
      gpuCores: 0,
    },
    optionInfo: {
      bandwidth: bandwidth,
      externalPort,
      traffic: 0,
    },
  };
};

export interface IBuildHardwareInfoParams {
  service: ISshService;
}

export const buildPart = async (params: IBuildHardwareInfoParams): Promise<IHardwareInfo> => {
  const { service } = params;

  const hardwareInfo = await service.getHardwareInfo();

  return build({ hardwareInfo });
};
