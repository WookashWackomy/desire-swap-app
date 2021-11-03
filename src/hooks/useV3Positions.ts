import { useSingleContractMultipleData, Result } from 'state/multicall/hooks';
import { useMemo } from 'react';
import { PositionDetails } from 'types/position';
import { usePositionViewer } from './useContract';
import { BigNumber } from '@ethersproject/bignumber';
import { DESIRE_SWAP_HARDHAT_ADDRESSES } from 'hardhatConsts';
import { FeeAmount } from 'v3sdk';

interface UseV3PositionsResults {
  loading: boolean;
  positions: PositionDetails[] | undefined;
}

function useV3PositionsFromTokenIds(
  poolAddress: string | undefined,
  tokenIds: BigNumber[] | undefined
): UseV3PositionsResults {
  const positionViewer = usePositionViewer();
  const inputs = useMemo(
    () => (tokenIds ? tokenIds.map((tokenId) => [poolAddress, BigNumber.from(tokenId)]) : []),
    [poolAddress, tokenIds]
  );
  const results = useSingleContractMultipleData(positionViewer, 'getPositionData', inputs);

  const loading = useMemo(() => results.some(({ loading }) => loading), [results]);
  const error = useMemo(() => results.some(({ error }) => error), [results]);

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call) => {
        const result = call.result as Result;
        const position = result[0];
        return {
          poolAddress: position.poolAddress,
          token0: position.token0,
          token1: position.token1,
          tokenId: position.ticketId,
          tickLower: position.lowestTick,
          tickUpper: position.highestTick,
          tokensOwed0: position.amount0,
          tokensOwed1: position.amount1,
          fee: FeeAmount.LOW,
        };
      });
    }
    return undefined;
  }, [loading, error, results, tokenIds]);

  return {
    loading,
    positions,
  };
}

interface UseV3PositionResults {
  loading: boolean;
  position: PositionDetails | undefined;
}

export function useV3PositionFromTokenId(
  poolAddress: string | undefined,
  tokenId: BigNumber | undefined
): UseV3PositionResults {
  const position = useV3PositionsFromTokenIds(poolAddress, tokenId ? [tokenId] : undefined);
  return {
    loading: position.loading,
    position: position.positions?.[0],
  };
}

const POOL_ADDRESSES = [DESIRE_SWAP_HARDHAT_ADDRESSES.POOL];

export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const positionViewer = usePositionViewer();

  // const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(positionViewer, 'balanceOf', [
  //   account ?? undefined,
  // ])

  // we don't expect any account balance to ever exceed the bounds of max safe int
  // const accountBalance: number | undefined = balanceResult?.[0]?.toNumber()

  const positionDataListArgs = useMemo(() => {
    if (account) {
      return POOL_ADDRESSES.map((addr) => [addr, account]);
    }
    return [];
  }, [account]);

  const positionDataListResults = useSingleContractMultipleData(
    positionViewer,
    'getPositionDataList',
    positionDataListArgs
  );
  const somePositionsLoading = useMemo(
    () => positionDataListResults.some(({ loading }) => loading),
    [positionDataListResults]
  );

  console.log(positionViewer?.getPositionDataList(positionDataListArgs[0][0], positionDataListArgs[0][1]));

  const positions: PositionDetails[] = useMemo(() => {
    if (account) {
      const poolsResults = positionDataListResults
        .map(({ result }) => result)
        .filter((result): result is Result => !!result)
        .map((result) => result[0]);

      return poolsResults.flatMap((poolResult) =>
        poolResult.map((position: any) => ({
          poolAddress: position.poolAddress,
          token0: position.token0,
          token1: position.token1,
          tokenId: position.ticketId,
          tickLower: position.lowestTick,
          tickUpper: position.highestTick,
          tokensOwed0: position.amount0,
          tokensOwed1: position.amount1,
          fee: FeeAmount.LOW,
        }))
      );
    }
    return [];
  }, [account, positionDataListResults]);

  // const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(tokenIds);

  return {
    loading: somePositionsLoading,
    positions,
  };
}
