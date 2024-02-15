import inquirer, { QuestionCollection } from 'inquirer';
import { AccountConfig, Config } from './types';
import {
  JWT_CHECK_REGEX,
  PRIVATE_KEY_CHECK_REGEX,
  SPCTL_BACKEND_URL_DEFAULT,
  SPCTL_BLOCKCHAIN_URL_DEFAULT,
  SPCTL_CRYPTO_ALGO_DEFAULT,
  SPCTL_ENCODING_DEFAULT,
  SPCTL_PCCS_SERVICE_DEFAULT,
  SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT,
  SPCTL_STORAGE_TYPE_DEFAULT,
} from '../constant';
import { createWallet } from '../../services/wallet';

interface Answers {
  spctl: {
    backend: {
      accessToken: string;
    };
  };
  account: AccountConfig & { isAutoGenerationNeeded: { [K in keyof AccountConfig]: boolean } };
}

type AccountType = keyof AccountConfig;
const accountTypeKeys: AccountType[] = ['authority', 'action', 'tokenReceiver'];

const getQuestionsObj = (config?: Config): QuestionCollection => {
  const buildAccountQuestion = (accountType: AccountType): QuestionCollection => [
    {
      type: 'confirm',
      name: `account.isAutoGenerationNeeded.${accountType}`,
      message: `Do you need to generate new ${accountType} account? If you choose "yes" the ${accountType} account will be auto generated for you and else you will asked later to enter the key from existed account`,
      default: false,
    },
    {
      type: 'input',
      name: `account.${accountType}`,
      message: `Enter ${accountType} account private key: `,
      default: config?.account?.[accountType],
      validate: (key: string): string | boolean => {
        if (PRIVATE_KEY_CHECK_REGEX.test(key)) {
          return true;
        }

        return `Please, enter valid ${accountType} account private key.`;
      },
      when: (answers: Answers) => !answers.account.isAutoGenerationNeeded[accountType],
    },
  ];

  const accountQuestions = accountTypeKeys
    .map((accountType) => buildAccountQuestion(accountType as AccountType))
    .flat();

  return [
    {
      type: 'input',
      name: 'spctl.backend.accessToken',
      message: 'Enter Access token: ',
      default: config?.spctl.backend?.accessToken,
      validate: (token: string): string | boolean => {
        if (JWT_CHECK_REGEX.test(token)) {
          return true;
        }

        return 'Please, enter valid Access token';
      },
    },
    ...accountQuestions,
  ];
};

export const setup = async (config?: Config): Promise<Config> => {
  const questions = getQuestionsObj(config);
  const answers = (await inquirer.prompt(questions)) as Answers;
  const getAccount = (answers: Answers, accountType: AccountType): string =>
    answers.account.isAutoGenerationNeeded[accountType]
      ? createWallet().privateKey
      : answers.account[accountType];

  const actionAccount = getAccount(answers, 'action');
  const authorityAccount = getAccount(answers, 'authority');
  const tokenReceiverAccount = getAccount(answers, 'tokenReceiver');
  return {
    spctl: {
      backend: {
        url: config?.spctl.backend.url ?? SPCTL_BACKEND_URL_DEFAULT,
        accessToken: answers.spctl.backend.accessToken,
      },
      blockchain: {
        rpcUrl: config?.spctl.blockchain?.rpcUrl ?? SPCTL_BLOCKCHAIN_URL_DEFAULT,
        smartContractAddress:
          config?.spctl.blockchain?.smartContractAddress ?? SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT,
        accountPrivateKey: actionAccount,
        authorityAccountPrivateKey: authorityAccount,
      },
      storage: {
        type: config?.spctl.storage?.type ?? SPCTL_STORAGE_TYPE_DEFAULT,
        bucket: '',
        prefix: '',
        readAccessToken: '',
        writeAccessToken: '',
      },
      workflow: {
        resultEncryption: {
          algo: config?.spctl.workflow.resultEncryption.algo ?? SPCTL_CRYPTO_ALGO_DEFAULT,
          key: '',
          encoding: config?.spctl.workflow.resultEncryption.encoding ?? SPCTL_ENCODING_DEFAULT,
        },
      },
      tii: {
        pccsServiceApiUrl: config?.spctl.tii.pccsServiceApiUrl ?? SPCTL_PCCS_SERVICE_DEFAULT,
      },
    },
    account: {
      authority: authorityAccount,
      action: actionAccount,
      tokenReceiver: tokenReceiverAccount,
    },
    ...(config?.logger && { logger: config.logger }),
  };
};
