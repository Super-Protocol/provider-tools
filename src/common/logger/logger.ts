import pino from 'pino';
import { IBindings, ILogger, ILoggerOptions } from './types';
import { APP_NAME, APP_VERSION } from '../constant';

export interface ICreateLoggerParams {
  options: Partial<ILoggerOptions>;
  parentLogger: ILogger;
  bindings: IBindings;
}
export const createLogger = (params: Partial<ICreateLoggerParams> = {}): ILogger => {
  const { options, parentLogger, bindings = {} } = params;
  if (parentLogger) {
    return parentLogger.child(bindings);
  }

  const logger = pino({
    level: 'info',
    name: APP_NAME,
    mixin: () => ({ version: APP_VERSION }),
    transport: {
      target: 'pino-pretty',
      options: {
        ignore: 'pid,hostname',
        singleLine: true,
      },
    },
    ...options,
  });

  return bindings ? logger.child(bindings) : (logger as unknown as ILogger);
};
