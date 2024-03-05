import { prepareSshConfig } from '../../deploy';
import { build } from '../offer-builder';
import { createSshService } from '../../../services/ssh';
import { ConfigLoader } from '../../../common/loader.config';
import { processOffer } from './manual-offer.processor';
import { ISpctlService } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import { process as processAutoSlots } from './auto-offer-slot.processor';
import { process as processAutoOptions } from './auto-offer-option.processor';
import { OfferType } from '../types';
import { toSpctlOfferType } from '../utils';
import { ProviderValueOffer } from '../../../common/config';

interface IAutoOfferProcessorParams {
  config: ConfigLoader;
  logger: ILogger;
  offerType: OfferType;
  service: ISpctlService;
  resourceFileData: Omit<ProviderValueOffer, 'id'> | null;
}

export const process = async (params: IAutoOfferProcessorParams): Promise<string> => {
  const { config, logger } = params;

  await prepareSshConfig(config);

  const offerInfo = await build({ service: await createSshService({ config, logger }) });
  const offerId = await processOffer({ ...params, offerInfo });
  const spctlOfferType = toSpctlOfferType(params.offerType);

  await processAutoSlots({
    ...params,
    offerId,
    resources: offerInfo.hardwareInfo.slotInfo,
  });

  if (params.offerType === 'tee') {
    await processAutoOptions({
      ...params,
      offerId,
      resources: offerInfo.hardwareInfo.optionInfo,
      offerType: spctlOfferType,
    });
  }

  return offerId;
};
