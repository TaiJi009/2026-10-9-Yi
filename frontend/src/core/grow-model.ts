/* ==========================================================================
   GROW 节点模型 —— 纯逻辑（抽自 index.html L769–785）

   规则：每个父节点裂变第 2 个子节点时，新增的那一爻【强制为第 1 个的反】。
   由此保证「第 d 层恰好 2^d 个互不相同的节点」——
     子节点继承父的下方若干爻 ⇒ 父不同则子不同；
     同一父的两个子在新爻处一阴一阳 ⇒ 也不同。
   于是两仪恒 2 个、四象恒 4 个、八卦恒 8 个，正是「加一倍」。

   抽成独立模块的原因：原型的 ?debug 自检把 childBit 抄了一份进测试，
   测的其实不是生产代码。这里让测试直接 import 同一份实现。
   ========================================================================== */

import { coin } from './rules'
import type { Bits } from './types'

export interface GrowNode {
  id: number
  d: number
  col: number
  bits: Bits
  bit: number | null
  parent: number | null
  kids: GrowNode[]
}

/** 第 k 个子节点新增的那一爻：k=0 随机（1/2），k=1 取第 1 个的反 */
export function childBit(parent: Pick<GrowNode, 'kids'>, k: number): number {
  if (k === 0) return coin()
  const first = parent.kids[0]
  if (!first || first.bit === null)
    throw new Error('childBit(k=1) 要求父节点已抽出第一个子 —— 调用顺序错了')
  return 1 - first.bit
}

export interface ChildSpec {
  d: number
  col: number
  bits: Bits
  bit: number
}

/** ★ 定位只用 col，绝不用 k 索引。父 col = n.col*2 + kidIndex ⇒ 「先抽出的在左边」 */
export function childSpec(parent: Pick<GrowNode, 'd' | 'col' | 'bits' | 'kids'>, k: number): ChildSpec {
  const bit = childBit(parent, k)
  return { d: parent.d + 1, col: parent.col * 2 + k, bits: parent.bits.concat([bit]), bit }
}

/** 把 spec 落成节点（ids 由调用方的计数器分配，保持纯函数） */
export function makeNode(id: number, spec: ChildSpec, parentId: number | null): GrowNode {
  return { id, d: spec.d, col: spec.col, bits: spec.bits, bit: spec.bit, parent: parentId, kids: [] }
}

/**
 * 生长 dMax 层，返回每一层的节点集。
 * 屏 1 的交互与自检都走这条路径 —— 不变量在此处一次成型。
 */
export function growLayers(dMax: number): GrowNode[][] {
  const root: GrowNode = { id: 0, d: 0, col: 0, bits: [], bit: null, parent: null, kids: [] }
  let seq = 1
  let layer: GrowNode[] = [root]
  const layers: GrowNode[][] = [layer]
  for (let d = 1; d <= dMax; d++) {
    const next: GrowNode[] = []
    for (const p of layer) {
      for (let k = 0; k < 2; k++) {
        const child = makeNode(seq++, childSpec(p, k), p.id)
        p.kids.push(child)
        next.push(child)
      }
    }
    layers.push(next)
    layer = next
  }
  return layers
}
