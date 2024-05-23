import path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs/promises';
import { ConfigLoader } from '../../common/loader.config';
import { ILogger } from '../../common/logger';
import { createSpctlService } from '../../services/spctl';
import { CONFIG_DEFAULT_FILENAME, TEE_OFFERS } from '../../common/constant';
import { createWallet } from '../../services/utils/wallet.utils';

const exec = promisify(execCallback);

export async function resourceProviderDeployer(params: {
  config: ConfigLoader;
  logger: ILogger;
  options: any;
}): Promise<void> {
  const logger = params.logger.child({ service: resourceProviderDeployer.name });

  const {
    path: configDirPath,
    teeOffer,
    solutionOffer,
    baseImageOffer,
    storageOffer,
  } = params.options;

  let pickedTeeOffer: string = teeOffer;

  if (!pickedTeeOffer) {
    pickedTeeOffer = TEE_OFFERS[Math.floor(Math.random() * TEE_OFFERS.length)];
    logger.info(`Selected Compute offer id: ${pickedTeeOffer}`);
  }

  const storageConfig = params.config.loadSection('spctl').storage;

  if (!(storageConfig.writeAccessToken && storageConfig.readAccessToken && storageConfig.bucket)) {
    throw new Error(
      `Storage config must be specified in ${CONFIG_DEFAULT_FILENAME} under "spctl" section`,
    );
    // TODO: Add the ability to issue temporary storage through upload command
  }

  const archivePath = await makeArchive('tmp-resource', ['.env', 'config.json'], configDirPath);

  logger.info('Prepared resource archive for upload');

  const authorityAddress = createWallet(params.config.loadSection('account').authority).address;

  const now = Date.now();
  const resultResourcePath = path.resolve(`resource-${now}.${authorityAddress}.json`);

  try {
    const spctlService = await createSpctlService({ logger: params.logger, config: params.config });

    logger.info('Uploading archive to StorJ');

    await spctlService.uploadToStorJ(
      path.resolve(archivePath),
      resultResourcePath,
      `${authorityAddress}/${now}`,
    );

    logger.info(
      'Successfully uploaded archive to StorJ. Creating workflow for provider deployment...',
    );

    const teeOrderId = await spctlService.createWorkflow({
      dataResourceFilePath: resultResourcePath,
      teeId: pickedTeeOffer,
      solutionOffer: solutionOffer,
      baseImageOffer: baseImageOffer,
      storageOffer: storageOffer,
    });

    logger.info(
      `Successfully created workflow with id: ${teeOrderId}. You can go to https://marketplace.dev.superprotocol.com/order/${teeOrderId} to track order status.`,
    );
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
  const cmd = `cd ${archiveRootDir} && tar -czf ${archivePath} ${input.join(' ')}`;

  await exec(cmd);

  return path.join(archiveRootDir, archivePath);
}
