/* ==========================================================================
   屏 4 · 成卦（逐字移植 PLAYS.settle L1638–1705）

   pair 容器由 React 挂出一个空 div，两列（本卦 / 之卦）在此命令式构建 ——
   这段动画要对 sheen 与逐爻元素排序时序，拆成 React 状态只会多一层往返。
   ========================================================================== */

import { ANIM } from '../anim/anim'
import { stackEl } from '../anim/yao-dom'
import { EASE, LINE_CN } from '../core/data'
import * as RULES from '../core/rules'
import { STORE } from '../state/store'

export interface SettleRefs {
  pair: HTMLElement // #settle-pair（空壳，本函数填充）
  sub: HTMLElement // #settle-sub
}

export interface SettleDeps {
  onDone: () => void // 原「展开错综」按钮 —— 本屏不自动跳屏，保留给用户点击
}

export async function playSettle(refs: SettleRefs, _deps: SettleDeps) {
  const epoch = ANIM.cur()
  const st = STORE.state
  if (!st.bits.length) return

  const { pair, sub } = refs
  pair.innerHTML = ''

  const mkCol = (cap: string, bitsArr: number[], moving: boolean) => {
    const col = document.createElement('div')
    col.className = 'col'
    col.append(Object.assign(document.createElement('div'), { className: 'cap', textContent: cap }))
    const box = document.createElement('div')
    box.className = 'hex-box'
    const sheen = document.createElement('div')
    sheen.className = 'sheen'
    sheen.append(document.createElement('i'))
    const hex = stackEl(bitsArr, moving ? { moves: st.moves } : {})
    hex.dataset.phase = 'settled'
    box.append(sheen, hex)
    // ★ 卦名放在各自的框下方（本卦、之卦都要有）
    const nm = document.createElement('div')
    nm.className = 'hex-name'
    nm.textContent = RULES.bitsToName(bitsArr)
    col.append(box, nm)
    return { col, box, sheen, hex, nm }
  }

  const hasMove = st.moves.some(Boolean)
  const zbits = hasMove ? RULES.zhiBits(st.bits, st.moves) : null

  const A = mkCol('本卦', st.bits, true)
  pair.append(A.col)
  let B: ReturnType<typeof mkCol> | null = null
  if (hasMove) {
    const arrow = document.createElement('div')
    arrow.className = 'arrow'
    arrow.textContent = '→'
    pair.append(arrow)
    B = mkCol('之卦', zbits!, false)
    pair.append(B.col)
  }

  // 落定：六爻自下而上归位
  A.hex.querySelectorAll<HTMLElement>('.yao').forEach((y, i) =>
    ANIM.play(
      y,
      [
        { opacity: 0, transform: 'translateY(-14px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 260, delay: i * 55, easing: EASE.drop, fill: 'none' },
    ),
  )
  await ANIM.sleep(260 + 5 * 55)
  if (!ANIM.alive(epoch)) return

  // 光泽横扫
  ANIM.play(A.sheen.firstElementChild as HTMLElement, [
    { transform: 'translateX(0) skewX(-18deg)' },
    { transform: 'translateX(420%) skewX(-18deg)' },
  ], { duration: 760, easing: EASE.settle, fill: 'none' })

  if (B) {
    B.hex.querySelectorAll<HTMLElement>('.yao').forEach((y, i) =>
      ANIM.play(y, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 330 + i * 30, fill: 'none' }),
    )
  }

  const movingNames = st.moves.map((m, i) => (m ? LINE_CN[i] : null)).filter(Boolean)
  sub.textContent = hasMove
    ? '动爻 ' + movingNames.join('、') + ' · 之 ' + RULES.bitsToName(zbits!)
    : '六爻皆静 · 无之卦'

  await ANIM.sleep(140)
  if (!ANIM.alive(epoch)) return
  ANIM.play(
    A.nm,
    [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 520, fill: 'none' },
  )
  if (B)
    ANIM.play(
      B.nm,
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 520, delay: 120, fill: 'none' },
    )
  ANIM.play(sub, [{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: 220, fill: 'none' })
}
