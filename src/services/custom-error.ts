export class CustomError extends Error {
  constructor(message: string, error?: Error) {
    const detailed = error ? ` Error: ${error.message}` : '';
    super(`${message}.${detailed}`);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
