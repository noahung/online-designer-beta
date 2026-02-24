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
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-red-600 dark:from-white dark:via-orange-100 dark:to-red-200 bg-clip-text text-transparent">
            {userType === 'client' ? `${clientData?.name} - Form Responses` : 'Responses'}
          </h1>
          <p className="text-gray-600 dark:text-white/70 mt-2 text-lg">
            {userType === 'client' 
              ? 'View and export your form submissions' 
              : 'View and export form submissions'
            }
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 animate-slide-up"
          style={{animationDelay: '0.2s'}}
        >
          <Download className="w-5 h-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Responses</h3>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Today</h3>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.today}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">This Week</h3>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.thisWeek}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">This Month</h3>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 p-6 mb-8 shadow-lg animate-fade-in" style={{animationDelay: '0.3s'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/40 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-white/15"
                placeholder="Search by name or email..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
              Form
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-3 bg-white/90 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-white/15"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">All Forms</option>
              {forms.map((form) => (
                <option key={form.id} value={form.name} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                  {form.name}
                </option>
              ))}
            </select>
          </div>

          {userType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-3 bg-white/90 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-white/15"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">All Clients</option>
                {clients.map((client) => (
                  <option key={client.name} value={client.name} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-3 bg-white/90 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-white/15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-3 bg-white/90 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-white/15"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
          <span className="text-sm text-gray-600 dark:text-white/60 px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            {filteredResponses.length} of {responses.length} responses
          </span>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700 dark:text-white/90">Page size:</label>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-white/15 shadow-lg appearance-none"
              style={{ minWidth: 70 }}
            >
              <option value={10} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">10</option>
              <option value={20} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">20</option>
              <option value={30} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">30</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 overflow-hidden shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-white/20 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 dark:bg-white/20 rounded w-32"></div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-white/20 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 p-12 text-center shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-500 dark:text-white/60" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No responses yet</h3>
          <p className="text-gray-600 dark:text-white/70">
            {searchTerm || selectedForm 
              ? 'No responses match your current filters'
              : 'Responses will appear here when users submit your forms'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 overflow-hidden shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white/90">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white/90">
                    Form
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white/90">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white/90">
                    Submitted
                  </th>
                  <th className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {paginatedResponses.map((response, index) => (
                  <tr key={response.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 group animate-slide-up" style={{animationDelay: `${0.1 * index}s`}}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {response.contact_name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-white/70">
                          {response.contact_email}
                        </div>
                        {response.contact_phone && (
                          <div className="text-sm text-gray-500 dark:text-white/60">
                            {response.contact_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-400/30">
                        {response.forms?.[0]?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-white/80">
                      {response.forms?.[0]?.clients?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-white/50" />
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/response/${response.id}`)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-end items-center mt-4 space-x-2">
        <button
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white font-medium shadow-lg transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/20 disabled:opacity-50"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="text-sm text-gray-700 dark:text-white/80">Page {currentPage} of {totalPages}</span>
        <button
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white font-medium shadow-lg transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/20 disabled:opacity-50"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </div>
  )
}
