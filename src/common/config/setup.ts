import inquirer, { QuestionCollection } from 'inquirer';
import { AccountConfig, Config } from './types';
import { JWT_CHECK_REGEX, PRIVATE_KEY_CHECK_REGEX } from '../constant';
import { create } from '../../services/wallet';

interface Answers {
  backend: {
    accessToken: string;
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
      name: 'backend.accessToken',
      message: 'Enter Access token: ',
      default: config?.backend?.accessToken,
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
      ? create().privateKey
      : answers.account[accountType];

  return {
    backend: {
      accessToken: answers.backend.accessToken,
    },
    account: {
      authority: getAccount(answers, 'authority'),
      action: getAccount(answers, 'action'),
      tokenReceiver: getAccount(answers, 'tokenReceiver'),
    },
    ...(config?.logger && { logger: config.logger }),
  };
};
