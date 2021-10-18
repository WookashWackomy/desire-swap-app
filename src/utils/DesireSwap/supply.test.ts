import { BigNumber } from 'ethers';
import { token0Supply, token1Supply } from 'utils/DesireSwap/supply';

const prettyPrintObj = (obj: Record<string, string | number | BigNumber>) =>
  Object.entries(obj)
    .map(([key, val]) => `\n\t${key}: ${val?.toString()}`)
    .join('');

fdescribe('#DesireSwap - supply', () => {
  describe('returns correct amount and liquidity for token0Supply', () => {
    //Arrange
    const testCases = [
      {
        funcArguments: {
          amount: BigNumber.from(0),
          lowestRangeIndex: 0,
          highestRangeIndex: 0,
          inUseRange: 0,
          ticksInRange: 0,
          reserve0: BigNumber.from(0),
          reserve1: BigNumber.from(0),
          liquidity: BigNumber.from(0),
        },
        expectedValues: { liquidity: BigNumber.from(0), amount: BigNumber.from(0) },
      },
      {
        funcArguments: {
          amount: BigNumber.from(0),
          lowestRangeIndex: 0,
          highestRangeIndex: 0,
          inUseRange: 0,
          ticksInRange: 0,
          reserve0: BigNumber.from(0),
          reserve1: BigNumber.from(0),
          liquidity: BigNumber.from(0),
        },
        expectedValues: { liquidity: BigNumber.from(0), amount: BigNumber.from(0) },
      },
    ];
    testCases.forEach((testCase) =>
      it(`\nargs: ${prettyPrintObj(testCase.funcArguments)}\n expected: ${prettyPrintObj(
        testCase.expectedValues
      )}`, () => {
        //Act
        const { liquidityToAdd, amount } = token0Supply(
          testCase.funcArguments.amount,
          testCase.funcArguments.lowestRangeIndex,
          testCase.funcArguments.highestRangeIndex,
          testCase.funcArguments.inUseRange,
          testCase.funcArguments.ticksInRange,
          testCase.funcArguments.reserve0,
          testCase.funcArguments.reserve1,
          testCase.funcArguments.liquidity
        );

        //Assert
        expect(liquidityToAdd.eq(testCase.expectedValues.liquidity)).toBeTruthy();
        expect(amount.eq(testCase.expectedValues.amount)).toBeTruthy();
      })
    );
  });

  describe('returns correct amount and liquidity for token1Supply', () => {
    const testCases = [
      {
        funcArguments: {
          amount: BigNumber.from(0),
          lowestRangeIndex: 0,
          highestRangeIndex: 0,
          inUseRange: 0,
          ticksInRange: 0,
          reserve0: BigNumber.from(0),
          reserve1: BigNumber.from(0),
          liquidity: BigNumber.from(0),
        },
        expectedValues: { liquidity: BigNumber.from(0), amount: BigNumber.from(0) },
      },
    ];
    testCases.forEach((testCase) =>
      it(`\nargs: ${prettyPrintObj(testCase.funcArguments)}\n expected: ${prettyPrintObj(
        testCase.expectedValues
      )}`, () => {
        expect(false).toBeTruthy();
        const { liquidityToAdd, amount } = token1Supply(
          testCase.funcArguments.amount,
          testCase.funcArguments.lowestRangeIndex,
          testCase.funcArguments.highestRangeIndex,
          testCase.funcArguments.inUseRange,
          testCase.funcArguments.ticksInRange,
          testCase.funcArguments.reserve0,
          testCase.funcArguments.reserve1,
          testCase.funcArguments.liquidity
        );
        expect(liquidityToAdd.eq(testCase.expectedValues.liquidity)).toBeTruthy();
        expect(amount.eq(testCase.expectedValues.amount)).toBeTruthy();
      })
    );
  });
});
