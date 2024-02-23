import { ConfigLoader } from '../../common/loader.config';
import { ISpctlService } from '../../services/spctl/service';
import { getConfigOffersSection } from './offer-processor/config.utils';
import { OfferType } from './types';
import { getRunnerAsset } from './utils';

interface GenereteEnvFileParams {
  config: ConfigLoader;
  offerType: OfferType;
  service: ISpctlService;
}

export const generateEnvFile = async (params: GenereteEnvFileParams): Promise<string> => {
  const { config, offerType } = params;

  const section = getConfigOffersSection(offerType);
  const providerOffers = config.loadSection(section);
  const templateContent = await getRunnerAsset('.env.template');

  return templateContent.replace('{{providerOffersJson}}', JSON.stringify(providerOffers));
};
