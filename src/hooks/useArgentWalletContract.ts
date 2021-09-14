import { useActiveWeb3React } from './web3';
import { useContract } from './useContract';
import useIsArgentWallet from './useIsArgentWallet';
import ArgentWalletContractABI from '../abis/argent-wallet-contract.json';
import { Contract } from 'ethers';

export interface ArgentWalletContract extends Contract {
  todo: string;
}

export function useArgentWalletContract(): ArgentWalletContract | null {
  const { account } = useActiveWeb3React();
  const isArgentWallet = useIsArgentWallet();
  return useContract(
    isArgentWallet ? account ?? undefined : undefined,
    ArgentWalletContractABI,
    true
  ) as ArgentWalletContract;
}
