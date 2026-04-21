import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertTriangle,
  Search,
  BarChart2,
  ClipboardList,
  FileText,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react'

const links = [
  { to: '/',              label: 'Global Dashboard',    icon: LayoutDashboard, color: 'text-blue-600' },
  { to: '/directory',     label: 'Suspicious Directory',icon: AlertTriangle,   color: 'text-red-500' },
  { to: '/investigation', label: 'Business Drill-Down', icon: Search,          color: 'text-purple-600' },
  { to: '/industry',      label: 'Industry Ratios',     icon: BarChart2,       color: 'text-teal-600' },
  { to: '/priority',      label: 'Audit Priority Queue',icon: ClipboardList,   color: 'text-orange-600' },
  { to: '/reports',       label: 'Reports & Analytics', icon: FileText,        color: 'text-indigo-600' },
]

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-30 shadow-sm transition-transform duration-300 transform ${
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* Logo & Close Button */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">GST Anomaly</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">Shield AI</p>
          </div>
        </div>
        <button 
          onClick={() => setOpen(false)}
          className="p-1 px-1.5 rounded-lg text-gray-400 hover:bg-gray-50 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">Navigation</p>
        {links.map(({ to, label, icon: Icon, color }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : color} opacity-80`} strokeWidth={2} />
              <span className="flex-1 truncate">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-green-50 border border-green-100">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-700">API Connected</p>
            <p className="text-xs text-green-600 opacity-70">localhost:8000</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
