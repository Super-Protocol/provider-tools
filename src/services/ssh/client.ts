import { Client, ConnectConfig } from 'ssh2';
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
      this.connection
        .on('ready', () => {
          logger.trace('Client :: ready');
          this.connection.exec(command, (err, stream) => {
            if (err) {
              reject(err);
              return;
            }

            let output = '';
            stream
              .on('data', (data: Buffer) => {
                output += data.toString();
              })
              .on('error', (err: Error) => {
                reject(err);
              })
              .on('close', (code: unknown) => {
                this.connection.end();
                if (code) {
                  reject(new Error(`Command '${command}' finished with code ${code}`));
                  return;
                }
                resolve(output);
              });
          });
        })
        .on('error', (err) => {
          reject(err);
        });

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
