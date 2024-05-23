import { Command, Argument } from 'commander';
import fsExtra from 'fs-extra';
import path from 'path';
import { ConfigCommandParam, OfferType } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import { process as processOffer } from './offer-processor';
import processProvider from './provider.processor';
import buildDeployConfig from './deploy-config-builder';
import { generateEnvFile } from './generateEnvFile';
import { printInstruction } from './printInstuction';
import { readJsonFile, textSerializer, writeToFile } from '../../services/utils/file.utils';
import { TOOL_HOME_PATH } from '../../common/constant';
import { ProviderValueOffer } from '../../common/config';
import { supportedOfferTypes } from '../utils';

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
  .addArgument(new Argument('offerType', 'offer type').choices(supportedOfferTypes))
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
      const files = [
        {
          name: '.env',
          content: await generateEnvFile({
            config,
            offerType,
          }),
        },
      ];

      const outputDirPath = path.resolve(options.output ?? `${offerType}-execution-controller`);

      for (const file of files) {
        const filePath = path.join(outputDirPath, file.name);
        await writeToFile(filePath, file.content, textSerializer);
      }

      const spctlConfigSrc = path.resolve(TOOL_HOME_PATH, 'config.json');

      await fsExtra.copy(spctlConfigSrc, path.join(outputDirPath, 'config.json'));

      await printInstruction({ outputDirPath, offerType });
    }
  });
