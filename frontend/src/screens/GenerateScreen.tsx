/* 屏 1 · 生演 —— 空 svg 骨架（内容全部由 GROW 控制器命令式生长）。
   React 永不重渲染 svg 内部的 <g> 图层。 */
import { GROW } from '../grow/grow'
import type { RefObject } from 'react'

interface Props {
  svgRef: RefObject<SVGSVGElement | null>
  hintRef: RefObject<HTMLParagraphElement | null>
}

export default function GenerateScreen({ svgRef, hintRef }: Props) {
  return (
    <>
      <svg
        ref={svgRef}
        id="gen-svg"
        viewBox="0 0 1000 720"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="太极生演：点击生出两仪、四象、八卦"
        onClick={GROW.onClick}
        onKeyDown={GROW.onKeyDown}
      />
      <p className="hint" ref={hintRef}>
        点击太极 · <b>生两仪</b>
      </p>
    </>
  )
}
