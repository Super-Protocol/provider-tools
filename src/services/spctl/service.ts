import { BigNumber, ethers } from 'ethers';
import { ILogger } from '../../common/logger';
import { spawnCommand } from './spawnCommand';
import { SpctlConfig } from '../../common/config';
import * as Path from 'path';
import { fileExist, readJsonFile, removeFileIfExist, writeToFile } from '../utils/file.utils';
import { IProvider } from './types';

export type SpctlServiceParams = {
  locationPath: string;
  logger: ILogger;
  config: SpctlConfig;
};

type Balance = {
  tee: BigNumber;
  matic: BigNumber;
};

export type ISpctlService = Required<SpctlService>;
export type RequestTokenParams = {
  tee: boolean;
  matic: boolean;
  account4Replenish: string;
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
    const response = await spawnCommand(command, args, this.locationPath, this.logger);

    if (response.code > 0) {
      throw Error(response.stderr.toString());
    }

    return response.stdout.toString();
  }
  async getVersion(): Promise<string> {
    const args = ['-V'];

    return this.exec(args);
  }

  async checkBalance(pk: string): Promise<Balance> {
    const args = ['tokens', 'balance', '--custom-key', pk];
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

  async requestTokens(params: RequestTokenParams): Promise<void> {
    const args = ['tokens', 'request'];
    if (params.matic) {
      args.push('--matic');
      this.logger.debug('matic tokens will be replenish a bit later');
    }
    if (params.tee) {
      args.push('--tee');
      this.logger.debug('tee tokens will be replenish a bit later');
    }
    if (args.length < 3) {
      return;
    }
    args.push('--custom-key', params.account4Replenish);

    const response = await this.exec(args);

    if (response) {
      this.logger.trace(response);
    }
  }

  async getProviderByAddress(address: string, saveFileName: string): Promise<IProvider | null> {
    const providerFields = ['name', 'address'];
    const args = [
      'providers',
      'get',
      address,
      '--save-to',
      saveFileName,
      '--fields',
      providerFields.join(','),
    ];

    const response = await this.exec(args);
    this.logger.trace({ response }, 'providers get response');
    const fileName = Path.join(this.locationPath, saveFileName);
    if (await fileExist(fileName)) {
      const provider = await readJsonFile(fileName);

      await removeFileIfExist(fileName);

      return provider as IProvider;
    }

    return null;
  }

  async createProvider(fileName: string, data: IProvider): Promise<void> {
    const filePath = Path.join(this.locationPath, fileName);
    await writeToFile(filePath, data, (data) => JSON.stringify(data, null, 2));
    const args = ['providers', 'create', '--path', fileName, '--yes'];
    try {
      const response = await this.exec(args);
      this.logger.debug(response);
    } finally {
      await removeFileIfExist(filePath);
    }
  }
}
