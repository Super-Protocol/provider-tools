import { PrivateKey } from 'eciesjs';
import { BinaryToTextEncoding } from 'crypto';

export const generatePair = (
  encoding: BinaryToTextEncoding = 'base64',
): { privateKey: string; publicKey: string } => {
  const sk = new PrivateKey();

  return {
    publicKey: sk.publicKey.compressed.toString(encoding),
    privateKey: sk.secret.toString(encoding),
  };
};

export const matchKeys = (
  publicKey: string,
  privateKey: string,
  encoding: BinaryToTextEncoding = 'base64',
): boolean => {
  const pk = new PrivateKey(Buffer.from(privateKey, encoding));

  return pk.publicKey.compressed.toString('base64') === publicKey;
};
