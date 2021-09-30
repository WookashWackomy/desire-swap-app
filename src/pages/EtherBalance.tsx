import { useEtherBalance, useEthers } from '@usedapp/core';
import { formatEther } from 'ethers/lib/utils';

export const EtherBalance = () => {
  const { account } = useEthers();
  const etherBalance = useEtherBalance(account);

  return <div>{etherBalance && <p>Balance: {formatEther(etherBalance)}</p>}</div>;
};
