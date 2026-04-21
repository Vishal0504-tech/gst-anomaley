import { useEffect, useState, useCallback, useMemo } from 'react'
import { ClipboardList, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react'
import { fetchAllBusinesses } from '../services/api.js'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'
import RiskBar from '../components/RiskBar.jsx'

function getPriority(score) {
  if (score >= 95) return { label: 'CRITICAL', cls: 'badge-critical' }
  if (score >= 85) return { label: 'High',     cls: 'badge-high' }
  return              { label: 'Medium',    cls: 'badge-medium' }
}

export default function Priority() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [sortKey, setSortKey]       = useState('Est_Revenue_Impact')
  const [sortDir, setSortDir]       = useState('desc')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchAllBusinesses()
      setBusinesses(data.filter((b) => b.Is_Suspicious))
    } catch (e) {
      setError(e.message ?? 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rows = useMemo(() => {
    const enriched = businesses.map((b) => ({
      ...b,
      Est_Revenue_Impact: b.Reported_Turnover * (b.Risk_Score / 100) * 0.2,
      Priority: getPriority(b.Risk_Score),
    }))
    return enriched.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'number') return sortDir === 'desc' ? bv - av : av - bv
      return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
    })
  }, [businesses, sortKey, sortDir])

  const totalImpact = rows.reduce((s, r) => s + r.Est_Revenue_Impact, 0)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null
    return sortDir === 'desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />
  }

  if (loading) return <Spinner message="Building Audit Queue…" />
  if (error)   return <ErrorState error={error} onRetry={load} />

  const cols = [
    { key: 'rank',               label: '#',                 sortable: false },
    { key: 'Business_ID',        label: 'Business ID',        sortable: false },
    { key: 'Industry',           label: 'Industry',           sortable: true },
    { key: 'City',               label: 'City',               sortable: true },
    { key: 'Priority',           label: 'Priority Level',     sortable: false },
    { key: 'Risk_Score',         label: 'Risk Score',         sortable: true },
    { key: 'Reported_Turnover',  label: 'Reported Turnover',  sortable: true },
    { key: 'Est_Revenue_Impact', label: 'Est. Revenue Impact',sortable: true },
  ]

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total in Queue',       value: rows.length.toLocaleString(),            color: 'text-gray-900' },
          { label: 'CRITICAL Targets',     value: rows.filter((r) => r.Risk_Score >= 95).length, color: 'text-red-600' },
          { label: 'Est. Total Impact',    value: `₹${(totalImpact / 1e7).toFixed(2)} Cr`, color: 'text-purple-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gray-300 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-gray-800">Priority Audit Targets</h2>
          <span className="ml-auto text-xs text-gray-400">Click column headers to sort</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {cols.map(({ key, label, sortable }) => (
                  <th
                    key={key}
                    onClick={() => sortable && handleSort(key)}
                    className={`table-th ${sortable ? 'cursor-pointer hover:text-gray-800 select-none' : ''}`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, idx) => (
                <tr key={r.Business_ID} className={`hover:bg-gray-50/70 transition-colors ${idx === 0 && r.Risk_Score >= 95 ? 'bg-red-50/30' : ''}`}>
                  <td className="table-td w-12">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      idx === 0 ? 'bg-red-500 text-white' : idx === 1 ? 'bg-orange-400 text-white' : idx === 2 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{idx + 1}</span>
                  </td>
                  <td className="table-td font-mono text-xs font-semibold text-gray-900">{r.Business_ID}</td>
                  <td className="table-td">
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{r.Industry}</span>
                  </td>
                  <td className="table-td text-gray-600">{r.City}</td>
                  <td className="table-td">
                    <span className={r.Priority.cls}>{r.Priority.label}</span>
                  </td>
                  <td className="table-td w-40"><RiskBar score={r.Risk_Score} /></td>
                  <td className="table-td tabular-nums text-gray-700">₹{r.Reported_Turnover.toLocaleString()}</td>
                  <td className="table-td tabular-nums font-semibold text-purple-700">₹{r.Est_Revenue_Impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
