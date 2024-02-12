import { Command } from 'commander';
import { ConfigCommandParam } from '../types';

type CommandParams = ConfigCommandParam & {
  path: string;
};

export const RegisterCommand = new Command()
  .name('register')
  .description('register tee-provider')
  .requiredOption('--path <filepath>', 'path to the provider info json file', './providerInfo.json')
  .action((options: CommandParams) => {
    console.log(`path: ${options.path}`);
  });
