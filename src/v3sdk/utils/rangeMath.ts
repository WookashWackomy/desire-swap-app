/* eslint-disable eqeqeq */
/* eslint-disable complexity */

import JSBI from 'jsbi';
import { BigNumber } from 'ethers';

export abstract class RangeMath {
  /**
   * Cannot be constructed.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}
  public static D = BigNumber.from("1000000000000000000")
  public static M = BigNumber.from("1000049998750062496")

  /**
   * Returns the sqrt ratio as a Q64.96 for the given tick. The sqrt ratio is computed as sqrt(1.0001)^tick
   * @param tick the tick for which to compute the sqrt ratio
   */
  public static getSqrtRatioAtTick(tick: number): JSBI {
    let ratio = RangeMath.D;
    if(tick > 0){
      for (let step = 0; step < tick; step ++){
        ratio = ratio.mul(RangeMath.M).div(RangeMath.D);
      }
    }
    else{
      for (let step = 0; step > tick; step --){
        ratio = ratio.mul(RangeMath.D).div(RangeMath.M);
      }
    }

    return JSBI.BigInt(ratio.toString());
  }

  /**
   * Returns the tick corresponding to a given sqrt ratio, s.t. #getSqrtRatioAtTick(tick) <= sqrtRatioX96
   * and #getSqrtRatioAtTick(tick + 1) > sqrtRatioX96
   * @param sqrtRatioX96 the sqrt ratio as a Q64.96 for which to compute the tick
   */
//   public static getTickAtSqrtRatio(sqrtRatioX96: JSBI): number {
//     invariant(
//       JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
//         JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO),
//       'SQRT_RATIO'
//     );

//     const sqrtRatioX128 = JSBI.leftShift(sqrtRatioX96, JSBI.BigInt(32));

//     const msb = mostSignificantBit(sqrtRatioX128);

//     let r: JSBI;
//     if (JSBI.greaterThanOrEqual(JSBI.BigInt(msb), JSBI.BigInt(128))) {
//       r = JSBI.signedRightShift(sqrtRatioX128, JSBI.BigInt(msb - 127));
//     } else {
//       r = JSBI.leftShift(sqrtRatioX128, JSBI.BigInt(127 - msb));
//     }

//     let log_2: JSBI = JSBI.leftShift(JSBI.subtract(JSBI.BigInt(msb), JSBI.BigInt(128)), JSBI.BigInt(64));

//     for (let i = 0; i < 14; i++) {
//       r = JSBI.signedRightShift(JSBI.multiply(r, r), JSBI.BigInt(127));
//       const f = JSBI.signedRightShift(r, JSBI.BigInt(128));
//       log_2 = JSBI.bitwiseOr(log_2, JSBI.leftShift(f, JSBI.BigInt(63 - i)));
//       r = JSBI.signedRightShift(r, f);
//     }

//     const log_sqrt10001 = JSBI.multiply(log_2, JSBI.BigInt('255738958999603826347141'));

//     const tickLow = JSBI.toNumber(
//       JSBI.signedRightShift(
//         JSBI.subtract(log_sqrt10001, JSBI.BigInt('3402992956809132418596140100660247210')),
//         JSBI.BigInt(128)
//       )
//     );
//     const tickHigh = JSBI.toNumber(
//       JSBI.signedRightShift(
//         JSBI.add(log_sqrt10001, JSBI.BigInt('291339464771989622907027621153398088495')),
//         JSBI.BigInt(128)
//       )
//     );

//     return tickLow === tickHigh
//       ? tickLow
//       : JSBI.lessThanOrEqual(TickMath.getSqrtRatioAtTick(tickHigh), sqrtRatioX96)
//       ? tickHigh
//       : tickLow;
//   }
}
