import { createLogger } from '../../common/logger';
import { ISshService, SshService } from './service';
import { CreateSshServiceOptions } from './types';
import { readFileSync } from 'fs';
import path from 'path';

let service: ISshService | null = null;

export const createSshService = async (options: CreateSshServiceOptions): Promise<ISshService> => {
  if (service) {
    return service;
  }

  const sshConfig = options.config.loadSection('sshConfig');
  if (!sshConfig) {
    throw Error('config file should be setup');
  }
  const {
    host = sshConfig.host,
    port = sshConfig.port,
    username = sshConfig.user,
    pathToPrivateKey = sshConfig.pathToPrivateKey,
    passphrase,
  } = options;
  const logger = createLogger({
    parentLogger: options.logger,
    bindings: {
      module: 'ssh-client',
      host,
      port,
      user: username,
    },
  });

  const privateKey = readFileSync(path.resolve(pathToPrivateKey));
  service = new SshService({
    username,
    host,
    port,
    privateKey,
    passphrase,
    logger,
  });

  return service;
};
