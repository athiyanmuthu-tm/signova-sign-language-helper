

export default function HeatmapGrid({ signs = [], levelOf, onSelect }) {
  return (
    <div className="heatmap-grid">
      {signs.map((s) => (
        <button
          key={s.id}
          className={`heat-cell ${levelOf(s.id)}`}
          onClick={() => onSelect?.(s.id)}
          title={s.label}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
