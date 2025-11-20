import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  theme: 'light' | 'dark'
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  theme,
}) => {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-xl transition-all duration-200 ${
          currentPage === 1
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-110'
        } ${
          theme === 'light'
            ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
        }`}
        title="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={`px-3 py-2 ${
                theme === 'light' ? 'text-gray-500' : 'text-white/60'
              }`}
            >
              ...
            </span>
          )
        }

        const pageNum = page as number
        const isActive = pageNum === currentPage

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                : theme === 'light'
                ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:scale-105'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-105'
            }`}
          >
            {pageNum}
          </button>
        )
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-xl transition-all duration-200 ${
          currentPage === totalPages
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-110'
        } ${
          theme === 'light'
            ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
        }`}
        title="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

export { Pagination }
