import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Download, Search, Calendar, User, Eye, X, ChevronRight, ExternalLink, FileText, Ruler, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ResponseAnswer {
  id: string
  answer_text: string | null
  selected_option_id: string | null
  // File upload fields
  file_url: string | null
  file_name: string | null
  file_size: number | null
  // Dimension fields
  width: number | null
  height: number | null
  depth: number | null
  units: string | null
  // Opinion scale field
  scale_rating: number | null
  // Frames plan field
  frames_count: number | null
  step_id: string
  form_steps: {
    id: string
    title: string
    question_type: string
    step_order: number
  } | null
  form_options: {
    id: string
    label: string
    image_url: string | null
  } | null
}

interface ResponseFrame {
  id: string
  response_id: string
  step_id: string
  frame_number: number
  image_url: string | null
  location_text: string | null
  measurements_text: string | null
  form_steps: {
    id: string
    title: string
    question_type: string
    step_order: number
  } | null
}

interface Response {
  id: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_postcode: string | null
  preferred_contact: string | null
  project_details: string | null
  submitted_at: string
  forms: {
    id: string
    name: string
    clients: {
      id: string
      name: string
    } | null
  }[] | null
  response_answers?: ResponseAnswer[]
  response_frames?: ResponseFrame[]
}

interface Client {
  name: string
}

export default function Responses() {
  const { user, userType, clientData } = useAuth()
  const navigate = useNavigate()
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [forms, setForms] = useState<{ id: string; name: string }[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const { push } = useToast()

  // Date range filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination state
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate stats
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now)
  monthStart.setDate(now.getDate() - 30)

  const stats = {
    total: responses.length,
    today: responses.filter(r => new Date(r.submitted_at) >= todayStart).length,
    thisWeek: responses.filter(r => new Date(r.submitted_at) >= weekStart).length,
    thisMonth: responses.filter(r => new Date(r.submitted_at) >= monthStart).length
  }

  const totalPages = Math.ceil(responses.length / pageSize)
  const paginatedResponses = responses.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      console.log('Fetching responses data for user:', user.id, 'userType:', userType)
      
      let formsData: any[] = []
      let clientsData: any[] = []
      let responsesData: any[] = []

      if (userType === 'client' && clientData) {
        console.log('Client view - fetching for client:', clientData.id)
        
        // Get forms for this client (same as admin pattern but filtered by client_id)
        const { data: clientFormsData, error: formsError } = await supabase
          .from('forms')
          .select('id, name, client_id')
          .eq('client_id', clientData.id)
          .order('name')
        
        console.log('Client forms data:', clientFormsData)
        console.log('Client forms error:', formsError)
        
        if (formsError) throw formsError
        formsData = clientFormsData || []
        clientsData = [{ name: clientData.name }]

        // Get responses for client's forms (same pattern as admin)
        if (formsData.length > 0) {
          const { data: clientResponsesData, error: responsesError } = await supabase
            .from('responses')
            .select(`
              id,
              contact_name,
              contact_email,
              contact_phone,
              contact_postcode,
              preferred_contact,
              project_details,
              submitted_at,
              form_id
            `)
            .in('form_id', formsData.map(f => f.id))
            .order('submitted_at', { ascending: false })

          console.log('Client responses data:', clientResponsesData)
          console.log('Client responses error:', responsesError)
          
          if (responsesError) throw responsesError
          
          // Enrich responses with form data (same pattern as admin)
          if (clientResponsesData && clientResponsesData.length > 0) {
            const enrichedResponses = await Promise.all(
              clientResponsesData.map(async (response) => {
                const formData = formsData.find(f => f.id === response.form_id)
                return {
                  ...response,
                  forms: formData ? [{
                    id: formData.id,
                    name: formData.name,
                    clients: { name: clientData.name }
                  }] : null
                }
              })
            )
            
            console.log('Enriched client responses:', enrichedResponses)
            responsesData = enrichedResponses
          } else {
            responsesData = clientResponsesData || []
          }
        }
      } else {
        console.log('Admin view - fetching for admin user:', user.id)
        
        // Admin view (existing working code)
        const { data: adminFormsData } = await supabase
          .from('forms')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name')
        
        console.log('Admin forms data:', adminFormsData)
        formsData = adminFormsData || []

        // Fetch clients for filter dropdown
        const { data: adminClientsData } = await supabase
          .from('clients')
          .select('name')
          .eq('user_id', user.id)
          .order('name')

        console.log('Admin clients data:', adminClientsData)
        clientsData = adminClientsData || []

        // Fetch responses with the same working pattern
        const { data: adminResponsesData, error } = await supabase
          .from('responses')
          .select(`
            id,
            contact_name,
            contact_email,
            contact_phone,
            contact_postcode,
            preferred_contact,
            project_details,
            submitted_at,
            form_id
          `)
          .in('form_id', formsData.map(f => f.id))
          .order('submitted_at', { ascending: false })

        console.log('Simple admin responses:', { adminResponsesData, error })

        if (error) throw error
        
        // Manually fetch form and client data for each response
        if (adminResponsesData && adminResponsesData.length > 0) {
          const enrichedResponses = await Promise.all(
            adminResponsesData.map(async (response) => {
              const { data: formData } = await supabase
                .from('forms')
                .select(`
                  id,
                  name,
                  client_id,
                  clients (
                    name
                  )
                `)
                .eq('id', response.form_id)
                .single()

              console.log('Form data for response:', response.id, formData)

              return {
                ...response,
                forms: formData ? [formData] : null
              }
            })
          )
          
          console.log('Enriched responses:', enrichedResponses)
          responsesData = enrichedResponses
        } else {
          responsesData = adminResponsesData || []
        }
      }
      
      console.log('Final data:', { formsData: formsData.length, clientsData: clientsData.length, responsesData: responsesData.length })
      console.log('Sample response data:', responsesData[0])
      
      setForms(formsData)
      setClients(clientsData)
      setResponses(responsesData as unknown as Response[])
    } catch (error) {
      console.error('Error fetching responses:', error)
      push({ type: 'error', message: 'Error loading responses' })
    } finally {
      setLoading(false)
    }
  }

  const filteredResponses = responses.filter(response => {
    const matchesSearch = searchTerm === '' || 
      response.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const formName = response.forms?.[0]?.name
    const matchesForm = selectedForm === '' || formName === selectedForm
    
    const clientName = response.forms?.[0]?.clients?.name
    const matchesClient = selectedClient === '' || clientName === selectedClient

    // Date range filtering
    const submittedDate = new Date(response.submitted_at)
    const matchesStartDate = !startDate || submittedDate >= new Date(startDate)
    const matchesEndDate = !endDate || submittedDate <= new Date(endDate + 'T23:59:59')

    return matchesSearch && matchesForm && matchesClient && matchesStartDate && matchesEndDate
  })

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      push({ type: 'success', message: 'Downloaded successfully' })
    } catch (error) {
      console.error('Error downloading file:', error)
      push({ type: 'error', message: 'Failed to download file' })
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Postcode', 'Form', 'Client', 'Submitted At']
    const csvData = filteredResponses.map(response => [
      response.contact_name || '',
      response.contact_email || '',
      response.contact_phone || '',
      response.contact_postcode || '',
      response.forms?.[0]?.name || '',
      response.forms?.[0]?.clients?.name || '',
      new Date(response.submitted_at).toLocaleDateString()
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `responses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  push({ type: 'success', message: 'CSV export ready' })
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedForm, selectedClient, pageSize])

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-5 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {userType === 'client' ? `${clientData?.name} - Form Responses` : 'Responses'}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {userType === 'client' 
            ? 'View and export your form submissions.' 
            : 'View and export all client form submissions.'
          }
        </p>
      </div>

      {/* Action & Stats summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Compact stats pill summary */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          <span>Total: <strong className="text-zinc-900 dark:text-white font-semibold">{stats.total}</strong></span>
          <span>Today: <strong className="text-zinc-900 dark:text-white font-semibold">{stats.today}</strong></span>
          <span>This Week: <strong className="text-zinc-900 dark:text-white font-semibold">{stats.thisWeek}</strong></span>
          <span>This Month: <strong className="text-zinc-900 dark:text-white font-semibold">{stats.thisMonth}</strong></span>
        </div>
      </div>

      {/* OpenAI Search & Filter Chips Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Search */}
        <div className="relative min-w-[220px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
            placeholder="Search..."
          />
        </div>

        {/* Filter select for Form */}
        <select
          value={selectedForm}
          onChange={(e) => setSelectedForm(e.target.value)}
          className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
        >
          <option value="" className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">All Forms</option>
          {forms.map((form) => (
            <option key={form.id} value={form.name} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">
              {form.name}
            </option>
          ))}
        </select>

        {userType === 'admin' && (
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">All Clients</option>
            {clients.map((client) => (
              <option key={client.name} value={client.name} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">
                {client.name}
              </option>
            ))}
          </select>
        )}

        {/* Active Filter Chip */}
        <button
          type="button"
          className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"
        >
          <span>✓ Active</span>
        </button>

        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1 font-normal">
          {filteredResponses.length} result{filteredResponses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900/60 animate-pulse border border-zinc-200/50 dark:border-zinc-800/40" />
          ))}
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">No responses yet</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {searchTerm || selectedForm 
              ? 'No responses match your current search filters.'
              : 'Responses will appear here when users submit your forms.'
            }
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                <th className="py-2.5 px-3 font-normal">
                  Contact
                </th>
                <th className="py-2.5 px-3 font-normal">
                  Form
                </th>
                <th className="py-2.5 px-3 font-normal">
                  Client
                </th>
                <th className="py-2.5 px-3 font-normal">
                  Submitted
                </th>
                <th className="py-2.5 px-3 text-right font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedResponses.map((response, index) => (
                <tr key={response.id} className="border-b border-zinc-200/70 dark:border-zinc-800/60 hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/70 transition-colors text-xs text-zinc-800 dark:text-zinc-300 group select-none">
                  <td className="py-2.5 px-3">
                    <div>
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-200">
                        {response.contact_name || 'Anonymous'}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {response.contact_email}
                      </div>
                      {response.contact_phone && (
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {response.contact_phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">
                      {response.forms?.[0]?.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-zinc-600 dark:text-zinc-400">
                    {response.forms?.[0]?.clients?.name || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(response.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button 
                      onClick={() => navigate(`/response/${response.id}`)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center pt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center space-x-2">
          <span>Page size:</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value={10} className="bg-white dark:bg-[#18181b]">10</option>
            <option value={20} className="bg-white dark:bg-[#18181b]">20</option>
            <option value={30} className="bg-white dark:bg-[#18181b]">30</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span>Page {currentPage} of {totalPages || 1}</span>
          <button
            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
