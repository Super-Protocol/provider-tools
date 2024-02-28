import { Command, Argument } from 'commander';
import fs from 'fs/promises';
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
import { textSerializer, writeToFile } from '../../services/utils/file.utils';
import axios, { AxiosError } from 'axios';
import { DOCKER_COMPOSE_URL, RUNNER_SH_URL } from '../../common/constant';

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
  .option('--result <resultPath>', 'path to the resource.json file')
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
      ? JSON.parse(await fs.readFile(options.result, 'utf-8'))
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
          name: 'docker-compose.yaml',
          content: await downloadFile(DOCKER_COMPOSE_URL),
        },
        {
          name: 'runner.sh',
          content: await downloadFile(RUNNER_SH_URL),
        },
      ];

      const outputDirPath = path.resolve(options.output ?? `${offerType}-execution-controller`);

      for (const file of files) {
        const filePath = path.join(outputDirPath, file.name);
        await writeToFile(filePath, file.content, textSerializer);
      }

      await printInstruction({ outputDirPath });
    }
  });
