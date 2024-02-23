import { IHardwareInfo } from '../offer-builder';
import { IOfferOptionAnswers } from '../questions/types';
import inquirer from 'inquirer';
import { optionQuestions } from '../questions/option.question';
import { ISpctlService, SpctlOfferType } from '../../../services/spctl';
import { ILogger } from '../../../common/logger';
import Path from 'path';
import os from 'os';
import { removeFileIfExist, writeToFile } from '../../../services/utils/file.utils';
import { processOption } from './offer-option.processor';
import { MB_TO_BYTES_MULTIPLIER } from '../../../common/constant';
import { etherToWei } from '../../../common/utils';

const splitOptions = (resources: IHardwareInfo['optionInfo']): IHardwareInfo['optionInfo'][] => {
  const options: IHardwareInfo['optionInfo'][] = [];

  if (resources.externalPort) {
    options.push({
      bandwidth: 0,
      traffic: 0,
      externalPort: 1,
    });
  }
  options.push({
    bandwidth: resources.bandwidth,
    traffic: 15000000,
    externalPort: 0,
  });

  return options;
};

type IOfferOption = IOfferOptionAnswers;

const processAutoOption = async (value: IHardwareInfo['optionInfo']): Promise<IOfferOption> => {
  const prefix = `Please ask next questions about option:\n${JSON.stringify(value, null, 2)}\n`;
  const answers = (await inquirer.prompt(
    optionQuestions(value).map((q) => ({ ...q, prefix })),
  )) as IOfferOptionAnswers;
  const convert = (value: number | undefined | null, defaultValue: number): number =>
    typeof value === 'number' ? value * MB_TO_BYTES_MULTIPLIER : defaultValue;

  const usage = {
    ...answers.usage,
    price: etherToWei(answers.usage.price.toString()).toString(),
  };

  return {
    info: {
      bandwidth: convert(answers.info?.bandwidth, value.bandwidth),
      traffic: convert(answers.info?.traffic, value.traffic),
      externalPort: value.externalPort,
    },
    usage,
  };
};

interface IProcessAutoOptionsParams {
  offerId: string;
  service: ISpctlService;
  logger: ILogger;
  offerType: SpctlOfferType;
  resources: IHardwareInfo['optionInfo'];
}
export const process = async (params: IProcessAutoOptionsParams): Promise<void> => {
  const options = splitOptions(params.resources);
  let count = 0;
  for (const option of options) {
    count++;
    const data = await processAutoOption(option);

    const tmpFileName = Path.join(os.tmpdir(), `${new Date().valueOf()}-option-info-${count}.json`);
    await writeToFile(tmpFileName, data);

    try {
      await processOption({ ...params, pathToOption: tmpFileName });
    } finally {
      await removeFileIfExist(tmpFileName);
    }
  }
};
