import { BigNumber } from 'ethers';
import { utils as ethersUtils } from 'ethers/lib/ethers';

export const etherToWei = (ether: string): BigNumber => {
  return ethersUtils.parseEther(ether);
};
