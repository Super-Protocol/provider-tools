import { Command } from 'commander';
import { ConfigCommandParam } from '../types';
import * as Config from '../../common/config';
import { ConfigLoader } from '../../common/loader.config';

type CommandParams = ConfigCommandParam;
export const SetupCommand = new Command()
  .name('setup')
  .description('Setup provider-tools config')
  .action(async (options: CommandParams) => {
    const config = Config.getRawConfig(options.config);
    const defaultConfig = await Config.setup(config);
    ConfigLoader.upsertConfig(options.config, defaultConfig);
  });
