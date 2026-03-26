import { CAMELOT_COLORS, CAMELOT_WHEEL_ORDER } from '../services/camelot.js'

export default function CamelotWheel({ tracks }) {
  // Count tracks per Camelot code
  const counts = {}
  tracks.forEach((t) => {
    if (t.camelot) {
      counts[t.camelot] = (counts[t.camelot] || 0) + 1
    }
  })

  const maxCount = Math.max(...Object.values(counts), 1)

  // Wheel layout: 12 segments, outer ring = B (major), inner ring = A (minor)
  const outerRadius = 140
  const innerRadius = 90
  const centerX = 160
  const centerY = 160

  function getSegmentPath(index, rOuter, rInner) {
    const angleStep = (2 * Math.PI) / 12
    const startAngle = index * angleStep - Math.PI / 2 - angleStep / 2
    const endAngle = startAngle + angleStep
    const gap = 0.02

    const x1Outer = centerX + rOuter * Math.cos(startAngle + gap)
    const y1Outer = centerY + rOuter * Math.sin(startAngle + gap)
    const x2Outer = centerX + rOuter * Math.cos(endAngle - gap)
    const y2Outer = centerY + rOuter * Math.sin(endAngle - gap)
    const x1Inner = centerX + rInner * Math.cos(endAngle - gap)
    const y1Inner = centerY + rInner * Math.sin(endAngle - gap)
    const x2Inner = centerX + rInner * Math.cos(startAngle + gap)
    const y2Inner = centerY + rInner * Math.sin(startAngle + gap)

    return `M ${x1Outer} ${y1Outer} A ${rOuter} ${rOuter} 0 0 1 ${x2Outer} ${y2Outer} L ${x1Inner} ${y1Inner} A ${rInner} ${rInner} 0 0 0 ${x2Inner} ${y2Inner} Z`
  }

  function getLabelPos(index, radius) {
    const angleStep = (2 * Math.PI) / 12
    const angle = index * angleStep - Math.PI / 2
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  }

  return (
    <div className="camelot-wheel">
      <h3>Key Distribution</h3>
      <svg viewBox="0 0 320 320" className="wheel-svg">
        {/* Outer ring - B (major) */}
        {Array.from({ length: 12 }, (_, i) => {
          const code = `${i + 1}B`
          const count = counts[code] || 0
          const opacity = count > 0 ? 0.4 + (count / maxCount) * 0.6 : 0.15
          return (
            <g key={code}>
              <path
                d={getSegmentPath(i, outerRadius, innerRadius + 4)}
                fill={CAMELOT_COLORS[code]}
                opacity={opacity}
                stroke="#1a1a2e"
                strokeWidth="1"
              />
              <text
                {...getLabelPos(i, (outerRadius + innerRadius) / 2 + 2)}
                textAnchor="middle"
                dominantBaseline="central"
                className="wheel-label"
                opacity={count > 0 ? 1 : 0.4}
              >
                {code}
                {count > 0 && (
                  <tspan dx="2" className="wheel-count">
                    ({count})
                  </tspan>
                )}
              </text>
            </g>
          )
        })}

        {/* Inner ring - A (minor) */}
        {Array.from({ length: 12 }, (_, i) => {
          const code = `${i + 1}A`
          const count = counts[code] || 0
          const opacity = count > 0 ? 0.4 + (count / maxCount) * 0.6 : 0.15
          return (
            <g key={code}>
              <path
                d={getSegmentPath(i, innerRadius - 4, 35)}
                fill={CAMELOT_COLORS[code]}
                opacity={opacity}
                stroke="#1a1a2e"
                strokeWidth="1"
              />
              <text
                {...getLabelPos(i, (innerRadius + 35) / 2)}
                textAnchor="middle"
                dominantBaseline="central"
                className="wheel-label-inner"
                opacity={count > 0 ? 1 : 0.4}
              >
                {code}
                {count > 0 && (
                  <tspan dx="2" className="wheel-count">
                    ({count})
                  </tspan>
                )}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
