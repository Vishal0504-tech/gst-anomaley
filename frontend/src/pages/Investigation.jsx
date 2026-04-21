import { useState } from 'react'
import {
  Search, AlertTriangle, CheckCircle, Building2,
  MapPin, Zap, Users, TrendingUp, ShieldAlert
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { fetchBusinessById } from '../services/api.js'
import { InlineSpinner } from '../components/Spinner.jsx'
import RiskBar from '../components/RiskBar.jsx'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{Number(p.value).toFixed(6)}</strong></p>
      ))}
    </div>
  )
}

export default function Investigation() {
  const [query, setQuery]     = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      setResult(await fetchBusinessById(query.trim()))
    } catch (e) {
      setError(e.response?.status === 404
        ? `Business ID "${query}" not found in the database.`
        : (e.message ?? 'Request failed'))
    } finally {
      setLoading(false)
    }
  }

  const biz = result?.business_data
  const avg = result?.industry_averages

  const comparisonData = biz && avg ? [
    {
      metric: 'Electricity / Turnover',
      'This Business': biz.ElectricityBill / biz.Reported_Turnover,
      'Industry Avg':  avg.avg_electricity_ratio,
    },
    {
      metric: 'Employees / Turnover',
      'This Business': biz.Employee_Count / biz.Reported_Turnover,
      'Industry Avg':  avg.avg_employee_ratio,
    },
  ] : []

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Search bar */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Search Business ID</h2>
        <p className="text-xs text-gray-400 mb-4">Enter an exact Business ID (e.g. <code className="bg-gray-100 px-1 rounded text-gray-600">GSTIN_0042</code>) to pull the full investigation profile.</p>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="investigation-search"
              type="text"
              placeholder="Enter Business ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-6">
            {loading ? <InlineSpinner /> : <Search className="w-4 h-4" />}
            {loading ? 'Analysing…' : 'Investigate'}
          </button>
        </form>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {biz && (
        <>
          {/* Profile Card */}
          <div className={`card p-5 border-l-4 ${biz.Is_Suspicious ? 'border-l-red-500' : 'border-l-green-500'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${biz.Is_Suspicious ? 'bg-red-50' : 'bg-green-50'}`}>
                  {biz.Is_Suspicious
                    ? <ShieldAlert className="w-6 h-6 text-red-600" />
                    : <CheckCircle className="w-6 h-6 text-green-600" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 font-mono">{biz.Business_ID}</h2>
                  <span className={biz.Is_Suspicious ? 'badge-critical' : 'badge-normal'}>
                    {biz.Is_Suspicious ? '🚨 Flagged Suspicious' : '✅ Normal'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap text-sm">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="w-3.5 h-3.5" /> <span>{biz.City}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Building2 className="w-3.5 h-3.5" /> <span>{biz.Industry}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
              {[
                { label: 'Reported Turnover', value: `₹${biz.Reported_Turnover.toLocaleString()}`, icon: TrendingUp },
                { label: 'Electricity Bill',  value: `₹${biz.ElectricityBill.toLocaleString()}`,  icon: Zap },
                { label: 'Employee Count',    value: biz.Employee_Count,                           icon: Users },
                { label: 'Risk Score',        value: null,                                          icon: null },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  {label === 'Risk Score'
                    ? <RiskBar score={biz.Risk_Score} />
                    : <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
                        {value}
                      </p>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* AI Explainability */}
          <div className={`rounded-xl border p-5 ${biz.Is_Suspicious
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className={`w-4 h-4 ${biz.Is_Suspicious ? 'text-red-600' : 'text-green-600'}`} />
              <h3 className={`text-sm font-bold ${biz.Is_Suspicious ? 'text-red-800' : 'text-green-800'}`}>
                AI Explainability — {biz.Is_Suspicious ? 'Why It Was Flagged' : 'Why This Is Normal'}
              </h3>
            </div>
            <p className={`text-sm leading-relaxed ${biz.Is_Suspicious ? 'text-red-700' : 'text-green-700'}`}>
              {biz.Explanation ?? (biz.Is_Suspicious
                ? 'The AI model detected statistically significant deviations in this entity\'s electricity consumption and employee count ratios relative to the industry baseline, indicating potential revenue under-reporting.'
                : 'The AI model found no significant deviations in this entity\'s operational ratios compared to industry peers.')}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className={`rounded-lg px-3 py-2 ${biz.Is_Suspicious ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                <strong>Elec. Ratio:</strong> {(biz.ElectricityBill / biz.Reported_Turnover).toFixed(6)}
                {avg && <span className="ml-1 opacity-70">(avg: {avg.avg_electricity_ratio.toFixed(6)})</span>}
              </div>
              <div className={`rounded-lg px-3 py-2 ${biz.Is_Suspicious ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                <strong>Emp. Ratio:</strong> {(biz.Employee_Count / biz.Reported_Turnover).toFixed(6)}
                {avg && <span className="ml-1 opacity-70">(avg: {avg.avg_employee_ratio.toFixed(6)})</span>}
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          {avg && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-1">Operational Ratios vs Industry Baseline ({biz.Industry})</h3>
              <p className="text-xs text-gray-400 mb-5">Lower reported turnover relative to electricity/employee usage suggests under-reporting.</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={comparisonData} margin={{ top: 0, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toExponential(1)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="This Business" fill={biz.Is_Suspicious ? '#ef4444' : '#22c55e'} radius={[6, 6, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="Industry Avg"  fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400">Enter a Business ID above to begin investigation</p>
          <p className="text-xs text-gray-300 mt-1">Data is sourced in real time from the FastAPI backend</p>
        </div>
      )}
    </div>
  )
}
