import { ILogger } from '../../common/logger';
import { SshClient } from './client';
import { IRawRemoteHardwareInfo, IRemoteHardwareInfo, ISshServiceOptions } from './types';

export type ISshService = Required<SshService>;
export class SshService implements ISshService {
  private readonly client: SshClient;
  private readonly logger: ILogger;
  constructor(private readonly options: ISshServiceOptions) {
    this.logger = options.logger;
    this.client = new SshClient(this.options, this.logger);
  }

  async getHardwareInfo(): Promise<IRemoteHardwareInfo> {
    const convert = (rawHardwareInfo: IRawRemoteHardwareInfo): IRemoteHardwareInfo => ({
      hardware: {
        cpusPerSocket: Number.parseInt(rawHardwareInfo.hardware.cpusPerSocket),
        sockets: Number.parseInt(rawHardwareInfo.hardware.sockets),
        simultaneousMultithreading: Number.parseInt(
          rawHardwareInfo.hardware.simultaneousMultithreading,
        ),
        cpuThreadsPerCore: Number.parseInt(rawHardwareInfo.hardware.cpuThreadsPerCore),
        cpuTotalThreads: Number.parseInt(rawHardwareInfo.hardware.cpuTotalThreads),
        logicalCores: Number.parseInt(rawHardwareInfo.hardware.logicalCores),
        ramTotal: Number.parseInt(rawHardwareInfo.hardware.ramTotal),
        gpus: rawHardwareInfo.hardware.gpus.map((gpu) => ({
          name: gpu.name,
          instanceProfiles: gpu.instanceProfiles.map((instanceProfile) => ({
            name: instanceProfile.name,
            memory: Number.parseFloat(instanceProfile.memory) * 1024 * 1024 * 1024,
            cores: Number.parseInt(instanceProfile.cores),
            totalInstances: Number.parseInt(instanceProfile.totalInstances),
          })),
        })),
        storageMax: Number.parseInt(rawHardwareInfo.hardware.storageMax),
      },
      network: {
        externalPort: rawHardwareInfo.network.externalPort.toLowerCase() === 'true',
        bandWidth: Number.parseInt(rawHardwareInfo.network.bandWidth),
      },
    });

    const parse = (output: string): IRemoteHardwareInfo => {
      try {
        return convert(JSON.parse(output));
      } catch (err: unknown) {
        throw Error(`Could not parse hardware info output: ${(err as Error).message}`);
      }
    };
    const data = await this.client.exec("/sp/hardware-info.sh | jq '{hardware,network}'");
    return parse(data);
  }

  async copyFile(source: string, destination: string): Promise<void> {
    await this.client.copyFile(source, destination);
  }
}
