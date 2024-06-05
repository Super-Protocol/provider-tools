import path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs/promises';
import { ConfigLoader } from '../../common/loader.config';
import { ILogger } from '../../common/logger';
import { createSpctlService } from '../../services/spctl';
import { TEE_OFFERS } from '../../common/constant';
import { createWallet } from '../../services/utils/wallet.utils';
import { DeployResourceCommandOptions } from '.';
import inquirer from 'inquirer';
import { DeployQuestions, IDeployAnswers } from './questions/deploy-resource-questions';
import { UploadToStorJParams } from '../../services/spctl/service';

const exec = promisify(execCallback);

export async function resourceProviderDeployer(params: {
  config: ConfigLoader;
  logger: ILogger;
  options: DeployResourceCommandOptions;
}): Promise<void> {
  const logger = params.logger.child({ service: resourceProviderDeployer.name });

  const {
    path: configDirPath,
    teeOffer,
    solutionOffer,
    baseImageOffer,
    storageOffer,
    minRentMinutes,
  } = params.options;

  let pickedTeeOffer: string = teeOffer;

  if (!pickedTeeOffer) {
    pickedTeeOffer = TEE_OFFERS[Math.floor(Math.random() * TEE_OFFERS.length)];
    logger.info(`Selected Compute offer id: ${pickedTeeOffer}`);
  }

  const spctlConfig = params.config.loadSection('spctl');
  const answers = (await inquirer.prompt(
    DeployQuestions.acquireStorJCredentials(spctlConfig.storage),
  )) as unknown as IDeployAnswers;

  if (answers.acquireStorJCredentials?.hasOwn) {
    spctlConfig.storage.bucket = answers.acquireStorJCredentials.getOwnBucket;
    spctlConfig.storage.prefix = answers.acquireStorJCredentials.getOwnBucketPrefix;
    spctlConfig.storage.readAccessToken = answers.acquireStorJCredentials.getOwnReadToken;
    spctlConfig.storage.writeAccessToken = answers.acquireStorJCredentials.getOwnWriteToken;
    params.config.updateSection('spctl', spctlConfig);
  }

  const archivePath = await makeArchive('tmp-resource', ['.env', 'config.json'], configDirPath);

  logger.info('Prepared resource archive for upload');

  const authorityAddress = createWallet(params.config.loadSection('account').authority).address;

  const now = Date.now();
  const resultResourcePath = path.resolve(`resource-${now}.${authorityAddress}.json`);

  try {
    const spctlService = await createSpctlService({ logger: params.logger, config: params.config });

    logger.info('Uploading archive to StorJ');

    const uploadParams: UploadToStorJParams = {
      filePath: path.resolve(archivePath),
      resultPath: resultResourcePath,
      tag: `${authorityAddress}/${now}`,
    };

    if (answers.acquireStorJCredentials?.hasOwn === false) {
      if (storageOffer.split(',').length === 1) {
        throw new Error(`Storage slot must be specified for offer ${storageOffer}`);
      } else {
        uploadParams.storage = storageOffer;
      }
      uploadParams.minRentMinutes = minRentMinutes;
    }

    const uploadResult = await spctlService.uploadToStorJ(uploadParams);

    logger.info(
      `Successfully uploaded archive to StorJ.${
        uploadResult.id && ` Storage order id: ${uploadResult.id}`
      } Creating workflow for provider deployment...`,
    );

    const teeOrderId = await spctlService.createWorkflow({
      dataResourceFilePath: resultResourcePath,
      teeId: pickedTeeOffer,
      solutionOffer: solutionOffer,
      baseImageOffer: baseImageOffer,
      storageOffer: storageOffer,
      minRentMinutes,
    });

    logger.info(
      `Successfully created workflow with id: ${teeOrderId}. You can go to https://marketplace.superprotocol.com/order/${teeOrderId} to track order status.`,
    );
  } catch (err) {
    logger.error({ err }, 'Provider deployment failed');
  } finally {
    await fs.unlink(archivePath);
    await fs.unlink(resultResourcePath);
  }
}

export async function makeArchive(
  name: string,
  input: string[],
  archiveRootDir: string,
): Promise<string> {
  const archivePath = `${name}.tar.gz`;
  const cmd = `cd "${archiveRootDir}" && tar -czf "${archivePath}" ${input.join(' ')}`;

  await exec(cmd);

  return path.join(archiveRootDir, archivePath);
}
