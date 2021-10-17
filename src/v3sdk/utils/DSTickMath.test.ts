import JSBI from 'jsbi'
import { ONE } from '../internalConstants'
import { DSTickMath } from './DSTickMath'

fdescribe('DSTickMath', () => {
  describe('#MIN_TICK', () => {
    it('equals correct value', () => {
      expect(DSTickMath.MIN_TICK).toEqual(-887272)
    })
  })

  describe('#MAX_TICK', () => {
    it('equals correct value', () => {
      expect(DSTickMath.MAX_TICK).toEqual(887272)
    })
  })

  describe('#getSqrtRatioAtTick', () => {
    it('throws for non integer', () => {
      expect(() => DSTickMath.getSqrtRatioAtTick(1.5)).toThrow('TICK')
    })

    it('throws for tick too small', () => {
      expect(() => DSTickMath.getSqrtRatioAtTick(DSTickMath.MIN_TICK - 1)).toThrow('TICK')
    })

    it('throws for tick too large', () => {
      expect(() => DSTickMath.getSqrtRatioAtTick(DSTickMath.MAX_TICK + 1)).toThrow('TICK')
    })

    it('returns the correct value for tick = -100000', () => {
      expect(DSTickMath.getSqrtRatioAtTick(-100000).toString()).toEqual(JSBI.BigInt('6739631584085027').toString())
    })

    it('returns the correct value for tick 0', () => {
      expect(DSTickMath.getSqrtRatioAtTick(0)).toEqual(JSBI.BigInt('1000000000000000000'))
    })

    it('returns the correct value for tick = 100000', () => {
        expect(DSTickMath.getSqrtRatioAtTick(100000).toString()).toBe(JSBI.BigInt('148376062923071752965').toString())
    })
  })

  describe('#getTickAtSqrtRatio', () => {
    it('returns the correct value for sqrt ratio at min tick', () => {
        expect(DSTickMath.getTickAtSqrtRatio(JSBI.BigInt('6739631584085027'))).toEqual(-100000)
      })
      it('returns the correct value for sqrt ratio at max tick', () => {
        expect(DSTickMath.getTickAtSqrtRatio(JSBI.BigInt('148376100000000000000'))).toEqual(100000)
    })
    })
})
