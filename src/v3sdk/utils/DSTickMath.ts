/* eslint-disable eqeqeq */
/* eslint-disable complexity */

import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import Decimals from 'decimal.js';
import { BigNumber } from 'ethers';

export abstract class DSTickMath {
  /**
   * Cannot be constructed.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * The minimum tick that can be used on any pool.
   */
  public static MIN_TICK = -887272;
  /**
   * The maximum tick that can be used on any pool.
   */
  public static MAX_TICK: number = -DSTickMath.MIN_TICK;

  /**
   * The sqrt ratio corresponding to the minimum tick that could be used on any pool.
   */
  public static MIN_SQRT_RATIO: JSBI = JSBI.BigInt('4295128739');
  /**
   * The sqrt ratio corresponding to the maximum tick that could be used on any pool.
   */
  public static MAX_SQRT_RATIO: JSBI = JSBI.BigInt('1461446703485210103287273052203988822378723970342');

  public static D = BigNumber.from('1000000000000000000');
  public static M = BigNumber.from('1000049998750062496');
  public static m = new Decimals('1.000049998750062496');
  public static d = new Decimals('1000000000000000000');

  public static getSqrtRatioAtTick(tick: number): JSBI {
    invariant(tick >= DSTickMath.MIN_TICK && tick <= DSTickMath.MAX_TICK && Number.isInteger(tick), 'TICK');
    let ret = DSTickMath.D;
    if (tick > 0) {
      for (let step = 0; step < tick; step++) {
        ret = ret.mul(DSTickMath.M).div(DSTickMath.D);
      }
    }
    if (tick < 0) {
      for (let step = 0; step > tick; step--) {
        ret = ret.mul(DSTickMath.D).div(DSTickMath.M);
      }
    }
    return JSBI.BigInt(ret.toString());
  }

  public static getTickAtSqrtRatio(sqrtRatioE18: JSBI): number {
    invariant(
      JSBI.greaterThanOrEqual(sqrtRatioE18, DSTickMath.MIN_SQRT_RATIO) &&
        JSBI.lessThan(sqrtRatioE18, DSTickMath.MAX_SQRT_RATIO),
      'SQRT_RATIO'
    );
    let x = new Decimals(sqrtRatioE18.toString());
    x = x.div(DSTickMath.d);
    let tick = Decimals.log(x, DSTickMath.m).toNumber();
    if (tick > 0) tick = Math.floor(tick);
    if (tick < 0) tick = Math.ceil(tick);
    return tick;
  }
}
