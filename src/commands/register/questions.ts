import { Answers, Question } from 'inquirer';
import Path from 'path';
import fs from 'fs';
import { ProviderInfoConfig } from '../../common/config';
import { DEFAULT_PROVIDER_NAME } from '../../common/constant';

export interface IProviderRegisterQuestions {
  getProviderMetaData: (config?: ProviderInfoConfig) => Question[];
  doYouWantToSaveProvider: Question[];
  giveUsTheSshKey: Question[];
}

export interface IProviderRegisterAnswers {
  getProviderMetaData: {
    providerName: string;
    providerDescription?: string;
  };
  doYouWantToSaveProvider: {
    shouldBeSaved: boolean;
    fileName: string;
  };
  giveUsTheSshKey: {
    hasSshKey: boolean;
    fileName: string;
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
      message: 'Do you want to save provider info into the file?',
      default: false,
    },
    {
      type: 'input',
      name: 'doYouWantToSaveProvider.fileName',
      message: 'Please enter the filename: ',
      default: `./tool/tee-provider-${new Date().valueOf()}.json`,
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
  giveUsTheSshKey: [
    {
      type: 'confirm',
      name: 'giveUsTheSshKey.hasSshKey',
      message:
        'Could you please provide us with your SSH key for connecting to the remote server in the TEE environment? ' +
        "This would enable us to automatically determine offer's slots' requirements (such as RAM, disk space, network limits, etc.)",
      default: true,
    },
    {
      type: 'input',
      name: 'giveUsTheSshKey.fileName',
      message: 'Please specify your ssh private key: ',
      validate: (fileName: string): string | boolean => {
        if (!fs.existsSync(fileName)) {
          return 'File was not found or unreachable. Please try again: ';
        }
        // TODO: need to add validation that is it ssh private key file
        return true;
      },
      when: (answers: Answers) => answers.doYouWantToSaveProvider.shouldBeSaved,
    },
  ],
};
