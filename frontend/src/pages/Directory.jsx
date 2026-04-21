import { useEffect, useState, useCallback, useMemo } from 'react'
import { Search, Filter, AlertTriangle } from 'lucide-react'
import { fetchAllBusinesses } from '../services/api.js'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'
import RiskBar from '../components/RiskBar.jsx'

export default function Directory() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [industry, setIndustry]     = useState('All')

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

  const industries = useMemo(() => ['All', ...new Set(businesses.map((b) => b.Industry))], [businesses])

  const filtered = useMemo(() =>
    businesses
      .filter((b) => {
        const matchId  = b.Business_ID.toLowerCase().includes(search.toLowerCase())
        const matchInd = industry === 'All' || b.Industry === industry
        return matchId && matchInd
      })
      .sort((a, b) => b.Risk_Score - a.Risk_Score),
    [businesses, search, industry]
  )

  if (loading) return <Spinner message="Loading Suspicious Directory…" />
  if (error)   return <ErrorState error={error} onRetry={load} />

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Summary banner */}
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-800">{businesses.length} business{businesses.length !== 1 ? 'es' : ''} flagged as suspicious</p>
          <p className="text-xs text-red-500 mt-0.5">All entries below have been identified as high-risk by the AI anomaly detection model.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="search-business-id"
            type="text"
            placeholder="Search by Business ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            id="filter-industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="input-field pl-9 appearance-none"
          >
            {industries.map((ind) => <option key={ind}>{ind}</option>)}
          </select>
        </div>
        <div className="flex items-center text-xs text-gray-400 whitespace-nowrap px-1">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Business ID', 'City', 'Industry', 'Reported Turnover', 'Electricity Bill', 'Employees', 'Risk Score'].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    No businesses match your search criteria.
                  </td>
                </tr>
              ) : filtered.map((b) => (
                <tr key={b.Business_ID} className="hover:bg-red-50/30 transition-colors group">
                  <td className="table-td font-mono text-xs font-semibold text-gray-900">{b.Business_ID}</td>
                  <td className="table-td text-gray-600">{b.City}</td>
                  <td className="table-td">
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{b.Industry}</span>
                  </td>
                  <td className="table-td tabular-nums text-gray-700">₹{b.Reported_Turnover.toLocaleString()}</td>
                  <td className="table-td tabular-nums text-gray-700">₹{b.ElectricityBill.toLocaleString()}</td>
                  <td className="table-td tabular-nums text-gray-700">{b.Employee_Count}</td>
                  <td className="table-td w-44"><RiskBar score={b.Risk_Score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
