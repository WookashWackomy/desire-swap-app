import { Token, Price } from '@uniswap/sdk-core';
import { tickToPrice } from 'v3sdk/index';

export function getTickToPrice(baseToken?: Token, quoteToken?: Token, tick?: number): Price<Token, Token> | undefined {
  if (!baseToken || !quoteToken || typeof tick !== 'number') {
    return undefined;
  }
  return tickToPrice(baseToken, quoteToken, tick);
}
