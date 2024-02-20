import { BigNumber, ethers } from 'ethers';
import { ILogger } from '../../common/logger';
import { spawnCommand } from './spawnCommand';
import { KnownTool, SpctlConfig } from '../../common/config';
import * as Path from 'path';
import { fileExist, readJsonFile, removeFileIfExist, writeToFile } from '../utils/file.utils';
import { IOfferInfo, IProvider, OfferType } from './types';

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
    const command = `./${KnownTool.SPCTL}`;
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

  async getProviderByAddress(address: string): Promise<IProvider | null> {
    const saveFileName = `${Date.now()}.tee-provider.json`;
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

      return provider as unknown as IProvider;
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

  private parse(regex: RegExp, text: string): string {
    let match;
    const ids: string[] = [];

    while ((match = regex.exec(text)) !== null) {
      ids.push(match[1]);
    }

    return ids.length ? ids[0] : '';
  }

  async createOffer(fileName: string, offerType: OfferType): Promise<string> {
    const absolutePath = Path.resolve(fileName);
    const args = ['offers', 'create', offerType, '--yes', '--path', absolutePath];
    const response = await this.exec(args);
    const id = this.parse(/Offer was created with id (\d+)/g, response);

    if (!id) {
      throw Error('Offer creating was failed');
    }

    return id;
  }

  async getOfferInfo(offerId: string): Promise<IOfferInfo | null> {
    const saveFileName = `offer-info-${offerId}.json`;
    const args = ['offers', 'get-info', 'tee', offerId, '--save-to', saveFileName];
    const response = await this.exec(args);
    this.logger.trace({ response }, 'offer-info response');
    const fileName = Path.join(this.locationPath, saveFileName);
    if (await fileExist(fileName)) {
      const obj = await readJsonFile(fileName);

      await removeFileIfExist(fileName);

      return obj as unknown as IOfferInfo;
    }

    return null;
  }

  async addOfferSlot(fileName: string, offerId: string, offerType: OfferType): Promise<string> {
    const absolutePath = Path.resolve(fileName);
    const args = ['offers', 'add-slot', offerType, '--offer', offerId, '--path', absolutePath];
    const response = await this.exec(args);
    const id = this.parse(/Slot was created with id (\d+)/g, response);

    if (!id) {
      throw Error('Slot creating was failed');
    }

    return id;
  }

  async addTeeOfferOption(fileName: string, offerId: string): Promise<string> {
    const absolutePath = Path.resolve(fileName);
    const args = ['offers', 'add-option', 'tee', '--offer', offerId, '--path', absolutePath];
    const response = await this.exec(args);
    const id = this.parse(/Option\s(\d+)\swas\sadded\sto\soffer\s(\d+)/g, response);

    if (!id) {
      throw Error('Option creating was failed');
    }

    return id;
  }
}
