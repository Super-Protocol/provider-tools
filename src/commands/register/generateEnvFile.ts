/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigLoader } from '../../common/loader.config';
import { createWallet } from '../../services/utils/wallet.utils';
import { getConfigOffersSection } from './offer-processor/config.utils';
import { OfferType } from '../types';

interface GenereteEnvFileParams {
  config: ConfigLoader;
  offerType: Exclude<OfferType, 'tee'>;
}

enum TaskSystemsType {
  data = 'DATA_PROVIDER_TASK_SYSTEM',
  solution = 'SOLUTION_PROVIDER_TASK_SYSTEM',
}

interface BaseProviderEnvVars extends Record<string, string> {
  CONTRACT_ADDRESS: string;
  PROVIDER_AUTH_ADDRESS: string;
  PROVIDER_ACTION_ACCOUNT_KEY: string;
  TASK_SYSTEM: TaskSystemsType;
  PROVIDER_OFFERS_JSON: string;
  MINIO_BUCKET: string;
  MINIO_ENDPOINT: string;
  MINIO_PORT: string;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  RMQ_QUEUE: string;
  NODEID: string;
  SERVICES: string;
  CRON_JOB_SERVICE_CONFIG: string;
}

export interface DataProviderEnvVars extends BaseProviderEnvVars {
  TASK_SYSTEM: TaskSystemsType.data;
}
export interface SolutionProviderEnvVars extends BaseProviderEnvVars {
  TASK_SYSTEM: TaskSystemsType.solution;
}

type ProviderEnvVars = DataProviderEnvVars | SolutionProviderEnvVars;

const getEnvVars = (params: {
  offerType: Exclude<OfferType, 'tee'>;
  contractAddress: string;
  authorityAddress: string;
  actionAccountKey: string;
  offers: any[];
}): ProviderEnvVars => {
  const { offerType, contractAddress, authorityAddress, actionAccountKey, offers } = params;

  return {
    RMQ_QUEUE: offerType,
    RMQ_EXCHANGE: `exch-${offerType}`,
    MINIO_BUCKET: offerType,
    MINIO_ENDPOINT: 'minio',
    MINIO_PORT: '9000',
    MINIO_ACCESS_KEY: 'CHANGE_ME',
    MINIO_SECRET_KEY: 'CHANGE_ME',
    TASK_SYSTEM: TaskSystemsType[offerType],
    CONTRACT_ADDRESS: contractAddress,
    PROVIDER_AUTH_ADDRESS: authorityAddress,
    PROVIDER_ACTION_ACCOUNT_KEY: actionAccountKey,
    NODEID: `node-ec-${offerType}`,
    MONGODB_URI: `mongodb://mongodb:27017/${offerType}-db`,
    PROVIDER_OFFERS_JSON: JSON.stringify(offers),
    SERVICES: ['common/*.service.js', `${offerType}Provider/*.service.js`].join(','),
    STATE_STORE_FILE: `${offerType}-state.db`,
    CRON_JOB_SERVICE_CONFIG: JSON.stringify({
      actions: {
        'AwaitingPaymentService.doSchedulerWork': { start: '*/10 * * * *' },
        'BlockchainConnectorService.syncBlockchainData': { start: '*/20 * * * * *' },
      },
    }),
  };
};

const generateEnv = (config: ProviderEnvVars): string => {
  let env = `# GENERATED\n`;
  for (const key of Object.keys(config)) {
    env += `${key}=${config[key]}\n`;
  }
  return env;
};

export const generateEnvFile = async (params: GenereteEnvFileParams): Promise<string> => {
  const { config, offerType } = params;

  const offersSection = getConfigOffersSection(offerType);
  const offers = config.loadSection(offersSection);
  const spctl = config.loadSection('spctl');
  const account = config.loadSection('account');

  const envVars = getEnvVars({
    offers,
    offerType,
    contractAddress: spctl.blockchain.smartContractAddress,
    authorityAddress: createWallet(account.authority).address,
    actionAccountKey: account.action,
  });

  return generateEnv(envVars);
};
