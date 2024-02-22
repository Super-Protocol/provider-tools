import Path from 'path';
import os from 'os';

import { ISpctlService } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import { removeFileIfExist, writeToFile } from '../../../services/utils/file.utils';
import { ConfigLoader } from '../../../common/loader.config';
import { generatePair } from '../../../services/utils/crypto.utils';
import { updateProviderOffers } from './config.utils';
import { process as processSlots } from './offer-slot.processor';
import { process as processOptions } from './offer-option.processor';
import { IOfferInfo } from '../offer-builder';
import { OfferType } from '../types';
import { toSpctlOfferType } from '../utils';

const buildResultPublicKey = (base64EncryptKey: string): { argsPublicKey: string } => {
  const encryption = {
    algo: 'ECIES',
    encoding: 'base64',
    key: base64EncryptKey,
  };

  return { argsPublicKey: JSON.stringify(encryption) };
};

type ProcessOfferParams = IManualOfferProcessorParams;
export const processOffer = async (params: ProcessOfferParams): Promise<string> => {
  const { config, offerInfo, service, logger, offerType } = params;
  const keys = generatePair();
  let offerId = '';

  const updatedOfferInfo = {
    ...offerInfo,
    ...buildResultPublicKey(keys.publicKey),
  };
  const tmpFileName = Path.join(os.tmpdir(), `${new Date().valueOf()}-offer-info.json`);
  await writeToFile(tmpFileName, updatedOfferInfo);

  try {
    offerId = await service.createOffer(tmpFileName, toSpctlOfferType(offerType));
  } finally {
    await removeFileIfExist(tmpFileName);
  }
  logger.info(`Offer ${offerId} has been created successfully`);

  updateProviderOffers({
    config,
    offerId,
    decryptKey: keys.privateKey,
    offerType,
    resourceFileData: null,
  });

  return offerId;
};

interface IManualOfferProcessorParams {
  offerInfo: IOfferInfo;
  service: ISpctlService;
  logger: ILogger;
  offerType: OfferType;
  config: ConfigLoader;
}
export const process = async (params: IManualOfferProcessorParams): Promise<string> => {
  const offerId = await processOffer(params);

  await processSlots({ ...params, offerId });

  if (params.offerType === 'tee') {
    await processOptions({ ...params, offerId });
  }

  return offerId;
};
