import { deployConfig } from './config';
import { stringify } from 'yaml';
import { writeToFile } from '../../../services/utils/file.utils';
import Path from 'path';
import {
  DEFAULT_DEPLOY_CONFIG_FILE_NAME,
  DEPLOY_CONFIG_PROVIDER_OFFER_DEVICE_ID,
} from '../../../common/constant';
import { ConfigLoader } from '../../../common/loader.config';
import { createWallet } from '../../../services/utils/wallet.utils';
import { ProviderOffer } from '../../../common/config';

export type DeployConfigBuilderParams = {
  fileName?: string;
  config: ConfigLoader;
};

export default async (params: DeployConfigBuilderParams): Promise<string> => {
  const { config, fileName = DEFAULT_DEPLOY_CONFIG_FILE_NAME } = params;
  const actions = config.loadSection('account');
  const saveTo = Path.resolve(fileName);
  const deploy = { ...deployConfig };
  deploy.data.PROVIDER_ACTION_ACCOUNT_KEY = actions.action;
  deploy.data.PROVIDER_AUTH_ADDRESS = createWallet(actions.authority).address;
  deploy.data.PROVIDER_PRIVATE_KEY = actions.authority;
  deploy.data.PROVIDER_OFFERS_JSON = config
    .loadSection('providerOffers')
    .map((providerOffer: ProviderOffer) => ({
      ...providerOffer,
      deviceId: DEPLOY_CONFIG_PROVIDER_OFFER_DEVICE_ID,
    }));

  await writeToFile(saveTo, deployConfig, (data) => stringify(data));

  return saveTo;
};
