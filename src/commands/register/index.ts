import { Command } from 'commander';
import { ConfigCommandParam } from '../types';
import { createSpctlService } from '../../services/spctl';
import { createLogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';
import {
  MIN_MATIC_SUM_FOR_PROVIDER_ACCOUNT,
  MIN_TEE_SUM_FOR_PROVIDER_ACCOUNT,
} from '../../common/constant';

type CommandParams = ConfigCommandParam & {
  path: string;
};

const COMMAND_NAME = 'register';
const logger = createLogger().child({ command: COMMAND_NAME });

export const RegisterCommand = new Command()
  .name(COMMAND_NAME)
  .description('register tee-provider')
  .requiredOption('--path <filepath>', 'path to the provider info json file', './providerInfo.json')
  // TODO: need to add other params like as backendUrl, etc
  .action(async (options: CommandParams) => {
    const service = await createSpctlService({
      logger,
      config: new ConfigLoader(options.config),
    });
    const needReplenish = async (): Promise<{ tee: boolean; matic: boolean }> => {
      const balance = await service.checkBalance();
      return {
        tee: balance.tee.lt(MIN_TEE_SUM_FOR_PROVIDER_ACCOUNT),
        matic: balance.matic.lt(MIN_MATIC_SUM_FOR_PROVIDER_ACCOUNT),
      };
    };

    const needs = await needReplenish();
    await service.requestTokens(needs);
  });
