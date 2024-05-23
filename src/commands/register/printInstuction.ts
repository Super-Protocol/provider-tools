import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { getRunnerAsset } from './utils';
import { supportedPlatform } from '../../services/download/utils';
import { OfferType } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
marked.use(markedTerminal() as any);

interface PrintInstructionParams {
  outputDirPath: string;
  offerType: OfferType;
}

const getInstructionFileName = (): string => {
  const platform = supportedPlatform.includes(process.platform) ? process.platform : 'linux';

  return `${platform}-instruction.md`;
};

export const printInstruction = async (params: PrintInstructionParams): Promise<void> => {
  const { outputDirPath, offerType } = params;
  const insructionFileName = getInstructionFileName();

  const text = await getRunnerAsset(insructionFileName);
  const result = marked.parse(
    text.replaceAll('{{output}}', outputDirPath).replaceAll('{{offerType}}', offerType),
  );

  // eslint-disable-next-line no-console
  console.log(result);
};
