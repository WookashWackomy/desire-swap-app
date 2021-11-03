import { BigNumber } from 'ethers';
import { DSTickMath } from 'v3sdk/utils/DSTickMath';

export const D: BigNumber = BigNumber.from(10).pow(18); //10^18
export const DDD: BigNumber = D.pow(3); //10^18^3

function supply(
  lowestRangeIndex: number,
  highestRangeIndex: number,
  inUseRange: number,
  ticksInRange: number,
  reserve0: BigNumber,
  reserve1: BigNumber,
  liquidity: BigNumber
) {
  const liqToAdd = DDD;
  let sqrtPriceTop: BigNumber = BigNumber.from(0);
  let sqrtPriceBottom: BigNumber = BigNumber.from(0);
  let amount0: BigNumber = BigNumber.from(0);
  let amount1: BigNumber = BigNumber.from(0);
  let sqrtA;
  let sqrtB;
  let amountA;
  let amountB;
  if (highestRangeIndex < inUseRange) {
    sqrtPriceBottom = BigNumber.from(DSTickMath.getSqrtRatioAtTick(lowestRangeIndex).toString());
    sqrtPriceTop = BigNumber.from(DSTickMath.getSqrtRatioAtTick(highestRangeIndex).toString());
    amount1 = liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(D);
    sqrtA = sqrtPriceBottom.toString();
    sqrtB = sqrtPriceTop.toString();
    amountB = amount1.toString();
    amountA = amount0.toString();
  } else if (lowestRangeIndex >= inUseRange + ticksInRange) {
    sqrtPriceBottom = BigNumber.from(DSTickMath.getSqrtRatioAtTick(lowestRangeIndex).toString());
    sqrtPriceTop = BigNumber.from(DSTickMath.getSqrtRatioAtTick(highestRangeIndex).toString());
    amount0 = liqToAdd.mul(D).mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(sqrtPriceBottom.mul(sqrtPriceTop));
    sqrtA = sqrtPriceBottom.toString();
    sqrtB = sqrtPriceTop.toString();
    amountB = amount1.toString();
    amountA = amount0.toString();
  } else {
    sqrtPriceBottom = BigNumber.from(DSTickMath.getSqrtRatioAtTick(lowestRangeIndex).toString());
    sqrtPriceTop = BigNumber.from(DSTickMath.getSqrtRatioAtTick(inUseRange).toString());
    amount1 = liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(D);
    sqrtA = sqrtPriceBottom.toString();
    sqrtB = sqrtPriceTop.toString();
    amountB = amount1.toString();
    amountA = amount0.toString();

    sqrtPriceBottom = BigNumber.from(DSTickMath.getSqrtRatioAtTick(inUseRange + ticksInRange).toString());
    sqrtPriceTop = BigNumber.from(DSTickMath.getSqrtRatioAtTick(highestRangeIndex).toString());
    amount0 = liqToAdd.mul(D).mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(sqrtPriceBottom.mul(sqrtPriceTop));
    sqrtA = sqrtPriceBottom.toString();
    sqrtB = sqrtPriceTop.toString();
    amountB = amount1.toString();
    amountA = amount0.toString();

    let amount0ToAdd;
    let amount1ToAdd;
    sqrtPriceBottom = BigNumber.from(DSTickMath.getSqrtRatioAtTick(inUseRange).toString());
    sqrtPriceTop = BigNumber.from(DSTickMath.getSqrtRatioAtTick(inUseRange + ticksInRange).toString());
    if (reserve0.eq(0) && reserve1.eq(0)) {
      amount0ToAdd = liqToAdd
        .mul(D)
        .mul(sqrtPriceTop.sub(sqrtPriceBottom))
        .div(sqrtPriceBottom.mul(sqrtPriceTop))
        .div(2);
      amount1ToAdd = liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(2);
    } else {
      amount0ToAdd = liqToAdd.mul(reserve0).div(liquidity);
      amount1ToAdd = liqToAdd.mul(reserve1).div(liquidity);
    }
    amount0 = amount0.add(amount0ToAdd);
    amount1 = amount1.add(amount1ToAdd);
    amountA = amount0.toString();
    amountB = amount1.toString();
  }
  console.log(amountA);
  console.log(amountB);
  console.log(sqrtA);
  console.log(sqrtB);
  return { amount0, amount1 };
}

export function token0Supply(
  amount0: BigNumber,
  lowestRangeIndex: number,
  highestRangeIndex: number,
  inUseRange: number,
  ticksInRange: number,
  reserve0: BigNumber,
  reserve1: BigNumber,
  liquidity: BigNumber
) {
  const { amount0: amount0Help, amount1: amount1Help } = supply(
    lowestRangeIndex,
    highestRangeIndex,
    inUseRange,
    ticksInRange,
    reserve0,
    reserve1,
    liquidity
  );
  const liquidityToAdd = DDD.mul(amount0).div(amount0Help);
  const amount = amount1Help.mul(amount0).div(amount0Help); //amount1
  return { liquidityToAdd, amount };
}

export function token1Supply(
  amount1: BigNumber,
  lowestRangeIndex: number,
  highestRangeIndex: number,
  inUseRange: number,
  ticksInRange: number,
  reserve0: BigNumber,
  reserve1: BigNumber,
  liquidity: BigNumber
) {
  const { amount0: amount0Help, amount1: amount1Help } = supply(
    lowestRangeIndex,
    highestRangeIndex,
    inUseRange,
    ticksInRange,
    reserve0,
    reserve1,
    liquidity
  );
  const liquidityToAdd = DDD.mul(amount1).div(amount1Help);
  const amount = amount0Help.mul(amount1).div(amount1Help); //amount0
  return { liquidityToAdd, amount };
}
