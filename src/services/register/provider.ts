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
import { CreateProviderError, ReplenishAccountBalanceError } from './errors';

export type ReplenishTokensParams = {
  service: ISpctlService;
  account: string;
};

export type RegisterProviderParams = {
  logger?: ILogger;
  service: ISpctlService;
  accounts: AccountConfig;
  providerName: string;
  providerDescription?: string;
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

export const getProvider = async (
  service: ISpctlService,
  authorityPrivateKey: string,
): Promise<IProvider | null> => {
  const address = createWallet(authorityPrivateKey).address;

  return service.getProviderByAddress(address);
};

export const replenishAccountBalance = async (params: ReplenishTokensParams): Promise<void> => {
  const { service, account } = params;
  try {
    const needs = await needReplenish(service, account);
    await service.requestTokens({
      ...needs,
      account4Replenish: account,
    });
  } catch (err) {
    throw new ReplenishAccountBalanceError('Failed to replenish account balance', err as Error);
  }
};

export const registerProvider = async (params: RegisterProviderParams): Promise<IProvider> => {
  try {
    const timestamp = new Date().toISOString();
    const provider: IProvider = {
      name: params.providerName ?? `${timestamp} - auto generated provider by ${APP_NAME}`,
      description: params.providerDescription ?? '',
      tokenReceiver: createWallet(params.accounts.tokenReceiver).address,
      actionAccount: createWallet(params.accounts.action).address,
      metadata: '',
    };

    const fileName = `provider_${timestamp}.json`;
    await params.service.createProvider(fileName, provider);

    return provider;
  } catch (err) {
    throw new CreateProviderError('Failed to create provider', err as Error);
  }
};
