import { ConnectConfig } from 'ssh2';
import { ILogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';

export type CreateSshServiceOptions = Partial<
  Pick<ISshServiceOptions, 'host' | 'port' | 'username' | 'logger'>
> & {
  config: ConfigLoader;
  pathToPrivateKey?: string;
};

export interface ISshServiceOptions
  extends Pick<ConnectConfig, 'host' | 'port' | 'username' | 'privateKey'> {
  logger: ILogger;
}

export interface IMemoryInfo {
  total: number;
}

export interface IStorageInfo {
  max: number;
}

export interface IRemoteHardwareInfo {
  hardware: {
    cpusPerSocket: number;
    sockets: number;
    simultaneousMultithreading: number;
    cpuThreadsPerCore: number;
    cpuTotalThreads: number;
    logicalCores: number;
    ramTotal: number;
    storageMax: number;
  };
  network: {
    externalPort: boolean;
    bandWidth: number;
  };
}
