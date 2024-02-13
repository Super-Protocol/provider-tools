import { BigNumber, ethers } from 'ethers';
import { ILogger } from '../../common/logger';
import { spawnCommand } from './spawnCommand';
import { SpctlConfig } from '../../common/config';

export type SpctlServiceParams = {
  locationPath: string;
  logger: ILogger;
  config: SpctlConfig;
};

export type ISpctlService = Required<SpctlService>;
type Balance = {
  tee: BigNumber;
  matic: BigNumber;
};
export class SpctlService implements ISpctlService {
  protected readonly logger: ILogger;
  protected readonly locationPath: string;

  constructor(params: SpctlServiceParams) {
    this.logger = params.logger;
    this.locationPath = params.locationPath;
  }

  protected async exec(args: string[]): Promise<string> {
    const command = './spctl';
    const response = await spawnCommand(command, args, this.locationPath);

    if (response.code > 0) {
      throw Error(response.stderr.toString());
    }

    return response.stdout.toString();
  }
  async getVersion(): Promise<string> {
    const args = ['-V'];

    return this.exec(args);
  }

  async checkBalance(): Promise<Balance> {
    const args = ['tokens', 'balance'];
    const response = await this.exec(args);
    const regex = /Balance\s+of\s+\S+:\s+([0-9.]+)\s+(TEE|MATIC)/g;
    let match;
    const result: Balance = {
      tee: BigNumber.from(0),
      matic: BigNumber.from(0),
    };
    while ((match = regex.exec(response)) !== null) {
      const value = match[1];
      match[2].toLowerCase() === 'tee'
        ? (result.tee = ethers.utils.parseEther(value))
        : (result.matic = ethers.utils.parseEther(value));
    }

    return result;
  }

  async requestTokens(params: { tee: boolean; matic: boolean }): Promise<void> {
    const args = ['tokens', 'request'];
    if (params.matic) {
      args.push('--matic');
    }
    if (params.tee) {
      args.push('--tee');
    }
    if (args.length < 3) {
      return;
    }

    const response = await this.exec(args);

    if (response) {
      this.logger.trace(response);
    }
  }
}
