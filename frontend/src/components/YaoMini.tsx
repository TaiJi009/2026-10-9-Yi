/* 卡片缩略爻栈 —— 声明式的 miniEl（与 anim/yao-dom.ts 的 miniEl 同构：
   同样的类名与 data-yang 钩子，CSS 不加区分地命中两者）。 */
import type { Bits } from '../core/types'

export default function YaoMini({ bits }: { bits: Bits }) {
  return (
    <div className="mini">
      {bits.map((b, i) => (
        <div key={i} className="yao" data-yang={b ? '1' : '0'}>
          <i className="glow" />
          <i className="seg seg-l" />
          <i className="seg seg-r" />
        </div>
      ))}
    </div>
  )
}
