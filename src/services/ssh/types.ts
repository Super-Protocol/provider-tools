import { ConnectConfig } from 'ssh2';
import { ILogger } from '../../common/logger';
import { ConfigLoader } from '../../common/loader.config';

export type CreateSshServiceOptions = Partial<
  Pick<ISshServiceOptions, 'host' | 'port' | 'username' | 'logger'>
> & {
  config: ConfigLoader;
  pathToPrivateKey?: string;
};

export interface ISshServiceOptions
  extends Pick<ConnectConfig, 'host' | 'port' | 'username' | 'privateKey'> {
  logger: ILogger;
}
