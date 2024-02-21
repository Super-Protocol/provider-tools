import { ILogger } from '../../common/logger';
import { SshClient } from './client';
import { ISshServiceOptions } from './types';

export type ISshService = Required<SshService>;
export class SshService implements ISshService {
  private readonly client: SshClient;
  private readonly logger: ILogger;
  constructor(private readonly options: ISshServiceOptions) {
    this.logger = options.logger;
    this.client = new SshClient(this.options, this.logger);
  }

  async getDiskInfo(): Promise<number> {
    const parse = (output: string): number => {
      const result = parseInt(output, 10);
      if (Number.isSafeInteger(result)) {
        return result;
      }

      this.logger.debug('Could not parse disk info output');
      return 0;
    };
    const command =
      'kubectl --kubeconfig /etc/rancher/rke2/rke2.yaml -n longhorn-system get nodes.longhorn.io $(hostname) -o json' +
      " | jq '.status.diskStatus | to_entries[] | .value.storageMaximum";
    const data = await this.client.exec(command);
    const value = parse(data);

    return Math.round(value * 0.8);
  }

  async getMemoryInfo(): Promise<number> {
    const parse = (output: string): number => {
      const lines = output.split('\n');
      const line = lines.find((line: string) => line.includes('Mem:'));
      if (line) {
        const words = line.split(/\s+/);
        const neededIndex = 1;

        const result = parseInt(words[neededIndex], 10);
        if (Number.isSafeInteger(result)) {
          return result;
        }
      }

      this.logger.debug('Could not parse memory info output');
      return 0;
    };
    const data = await this.client.exec('free -m');
    const value = parse(data);

    return Math.round(value * 0.9);
  }

  async getNetworkInfo(): Promise<string> {
    const data = await this.client.exec('ifconfig');

    this.logger.trace({ data }, 'Network info');

    return data;
  }

  async copyFile(source: string, destination: string): Promise<void> {
    await this.client.copyFile(source, destination);
  }
}
