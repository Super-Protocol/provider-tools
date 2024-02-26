import { CustomError } from '../custom-error';

export class DownloadToolError extends CustomError {
  constructor(message: string, error?: Error) {
    super(message, error);
  }
}
