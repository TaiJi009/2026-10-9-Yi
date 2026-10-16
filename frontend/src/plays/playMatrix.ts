/* ==========================================================================
   屏 2 · 重卦矩阵（逐字移植 PLAYS.matrix L1519–1560）
   svg 由参数传入（原来是 UTIL.qs('#matrix-svg')）
   ========================================================================== */

import { ANIM } from '../anim/anim'
import { svg, svgGlyph, svgText } from '../anim/yao-dom'
import { MATRIX as M } from '../core/data'
import * as RULES from '../core/rules'

export function playMatrix(svgRoot: SVGSVGElement) {
  svgRoot.innerHTML = '' // 重进本屏：清掉上一轮笔画，动画从头排
  const order = RULES.generationOrder() // 乾 兑 离 震 巽 坎 艮 坤
  const geo = { w: M.GW, th: M.GT, gap: M.GGAP }

  // 列首（下卦）
  order.forEach((t, c) => {
    svgRoot.append(
      svgText({ class: 'gen-label', x: M.X0 + c * M.CW + M.CW / 2, y: M.Y0 - 22 }, t.sym + ' ' + t.name),
    )
  })
  // 行首（上卦）
  order.forEach((t, r) => {
    const el = svgText({ class: 'gen-label', x: M.X0 - 18, y: M.Y0 + r * M.CH + M.CH / 2 + 7 }, t.sym + ' ' + t.name)
    el.setAttribute('text-anchor', 'end')
    svgRoot.append(el)
  })

  // 8×8 = 64 卦：行 = 上卦、列 = 下卦
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const bits = order[c].bits.concat(order[r].bits)
      const cx = M.X0 + c * M.CW + M.CW / 2
      const cy = M.Y0 + r * M.CH + M.CH / 2
      const g = svgGlyph(bits, cx, cy, geo)
      svgRoot.append(g)
      ANIM.play(g, [{ opacity: 0 }, { opacity: 0.94 }], { duration: 280, delay: (r + c) * 26, fill: 'none' })
    }
  }
  // 细网格
  for (let i = 0; i <= 8; i++) {
    svgRoot.insertBefore(
      svg('line', {
        x1: M.X0,
        y1: M.Y0 + i * M.CH,
        x2: M.X0 + 8 * M.CW,
        y2: M.Y0 + i * M.CH,
        stroke: 'var(--t2)',
        'stroke-width': 0.8,
      }),
      svgRoot.firstChild,
    )
  }
}
