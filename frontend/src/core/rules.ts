/* ==========================================================================
   RULES —— 纯函数，无 DOM、无副作用（逐字移植自 index.html L458–543）
   ========================================================================== */

import * as DATA from './data'
import type { HuMode } from './data'
import type { Bits, HuGeo, Variant, YaoValue } from './types'

const triVal = (b0: number, b1: number, b2: number) => b0 + b1 * 2 + b2 * 4
const lowerVal = (b: Bits) => triVal(b[0], b[1], b[2])
const upperVal = (b: Bits) => triVal(b[3], b[4], b[5])
const bitsToValue = (b: Bits) => lowerVal(b) + upperVal(b) * 8
const bitsToName = (b: Bits) => DATA.HEX[bitsToValue(b)]
const lowerTri = (b: Bits) => DATA.TRIGRAM[lowerVal(b)]
const upperTri = (b: Bits) => DATA.TRIGRAM[upperVal(b)]

// ★ 三爻卦名由 bits 反查，不按位置。
//   生演树是随机生长的，位置与卦不再对应，按位置贴名必错。
const bitsToTrigram = (b3: Bits) => DATA.TRIGRAM[triVal(b3[0], b3[1], b3[2])]
const bitsToSixiang = (b2: Bits) => DATA.SIXIANG[(b2[0] ? 0 : 2) + (b2[1] ? 0 : 1)]

// 生演抽爻：1/2 均匀（与六爻起卦的大衍筮法是两套独立随机）
const coin = () => (Math.random() < 0.5 ? 1 : 0)

// 生演树坐标（公式预算）
const growX = (col: number, d: number) => ((col + 0.5) / (1 << d)) * DATA.GROW.W
const growY = (d: number) => DATA.GROW.Y0 - d * DATA.GROW.RH
const glyphH = (d: number) => d * DATA.GROW.GT + Math.max(0, d - 1) * DATA.GROW.GGAP

const isMovingVal = (v: YaoValue) => v === 6 || v === 9
const bitsOfValues = (vs: YaoValue[]) => vs.map((v) => (v === 7 || v === 9 ? 1 : 0))
const movingOfValues = (vs: YaoValue[]) => vs.map(isMovingVal)

const flipLine = (b: Bits, i: number) => b.map((x, j) => (j === i ? (x ? 0 : 1) : x))
const invertAll = (b: Bits) => b.map((x) => (x ? 0 : 1))
const reverseBits = (b: Bits) => b.slice().reverse()
const swapTrigrams = (b: Bits) => [b[3], b[4], b[5], b[0], b[1], b[2]]
const diffLines = (a: Bits, b: Bits) =>
  a
    .map((x, i) => (x !== b[i] ? i : -1))
    .filter((i) => i >= 0)

const huBuild = (b: Bits, m: HuMode) => [...m.lower.map((i: number) => b[i]), ...m.upper.map((i: number) => b[i])]

// 大衍筮法抽一爻：返回 6 / 7 / 8 / 9（老阴:少阳:少阴:老阳 = 1:5:7:3）
function drawValue(): YaoValue {
  const p = DATA.LINE_PROB
  let r = Math.random(),
    acc = 0
  for (const v of [6, 7, 8, 9] as YaoValue[]) {
    acc += p[v]
    if (r < acc) return v
  }
  return 9
}

// 本卦 + 14 变体 = 15 格系统
function buildVariants(bits: Bits): Variant[] {
  // 草稿 = 尚未补 name 的 Variant；push 统一填名后才是完整 Variant
  type Draft = Omit<Variant, 'name'> & { name?: string }
  const out: Variant[] = []
  const push = (o: Draft) => {
    o.bits = o.bits.slice()
    o.name = bitsToName(o.bits)
    out.push(o as Variant)
  }

  push({ slot: 'ben', kind: 'ben', label: '本卦', bits, changedLines: [], hlMode: 'none' })

  for (let i = 0; i < 6; i++) {
    push({
      slot: 'bian' + i,
      kind: 'bian',
      line: i,
      label: '变 · ' + DATA.LINE_CN[i] + '爻',
      bits: flipLine(bits, i),
      changedLines: [i],
      hlMode: 'lines',
    })
  }
  push({
    slot: 'zong',
    kind: 'zong',
    label: '综卦 · 倒转',
    bits: reverseBits(bits),
    changedLines: diffLines(bits, reverseBits(bits)),
    hlMode: 'rotate',
  })
  push({
    slot: 'cuo',
    kind: 'cuo',
    label: '错卦 · 全反',
    bits: invertAll(bits),
    changedLines: diffLines(bits, invertAll(bits)),
    hlMode: 'all',
  })
  push({
    slot: 'jiao',
    kind: 'jiao',
    label: '交卦 · 上下互换',
    bits: swapTrigrams(bits),
    changedLines: diffLines(bits, swapTrigrams(bits)),
    hlMode: 'trigramSwap',
  })

  DATA.HU_MODES.forEach((m) => {
    const hb = huBuild(bits, m)
    const hu: HuGeo = { lower: m.lower, upper: m.upper, removed: m.removed }
    push({
      slot: 'hu-' + m.key,
      kind: 'hu',
      label: '互 · ' + m.label,
      bits: hb,
      changedLines: diffLines(bits, hb),
      hlMode: 'removeKept',
      hu,
    })
  })

  return out
}

// 之卦：动爻全变
const zhiBits = (b: Bits, mv: boolean[]) => b.map((x, i) => (mv[i] ? (x ? 0 : 1) : x))

// 先天生成序：乾 兑 离 震 巽 坎 艮 坤（64 矩阵的行列序）
const generationOrder = () => [7, 3, 5, 1, 6, 2, 4, 0].map((i) => DATA.TRIGRAM[i])

export {
  triVal,
  lowerVal,
  upperVal,
  bitsToValue,
  bitsToName,
  lowerTri,
  upperTri,
  bitsToTrigram,
  bitsToSixiang,
  coin,
  growX,
  growY,
  glyphH,
  isMovingVal,
  bitsOfValues,
  movingOfValues,
  flipLine,
  invertAll,
  reverseBits,
  swapTrigrams,
  diffLines,
  huBuild,
  drawValue,
  buildVariants,
  zhiBits,
  generationOrder,
}
