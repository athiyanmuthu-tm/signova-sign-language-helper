// ============================================================
// HandPoseGuide
// Simple hand icon showing which fingers are straight/bent
// ============================================================

export default function HandPoseGuide({ fingerState, size = 'normal' }) {
  const isSmall = size === 'small'
  const w = isSmall ? 80 : 140
  const h = isSmall ? 44 : 77

  // Normalize to an array of 5 values: 'straight' | 'curled'
  let states
  if (fingerState && fingerState.length === 5) {
    states = fingerState
  } else {
    states = ['curled', 'curled', 'curled', 'curled', 'curled']
  }

  // Fixed design that fits all five fingers at any size
  // Each finger: x position, baseY (palm line), tipY (top of finger)
  // Finger order: thumb, index, middle, ring, pinky
  const fingers = [
    { x: 10, baseY: 32, tipY: 14 },   // thumb (short, left)
    { x: 30, baseY: 32, tipY: 8 },    // index
    { x: 50, baseY: 32, tipY: 5 },    // middle (tallest)
    { x: 70, baseY: 32, tipY: 9 },    // ring
    { x: 90, baseY: 32, tipY: 13 },   // pinky (short, right)
  ]

  const getColor = (state) =>
    state === 'straight' ? '#38e8b2' : '#7a82a6'

  const halfY = (finger) => (finger.baseY + finger.tipY) / 2

  return (
    <svg className="guide-svg" width={w} height={h} viewBox="0 0 100 44">
      {/* Palm line */}
      <line x1="3" y1="32" x2="97" y2="32" stroke="#1e2548" strokeWidth="3" strokeLinecap="round" />

      {/* Fingers */}
      {fingers.map((finger, i) => {
        const state = states[i] || 'curled'
        const isStraight = state === 'straight'
        const tipY = isStraight ? finger.tipY : halfY(finger)
        const color = getColor(state)

        return (
          <line
            key={i}
            x1={finger.x}
            y1={finger.baseY}
            x2={finger.x}
            y2={tipY}
            stroke={color}
            strokeWidth={isSmall ? 5 : 7}
            strokeLinecap="round"
          />
        )
      })}

      {/* Fingertip dots */}
      {fingers.map((finger, i) => {
        const state = states[i] || 'curled'
        const isStraight = state === 'straight'
        const tipY = isStraight ? finger.tipY : halfY(finger)
        const color = getColor(state)

        return (
          <circle
            key={i}
            cx={finger.x}
            cy={tipY}
            r={isSmall ? 3.5 : 4.5}
            fill={color}
          />
        )
      })}
    </svg>
  )
}