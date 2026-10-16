/* ==========================================================================
   App —— 六屏骨架 + FSM（移植 index.html FSM/BOOT/EVENTS 的调度层）

   ★ 六屏全部常驻挂载，只切 .active 类：
     卸载会杀死 CSS 的 0.42s 淡入，还会丢掉 WAAPI fill:forwards 的状态。
   ★ goto = ANIM.cancelAll() + 切类 + 触发对应 play（effect 中），
     与原型 FSM.goto 逐语义一致。
   ========================================================================== */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ANIM } from './anim/anim'
import { qsa } from './anim/yao-dom'
import { GROW } from './grow/grow'
import * as RULES from './core/rules'
import { playCast, castInstant, type CastRefs } from './plays/playCast'
import { playMatrix } from './plays/playMatrix'
import { playSettle } from './plays/playSettle'
import { STAGE } from './stage/stage'
import { STORE } from './state/store'
import CastScreen from './screens/CastScreen'
import GenerateScreen from './screens/GenerateScreen'
import MatrixScreen from './screens/MatrixScreen'
import NetworkScreen from './screens/NetworkScreen'
import RestScreen from './screens/RestScreen'
import SettleScreen from './screens/SettleScreen'

export type Screen = 'rest' | 'generate' | 'matrix' | 'cast' | 'settle' | 'network'

export default function App() {
  const [screen, setScreen] = useState<Screen>('rest')
  const screenRef = useRef<Screen>('rest')
  const busyRef = useRef(false)

  // 各屏的命令式目标（常驻挂载 ⇒ 首次 render 后即就绪）
  const genSvgRef = useRef<SVGSVGElement>(null)
  const genHintRef = useRef<HTMLParagraphElement>(null)
  const matrixSvgRef = useRef<SVGSVGElement>(null)
  const castStackRef = useRef<HTMLDivElement>(null)
  const castNRef = useRef<HTMLSpanElement>(null)
  const settlePairRef = useRef<HTMLDivElement>(null)
  const settleSubRef = useRef<HTMLDivElement>(null)

  const goto = useCallback((name: Screen) => {
    ANIM.cancelAll() // 切屏解药：在飞的动画与 await 立即失效
    screenRef.current = name
    setScreen(name)
  }, [])

  // —— 屏激活 play（对应原型 PLAYS 注册表）——
  useEffect(() => {
    switch (screen) {
      case 'generate':
        if (genSvgRef.current)
          GROW.start(genSvgRef.current, genHintRef.current, ANIM.cur(), {
            onFinished: () => goto('matrix'),
          })
        break
      case 'matrix':
        if (matrixSvgRef.current) playMatrix(matrixSvgRef.current)
        break
      case 'cast': {
        if (!castStackRef.current || !castNRef.current) return
        const refs: CastRefs = {
          slots: qsa<HTMLElement>('.slot', castStackRef.current),
          yaos: qsa<HTMLElement>('.yao', castStackRef.current),
          vals: qsa<HTMLElement>('.val', castStackRef.current),
          counter: castNRef.current,
        }
        void playCast(refs, { onDone: () => goto('settle') })
        break
      }
      case 'settle':
        if (settlePairRef.current && settleSubRef.current)
          void playSettle(
            { pair: settlePairRef.current, sub: settleSubRef.current },
            { onDone: () => {} },
          )
        break
      case 'network':
        // STAGE.init 由 NetworkScreen 在卡片挂好后自行触发（useLayoutEffect）
        break
      default:
        break
    }
  }, [screen, goto])

  // —— 输入门 withBusy（原 FSM.withBusy）——
  const withBusy = useCallback((fn: () => void | Promise<void>) => {
    if (busyRef.current) return
    busyRef.current = true
    Promise.resolve()
      .then(fn)
      .finally(() => {
        busyRef.current = false
      })
  }, [])

  // —— Esc 跳过 + resize 重测量（原 EVENTS.bindChrome / bindResize）——
  const skip = useCallback(() => {
    if (screenRef.current === 'generate') void GROW.instant()
    else if (screenRef.current === 'cast')
      castInstant({ onDone: () => goto('settle') })
  }, [goto])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    document.addEventListener('keydown', onKey)
    const unbindResize = STAGE.bindResize(() => screenRef.current === 'network')
    return () => {
      document.removeEventListener('keydown', onKey)
      unbindResize()
    }
  }, [skip])

  // —— 调试把手（原 BOOT 的 window.YI，仅 dev）——
  useEffect(() => {
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).YI = {
        STORE,
        RULES,
        ANIM,
        GROW,
        STAGE,
        goto,
        get screen() {
          return screenRef.current
        },
      }
    }
  }, [goto])

  const cls = (name: Screen) => 'screen' + (screen === name ? ' active' : '')

  return (
    <>
      <main id="stage">
        <section className={cls('rest')} data-screen="rest" id="rest">
          <RestScreen
            onFire={() => {
              // 与原型 EVENTS.bindRest 同：先验屏与忙碌，再走 withBusy 门
              if (screenRef.current !== 'rest') return
              withBusy(() => {
                STORE.reset()
                goto('generate')
              })
            }}
          />
        </section>

        <section className={cls('generate')} data-screen="generate" id="generate">
          <GenerateScreen svgRef={genSvgRef} hintRef={genHintRef} />
        </section>

        <section className={cls('matrix')} data-screen="matrix" id="matrix">
          <MatrixScreen
            svgRef={matrixSvgRef}
            onToCast={() => withBusy(() => goto('cast'))}
          />
        </section>

        <section className={cls('cast')} data-screen="cast">
          <CastScreen stackRef={castStackRef} counterRef={castNRef} />
        </section>

        <section className={cls('settle')} data-screen="settle">
          <SettleScreen
            pairRef={settlePairRef}
            subRef={settleSubRef}
            onToNetwork={() => withBusy(() => goto('network'))}
          />
        </section>

        <section className={cls('network')} data-screen="network" id="network">
          <NetworkScreen
            active={screen === 'network'}
            ben={STORE.state.bits}
            onRestart={() =>
              withBusy(() => {
                STORE.reset()
                goto('rest')
              })
            }
          />
        </section>
      </main>

      {/* HUD：跳过按钮只在生演屏点亮（原 FSM.goto 内的 #skip toggle），Esc 全局可用 */}
      <button
        id="skip"
        className={screen === 'generate' ? 'on' : ''}
        onClick={skip}
      >
        跳过
      </button>
    </>
  )
}
