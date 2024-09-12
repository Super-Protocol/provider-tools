import { ConnectConfig } from 'ssh2';
import { ILogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';

export type CreateSshServiceOptions = Partial<
  Pick<ISshServiceOptions, 'host' | 'port' | 'username' | 'passphrase' | 'logger'>
> & {
  config: ConfigLoader;
  pathToPrivateKey?: string;
};

export interface ISshServiceOptions
  extends Pick<ConnectConfig, 'host' | 'port' | 'username' | 'privateKey' | 'passphrase'> {
  logger: ILogger;
}

interface GPU {
  name: string;
  instanceProfiles: InstanceProfile[];
}

export interface InstanceProfile {
  name: string; // example: "MIG 1g.5gb"
  memory: number; // example: 4.75 (GiB)
  cores: number; // example: 1
  totalInstances: number; // example: 7
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
    gpus: GPU[];
    storageMax: number;
  };
  network: {
    externalPort: boolean;
    bandWidth: number;
  };
}

type StringifyNested<T> = {
  [K in keyof T]: T[K] extends object ? StringifyNested<T[K]> : string;
};

export type IRawRemoteHardwareInfo = StringifyNested<IRemoteHardwareInfo>;
