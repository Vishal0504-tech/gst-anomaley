import { useEffect, useState, useCallback, useMemo } from 'react'
import { BarChart2 } from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { fetchAllBusinesses } from '../services/api.js'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-800 mb-1 font-mono">{d.id}</p>
      <p className="text-gray-600">Ratio: <strong className="text-gray-900">{Number(d.y).toFixed(6)}</strong></p>
      <p className={d.suspicious ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
        {d.suspicious ? '🚨 Suspicious' : '✅ Normal'}
      </p>
    </div>
  )
}

function RatioScatter({ data, title, avgLine }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-0.5">{title}</h3>
      <p className="text-xs text-gray-400 mb-4">Each dot is one business. Red = suspicious, Green = normal. Dashed line = industry average.</p>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" type="number" name="Index" tick={{ fontSize: 9, fill: '#cbd5e1' }} axisLine={false} tickLine={false} label={{ value: 'Businesses (indexed)', fontSize: 10, fill: '#cbd5e1', position: 'insideBottom', offset: -5 }} />
          <YAxis dataKey="y" type="number" name="Ratio" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toExponential(1)} />
          <Tooltip content={<ScatterTooltip />} />
          {avgLine && <ReferenceLine y={avgLine} stroke="#6366f1" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: 'Avg', fontSize: 9, fill: '#6366f1', position: 'right' }} />}
          <Scatter data={data} shape="circle">
            {data.map((d, i) => (
              <Cell key={i} fill={d.suspicious ? '#ef4444' : '#22c55e'} fillOpacity={0.8} stroke={d.suspicious ? '#dc2626' : '#16a34a'} strokeWidth={0.5} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 justify-end">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Suspicious</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Normal</span>
        <span className="flex items-center gap-1"><span className="w-5 border-t border-dashed border-indigo-400 inline-block" />Industry Avg</span>
      </div>
    </div>
  )
}

export default function Industry() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [selected, setSelected]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchAllBusinesses()
      setBusinesses(data)
      if (data.length) setSelected(data[0].Industry)
    } catch (e) { setError(e.message ?? 'Failed to connect') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const industries = useMemo(() => [...new Set(businesses.map((b) => b.Industry))].sort(), [businesses])

  const sector = useMemo(() => businesses.filter((b) => b.Industry === selected), [businesses, selected])

  const electricData = useMemo(() =>
    sector.map((b, i) => ({
      x: i + 1,
      y: b.Reported_Turnover > 0 ? b.ElectricityBill / b.Reported_Turnover : 0,
      suspicious: b.Is_Suspicious,
      id: b.Business_ID,
    })), [sector])

  const employeeData = useMemo(() =>
    sector.map((b, i) => ({
      x: i + 1,
      y: b.Reported_Turnover > 0 ? b.Employee_Count / b.Reported_Turnover : 0,
      suspicious: b.Is_Suspicious,
      id: b.Business_ID,
    })), [sector])

  const avgElec = electricData.length ? electricData.reduce((s, d) => s + d.y, 0) / electricData.length : 0
  const avgEmp  = employeeData.length ? employeeData.reduce((s, d) => s + d.y, 0) / employeeData.length : 0

  if (loading) return <Spinner message="Loading Industry Data…" />
  if (error)   return <ErrorState error={error} onRetry={load} />

  const suspCount  = sector.filter((b) => b.Is_Suspicious).length
  const totalCount = sector.length

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Controls */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label htmlFor="industry-select" className="block text-xs font-semibold text-gray-600 mb-1.5">
            Select Industry
          </label>
          <div className="relative">
            <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              id="industry-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="input-field pl-9 appearance-none"
            >
              {industries.map((ind) => <option key={ind}>{ind}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-4 text-sm pb-0.5">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">{suspCount}</p>
            <p className="text-xs text-gray-400">Suspicious</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{totalCount - suspCount}</p>
            <p className="text-xs text-gray-400">Normal</p>
          </div>
        </div>
      </div>

      {/* Scatter Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RatioScatter
          data={electricData}
          title={`Electricity-to-Turnover Ratio — ${selected}`}
          avgLine={avgElec}
        />
        <RatioScatter
          data={employeeData}
          title={`Employee-to-Turnover Ratio — ${selected}`}
          avgLine={avgEmp}
        />
      </div>
    </div>
  )
}
