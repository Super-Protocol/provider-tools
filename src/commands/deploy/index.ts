import { Command } from 'commander';

import { ConfigCommandParam } from '../types';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';

import { teeProviderDeployer } from './tee-provider-deployer';
import { resourceProviderDeployer } from './resource-provider-deployer';
import { BASE_IMAGE_OFFER, PROVIDER_PROVISIONER_OFFER, STORAGE_OFFER } from '../../common/constant';

type CommandParams = ConfigCommandParam & {
  tee: boolean;
  path: string;
};

const COMMAND_NAME = 'deploy';

export const DeployCommand = new Command().name(COMMAND_NAME);

DeployCommand.command('tee')
  .description('deploy TEE offer provider')
  .requiredOption('--path <deploy-config.yaml>', 'path to deploy config file')
  .action(async (options: CommandParams): Promise<void> => {
    const config = new ConfigLoader(options.config);
    const logger = createLogger({
      options: config.loadSection('logger'),
      bindings: { command: COMMAND_NAME },
    });
    await teeProviderDeployer({
      config,
      logger,
      options,
    });
  });

const deployResourceProviderCommandWrapper = (command: Command): void => {
  command
    .requiredOption('--path <dir>', 'path to "register" output directory')
    .option(
      '--tee-offer <id>',
      'Compute offer id to deploy to. If not provided, it will be picked randomly',
    )
    .option(
      '--solution-offer <id,slot>',
      'Provisioner offer. If slot is not specified, it will be autoselected',
      PROVIDER_PROVISIONER_OFFER,
    )
    .option(
      '--base-image-offer <id,slot>',
      'Base image offer. If slot is not specified, it will be autoselected',
      BASE_IMAGE_OFFER,
    )
    .option(
      '--storage-offer <id,slot>',
      'Storage offer. If slot is not specified, it will be autoselected',
      STORAGE_OFFER,
    )
    .action(async (options: CommandParams): Promise<void> => {
      const config = new ConfigLoader(options.config);
      const logger = createLogger({
        options: config.loadSection('logger'),
        bindings: { command: COMMAND_NAME },
      });
      await resourceProviderDeployer({
        config,
        logger,
        options,
      });
    });
};

deployResourceProviderCommandWrapper(
  DeployCommand.command('data').description('deploy data offer provider'),
);

deployResourceProviderCommandWrapper(
  DeployCommand.command('solution').description('deploy solution offer provider'),
);
