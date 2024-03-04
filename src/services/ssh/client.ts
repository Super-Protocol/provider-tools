import { Client, ClientCallback, ConnectConfig } from 'ssh2';
import { createLogger, ILogger } from '../../common/logger';

export class SshClient {
  private readonly connection: Client;

  constructor(private readonly options: ConnectConfig, private readonly logger: ILogger) {
    this.connection = new Client();
  }

  exec(command: string): Promise<string> {
    const logger = createLogger({
      parentLogger: this.logger,
      bindings: {
        command,
        module: 'ssh-client-exec',
      },
    });

    return new Promise((resolve, reject): void => {
      let output = '';
      const onData = (data: Buffer): void => {
        output += data.toString();
      };
      const onError = (err: Error): void => {
        reject(err);
      };
      const onClose = (code: unknown): void => {
        this.connection.end();
        if (code) {
          reject(new Error(`Command '${command}' finished with code ${code}`));
          return;
        }
        resolve(output);
      };
      const onExec: ClientCallback = (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        stream.on('data', onData).on('error', onError).on('close', onClose);
      };
      const onReady = (): void => {
        logger.trace('Client :: ready');
        this.connection.exec(command, onExec);
      };

      this.connection.once('ready', onReady).on('error', onError);

      this.connection.connect(this.options);
    });
  }

  async copyFile(localPath: string, remotePath: string): Promise<void> {
    const logger = createLogger({
      parentLogger: this.logger,
      bindings: {
        localPath,
        remotePath,
        module: 'ssh-client-sftp',
      },
    });

    await new Promise<void>((resolve, reject) => {
      this.connection
        .on('ready', () => {
          logger.trace('Client :: ready');
          this.connection.sftp((err, sftp) => {
            if (err) {
              reject(err);
              return;
            }
            sftp.fastPut(localPath, remotePath, (err) => {
              if (err) {
                reject(err);
                return;
              }
              this.connection.end();
              resolve();
            });
          });
        })
        .on('error', (err) => {
          reject(err);
        });

      this.connection.connect(this.options);
    });
  }
}
