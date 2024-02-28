import { Wallet } from 'ethers';

export const createWallet = (privateKey?: string): Wallet => {
  return privateKey ? new Wallet(privateKey) : Wallet.createRandom();
};
