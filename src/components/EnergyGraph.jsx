export default function EnergyGraph({ tracks }) {
  const withEnergy = tracks.filter((t) => t.energy != null)
  if (withEnergy.length < 2) return null

  const width = 600
  const height = 120
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom

  const points = withEnergy.map((t, i) => ({
    x: padding.left + (i / (withEnergy.length - 1)) * graphWidth,
    y: padding.top + graphHeight - t.energy * graphHeight,
    energy: t.energy,
    name: t.name,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`

  return (
    <div className="energy-graph">
      <h3>Energy Flow</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="energy-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={padding.top + graphHeight - v * graphHeight}
              x2={width - padding.right}
              y2={padding.top + graphHeight - v * graphHeight}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text
              x={padding.left - 5}
              y={padding.top + graphHeight - v * graphHeight}
              textAnchor="end"
              dominantBaseline="central"
              className="graph-label"
            >
              {Math.round(v * 100)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#energyGradient)" opacity="0.3" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#ec4899"
            opacity="0.8"
          >
            <title>{`${p.name}: ${Math.round(p.energy * 100)}%`}</title>
          </circle>
        ))}

        <defs>
          <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
