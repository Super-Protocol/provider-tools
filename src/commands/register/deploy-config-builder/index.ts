import Path from 'path';
import { stringify } from 'yaml';

import { deployConfig } from './config';
import { writeToFile } from '../../../services/utils/file.utils';
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

  const providerOffers = config
    .loadSection('providerOffers')
    .sort((a, b) => {
      const a1 = a.modifiedAt ?? 0;
      const b1 = b.modifiedAt ?? 0;
      if (a1 > b1) {
        return -1;
      } else if (a1 < b1) {
        return 1;
      }

      return 0;
    })
    .map((providerOffer: ProviderOffer) => ({
      id: providerOffer.id,
      argsPrivateKey: providerOffer.argsPrivateKey,
      deviceId: DEPLOY_CONFIG_PROVIDER_OFFER_DEVICE_ID,
    }));

  deploy.data.PROVIDER_OFFERS_JSON = providerOffers.length ? [providerOffers[0]] : [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  await writeToFile(saveTo, deployConfig, (data: any): string => {
    const { data: rawData, ...rest } = data;

    return stringify(
      {
        ...rest,
        data: {
          ...rawData,
          PROVIDER_OFFERS_JSON: JSON.stringify(rawData.PROVIDER_OFFERS_JSON, null, 2),
        },
      },
      { blockQuote: 'literal' },
    );
  });

  return saveTo;
};
