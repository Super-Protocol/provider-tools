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
): Promise<void> => {
  const ask = async (): Promise<void> => {
    const createSlotAnswers = (await inquirer.prompt(
      ProviderRegisterQuestions.addSlot,
    )) as IRegisterProviderAnswers;
    const slotId = await service.addTeeOfferSlot(createSlotAnswers.addSlot.slotInfo, offerId);
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

const createTeeOffer = async (
  publicKey: string,
  pathToOfferInfo: string,
  service: ISpctlService,
  logger: ILogger,
): Promise<string> => {
  let offerId = '';

  const offerInfo = {
    ...(await readJsonFile(pathToOfferInfo)),
    ...buildResultPublicKey(publicKey),
  };
  const tmpFileName = Path.join(os.tmpdir(), `${new Date().valueOf()}-offer-info.json`);
  await writeToFile(tmpFileName, offerInfo);

  try {
    offerId = await service.createTeeOffer(tmpFileName);
  } finally {
    await removeFileIfExist(tmpFileName);
  }
  logger.info(`Offer ${offerId} has been created successfully`);

  return offerId;
};

export default async (
  config: ConfigLoader,
  service: ISpctlService,
  logger: ILogger,
): Promise<string> => {
  const deployedOfferIds = config.loadSection('providerOffers').map((item) => item.id);
  const createOfferAnswers = (await inquirer.prompt(
    ProviderRegisterQuestions.createOffer(deployedOfferIds, service),
  )) as IRegisterProviderAnswers;
  let offerId = '';

  if (!createOfferAnswers.createOffer.auto && createOfferAnswers.createOffer.offerInfo) {
    const keys = generatePair();

    offerId = await createTeeOffer(
      keys.publicKey,
      createOfferAnswers.createOffer.offerInfo,
      service,
      logger,
    );
    updateProviderOffers(config, offerId, keys.privateKey);
    await addSlots(offerId, service, logger);
    await addOptions(offerId, service, logger);
  } else if (createOfferAnswers.createOffer.hasOffer && createOfferAnswers.createOffer.offerId) {
    if (createOfferAnswers.createOffer.pk) {
      offerId = createOfferAnswers.createOffer.offerId;
      updateProviderOffers(config, offerId, createOfferAnswers.createOffer.pk);
    }
  }

  return offerId;
};