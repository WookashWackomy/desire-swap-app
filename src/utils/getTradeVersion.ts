import { Currency, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '../v2sdk/entities/trade';
import { Trade as V3Trade } from 'v3sdk/index';
import { Version } from '../hooks/useToggledVersion';

export function getTradeVersion(
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
): Version | undefined {
  if (!trade) return undefined;
  if (trade instanceof V2Trade) return Version.v2;
  return Version.v3;
}
