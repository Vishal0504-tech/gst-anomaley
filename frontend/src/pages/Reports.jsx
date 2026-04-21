import { useEffect, useState, useCallback, useMemo } from 'react'
import { Download, FileText } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, Cell,
  ReferenceLine, Legend
} from 'recharts'
import { fetchAllBusinesses } from '../services/api.js'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label ?? payload[0]?.payload?.id}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? '#374151' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function exportCSV(businesses) {
  const suspicious = businesses.filter((b) => b.Is_Suspicious)
  if (!suspicious.length) { alert('No suspicious businesses to export.'); return }

  const headers = ['Business_ID', 'City', 'Industry', 'Reported_Turnover', 'Risk_Score', 'ElectricityBill', 'Employee_Count']
  const rows = suspicious.map((b) => headers.map((h) => `"${b[h] ?? ''}"`).join(','))
  const csv  = [headers.join(','), ...rows].join('\n')

  const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'gst_audit_targets.csv' })
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function Reports() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setBusinesses(await fetchAllBusinesses()) }
    catch (e) { setError(e.message ?? 'Failed to connect') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const cityData = useMemo(() => {
    const map = {}
    businesses.forEach((b) => {
      if (!map[b.City]) map[b.City] = { city: b.City, Suspicious: 0, Normal: 0, total: 0 }
      b.Is_Suspicious ? map[b.City].Suspicious++ : map[b.City].Normal++
      map[b.City].total++
    })
    return Object.values(map).sort((a, b) => b.Suspicious - a.Suspicious)
  }, [businesses])

  const scatterData = useMemo(() =>
    businesses.map((b, i) => ({
      x: b.Reported_Turnover,
      y: b.ElectricityBill,
      suspicious: b.Is_Suspicious,
      id: b.Business_ID,
    })), [businesses])

  const suspicious = businesses.filter((b) => b.Is_Suspicious)

  if (loading) return <Spinner message="Compiling Analytics Report…" />
  if (error)   return <ErrorState error={error} onRetry={load} />

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Macro-Level Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">Aggregated insights across all {businesses.length} businesses</p>
        </div>
        <button
          id="export-csv-btn"
          onClick={() => exportCSV(businesses)}
          className="btn-primary"
        >
          <Download className="w-4 h-4" />
          Export Audit List to CSV
        </button>
      </div>

      {/* Export info */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        <FileText className="w-4 h-4 flex-shrink-0" />
        <span>
          Clicking <strong>Export</strong> downloads a CSV of <strong>{suspicious.length} suspicious businesses</strong> — ready for audit team distribution.
        </span>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Anomaly Density by City */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-0.5">Anomaly Density by City</h3>
          <p className="text-xs text-gray-400 mb-4">Suspicious vs normal count per city</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cityData} margin={{ top: 5, right: 10, left: -20, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="city" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Suspicious" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Normal"     fill="#86efac" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Electricity vs Turnover Scatter */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-0.5">Electricity Usage vs Reported Turnover</h3>
          <p className="text-xs text-gray-400 mb-4">Outliers above the trend indicate potential under-reporting of revenue</p>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="x" type="number" name="Turnover" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} />
              <YAxis dataKey="y" type="number" name="ElectricityBill" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
                    <p className="font-semibold text-gray-800 font-mono mb-1">{d.id}</p>
                    <p className="text-gray-600">Turnover: ₹{d.x.toLocaleString()}</p>
                    <p className="text-gray-600">Electricity: ₹{d.y.toLocaleString()}</p>
                    <p className={d.suspicious ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {d.suspicious ? '🚨 Suspicious' : '✅ Normal'}
                    </p>
                  </div>
                )
              }} />
              <Scatter data={scatterData} shape="circle">
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.suspicious ? '#ef4444' : '#22c55e'} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 justify-end">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Suspicious</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Normal</span>
          </div>
        </div>
      </div>

      {/* City table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">City-wise Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['City', 'Total', 'Suspicious', 'Normal', 'Anomaly Rate'].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cityData.map((c) => {
                const rate = ((c.Suspicious / c.total) * 100).toFixed(1)
                return (
                  <tr key={c.city} className="hover:bg-gray-50/70 transition-colors">
                    <td className="table-td font-medium text-gray-900">{c.city}</td>
                    <td className="table-td tabular-nums text-gray-600">{c.total}</td>
                    <td className="table-td tabular-nums text-red-600 font-semibold">{c.Suspicious}</td>
                    <td className="table-td tabular-nums text-green-600 font-semibold">{c.Normal}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-gray-600">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
