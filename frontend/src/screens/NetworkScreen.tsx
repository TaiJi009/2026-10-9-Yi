/* ==========================================================================
   屏 5 · 错综演算 —— 三栏卡片由 React 声明式渲染，展示位由 STAGE 命令式演算

   ★ 两个框（本卦 / 展示位）保持空 div：内容全由 STAGE 填充，React 从不写它们，
     否则 reconciler 会把 WAAPI 的 fill:forwards 结果抹掉。
   ★ 硬约束（global.css 的 SCREEN 5 段有同款注释）：两框同行、等几何、固定 gap。
   ========================================================================== */

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { ANIM } from '../anim/anim'
import HexCard from '../components/HexCard'
import { HU_MODES } from '../core/data'
import type { Bits, Variant } from '../core/types'
import { STAGE } from '../stage/stage'
import { prepareVariants } from '../stage/variants'
import { STORE } from '../state/store'

interface Props {
  active: boolean
  /** 本卦六爻；moves 不进 props —— STAGE.init 直接从 STORE 读，与原型一致 */
  ben: Bits
  onRestart: () => void
}

// 15 格按原型的位置分配：左列 6 变卦、顶部综错交、右列 5 互卦
function slotList(bySlot: Record<string, Variant>, keys: string[]): Variant[] {
  return keys.map((k) => bySlot[k]).filter((v): v is Variant => Boolean(v))
}

export default function NetworkScreen({ active, ben, onRestart }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const benStackRef = useRef<HTMLDivElement>(null)
  const showStackRef = useRef<HTMLDivElement>(null)
  const benNameRef = useRef<HTMLDivElement>(null)
  const showNameRef = useRef<HTMLDivElement>(null)
  const showCapRef = useRef<HTMLDivElement>(null)
  const brLRef = useRef<HTMLDivElement>(null)
  const brRRef = useRef<HTMLDivElement>(null)

  // 15 格 + 重合检测（纯函数）：ben 变了才重算。
  // ★ 六屏常驻挂载 ⇒ 未起卦时 ben 是空数组，此时不能出卡：
  //   空 bits 会让 14 个变体全等，每张都挂上「同本卦」徽标（2.0 由 STAGE.init
  //   懒建卡片，天然没这问题）。
  const variants = useMemo(() => (ben.length ? prepareVariants(ben) : []), [ben])
  const bySlot = useMemo(() => {
    const m: Record<string, Variant> = {}
    variants.forEach((v) => (m[v.slot] = v))
    return m
  }, [variants])

  // 变体写进 STORE —— 原型在 STAGE.init 里写；卡片改由 React 渲染后，
  // 写入提前到这里（STAGE 仍从 STORE 读同一份）。
  useEffect(() => {
    if (active && variants.length && STORE.state.variants !== variants) STORE.set({ variants })
  }, [active, variants])

  // 卡片进了 DOM 之后再测量与入场；用 layout effect 抢在浏览器绘制前，避免闪烁
  useLayoutEffect(() => {
    if (!active) return
    const root = rootRef.current
    if (!root || !benStackRef.current || !showStackRef.current) return
    STAGE.init(ANIM.cur(), {
      root,
      benStack: benStackRef.current,
      showStack: showStackRef.current,
      benName: benNameRef.current!,
      showName: showNameRef.current!,
      showCap: showCapRef.current!,
      brL: brLRef.current!,
      brR: brRRef.current!,
    })
  }, [active])

  // 左列 6 张变卦（上 → 下 = 上爻 → 初爻，与「垂直位置 = 变哪一爻」一致）
  const left = slotList(bySlot, [5, 4, 3, 2, 1, 0].map((i) => 'bian' + i))
  const top = slotList(bySlot, ['zong', 'cuo', 'jiao'])
  const right = slotList(
    bySlot,
    HU_MODES.map((m) => 'hu-' + m.key),
  )

  const show = (v: Variant) => () => STAGE.select(v)

  return (
    <div ref={rootRef}>
      <div className="net-toolbar">
        <span className="net-title">错综 · 十五卦</span>
        <button className="net-btn" id="restart" onClick={onRestart}>
          重新起卦
        </button>
      </div>
      <div className="net-board">
        <div className="board-col" id="board-left">
          {left.map((v) => (
            <HexCard key={v.slot} v={v} onClick={show(v)} />
          ))}
        </div>
        <div className="board-mid">
          <div className="board-top" id="board-top">
            {top.map((v) => (
              <HexCard key={v.slot} v={v} onClick={show(v)} />
            ))}
          </div>
          <div className="board-pair" id="board-pair">
            <div className="frame">
              <div className="stack f-stack" id="ben-stack" ref={benStackRef} />
              <div className="hex-name" id="ben-name" ref={benNameRef} />
              <div className="f-cap">本卦</div>
              <div className="bracket l" id="br-l" ref={brLRef} />
              <div className="bracket r" id="br-r" ref={brRRef} />
            </div>
            <div className="frame">
              <div className="stack f-stack" id="show-stack" ref={showStackRef} />
              <div className="hex-name" id="show-name" ref={showNameRef} />
              <div className="f-cap" id="show-cap" ref={showCapRef}>
                之卦
              </div>
            </div>
          </div>
        </div>
        <div className="board-col" id="board-right">
          {right.map((v) => (
            <HexCard key={v.slot} v={v} onClick={show(v)} />
          ))}
        </div>
      </div>
    </div>
  )
}
