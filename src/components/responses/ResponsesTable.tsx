import { useState } from 'react'
import { ChevronUp, ChevronDown, Eye } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { FormResponse } from '../../api/responses'

interface ResponsesTableProps {
  responses: FormResponse[]
  onViewDetails: (response: FormResponse) => void
  loading?: boolean
}

export default function ResponsesTable({ responses, onViewDetails, loading = false }: ResponsesTableProps) {
  const { theme } = useTheme()
  const [sortField, setSortField] = useState<'submitted_at' | 'name'>('submitted_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Sorting logic
  const sortedResponses = [...responses].sort((a, b) => {
    if (sortField === 'submitted_at') {
      const dateA = new Date(a.submitted_at).getTime()
      const dateB = new Date(b.submitted_at).getTime()
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
    } else {
      const nameA = a.contact_name || ''
      const nameB = b.contact_name || ''
      return sortDirection === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedResponses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedResponses = sortedResponses.slice(startIndex, endIndex)

  const handleSort = (field: 'submitted_at' | 'name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: 'submitted_at' | 'name' }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  if (loading) {
    return (
      <div className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${
        theme === 'light'
          ? 'bg-white/50 border-gray-200'
          : 'bg-white/10 border-white/20'
      }`}>
        <div className="p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-16 rounded-lg animate-pulse ${
              theme === 'light' ? 'bg-gray-200' : 'bg-white/10'
            }`}></div>
          ))}
        </div>
      </div>
    )
  }

  if (responses.length === 0) {
    return (
      <div className={`rounded-2xl border p-12 text-center backdrop-blur-xl ${
        theme === 'light'
          ? 'bg-white/50 border-gray-200'
          : 'bg-white/10 border-white/20'
      }`}>
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye className={`w-8 h-8 ${
            theme === 'light' ? 'text-blue-600' : 'text-blue-300'
          }`} />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          No responses yet
        </h3>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-white/70'}>
          Responses will appear here once someone submits this form
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${
        theme === 'light'
          ? 'bg-white/50 border-gray-200'
          : 'bg-white/10 border-white/20'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}>
              <tr>
                <th
                  className={`px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-black/5 transition-colors ${
                    theme === 'light' ? 'text-gray-700' : 'text-white/90'
                  }`}
                  onClick={() => handleSort('submitted_at')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Submitted</span>
                    <SortIcon field="submitted_at" />
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-black/5 transition-colors ${
                    theme === 'light' ? 'text-gray-700' : 'text-white/90'
                  }`}
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Contact Name</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>
                  Email
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>
                  Phone
                </th>
                <th className={`px-6 py-4 text-right text-sm font-semibold ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedResponses.map((response) => (
                <tr
                  key={response.id}
                  className={`border-t cursor-pointer transition-colors ${
                    theme === 'light'
                      ? 'border-gray-200 hover:bg-gray-50'
                      : 'border-white/10 hover:bg-white/5'
                  }`}
                  onClick={() => onViewDetails(response)}
                >
                  <td className={`px-6 py-4 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    <div className="font-medium">
                      {new Date(response.submitted_at).toLocaleDateString()}
                    </div>
                    <div className={`text-sm ${
                      theme === 'light' ? 'text-gray-500' : 'text-white/60'
                    }`}>
                      {new Date(response.submitted_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {response.contact_name || '-'}
                  </td>
                  <td className={`px-6 py-4 ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/80'
                  }`}>
                    {response.contact_email || '-'}
                  </td>
                  <td className={`px-6 py-4 ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/80'
                  }`}>
                    {response.contact_phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(response)
                      }}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105 ${
                        theme === 'light'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-white/70'
          }`}>
            Show
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-900'
                : 'bg-white/10 border-white/20 text-white'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-white/70'
          }`}>
            of {responses.length} responses
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'light'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Previous
          </button>

          <span className={`px-4 text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-white/70'
          }`}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'light'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
