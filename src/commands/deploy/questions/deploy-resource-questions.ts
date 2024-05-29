import { Answers, Question } from 'inquirer';

type StorJConfig = {
  bucket: string;
  prefix: string;
  writeAccessToken: string;
  readAccessToken: string;
};

interface IDeployQuestions {
  acquireStorJCredentials: (
    config: StorJConfig,
  ) => Question<IDeployAnswers['acquireStorJCredentials']>[];
}

export interface IDeployAnswers extends Answers {
  acquireStorJCredentials: {
    hasOwn: boolean;
    getOwnBucket: string;
    getOwnBucketPrefix: string;
    getOwnReadToken: string;
    getOwnWriteToken: string;
  };
}

export const DeployQuestions: IDeployQuestions = {
  acquireStorJCredentials: (
    config: StorJConfig,
  ): Question<IDeployAnswers['acquireStorJCredentials']>[] => [
    {
      type: 'confirm',
      name: 'acquireStorJCredentials.hasOwn',
      message:
        "StorJ credentials aren't set in provider-tools config. Do you have them? If not, temporary storage will be created automatically.",
      default: false,
      when: () => Boolean(!(config.bucket && config.readAccessToken && config.writeAccessToken)),
    },
    {
      type: 'input',
      name: 'acquireStorJCredentials.getOwnBucket',
      message: 'Please specify bucket name',
      default: config.bucket,
      validate: (value: string): string | boolean => {
        return value ? true : 'Please specify bucket name';
      },
      when: (answers: Answers) => Boolean(answers.acquireStorJCredentials?.hasOwn),
    },
    {
      type: 'input',
      name: 'acquireStorJCredentials.getOwnBucketPrefix',
      message: "Please specify file's prefix, if needed",
      default: config.prefix || undefined,
      when: (answers: Answers) => Boolean(answers.acquireStorJCredentials?.hasOwn),
    },
    {
      type: 'input',
      name: 'acquireStorJCredentials.getOwnReadToken',
      message: 'Please specify read token',
      default: config.readAccessToken || undefined,
      validate: (value: string): string | boolean => {
        return value ? true : 'Please specify read token';
      },
      when: (answers: Answers) => Boolean(answers.acquireStorJCredentials?.hasOwn),
    },
    {
      type: 'input',
      name: 'acquireStorJCredentials.getOwnWriteToken',
      message: 'Please specify write token',
      default: config.writeAccessToken || undefined,
      validate: (value: string): string | boolean => {
        return value ? true : 'Please specify write token';
      },
      when: (answers: Answers) => Boolean(answers.acquireStorJCredentials?.hasOwn),
    },
  ],
};
