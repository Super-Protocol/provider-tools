import { Answers, Question } from 'inquirer';
import Path from 'path';
import fs from 'fs';
import { ProviderInfoConfig } from '../../common/config';
import { DEFAULT_PROVIDER_NAME } from '../../common/constant';
import { ISpctlService } from '../../services/spctl';
import util from 'util';
import { matchKeys } from '../../services/utils/crypto.utils';
import { OfferType } from '../types';
import { toSpctlOfferType } from './utils';

export interface IProviderRegisterQuestions {
  getProviderMetaData: (config?: ProviderInfoConfig) => Question[];
  doYouWantToSaveProvider: Question[];
  createOffer: (service: ISpctlService, offerType: OfferType) => Question[];
}

export interface IRegisterProviderAnswers {
  getProviderMetaData: {
    providerName: string;
    providerDescription?: string;
  };
  doYouWantToSaveProvider: {
    shouldBeSaved: boolean;
    fileName: string;
  };
  createOffer: {
    hasOffer: boolean;
    auto: boolean;
    offerInfo?: string;
    offerId: string;
    publicKey?: string;
    pk: string;
  };
  addOption: {
    optionInfo: string;
    anymore: boolean;
  };
}

export const ProviderRegisterQuestions: IProviderRegisterQuestions = {
  getProviderMetaData: (config?: ProviderInfoConfig): Question[] => {
    const timestamp = new Date().valueOf();

    return [
      {
        type: 'input',
        name: 'getProviderMetaData.providerName',
        message: 'Please enter provider name: ',
        default: `${timestamp} - ${DEFAULT_PROVIDER_NAME}`,
        validate: (value: string): string | boolean => {
          if (!value) {
            return 'Please specify provider name: ';
          }

          return true;
        },
        when: () => !config?.name,
      },
      {
        type: 'input',
        name: 'getProviderMetaData.providerDescription',
        message: 'Please enter provider description: ',
        when: () => config?.description === undefined,
      },
    ];
  },
  doYouWantToSaveProvider: [
    {
      type: 'confirm',
      name: 'doYouWantToSaveProvider.shouldBeSaved',
      message: 'Do you want to save provider info into a file?',
      default: false,
    },
    {
      type: 'input',
      name: 'doYouWantToSaveProvider.fileName',
      message: 'Please enter the filename: ',
      default: `./provider-${new Date().valueOf()}.json`,
      validate: (fileName: string): string | boolean => {
        const fileNameRegex = /^[a-zA-Z0-9_.-]+$/;
        const baseName = Path.basename(fileName);

        if (!fileNameRegex.test(baseName)) {
          return 'Please enter valid file name: ';
        }

        if (fs.existsSync(fileName)) {
          return 'File is already existed, please enter new name: ';
        }

        const fullPath = Path.resolve(fileName);
        const currentDir = process.cwd();
        if (!fullPath.startsWith(currentDir)) {
          return 'The path to the file is outside the current directory. Please enter another filename: ';
        }

        return true;
      },
      when: (answers: Answers) => answers.doYouWantToSaveProvider.shouldBeSaved,
    },
  ],
  createOffer: (service: ISpctlService, offerType: OfferType) => [
    {
      type: 'confirm',
      name: 'createOffer.hasOffer',
      message: `Have you already created a ${offerType.toUpperCase()} offer?`,
      default: false,
    },
    {
      type: 'confirm',
      name: 'createOffer.auto',
      message: `Do you want a ${offerType.toUpperCase()} offer to be created automatically? if not, you will be asked to provide offer json file`,
      default: false,
      when: (answers: Answers) => !answers.createOffer.hasOffer && offerType === 'tee',
    },
    {
      type: 'input',
      name: 'createOffer.offerInfo',
      message: 'Please specify a path to the offer info json file: ',
      when: (answers: Answers) => !answers.createOffer.auto && !answers.createOffer.hasOffer,
      validate(fileName: string): boolean | string {
        if (!fs.existsSync(fileName)) {
          return 'File not found, please specify it again: ';
        }

        return true;
      },
    },
    {
      type: 'input',
      name: 'createOffer.offerId',
      message: 'Please specify the offer id: ',
      default: false,
      when: (answers: Answers) => answers.createOffer.hasOffer,
      async validate(offerId: string, answers?: Answers): Promise<boolean | string> {
        const regex = /^[1-9]\d*$/;
        if (!regex.test(offerId)) {
          return 'Please specify valid order number (positive integer); ';
        }
        try {
          const offer = await service.getOfferInfo(offerId, toSpctlOfferType(offerType));
          if (!offer) {
            return `Order ${offerId} was not found. Please try to specify another order number: `;
          }

          if (answers) {
            answers.createOffer.publicKey = JSON.parse(offer.argsPublicKey).key;
          }
          if (!answers?.createOffer.publicKey) {
            return `Order ${offerId} does not have "argsPublicKey" or it has invalid data. Please try to specify another order number: `;
          }
        } catch (err) {
          return (
            `Get offer info error:\n${util.inspect(err, { compact: true })}` +
            '\nPlease try specify order number again: '
          );
        }

        return true;
      },
    },
    {
      type: 'input',
      name: 'createOffer.pk',
      message:
        'Please specify the private key which was used for offer encryption (argsPublicKey): ',
      when: (answers: Answers) => answers.createOffer.hasOffer && answers.createOffer.offerId,
      validate(pk: string, answers?: Answers): boolean | string {
        if (answers?.createOffer.publicKey && !matchKeys(answers.createOffer.publicKey, pk)) {
          return 'Private does not match with offer args public key. Please specify the valid private key: ';
        }
        return true;
      },
    },
  ],
};
