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
import { abi as DesireSwapV0PoolABI } from 'abis/DesireSwapV0Pool.json';
import { useDesireSwapPoolFactory } from 'hooks/useContract';

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
      return [value[0].address, value[1].address, BigNumber.from(value[2]).toString()];
    })
    .filter((val) => val !== null) as [string, string, string][];

  const factoryContract = useDesireSwapPoolFactory();

  const poolAddressResult = useSingleContractMultipleData(factoryContract, 'poolAddress', poolAddressCallInputs);

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

        if (!slot0.sqrtCurrentPrice || slot0.sqrtCurrentPrice.eq(0)) return [PoolState.NOT_EXISTS, null];

        return [
          PoolState.EXISTS,
          new Pool(
            token0,
            token1,
            fee,
            slot0.sqrtCurrentPrice,
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
