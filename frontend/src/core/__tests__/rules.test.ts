/* ==========================================================================
   RULES 断言套件 —— 逐条移植自 index.html 的 ?debug 自检（L1804–1827）

   原型的设计是「页面与控制台跑同一份断言」，靠文本抽取实现。
   模块化之后这一性质以更稳的方式保留：测试与页面 import 同一份 core/ 源码。
   ========================================================================== */

import { describe, expect, it } from 'vitest'
import * as DATA from '../data'
import * as RULES from '../rules'

describe('卦名表', () => {
  it('乾 111111 → 乾为天', () => expect(RULES.bitsToName([1, 1, 1, 1, 1, 1])).toBe('乾为天'))
  it('坤 000000 → 坤为地', () => expect(RULES.bitsToName([0, 0, 0, 0, 0, 0])).toBe('坤为地'))
  it('地天泰 = 7', () => expect(RULES.bitsToValue([1, 1, 1, 0, 0, 0])).toBe(7))
  it('天地否 = 56', () => expect(RULES.bitsToValue([0, 0, 0, 1, 1, 1])).toBe(56))
  it('水火既济', () => expect(RULES.bitsToName([1, 0, 1, 0, 1, 0])).toBe('水火既济'))
  it('山水蒙', () => expect(RULES.bitsToName([0, 1, 0, 0, 0, 1])).toBe('山水蒙'))

  // 原型只抽查了几个点，这里补全 64 个下标的往返：值 → 名 → 值 必须闭合
  it('64 卦全下标 bitsToValue ↔ HEX 闭合', () => {
    expect(DATA.HEX).toHaveLength(64)
    for (let v = 0; v < 64; v++) {
      const lower = v % 8
      const upper = Math.floor(v / 8)
      const bits = [...DATA.TRIGRAM[lower].bits, ...DATA.TRIGRAM[upper].bits]
      expect(RULES.bitsToValue(bits)).toBe(v)
      expect(RULES.bitsToName(bits)).toBe(DATA.HEX[v])
    }
  })
})

describe('先天序与反查', () => {
  it('先天生成序 = 乾兑离震巽坎艮坤', () =>
    expect(RULES.generationOrder().map((x) => x.name).join('')).toBe('乾兑离震巽坎艮坤'))
  it('bitsToTrigram([1,1,1]) → 乾', () => expect(RULES.bitsToTrigram([1, 1, 1]).name).toBe('乾'))
  it('bitsToTrigram([0,1,0]) → 坎', () => expect(RULES.bitsToTrigram([0, 1, 0]).name).toBe('坎'))
  it('bitsToSixiang([1,1]) → 太阳', () => expect(RULES.bitsToSixiang([1, 1])).toBe('太阳'))
  it('bitsToSixiang([1,0]) → 少阴', () => expect(RULES.bitsToSixiang([1, 0])).toBe('少阴'))
  it('bitsToSixiang([0,1]) → 少阳', () => expect(RULES.bitsToSixiang([0, 1])).toBe('少阳'))
  it('bitsToSixiang([0,0]) → 太阴', () => expect(RULES.bitsToSixiang([0, 0])).toBe('太阴'))
})

describe('15 格系统', () => {
  const vs = RULES.buildVariants([1, 0, 1, 0, 1, 0]) // 水火既济

  it('15 格系统', () => expect(vs).toHaveLength(15))
  it('└ 变卦 6', () => expect(vs.filter((v) => v.kind === 'bian')).toHaveLength(6))
  it('└ 互卦 5', () => expect(vs.filter((v) => v.kind === 'hu')).toHaveLength(5))
  it('水火既济 · 综 → 火水未济', () =>
    expect(vs.find((v) => v.kind === 'zong')?.name).toBe('火水未济'))
  it('水火既济 · 错 → 火水未济', () =>
    expect(vs.find((v) => v.kind === 'cuo')?.name).toBe('火水未济'))
  it('水火既济 · 互(去初上) → 火水未济', () =>
    expect(vs.find((v) => v.slot === 'hu-chushang')?.name).toBe('火水未济'))
})
