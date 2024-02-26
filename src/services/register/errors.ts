import { CustomError } from '../custom-error';

export class ReplenishAccountBalanceError extends CustomError {
  constructor(message: string, error?: Error) {
    super(message, error);
  }
}

export class CreateProviderError extends CustomError {
  constructor(message: string, error?: Error) {
    super(message, error);
  }
}
