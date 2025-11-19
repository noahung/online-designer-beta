import { Search, X, Calendar } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface ResponsesFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onClearFilters: () => void
}

export default function ResponsesFilters({
  searchQuery,
  onSearchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters
}: ResponsesFiltersProps) {
  const { theme } = useTheme()

  const hasActiveFilters = searchQuery || startDate || endDate

  return (
    <div className={`rounded-2xl border p-6 mb-6 backdrop-blur-xl ${
      theme === 'light'
        ? 'bg-white/50 border-gray-200'
        : 'bg-white/10 border-white/20'
    }`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'light' ? 'text-gray-400' : 'text-white/40'
            }`} />
            <input
              type="text"
              placeholder="Search by name, email, or answer..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-white/5 border-white/20 text-white placeholder-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
              } focus:outline-none`}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-gray-400' : 'text-white/40'
            }`} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={`pl-10 pr-4 py-3 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-white/5 border-white/20 text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
              } focus:outline-none`}
              placeholder="Start date"
            />
          </div>

          <span className={theme === 'light' ? 'text-gray-500' : 'text-white/60'}>to</span>

          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-gray-400' : 'text-white/40'
            }`} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={`pl-10 pr-4 py-3 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-white/5 border-white/20 text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
              } focus:outline-none`}
              placeholder="End date"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 ${
              theme === 'light'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className={`mt-4 text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-white/60'
        }`}>
          {searchQuery && <span>Searching for "{searchQuery}" </span>}
          {(startDate || endDate) && (
            <span>
              {startDate && `from ${new Date(startDate).toLocaleDateString()}`}
              {startDate && endDate && ' '}
              {endDate && `to ${new Date(endDate).toLocaleDateString()}`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
