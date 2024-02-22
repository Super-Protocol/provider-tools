import { Validator } from 'inquirer';

export const nonNegativeNumberValidator: Validator = (input) => {
  const number = parseFloat(input);

  if (Number.isNaN(number) || number < 0) {
    return 'It should be non negative number. Please try again:';
  }

  return true;
};

export const positiveNumberValidator: Validator = (input) => {
  const number = parseFloat(input);

  if (Number.isNaN(number) || number <= 0) {
    return 'It should be positive number. Please try again:';
  }

  return true;
};

export const nonNegativeIntegerValidator: Validator = (input) => {
  const number = parseInt(input);

  if (!Number.isSafeInteger(number) || number < 0) {
    return 'It should be positive integer number. Please try again:';
  }

  return true;
};
