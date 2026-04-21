/**
 * Color-coded risk score progress bar.
 * score: number 0–100
 */
export default function RiskBar({ score }) {
  const pct = Math.min(Math.max(score, 0), 100)

  const color =
    pct >= 80 ? 'bg-red-500'
    : pct >= 50 ? 'bg-amber-400'
    : 'bg-green-500'

  const textColor =
    pct >= 80 ? 'text-red-700'
    : pct >= 50 ? 'text-amber-700'
    : 'text-green-700'

  const bg =
    pct >= 80 ? 'bg-red-50'
    : pct >= 50 ? 'bg-amber-50'
    : 'bg-green-50'

  return (
    <div className="flex items-center gap-2.5 min-w-[120px]">
      <div className={`flex-1 h-1.5 rounded-full ${bg} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${textColor}`}>
        {pct.toFixed(0)}
      </span>
    </div>
  )
}
