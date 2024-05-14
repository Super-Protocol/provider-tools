import { Command, Argument } from 'commander';
import fsExtra from 'fs-extra';
import path from 'path';
import { ConfigCommandParam } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { process as processOffer } from './offer-processor';
import processProvider from './provider.processor';
import buildDeployConfig from './deploy-config-builder';
import { OfferType } from './types';
import { generateEnvFile } from './generateEnvFile';
import { printInstruction } from './printInstuction';
import { readJsonFile, textSerializer, writeToFile } from '../../services/utils/file.utils';
import axios, { AxiosError } from 'axios';
import {
  CONFIG_DEFAULT_FILENAME,
  RUNNER_SH_URL,
  SPCTL_SUFFIX,
  TOOL_DIRECTORY_PATH,
} from '../../common/constant';
import { KnownTool, ProviderValueOffer } from '../../common/config';

type CommandParams = ConfigCommandParam & {
  backendUrl: string;
  blockchainUrl: string;
  contractAddress: string;
  result?: string;
  output?: string;
};

const COMMAND_NAME = 'register';

export const RegisterCommand = new Command()
  .name(COMMAND_NAME)
  .description('register provider and offers')
  .addArgument(new Argument('offerType', 'offer type').choices(['tee', 'data', 'solution']))
  .option(
    '--result <resultPath>',
    'path to the resource.json file (is required for "data"|"solution" offer type)',
  )
  .option(
    '--output <dirPath>',
    'directory path where files needed for running execution controller will be placed',
  )
  .option('--backend-url <url>', 'backend url')
  .option('--blockchain-url <url>', 'blockchain url')
  .option('--contract-address <address>', 'contract address')
  .action(async (offerType: OfferType, options: CommandParams): Promise<void> => {
    const config = new ConfigLoader(options.config);
    const logger = createLogger({
      options: config.loadSection('logger'),
      bindings: { command: COMMAND_NAME },
    });

    if (offerType !== 'tee' && !options.result) {
      return logger.info(`required option '--result <resultPath>' is not specified`);
    }
    const service = await createSpctlService({
      logger,
      config,
      backendUrl: options.backendUrl,
      blockchainUrl: options.blockchainUrl,
      contractAddress: options.contractAddress,
    });
    const resourceFileData = options.result
      ? ((await readJsonFile(options.result)) as Omit<ProviderValueOffer, 'id'>)
      : null;

    await processProvider({ config, service, logger });
    const offerId = await processOffer({ config, service, offerType, logger, resourceFileData });
    if (!offerId) {
      return logger.info('Upss...Something went wrong. Offer was not created well.');
    }

    if (offerType === 'tee') {
      const deployConfigPath = await buildDeployConfig({ config });
      logger.info(
        `deploy-config was saved to ${deployConfigPath}. You can edit it manually before run "deploy" command if it's needed.`,
      );
    }

    if (offerType === 'data' || offerType === 'solution') {
      const downloadFile = async (url: string): Promise<string> => {
        try {
          const res = await axios.get(url);
          return res.data;
        } catch (err) {
          throw new Error(
            `Failed to download the file from the provided URL: ${url}. The server responded with the following error: ${
              (err as AxiosError).response?.data || (err as Error).message
            }`,
          );
        }
      };

      const files = [
        {
          name: '.env',
          content: await generateEnvFile({
            config,
            offerType,
          }),
        },
        {
          name: 'runner.sh',
          content: (await downloadFile(RUNNER_SH_URL)).replaceAll(
            './tool/spctl',
            `./tool/spctl${SPCTL_SUFFIX}`,
          ),
        },
      ];

      const outputDirPath = path.resolve(options.output ?? `${offerType}-execution-controller`);

      for (const file of files) {
        const filePath = path.join(outputDirPath, file.name);
        await writeToFile(filePath, file.content, textSerializer);
      }

      const spctlFileName = `${KnownTool.SPCTL}${SPCTL_SUFFIX}`;
      const spctlConfigName = path.basename(CONFIG_DEFAULT_FILENAME);
      const toolDirName = path.basename(TOOL_DIRECTORY_PATH);

      const spctlDestination = path.resolve(TOOL_DIRECTORY_PATH, spctlFileName);
      const spctlConfigDestination = path.resolve(TOOL_DIRECTORY_PATH, spctlConfigName);

      await fsExtra.copy(spctlDestination, path.join(outputDirPath, toolDirName, spctlFileName));
      await fsExtra.copy(
        spctlConfigDestination,
        path.join(outputDirPath, toolDirName, spctlConfigName),
      );

      await printInstruction({ outputDirPath });
    }
  });
