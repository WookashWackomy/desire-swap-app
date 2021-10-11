import { BigNumber } from 'ethers';

export const D: BigNumber = BigNumber.from(10).pow(18); //10^18
const m: BigNumber = BigNumber.from('1000049998750062496');

function power(base: BigNumber, to: number) {
  // in standard E18
  let ret: BigNumber = D;
  if(to > 0){
    for (let step = 0; step < to; step++) {
      ret = ret.mul(base).div(D);
    }
    return ret;
  }
  if(to < 0){
    for (let step = 0; step > to; step--) {
      ret = ret.mul(D).div(base);
    }
    return ret;
  }
  return ret;
}

function supply(
  lowestRangeIndex: number,
  highestRangeIndex: number,
  inUseRange: number,
  ticksInRange: number,
  reserve0: BigNumber,
  reserve1: BigNumber,
  liquidity: BigNumber
) {
  const liqToAdd = D.mul(D);
  let sqrtPriceTop: BigNumber = BigNumber.from(0);
  let sqrtPriceBottom: BigNumber = BigNumber.from(0);
  let amount0: BigNumber = BigNumber.from(0);
  let amount1: BigNumber = BigNumber.from(0);
  let sqrtA;
  let sqrtB;
  let amountA;
  let amountB;
  if (lowestRangeIndex > inUseRange) {
    for (let i: number = lowestRangeIndex; i < highestRangeIndex; i = i + ticksInRange) {
      sqrtPriceBottom = power(m, i);
sqrtA = sqrtPriceBottom.toString();
      sqrtPriceTop = power(m, i + ticksInRange);
sqrtB = sqrtPriceTop.toString();
      amount0 = amount0.add(liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).mul(D).div(sqrtPriceBottom.mul(sqrtPriceTop)));
amountA = amount0.toString();
    }
  } else if (highestRangeIndex < inUseRange) {
    for (let i = lowestRangeIndex; i < highestRangeIndex; i = i + ticksInRange) {
      sqrtPriceBottom = power(m, i);
sqrtA = sqrtPriceBottom.toString();
      sqrtPriceTop = power(m, i + ticksInRange);
sqrtB = sqrtPriceTop.toString();
      amount1 = amount1.add(liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(D));
amountB = amount1.toString();
    }
  } else {
    for (let i = inUseRange + ticksInRange; i < highestRangeIndex; i = i + ticksInRange) {
      sqrtPriceBottom = power(m, i);
sqrtA = sqrtPriceBottom.toString();
      sqrtPriceTop = power(m, i + ticksInRange);
sqrtB = sqrtPriceTop.toString();
      amount0 = amount0.add(liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).mul(D).div(sqrtPriceBottom.mul(sqrtPriceTop)));
amountA = amount0.toString();
    }

    for (let i = lowestRangeIndex; i < inUseRange; i = i + ticksInRange) {
      sqrtPriceBottom = power(m, i);
sqrtA = sqrtPriceBottom.toString();
      sqrtPriceTop = power(m, i + ticksInRange);
sqrtB = sqrtPriceTop.toString();
      amount1 = amount1.add(liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(D));
amountB = amount1.toString();
    }

    let amount0ToAdd;
    let amount1ToAdd;
    sqrtPriceTop = power(m, inUseRange + ticksInRange);
    sqrtA = sqrtPriceBottom.toString();
    sqrtB = sqrtPriceTop.toString();
    sqrtPriceBottom = power(m, inUseRange);
    if (reserve0.eq(0) && reserve1.eq(0)) {
      amount0ToAdd = liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(sqrtPriceBottom.mul(sqrtPriceTop)).div(2);
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
  console.log(amountA)
  console.log(amountB)
  console.log(sqrtA)
  console.log(sqrtB)
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
  const liqToAdd = D.mul(D).mul(amount0).div(amount0Help);
  const amount = D.mul(amount1Help).mul(amount0).div(amount0Help); //amount1
  return { liqToAdd, amount };
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
  const liqToAdd = D.mul(D).mul(amount1).div(amount1Help);
  const amount = D.mul(amount0Help).mul(amount1).div(amount1Help); //amount0
  return { liqToAdd, amount };
}
