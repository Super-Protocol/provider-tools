import { ConnectConfig } from 'ssh2';
import SSH2Promise from 'ssh2-promise';

import { createLogger, ILogger } from '../../common/logger';

export class SshClient {
  constructor(private readonly options: ConnectConfig, private readonly logger: ILogger) {}

  async exec(command: string): Promise<string> {
    const logger = createLogger({
      parentLogger: this.logger,
      bindings: {
        command,
        module: 'ssh-client-exec',
        sshOptions: {
          host: this.options.host,
          port: this.options.port,
          username: this.options.username,
        },
      },
    });

    try {
      logger.trace('creating ssh-client');
      const ssh = new SSH2Promise(this.options);

      logger.trace(`try to execute command`);
      return await ssh.exec(command);
    } catch (err) {
      logger.debug({ err }, 'Failed to execute command on the remote host');
      throw err;
    }
  }

  async copyFile(localPath: string, remotePath: string): Promise<void> {
    const logger = createLogger({
      parentLogger: this.logger,
      bindings: {
        localPath,
        remotePath,
        module: 'ssh-client-sftp',
        sshOptions: {
          host: this.options.host,
          port: this.options.port,
          username: this.options.username,
        },
      },
    });

    try {
      logger.trace('creating ssh-client');
      const ssh = new SSH2Promise(this.options);

      logger.trace('creating sftp');
      const sftp = ssh.sftp();

      logger.trace('copy file');
      await sftp.fastPut(localPath, remotePath);
    } catch (err) {
      logger.debug({ err }, 'Failed to copy file to the remote host');
      throw err;
    }
  }
}
