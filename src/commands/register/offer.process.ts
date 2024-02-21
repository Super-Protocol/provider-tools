import { ISpctlService } from '../../services/spctl';
import inquirer from 'inquirer';
import { IRegisterProviderAnswers, ProviderRegisterQuestions } from './questions';
import { ILogger } from '../../common/logger';
import { generatePair } from '../../services/utils/crypto.utils';
import { readJsonFile, removeFileIfExist, writeToFile } from '../../services/utils/file.utils';
import { ConfigLoader } from '../../common/loader.config';
import Path from 'path';
import * as os from 'os';
import { ProviderOffer } from '../../common/config';
import { OfferType } from './types';
import { toSpctlOfferType } from './utils';
import { SpctlOfferType } from '../../services/spctl/types';

interface OfferProcessParams {
  config: ConfigLoader;
  service: ISpctlService;
  offerType: OfferType;
  logger: ILogger;
}

const buildResultPublicKey = (base64EncryptKey: string): { argsPublicKey: string } => {
  const encryption = {
    algo: 'ECIES',
    encoding: 'base64',
    key: base64EncryptKey,
  };

  return { argsPublicKey: JSON.stringify(encryption) };
};

const updateProviderOffers = (config: ConfigLoader, offerId: string, decryptKey: string): void => {
  const offers = config.loadSection('providerOffers');
  const providerOfferInfo: ProviderOffer = {
    id: offerId,
    argsPrivateKey: decryptKey,
  };
  const index = offers.findIndex((item) => item.id === offerId);

  index === -1 ? offers.push(providerOfferInfo) : (offers[index] = providerOfferInfo);

  config.updateSection('providerOffers', offers);
};

const addSlots = async (
  offerId: string,
  service: ISpctlService,
  logger: ILogger,
  offerType: SpctlOfferType,
): Promise<void> => {
  const ask = async (): Promise<void> => {
    const createSlotAnswers = (await inquirer.prompt(
      ProviderRegisterQuestions.addSlot,
    )) as IRegisterProviderAnswers;
    const slotId = await service.addOfferSlot(
      createSlotAnswers.addSlot.slotInfo,
      offerId,
      offerType,
    );
    logger.info(`Slot ${slotId} for offer ${offerId} has been created successfully`);

    if (createSlotAnswers.addSlot.anymore) {
      await ask();
    }
  };

  await ask();
};

const addOptions = async (
  offerId: string,
  service: ISpctlService,
  logger: ILogger,
): Promise<void> => {
  const ask = async (): Promise<void> => {
    const createOptionAnswers = (await inquirer.prompt(
      ProviderRegisterQuestions.addOption,
    )) as IRegisterProviderAnswers;
    const optionId = await service.addTeeOfferOption(
      createOptionAnswers.addOption.optionInfo,
      offerId,
    );
    logger.info(`Option ${optionId} for offer ${offerId} has been created successfully`);

    if (createOptionAnswers.addOption.anymore) {
      await ask();
    }
  };

  await ask();
};

const createOffer = async (
  publicKey: string,
  pathToOfferInfo: string,
  service: ISpctlService,
  logger: ILogger,
  offerType: SpctlOfferType,
): Promise<string> => {
  let offerId = '';

  const offerInfo = {
    ...(await readJsonFile(pathToOfferInfo)),
    ...buildResultPublicKey(publicKey),
  };
  const tmpFileName = Path.join(os.tmpdir(), `${new Date().valueOf()}-offer-info.json`);
  await writeToFile(tmpFileName, offerInfo);

  try {
    offerId = await service.createOffer(tmpFileName, offerType);
  } finally {
    await removeFileIfExist(tmpFileName);
  }
  logger.info(`Offer ${offerId} has been created successfully`);

  return offerId;
};

export default async (params: OfferProcessParams): Promise<string> => {
  const { config, service, logger } = params;
  const offerType = toSpctlOfferType(params.offerType);

  const deployedOfferIds = config.loadSection('providerOffers').map((item) => item.id);
  const questions = ProviderRegisterQuestions.createOffer(deployedOfferIds, service, offerType);
  const createOfferAnswers = (await inquirer.prompt(questions)) as IRegisterProviderAnswers;
  let offerId = '';

  if (!createOfferAnswers.createOffer.auto && createOfferAnswers.createOffer.offerInfo) {
    const keys = generatePair();

    offerId = await createOffer(
      keys.publicKey,
      createOfferAnswers.createOffer.offerInfo,
      service,
      logger,
      offerType,
    );
    updateProviderOffers(config, offerId, keys.privateKey);
    await addSlots(offerId, service, logger, offerType);

    if (offerType === 'tee') {
      await addOptions(offerId, service, logger);
    }
  } else if (createOfferAnswers.createOffer.hasOffer && createOfferAnswers.createOffer.offerId) {
    offerId = createOfferAnswers.createOffer.offerId;

    if (createOfferAnswers.createOffer.pk) {
      updateProviderOffers(config, offerId, createOfferAnswers.createOffer.pk);
    }
  }

  return offerId;
};
