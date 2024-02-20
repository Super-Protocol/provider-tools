import { Answers, Question } from 'inquirer';
import fs from 'fs';
import { SshConfig } from '../../common/config';

export interface IDeployQuestions {
  giveUsSshConnectionInfo: (config?: SshConfig) => Question[];
}

export interface IDeployAnswers extends Answers {
  giveUsSshConnectionInfo: {
    hasSshKey: boolean;
    pathToPrivateKey: string;
    user: string;
    port: string;
    host: string;
  };
}

export const DeployQuestions: IDeployQuestions = {
  giveUsSshConnectionInfo: (config?: SshConfig): Question[] => [
    {
      type: 'confirm',
      name: 'giveUsSshConnectionInfo.hasSshKey',
      message:
        'Could you please provide us with your SSH key for connecting to the remote server in the TEE environment? ' +
        "This would enable us to automatically determine offer's slots' requirements (such as RAM, disk space, network limits, etc.)",
      default: true,
      when: () => !config?.pathToPrivateKey,
    },
    {
      type: 'input',
      name: 'giveUsSshConnectionInfo.pathToPrivateKey',
      message: 'Please specify your ssh private key: ',
      default: config?.pathToPrivateKey,
      validate: (value: string): string | boolean => {
        if (!fs.existsSync(value)) {
          return 'File was not found or unreachable. Please try again: ';
        }
        // TODO: need to add validation that is it ssh private key file
        return true;
      },
      when: (_answers: Answers) => !config?.pathToPrivateKey,
    },
    {
      type: 'input',
      name: 'giveUsSshConnectionInfo.user',
      message: 'Please specify username: ',
      default: config?.user || 'root',
      validate: (value: string): string | boolean => {
        if (!value) {
          return 'File was not found or unreachable. Please try again: ';
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
        if (Number.isSafeInteger(value) && value > 0) {
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
        // TODO: need to validate host well
        return true;
      },
      when: (_answers: Answers) => !config?.host,
    },
  ],
};