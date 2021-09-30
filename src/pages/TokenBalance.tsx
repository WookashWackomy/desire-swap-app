import { useEthers, useTokenBalance } from '@usedapp/core';
import { formatUnits } from 'ethers/lib/utils';

const tokenAddress = '';

export function TokenBalance() {
  const { account } = useEthers();
  const tokenBalance = useTokenBalance(tokenAddress, account as any);

  return <div>{tokenBalance && <p>Balance: {formatUnits(tokenBalance as any, 18)}</p>}</div>;
}
