/* ==========================================================================
   起卦节奏不变量 —— 屏 3 每爻「蓄—落—显」的时序约束

   起因：调节奏时最容易犯的错是「只改一段」——把蓄段压得比落/显还短，
   三段主次一倒，「摇而后得」的叙事就散了。文档口头说过「蓄段必须恒为最长」，
   这里硬化成断言（CLAUDE.md：review 里口头说过的「不许做 X」要落地成机械哨兵）。

   本测试只钉**结构与次序**，不钉绝对毫秒数——具体快慢是可调参数，
   基线与推导见 core/data.ts 的 DUR.cast* 注释与 docs/agents/features/cast.md。
   ========================================================================== */

import { describe, expect, it } from 'vitest'
import { DUR, LINE_CN } from '../data'

/** 一拍的构成：蓄（抖动）+ 落（爻线归位）+ 显（尾拍，即下一拍之前的留白） */
const beat = (last = false) => DUR.castCharge + DUR.castDrop + (last ? DUR.castGapLast : DUR.castGap)
/** 六爻走完的总时长：前 5 拍常规 + 第 6 拍尾拍加长 */
const total = () => beat() * 5 + beat(true)

describe('起卦节奏', () => {
  it('蓄段恒为三段最长（主次不可颠倒）', () => {
    expect(DUR.castCharge).toBeGreaterThan(DUR.castDrop)
    expect(DUR.castCharge).toBeGreaterThan(DUR.castGap)
    expect(DUR.castCharge).toBeGreaterThan(DUR.castGapLast)
  })

  it('三段皆有效时长，且动爻呼吸不早于显段结束', () => {
    expect(DUR.castCharge).toBeGreaterThan(0)
    expect(DUR.castDrop).toBeGreaterThan(0)
    expect(DUR.castGlow).toBeGreaterThan(DUR.castGap)
  })

  it('尾拍留白不短于常规拍：最后一爻要落地感', () => {
    expect(DUR.castGapLast).toBeGreaterThanOrEqual(DUR.castGap)
  })

  it('逐爻顺序自下而上由 LINE_CN 定义（初爻在前、上爻在后）', () => {
    expect(LINE_CN).toEqual(['初', '二', '三', '四', '五', '上'])
  })

  it('总时长落在 4–7s 区间：够叙事、不拖沓', () => {
    expect(total()).toBeGreaterThanOrEqual(4000)
    expect(total()).toBeLessThan(7000)
  })
})
