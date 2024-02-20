import crypto, { BinaryToTextEncoding } from 'crypto';

export const generatePair = (
  encoding: BinaryToTextEncoding = 'base64',
): { privateKey: string; publicKey: string } => {
  const ecdh = crypto.createECDH('secp256k1');
  const publicKey = ecdh.generateKeys(encoding, `compressed`);

  return {
    publicKey,
    privateKey: ecdh.getPrivateKey(encoding),
  };
};

const generatePublicKey = (
  privateKey: string,
  encoding: BinaryToTextEncoding = 'base64',
): string => {
  try {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(Buffer.from(privateKey, encoding));

    return ecdh.getPublicKey(encoding, 'compressed');
  } catch (error) {
    throw Error(`Invalid private key provided. Error: ${(error as Error).message}`);
  }
};

export const matchKeys = (
  publicKey: string,
  privateKey: string,
  encoding: BinaryToTextEncoding = 'base64',
): boolean => generatePublicKey(privateKey, encoding) === publicKey;
