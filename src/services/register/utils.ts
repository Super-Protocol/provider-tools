import crypto from 'crypto';

export const generateShortHash = (value: string): string => {
  const hash = crypto.createHash('sha256').update(value).digest('base64');

  return hash.slice(0, 8);
};

export const restoreOriginalValue = (filename: string): string => {
  return '0x' + Buffer.from(filename, 'base64').toString('ascii');
};
