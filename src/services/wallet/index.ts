import { Wallet } from 'ethers';

export const create = (): Wallet => {
  return Wallet.createRandom();
};
