import _ from 'lodash';
import pino, { ChildLoggerOptions } from 'pino';
import { IBindings, ILogger, ILoggerOptions } from './types';
import { APP_NAME, APP_VERSION } from '../constant';

export interface ICreateLoggerParams {
  options: Partial<ILoggerOptions>;
  parentLogger: ILogger;
  bindings: IBindings;
  exclude?: string[];
}
export const createLogger = (params: Partial<ICreateLoggerParams> = {}): ILogger => {
  const { options, parentLogger, bindings = {} } = params;
  if (parentLogger) {
    return parentLogger.child(bindings);
  }
  const formatters: ILoggerOptions['formatters'] = {
    bindings: (bindings: IBindings) => _.omit(bindings, params.exclude ?? ['pid', 'hostname']),
    level: (label: string) => ({ level: label }),
  };
  const childLoggerOptions: ChildLoggerOptions = {
    formatters: {
      bindings: formatters.bindings,
    },
    ..._.omit(options, 'formatters'),
  };
  const logger = pino({
    level: 'info',
    name: APP_NAME,
    mixin: () => ({ version: APP_VERSION }),
    timestamp: () => `,time:${new Date().toISOString()}`,
    formatters,
    ...options,
  });

  return bindings
    ? (logger.child(bindings, childLoggerOptions) as unknown as ILogger)
    : (logger as unknown as ILogger);
};
