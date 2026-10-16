/* 屏 4 · 成卦 —— pair/sub 空壳由 playSettle 填充（两列结构与动画一体） */
import type { RefObject } from 'react'

interface Props {
  pairRef: RefObject<HTMLDivElement | null>
  subRef: RefObject<HTMLDivElement | null>
  onToNetwork: () => void
}

export default function SettleScreen({ pairRef, subRef, onToNetwork }: Props) {
  return (
    <div className="settle-wrap">
      <div className="pair" id="settle-pair" ref={pairRef} />
      <div className="hex-sub" id="settle-sub" ref={subRef} />
      <button className="net-btn" id="to-network" onClick={onToNetwork}>
        展开错综 · 十五卦
      </button>
    </div>
  )
}
