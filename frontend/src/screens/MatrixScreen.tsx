/* 屏 2 · 重卦 —— 64 卦方阵（内容由 playMatrix 填充） */
import type { RefObject } from 'react'

interface Props {
  svgRef: RefObject<SVGSVGElement | null>
  onToCast: () => void
}

export default function MatrixScreen({ svgRef, onToCast }: Props) {
  return (
    <div id="gen-matrix">
      <svg
        ref={svgRef}
        id="matrix-svg"
        viewBox="0 0 1120 940"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="六十四卦方阵"
      />
      <button className="net-btn" id="to-cast" onClick={onToCast}>
        继续 · 起卦
      </button>
    </div>
  )
}
