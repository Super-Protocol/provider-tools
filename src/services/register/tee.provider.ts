import { ISpctlService } from '../spctl';
import {
  APP_NAME,
  MIN_MATIC_SUM_FOR_PROVIDER_ACCOUNT,
  MIN_TEE_SUM_FOR_PROVIDER_ACCOUNT,
} from '../../common/constant';
import { createWallet } from '../utils/wallet.utils';
import { AccountConfig } from '../../common/config';
import { ILogger } from '../../common/logger';
import { IProvider } from '../spctl/types';
import { generateShortHash } from './utils';

export type RegisterTeeProviderParams = {
  logger?: ILogger;
  service: ISpctlService;
  accounts: AccountConfig;
};

const needReplenish = async (
  service: ISpctlService,
  pk: string,
): Promise<{ tee: boolean; matic: boolean }> => {
  const balance = await service.checkBalance(pk);
  return {
    tee: balance.tee.lt(MIN_TEE_SUM_FOR_PROVIDER_ACCOUNT),
    matic: balance.matic.lt(MIN_MATIC_SUM_FOR_PROVIDER_ACCOUNT),
  };
};

const createProvider = async (params: RegisterTeeProviderParams): Promise<IProvider> => {
  const providerName = generateShortHash(createWallet(params.accounts.authority).address);
  const provider: IProvider = {
    name: `${providerName} - auto generated provider by ${APP_NAME}`,
    description: `It was created at ${new Date().toISOString()}`,
    tokenReceiver: createWallet(params.accounts.tokenReceiver).address,
    actionAccount: createWallet(params.accounts.action).address,
    metadata: '',
  };

  const fileName = `provider_${providerName}.json`;
  await params.service.createProvider(fileName, provider);

  return provider;
};

export const registerTeeProvider = async (
  params: RegisterTeeProviderParams,
): Promise<IProvider> => {
  const { service } = params;

  const address = createWallet(params.accounts.authority).address;
  const provider = await service.getProviderByAddress(address, `${Date.now()}.tee-provider.json`);
  if (provider) {
    return provider;
  }
  const replenishAccountBalance = async (pk: string): Promise<void> => {
    const needs = await needReplenish(service, pk);
    await service.requestTokens({
      ...needs,
      account4Replenish: pk,
    });
  };

  await Promise.all([
    replenishAccountBalance(params.accounts.authority),
    replenishAccountBalance(params.accounts.action),
  ]);

  return createProvider(params);
};
