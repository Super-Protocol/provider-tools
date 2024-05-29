import fs from 'fs';
import { generateMnemonic, mnemonicToEntropy } from 'bip39';
import { Config, ConfigSchema } from './types';
import { CONFIG_DEFAULT_FILENAME } from '../constant';

export const validate = (config: unknown): Config => {
  try {
    return ConfigSchema.parse(config) as Config;
  } catch (err) {
    throw Error(`Validation config error: ${(err as Error).message}`);
  }
};

export const getConfigPath = (): string => {
  const configArgIndex = process.argv.indexOf(`--config`);

  return configArgIndex < 0 ? CONFIG_DEFAULT_FILENAME : process.argv[configArgIndex + 1];
};

export const hasArgv = (arg: string): boolean => {
  const configArgIndex = process.argv.indexOf(arg);

  return configArgIndex >= 0;
};

export const getRawConfig = (configPath: string, throwError = true): Config | undefined => {
  if (!fs.existsSync(configPath)) {
    if (!throwError) {
      return;
    }

    throw Error('Config file was not found');
  }

  try {
    const bufferConfig = fs.readFileSync(configPath);
    const strConfig = bufferConfig.toString();
    return JSON.parse(strConfig);
  } catch (err) {
    if (!throwError) {
      return;
    }

    throw Error(`Config is not valid JSON. Error: ${(err as Error).message}`);
  }
};

export const workflowGenerateKey = (): string => {
  const mnemonic = generateMnemonic(256);
  const entropy = mnemonicToEntropy(mnemonic);

  return Buffer.from(entropy, 'hex').toString('base64');
};
