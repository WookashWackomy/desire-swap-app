// import { computePoolAddress } from 'v3sdk/index';
// import { V3_CORE_FACTORY_ADDRESSES } from '../constants/addresses';
//import { IUniswapV3PoolStateInterface } from '../types/v3/IUniswapV3PoolState'
import { BigNumber } from 'ethers';
import { Token, Currency } from 'sdkCore/index';
import { useMemo } from 'react';
import { useActiveWeb3React } from './web3';
import { Result, useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks';

import { Pool, FeeAmount } from 'v3sdk/index';
import { Interface } from '@ethersproject/abi';
import DesireSwapV0FactoryABI from 'abis/DesireSwapV0Factory.json';
import DesireSwapV0PoolABI from 'abis/DesireSwapV0Pool.json';
import { Contract } from 'ethers';
// import { DESIRE_SWAP_HARDHAT_ADDRESSES } from 'hardhatConsts';

const DesireSwapV0FactoryInterface = new Interface(DesireSwapV0FactoryABI);
const DesireSwapV0FactoryContract = new Contract(
  '0x1cdaFA7e6E96b125d4de01EEe9b8952fAff5a25d', // DESIRE_SWAP_HARDHAT_ADDRESSES.V0_FACTORY,
  DesireSwapV0FactoryInterface
);

const DesireSwapV0PoolInterface = new Interface(DesireSwapV0PoolABI);

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePools(
  poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]
): [PoolState, Pool | null][] {
  const { chainId } = useActiveWeb3React();

  const transformed: ([Token, Token, FeeAmount] | null)[] = useMemo(() => {
    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (!chainId || !currencyA || !currencyB || !feeAmount) return null;

      const tokenA = currencyA?.wrapped;
      const tokenB = currencyB?.wrapped;
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return null;
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
      return [token0, token1, feeAmount];
    });
  }, [chainId, poolKeys]);

  const poolAddressCallInputs = transformed
    .map((value) => {
      if (value === null) return null;
      return [
        value[0].address,
        value[1].address,
        BigNumber.from(value[2]).mul(BigNumber.from('1000000000000')).toString(),
      ]; //TODO fee
    })
    .filter((val) => val !== null) as [string, string, string][];

  const poolAddressResult = useSingleContractMultipleData(
    DesireSwapV0FactoryContract,
    'poolAddress',
    poolAddressCallInputs
  );

  if (poolAddressResult.length > 0) console.log(poolAddressResult);
  const poolAddresses = poolAddressResult
    .map(({ result }) => result)
    .filter((result): result is Result => !!result)
    .map((result) => result[0]);

  const inUseInfos = useMultipleContractSingleData(poolAddresses, DesireSwapV0PoolInterface, 'inUseInfo');
  const slot0s = inUseInfos;

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      try {
        if (!slot0s[index]) return [PoolState.NOT_EXISTS, null];
        const [token0, token1, fee] = transformed[index] ?? [];
        if (!token0 || !token1 || !fee) return [PoolState.INVALID, null];

        const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index];

        if (!slot0Valid) return [PoolState.INVALID, null];
        if (slot0Loading) return [PoolState.LOADING, null];

        if (!slot0) return [PoolState.NOT_EXISTS, null];

        if (!slot0.currentPrice || slot0.currentPrice.eq(0)) return [PoolState.NOT_EXISTS, null];

        return [
          PoolState.EXISTS,
          new Pool(
            token0,
            token1,
            fee,
            slot0.currentPrice,
            slot0.inUseLiq,
            slot0.usingRange,
            undefined,
            slot0.inUseReserve0,
            slot0.inUseReserve1
          ),
        ];
      } catch (error) {
        console.error('Error when constructing the pool', error);
        return [PoolState.NOT_EXISTS, null];
      }
    });
  }, [poolKeys, slot0s, transformed]);
}

export function usePool(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): [PoolState, Pool | null] {
  const poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = useMemo(
    () => [[currencyA, currencyB, feeAmount]],
    [currencyA, currencyB, feeAmount]
  );

  return usePools(poolKeys)[0];
}
