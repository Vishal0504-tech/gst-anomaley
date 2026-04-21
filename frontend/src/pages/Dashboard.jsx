import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, AlertTriangle, Activity, TrendingUp,
  ArrowRight, ExternalLink
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import { fetchAllBusinesses } from '../services/api.js'
import KPICard from '../components/KPICard.jsx'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'
import RiskBar from '../components/RiskBar.jsx'

/* ── Custom Tooltip ─────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

/* ── Risk Histogram builder ─────────────────────── */
function buildHistogram(businesses) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 10}`,
    Normal: 0,
    Suspicious: 0,
  }))
  businesses.forEach((b) => {
    const idx = Math.min(Math.floor(b.Risk_Score / 10), 9)
    b.Is_Suspicious ? buckets[idx].Suspicious++ : buckets[idx].Normal++
  })
  return buckets
}

/* ── Industry Anomaly chart data ────────────────── */
function buildIndustryData(businesses) {
  const map = {}
  businesses.forEach((b) => {
    if (!map[b.Industry]) map[b.Industry] = { industry: b.Industry, Normal: 0, Suspicious: 0 }
    b.Is_Suspicious ? map[b.Industry].Suspicious++ : map[b.Industry].Normal++
  })
  return Object.values(map).sort((a, b) => b.Suspicious - a.Suspicious).slice(0, 8)
}

export default function Dashboard() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setBusinesses(await fetchAllBusinesses())
    } catch (e) {
      setError(e.message ?? 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner message="Loading Global Dashboard…" />
  if (error)   return <ErrorState error={error} onRetry={load} />

  const suspicious = businesses.filter((b) => b.Is_Suspicious)
  const avgRisk    = businesses.length
    ? businesses.reduce((s, b) => s + b.Risk_Score, 0) / businesses.length
    : 0
  const estRisk    = suspicious.reduce((s, b) => s + b.Reported_Turnover, 0) * 0.15
  const top5       = [...suspicious].sort((a, b) => b.Risk_Score - a.Risk_Score).slice(0, 5)

  const kpis = [
    { label: 'Total Businesses',   value: businesses.length.toLocaleString(),
      icon: Building2,    iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',
      description: 'Registered in database' },
    { label: 'Suspicious Cases',   value: suspicious.length.toLocaleString(),
      icon: AlertTriangle, iconBg: 'bg-red-50',    iconColor: 'text-red-600',
      description: `${((suspicious.length / businesses.length) * 100).toFixed(1)}% of total`,
      trend: { up: true, label: 'Flagged by AI' } },
    { label: 'Avg Risk Score',     value: avgRisk.toFixed(1),
      icon: Activity,     iconBg: 'bg-amber-50',  iconColor: 'text-amber-600',
      description: 'Out of 100 across all businesses' },
    { label: 'Est. Revenue at Risk', value: `₹${(estRisk / 1e7).toFixed(2)} Cr`,
      icon: TrendingUp,   iconBg: 'bg-purple-50', iconColor: 'text-purple-600',
      description: '15% of suspicious turnover' },
  ]

  const histData     = buildHistogram(businesses)
  const industryData = buildIndustryData(businesses)

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Anomalies by Industry */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Anomalies by Industry</h2>
          <p className="text-xs text-gray-400 mb-4">Normal vs suspicious grouped by sector</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={industryData} margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="industry" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Normal"     fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="Suspicious" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Score Histogram */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Risk Score Distribution</h2>
          <p className="text-xs text-gray-400 mb-4">Frequency of businesses per score bucket (0–100)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={histData} margin={{ top: 0, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Normal"     fill="#86efac" radius={[3, 3, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Suspicious" fill="#fca5a5" radius={[3, 3, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Table */}
      <div className="card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Top 5 Critical Businesses</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by highest risk score</p>
          </div>
          <Link to="/directory" className="btn-secondary text-xs py-1.5">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Business ID', 'City', 'Industry', 'Turnover (₹)', 'Risk Score', 'Status'].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {top5.map((b) => (
                <tr key={b.Business_ID} className="hover:bg-gray-50/70 transition-colors">
                  <td className="table-td font-mono text-xs text-gray-900 font-semibold">{b.Business_ID}</td>
                  <td className="table-td text-gray-600">{b.City}</td>
                  <td className="table-td">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{b.Industry}</span>
                  </td>
                  <td className="table-td tabular-nums">₹{b.Reported_Turnover.toLocaleString()}</td>
                  <td className="table-td w-40"><RiskBar score={b.Risk_Score} /></td>
                  <td className="table-td">
                    <span className="badge-critical">🚨 Suspicious</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
