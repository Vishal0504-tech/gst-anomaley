import { useLocation } from 'react-router-dom'
import { Bell, RefreshCw, Menu } from 'lucide-react'

const titles = {
  '/':              { title: 'Global Risk Dashboard',     subtitle: 'Real-time AI anomaly detection overview' },
  '/directory':     { title: 'Suspicious Directory',      subtitle: 'All businesses flagged as high-risk by the AI' },
  '/investigation': { title: 'Business Drill-Down',       subtitle: 'Deep-dive investigation for a specific entity' },
  '/industry':      { title: 'Industry Ratios',           subtitle: 'Sector-wise electricity & employee ratio scatter analysis' },
  '/priority':      { title: 'Audit Priority Queue',      subtitle: 'Ranked audit targets sorted by estimated revenue impact' },
  '/reports':       { title: 'Reports & Analytics',       subtitle: 'Macro trends, city heatmaps, and data exports' },
}

export default function Header({ onRefresh, loading, onMenuClick }) {
  const { pathname } = useLocation()
  const { title, subtitle } = titles[pathname] ?? { title: 'Dashboard', subtitle: '' }

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-20 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-50 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[14px] sm:text-[15px] font-bold text-gray-900 leading-none">{title}</h1>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-none line-clamp-1">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live Monitoring
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors" title="Notifications">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
