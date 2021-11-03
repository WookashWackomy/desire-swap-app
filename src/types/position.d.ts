import { BigNumber } from '@ethersproject/bignumber';

export interface PositionDetails {
  tokenId: BigNumber;
  token0: string;
  token1: string;
  tickLower: number;
  tickUpper: number;
  tokensOwed0: BigNumber;
  tokensOwed1: BigNumber;
  nonce?: BigNumber;
  operator?: string;
  fee: number;
  liquidity?: BigNumber;
  feeGrowthInside0LastX128?: BigNumber;
  feeGrowthInside1LastX128?: BigNumber;
  tokensOwed0: BigNumber;
  tokensOwed1: BigNumber;
  poolAddress: string;
}
