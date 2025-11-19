import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import {
  getFormResponses,
  deleteResponse,
  getResponseStats,
  searchResponses,
  filterResponsesByDateRange,
  FormResponse,
  ResponseStats as ResponseStatsType
} from '../api/responses'
import ResponsesStats from '../components/responses/ResponsesStats'
import ResponsesFilters from '../components/responses/ResponsesFilters'
import ResponsesTable from '../components/responses/ResponsesTable'
import ResponseDetailsModal from '../components/responses/ResponseDetailsModal'
import ExportButton from '../components/responses/ExportButton'

export default function FormResponses() {
  const { formId } = useParams<{ formId: string }>()
  const { user } = useAuth()
  const { theme } = useTheme()
  const { push } = useToast()
  const navigate = useNavigate()

  const [formName, setFormName] = useState('')
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>([])
  const [stats, setStats] = useState<ResponseStatsType>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (formId && user) {
      fetchFormData()
      fetchResponses()
      fetchStats()
    }
  }, [formId, user])

  useEffect(() => {
    // Apply filters
    let filtered = responses

    // Search filter
    if (searchQuery) {
      filtered = searchResponses(filtered, searchQuery)
    }

    // Date range filter
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined
      filtered = filterResponsesByDateRange(filtered, start, end)
    }

    setFilteredResponses(filtered)
  }, [responses, searchQuery, startDate, endDate])

  const fetchFormData = async () => {
    if (!formId || !user) return

    try {
      const { data, error } = await supabase
        .from('forms')
        .select('name, user_id')
        .eq('id', formId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      if (!data) {
        push({ type: 'error', message: 'Form not found or access denied' })
        navigate('/forms')
        return
      }

      setFormName(data.name)
    } catch (error) {
      console.error('Error fetching form:', error)
      push({ type: 'error', message: 'Failed to load form' })
      navigate('/forms')
    }
  }

  const fetchResponses = async () => {
    if (!formId || !user) return

    setLoading(true)
    try {
      const { data, error } = await getFormResponses(formId, user.id)

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error('Error fetching responses:', error)
      push({ type: 'error', message: 'Failed to load responses' })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!formId || !user) return

    try {
      const { data, error } = await getResponseStats(formId, user.id)

      if (error) throw error
      if (data) setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDeleteResponse = async (responseId: string) => {
    if (!user) return

    try {
      const { error } = await deleteResponse(responseId, user.id)

      if (error) throw error

      push({ type: 'success', message: 'Response deleted successfully' })
      fetchResponses()
      fetchStats()
    } catch (error) {
      console.error('Error deleting response:', error)
      push({ type: 'error', message: 'Failed to delete response' })
    }
  }

  const handleViewDetails = (response: FormResponse) => {
    console.log('Opening response details:', response)
    setSelectedResponse(response)
    setIsModalOpen(true)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
  }

  if (loading && responses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className={`w-12 h-12 animate-spin mx-auto mb-4 ${
            theme === 'light' ? 'text-orange-500' : 'text-orange-400'
          }`} />
          <p className={theme === 'light' ? 'text-gray-600' : 'text-white/70'}>
            Loading responses...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ResponseDetailsModal
        isOpen={isModalOpen}
        response={selectedResponse}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedResponse(null)
        }}
        onDelete={handleDeleteResponse}
      />

      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/forms')}
            className={`flex items-center space-x-2 mb-4 px-4 py-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Forms</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="animate-slide-up">
              <h1 className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                theme === 'light'
                  ? 'from-gray-800 via-orange-600 to-red-600'
                  : 'from-white via-orange-100 to-red-200'
              }`}>
                {formName}
              </h1>
              <p className={`mt-2 text-lg ${
                theme === 'light' ? 'text-gray-600' : 'text-white/70'
              }`}>
                Form Responses
              </p>
            </div>

            <ExportButton
              responses={filteredResponses}
              formName={formName}
            />
          </div>
        </div>

        {/* Stats */}
        <ResponsesStats stats={stats} loading={loading} />

        {/* Filters */}
        <ResponsesFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearFilters={handleClearFilters}
        />

        {/* Table */}
        <ResponsesTable
          responses={filteredResponses}
          onViewDetails={handleViewDetails}
          loading={loading}
        />
      </div>
    </>
  )
}
