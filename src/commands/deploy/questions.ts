import { Answers, Question } from 'inquirer';
import fs from 'fs';
import { SshConfig } from '../../common/config';

interface IDeployQuestions {
  giveUsSshConnectionInfo: (
    config?: SshConfig,
  ) => Question<IDeployAnswers['giveUsSshConnectionInfo']>[];
}

export interface IDeployAnswers extends Answers {
  giveUsSshConnectionInfo: {
    pathToPrivateKey: string;
    user: string;
    port: string;
    host: string;
    requiredPassphrase: boolean;
    passphrase?: string;
  };
}

export const DeployQuestions: IDeployQuestions = {
  giveUsSshConnectionInfo: (
    config?: SshConfig,
  ): Question<IDeployAnswers['giveUsSshConnectionInfo']>[] => [
    {
      type: 'input',
      name: 'giveUsSshConnectionInfo.pathToPrivateKey',
      message: 'Please specify the path to the file with your ssh private key: ',
      default: config?.pathToPrivateKey,
      validate: (value: string): string | boolean => {
        if (!fs.existsSync(value)) {
          return 'File was not found or unreachable. Please try again: ';
        }
        return true;
      },
      when: (_answers: Answers) => !config?.pathToPrivateKey,
    },
    {
      type: 'confirm',
      name: 'giveUsSshConnectionInfo.requiredPassphrase',
      message: 'Does your SSH private key have a passphrase?',
      default: false,
      when: (answers: Answers) => Boolean(answers.giveUsSshConnectionInfo?.pathToPrivateKey),
    },
    {
      type: 'password',
      name: 'giveUsSshConnectionInfo.passphrase',
      message: 'Please specify SSH passphrase: ',
      validate: (value: string): string | boolean => {
        if (!value) {
          return 'Invalid passphrase. Please try again: ';
        }
        return true;
      },
      when: (answers: Answers) =>
        Boolean(answers.giveUsSshConnectionInfo?.requiredPassphrase || config?.requiredPassphrase),
    },
    {
      type: 'input',
      name: 'giveUsSshConnectionInfo.user',
      message: 'Please specify username: ',
      default: config?.user || 'root',
      validate: (value: string): string | boolean => {
        if (!value) {
          return 'Invalid username. Please try again: ';
        }
        return true;
      },
      when: (_answers: Answers) => !config?.user,
    },
    {
      type: 'input',
      name: 'giveUsSshConnectionInfo.port',
      message: 'Please specify port: ',
      default: config?.port || 22,
      validate: (value: number): string | boolean => {
        const port = Number(value);
        if (!Number.isSafeInteger(port) || port < 1) {
          return 'It should be positive integer number. Please try again: ';
        }
        return true;
      },
      when: (_answers: Answers) => !config?.port,
    },
    {
      type: 'input',
      name: 'giveUsSshConnectionInfo.host',
      message: 'Please specify host: ',
      default: config?.host || '127.0.0.1',
      validate: (value: string): string | boolean => {
        if (!value) {
          return 'Invalid host. Please try again: ';
        }
        return true;
      },
      when: (_answers: Answers) => !config?.host,
    },
  ],
};
