/* 屏 0 · 静 —— 太极（原 body L299–316 + EVENTS.bindRest） */

interface Props {
  onFire: () => void
}

// 双击/回车连击的防抖不在这里 —— App 的 withBusy 门是唯一把关点（与原型一致）
export default function RestScreen({ onFire }: Props) {
  const fire = () => onFire()
  return (
    <>
      <div className="halo" aria-hidden="true" />
      <div
        className="taiji"
        role="button"
        tabIndex={0}
        aria-label="点击起卦"
        onClick={fire}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          fire()
        }}
      >
        <svg viewBox="-100 -100 200 200" aria-hidden="true">
          <defs>
            <clipPath id="taijiClip">
              <circle cx="0" cy="0" r="100" />
            </clipPath>
          </defs>
          <g clipPath="url(#taijiClip)">
            <circle cx="0" cy="0" r="100" fill="#0b0b0f" />
            <path d="M0,-100 A100,100 0 0 1 0,100 Z" fill="#f2f2f7" />
            <circle cx="0" cy="-50" r="50" fill="#0b0b0f" />
            <circle cx="0" cy="50" r="50" fill="#f2f2f7" />
            <circle cx="0" cy="-50" r="13" fill="#f2f2f7" />
            <circle cx="0" cy="50" r="13" fill="#0b0b0f" />
          </g>
          <circle cx="0" cy="0" r="99" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.4" />
        </svg>
      </div>
      <p className="hint">
        点击太极 · <b>起卦</b>
      </p>
    </>
  )
}
