

export default function Sparkline({ points = [], width = 600, height = 120 }) {
  const pad = { top: 10, right: 10, bottom: 25, left: 35 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const valid = points.filter((p) => p.value !== null)
  if (valid.length === 0) {
    return <div className="sparkline-empty">No data yet — start practicing to see your accuracy chart.</div>
  }

  const xStep = innerW / (points.length - 1 || 1)

  const yScale = (v) => pad.top + innerH - (v / 100) * innerH

  const pathD = points.map((p, i) => {
    const x = pad.left + i * xStep
    const y = p.value !== null ? yScale(p.value) : null
    if (y === null) return null
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).filter(Boolean).join(' ')

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <line x1={pad.left} y1={yScale(0)} x2={pad.left + innerW} y2={yScale(0)} stroke="#1e2548" strokeWidth="1" />
      <line x1={pad.left} y1={yScale(50)} x2={pad.left + innerW} y2={yScale(50)} stroke="#1e2548" strokeWidth="1" strokeDasharray="4,4" />
      <line x1={pad.left} y1={yScale(100)} x2={pad.left + innerW} y2={yScale(100)} stroke="#1e2548" strokeWidth="1" strokeDasharray="4,4" />
      <text x={pad.left - 5} y={yScale(100) + 4} textAnchor="end" fill="#7a82a6" fontSize="8">0</text>
      <text x={pad.left - 5} y={yScale(50) + 4} textAnchor="end" fill="#7a82a6" fontSize="8">50</text>
      <text x={pad.left - 5} y={yScale(100) + 4} textAnchor="end" fill="#7a82a6" fontSize="8">0</text>
      {pathD && <path d={pathD} fill="none" stroke="#38e8b2" strokeWidth="2" strokeLinejoin="round" />}
      {points.map((p, i) => {
        if (p.value === null) return null
        const x = pad.left + i * xStep
        return <circle key={i} cx={x} cy={yScale(p.value)} r="3" fill="#38e8b2" />
      })}
      {points.map((p, i) => {
        const x = pad.left + i * xStep
        return <text key={i} x={x} y={height - 5} textAnchor="middle" fill="#7a82a6" fontSize="7">{p.label}</text>
      })}
    </svg>
  )
}
