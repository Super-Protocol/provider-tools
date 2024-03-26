import { SleepFn } from './timer.utils';
import { CustomError } from '../custom-error';
import { DEFAULT_RETRY_COUNT } from '../../common/constant';

export class RetryByConditionError extends CustomError {
  constructor(error?: Error) {
    super('Failed to get result by retrying', error);
  }
}

type RetryByConditionParams<T> = {
  method: () => Promise<T>;
  retryCount: number;
  sleepFn?: SleepFn;
  predicateFn?: (value: T) => boolean;
  errorLoggerFn?: (err: Error, attemptNumber: number) => void;
};
export const retryByCondition = async <T>(
  params: RetryByConditionParams<T>,
): Promise<T | undefined> => {
  if (!Number.isSafeInteger(params.retryCount) || params.retryCount < 0) {
    throw Error('Invalid retryCount param');
  }

  const { method, sleepFn, predicateFn, errorLoggerFn } = params;
  let retryCount = params.retryCount ?? DEFAULT_RETRY_COUNT;

  while (retryCount > -1) {
    retryCount--;
    try {
      const result = await method();

      if ((predicateFn && predicateFn(result)) || !predicateFn) {
        return result;
      }
    } catch (err) {
      if (errorLoggerFn) {
        errorLoggerFn(err as Error, retryCount);
      }
      if (retryCount < 0) {
        throw err;
      }
    }

    if (retryCount < 0 && predicateFn) {
      throw new RetryByConditionError();
    }

    if (sleepFn) {
      await sleepFn();
    }
  }
};
