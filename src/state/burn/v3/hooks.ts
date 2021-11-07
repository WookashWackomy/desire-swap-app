import { CurrencyAmount, Percent, Currency } from 'sdkCore/index';
import { Position } from 'v3sdk/index';
import { usePool } from 'hooks/usePools';
import { useActiveWeb3React } from 'hooks/web3';
import { useToken } from 'hooks/Tokens';
import { useCallback, useMemo } from 'react';
import { PositionDetails } from 'types/position';

import { AppState } from '../../index';
import { selectPercent } from './actions';
import { unwrappedToken } from 'utils/unwrappedToken';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import { t } from '@lingui/macro';

export function useBurnV3State(): AppState['burnV3'] {
  return useAppSelector((state) => state.burnV3);
}

export function useDerivedV3BurnInfo(
  position?: PositionDetails,
  asWETH = false
): {
  position?: Position;
  liquidityPercentage?: Percent;
  liquidityValue0?: CurrencyAmount<Currency>;
  liquidityValue1?: CurrencyAmount<Currency>;
  outOfRange: boolean;
  error?: string;
} {
  const { account } = useActiveWeb3React();

  const token0 = useToken(position?.token0);
  const token1 = useToken(position?.token1);

  const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.fee);

  const positionSDK = useMemo(
    () =>
      pool && pool?.liquidity && typeof position?.tickLower === 'number' && typeof position?.tickUpper === 'number'
        ? new Position({
            pool,
            liquidity: pool.liquidity.toString(),
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
          })
        : undefined,
    [pool, position]
  );

  const liquidityPercentage = new Percent(100, 100);

  const discountedAmount0 = position?.tokensOwed0
    ? liquidityPercentage.multiply(position.tokensOwed0.toString()).quotient
    : undefined;
  const discountedAmount1 = position?.tokensOwed1
    ? liquidityPercentage.multiply(position.tokensOwed1.toString()).quotient
    : undefined;

  const liquidityValue0 =
    token0 && discountedAmount0
      ? CurrencyAmount.fromRawAmount(asWETH ? token0 : unwrappedToken(token0), discountedAmount0)
      : undefined;
  const liquidityValue1 =
    token1 && discountedAmount1
      ? CurrencyAmount.fromRawAmount(asWETH ? token1 : unwrappedToken(token1), discountedAmount1)
      : undefined;

  const outOfRange =
    pool && position
      ? pool.tickCurrent + pool.tickSpacing < position.tickLower || pool.tickCurrent > position.tickUpper
      : false;

  let error: string | undefined;
  if (!account) {
    error = t`Connect Wallet`;
  }

  return {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    outOfRange,
    error,
  };
}

export function useBurnV3ActionHandlers(): {
  onPercentSelect: (percent: number) => void;
} {
  const dispatch = useAppDispatch();

  const onPercentSelect = useCallback(
    (percent: number) => {
      dispatch(selectPercent({ percent }));
    },
    [dispatch]
  );

  return {
    onPercentSelect,
  };
}
