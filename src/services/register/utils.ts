import crypto from 'crypto';

export const generateShortHash = (value: string): string => {
  const hash = crypto.createHash('sha256').update(value).digest('base64');
  const regexp = /[^a-zA-Z0-9-_]/g;
  let filteredHash = hash.replace(regexp, '');
  while (filteredHash.length < 8) {
    const additionalHash = crypto
      .createHash('sha256')
      .update(value + filteredHash)
      .digest('base64');
    filteredHash += additionalHash.replace(regexp, '');
  }
  return filteredHash.slice(0, 8);
};
