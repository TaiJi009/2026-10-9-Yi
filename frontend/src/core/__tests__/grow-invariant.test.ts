/* ==========================================================================
   生演不变量 —— 移植自 ?debug 自检（L1830–1850）

   原型里这段是把 childBit 手抄一遍来测；现在直接测 grow-model 的真实实现，
   测的就是屏 1 点击时跑的那份代码。
   ========================================================================== */

import { describe, expect, it } from 'vitest'
import { growLayers } from '../grow-model'

describe('生演树', () => {
  it('每层恰好 2^d 个互不相同的节点', () => {
    const layers = growLayers(3)
    for (let d = 1; d <= 3; d++) {
      const layer = layers[d]
      expect(layer).toHaveLength(1 << d)
      expect(new Set(layer.map((n) => n.bits.join(''))).size).toBe(1 << d)
    }
  })

  it('同一父的两子在新爻处一阴一阳', () => {
    const layers = growLayers(3)
    for (const p of layers[2]) {
      expect(p.kids).toHaveLength(2)
      expect(p.kids[0].bit).not.toBe(p.kids[1].bit)
    }
  })

  it('col 定位唯一：先抽出的在左边', () => {
    const tops = growLayers(3)[3]
    const cols = tops.map((n) => n.col)
    expect(new Set(cols).size).toBe(8)
    // 每个节点的 col 由父 col*2 + k 决定 ⇒ 同一父的第 1 子恒在左
    const byParent = new Map<number, number[]>()
    tops.forEach((n) => {
      const list = byParent.get(n.parent!) ?? []
      list.push(n.col)
      byParent.set(n.parent!, list)
    })
    byParent.forEach((cs) => expect(cs).toEqual([...cs].sort((a, b) => a - b)))
  })
})
