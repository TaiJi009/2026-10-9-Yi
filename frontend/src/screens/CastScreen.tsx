/* 屏 3 · 起卦 —— 6 个爻槽由 React 静态挂出（原型里由 PLAYS.cast 动态创建；
   改静态后 playCast 每次进入先复位再逐爻演），计数与「蓄→落→显」不变。 */
import { LINE_CN } from '../core/data'
import type { RefObject } from 'react'

interface Props {
  stackRef: RefObject<HTMLDivElement | null>
  counterRef: RefObject<HTMLSpanElement | null>
}

export default function CastScreen({ stackRef, counterRef }: Props) {
  return (
    <>
      <div className="cast-wrap">
        <div className="cast-head">
          摇卦 <b><span id="cast-n" ref={counterRef}>0</span> / 6</b>
        </div>
        <div className="cast-stack" id="cast-stack" ref={stackRef}>
          {LINE_CN.map((cn, i) => (
            <div className="slot" key={i}>
              <div className="yao" data-yang="0" data-ghost="1">
                <i className="glow" />
                <i className="seg seg-l" />
                <i className="seg seg-r" />
              </div>
              <span className="val">{cn}爻</span>
            </div>
          ))}
        </div>
      </div>
      <p className="hint">
        六爻 · <b>自下而上</b>
      </p>
    </>
  )
}
