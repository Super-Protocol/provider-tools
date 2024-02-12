import { HDNodeWallet, Wallet } from 'ethers';

export const create = (): HDNodeWallet => {
  return Wallet.createRandom();
};
