/* 屏 5 的变法卡片 —— 原 STAGE.makeCard（L1376–1388）的声明式版。
   data-slot / data-kind / data-dup 与原型逐字一致：
   CSS 靠 [data-active] [data-dup] 着色，STAGE.resetBase 靠 dataset 复位。 */
import type { Variant } from '../core/types'
import YaoMini from './YaoMini'

interface Props {
  v: Variant
  onClick: () => void
}

export default function HexCard({ v, onClick }: Props) {
  return (
    <button
      className="card"
      data-slot={v.slot}
      data-kind={v.kind}
      data-dup={v.dup ? '1' : undefined}
      onClick={onClick}
    >
      <span className="c-label">{v.label}</span>
      <YaoMini bits={v.bits} />
      <span className="c-name">{v.name}</span>
      <span className="c-badge">{v.dup || ''}</span>
    </button>
  )
}
