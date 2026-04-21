export default function KPICard({ label, value, icon: Icon, iconBg, iconColor, description, trend }) {
  return (
    <div className="card card-hover p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1.5">{description}</p>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-red-600' : 'text-green-600'}`}>
          <span>{trend.up ? '▲' : '▼'}</span>
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  )
}
