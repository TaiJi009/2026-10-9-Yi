/* ==========================================================================
   15 格变体的构建 + 重合检测（抽自 index.html L1393–1406）

   抽成纯函数：卡片改由 React 声明式渲染，dup 标记必须在渲染前算好；
   顺带让它可测（卦名重合是「同本卦」徽标的唯一来源）。
   ========================================================================== */

import * as RULES from '../core/rules'
import type { Bits, Variant } from '../core/types'

export function prepareVariants(ben: Bits): Variant[] {
  const variants = RULES.buildVariants(ben)

  // 重合检测：回文卦（综=本卦）/ 八纯卦（交=本卦）
  const seen = new Map<string, string>()
  seen.set(ben.join(''), '本卦')
  variants.forEach((v) => {
    if (v.kind === 'ben') {
      v.dup = ''
      return
    }
    const key = v.bits.join('')
    if (seen.has(key)) {
      v.dup = '同' + seen.get(key)
      return
    }
    seen.set(key, v.label)
    v.dup = ''
  })

  return variants
}

