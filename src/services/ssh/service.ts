import { ILogger } from '../../common/logger';
import { SshClient } from './client';
import { IMemoryInfo, ISshServiceOptions, IStorageInfo } from './types';

export type ISshService = Required<SshService>;
export class SshService implements ISshService {
  private readonly client: SshClient;
  private readonly logger: ILogger;
  constructor(private readonly options: ISshServiceOptions) {
    this.logger = options.logger;
    this.client = new SshClient(this.options, this.logger);
  }

  async getDiskInfo(): Promise<IStorageInfo> {
    const parse = (output: string): IStorageInfo => {
      const result = parseInt(output, 10);
      if (Number.isSafeInteger(result)) {
        return { max: result };
      }

      this.logger.debug('Could not parse disk info output');

      return { max: 0 };
    };
    const command =
      'kubectl --kubeconfig /etc/rancher/rke2/rke2.yaml -n longhorn-system get nodes.longhorn.io $(hostname) -o json' +
      " | jq '.status.diskStatus | to_entries[] | .value.storageMaximum";
    const data = await this.client.exec(command);

    return parse(data);
  }

  async getMemoryInfo(): Promise<IMemoryInfo> {
    const parse = (output: string): IMemoryInfo => {
      const lines = output.split('\n');
      const line = lines.find((line: string) => line.includes('Mem:'));
      if (line) {
        const words = line.split(/\s+/);
        const neededIndex = 1;

        const result = parseInt(words[neededIndex], 10);
        if (Number.isSafeInteger(result)) {
          return { total: result };
        }
      }

      this.logger.debug('Could not parse memory info output');
      return { total: 0 };
    };
    const data = await this.client.exec('free -m');

    return parse(data);
  }

  async getNetworkInfo(): Promise<string> {
    const data = await this.client.exec('ifconfig');

    this.logger.trace({ data }, 'Network info');

    return data;
  }

  // async getHardwareInfo(): Promise<IRemoteHardwareInfo> {
  //   const parse = (output: string): IRemoteHardwareInfo => {
  //     try {
  //       const rawJson;
  //     } catch (err: Error) {
  //       throw Error(`Could not parse hardware info output: ${err.message}`);
  //     }
  //   };
  //   const data = await this.client.exec("/sp/hardware_info.sh | jq '{hardware,network}'");
  //   return parse(data);
  // }
  async copyFile(source: string, destination: string): Promise<void> {
    await this.client.copyFile(source, destination);
  }
}
