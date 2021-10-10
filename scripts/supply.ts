import { BigNumber } from "ethers";

const D: BigNumber = BigNumber.from(10).pow(18);
const d: BigNumber = BigNumber.from(10).pow(9);
const m: BigNumber = BigNumber.from(1.000049998750062496)

  function supply(
    lowestRangeIndex: number,
    highestRangeIndex: number,
    inUseRange: number,
    ticksInRange : number,
    reserve0 : BigNumber,
    reserve1 : BigNumber,
    liquidity : BigNumber
    ){
    const liqToAdd = D.mul(d);
    let sqrtPriceTop : BigNumber = BigNumber.from(0);
    let sqrtPriceBottom : BigNumber = BigNumber.from(0);
    let amount0 : BigNumber = BigNumber.from(0);
    let amount1 : BigNumber = BigNumber.from(0);
    if (lowestRangeIndex > inUseRange) {
      for (let i : number = highestRangeIndex; i >= lowestRangeIndex; i = i - ticksInRange) {
        sqrtPriceTop = m.pow(i);
        sqrtPriceBottom= m.pow(i - ticksInRange);
        amount0 = amount0.add((liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(sqrtPriceBottom.mul(sqrtPriceTop))));
      }
    } else if (highestRangeIndex < inUseRange) {
      for (let i = lowestRangeIndex; i <= highestRangeIndex; i = i + ticksInRange) {
        sqrtPriceTop = m.pow(i + ticksInRange);
        sqrtPriceBottom= m.pow(i);
        amount1 = amount1.add((liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom))));
      }
    } else {
      for (let i = highestRangeIndex; i >inUseRange; i = i - ticksInRange) {
        sqrtPriceTop = m.pow(i);
        sqrtPriceBottom= m.pow(i - ticksInRange);
        amount0 = amount0.add((liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(sqrtPriceBottom.mul(sqrtPriceTop))));
      }

      for (let i = lowestRangeIndex; i <= inUseRange; i = i - ticksInRange) {
        sqrtPriceTop = m.pow(i + ticksInRange);
        sqrtPriceBottom= m.pow(i);
        amount1 = amount1.add((liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom))));
      }

      let amount0ToAdd;
      let amount1ToAdd;
      if (reserve0.eq(0) && reserve1.eq(0)) {
        amount0ToAdd = liqToAdd.mul((sqrtPriceTop.sub(sqrtPriceBottom))).div(sqrtPriceBottom.mul(sqrtPriceTop)).div(2);
        amount1ToAdd = liqToAdd.mul(sqrtPriceTop.sub(sqrtPriceBottom)).div(2);
      } else {
        amount0ToAdd = liqToAdd.mul(reserve0).div(liquidity);
        amount1ToAdd = liqToAdd.mul(reserve1).div(liquidity);
      }
      amount0 = amount0.add(amount0ToAdd);
      amount1 = amount1.add(amount1ToAdd);
    }
    return {amount0, amount1}
  }

  function token0Supply(
    amount0 : BigNumber,
    lowestRangeIndex : number,
    highestRangeIndex : number,
    inUseRange : number,
    ticksInRange : number,
    reserve0 : BigNumber,
    reserve1 : BigNumber,
    liquidity : BigNumber,
    ){
    const {amount0: amount0Help, amount1 : amount1Help} = supply(lowestRangeIndex, highestRangeIndex, ticksInRange, inUseRange, reserve0, reserve1, liquidity);
    const liqToAdd = D.mul(d).mul(amount0).div(amount0Help);
    const amount1 = D.mul(amount1Help).mul(amount0).div(amount0Help);
    return {liqToAdd, amount1};
  }

  function token1Supply(
    amount1 : BigNumber,
    lowestRangeIndex : number,
    highestRangeIndex : number,
    inUseRange : number,
    ticksInRange : number,
    reserve0 : BigNumber,
    reserve1 : BigNumber,
    liquidity : BigNumber,
    ){
    const {amount0: amount0Help, amount1 : amount1Help} = supply(lowestRangeIndex, highestRangeIndex, ticksInRange, inUseRange, reserve0, reserve1, liquidity);
    const liqToAdd = D.mul(d).mul(amount1).div(amount1Help);
    const amount0 = D.mul(amount0Help).mul(amount1).div(amount1Help);
    return {liqToAdd, amount0};
  }

  async function main() {
    try {
     console.log(token1Supply(
      BigNumber.from("100000000").div(10),
      0,
      0,
      0,
      1,
      BigNumber.from(249),
      BigNumber.from(249),
      BigNumber.from("10000000")
     )) 
    } catch (err) {
      console.error('Rejection handled.', err);
    }
    process.exit(0);
  }
  
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });

  export{}
  