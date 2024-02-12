import { Wallet } from 'ethers';

export const create = () => {
  const account = Wallet.createRandom();

  return account;
};
