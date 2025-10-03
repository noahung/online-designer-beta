import { useState, useEffect } from 'react'
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
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
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

  const fetchResponseDetails = async (responseId: string) => {
    try {
      // First, get the response with form_id
      const { data: responseData, error: responseError } = await supabase
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
          form_id,
          response_answers (
            id,
            answer_text,
            selected_option_id,
            file_url,
            file_name,
            file_size,
            width,
            height,
            depth,
            units,
            scale_rating,
            frames_count,
            step_id,
            form_steps!step_id (
              id,
              title,
              question_type,
              step_order
            )
          )
        `)
        .eq('id', responseId)
        .single()

      if (responseError) throw responseError

      // Then get the form with client data
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select(`
          id,
          name,
          clients (
            name
          )
        `)
        .eq('id', responseData.form_id)
        .single()

      if (formError) throw formError

  // Combine the base response + form
  const combinedData: any = {
        ...responseData,
        forms: [formData]
      }

      console.log('Response details data:', combinedData)
      console.log('Forms array:', combinedData.forms)
      console.log('First form:', combinedData.forms?.[0])
      console.log('Clients:', combinedData.forms?.[0]?.clients)

      // Fetch form options for answers that have selected_option_id
      if (combinedData.response_answers) {
        const optionIds = combinedData.response_answers
          .map((answer: any) => answer.selected_option_id)
          .filter(Boolean)

        let optionsMap = new Map()
        
        if (optionIds.length > 0) {
          const { data: optionsData, error: optionsError } = await supabase
            .from('form_options')
            .select('id, label, image_url')
            .in('id', optionIds)

          if (optionsError) throw optionsError

          optionsData?.forEach(option => {
            optionsMap.set(option.id, option)
          })
        }

        // Attach form_options to response_answers
        combinedData.response_answers = combinedData.response_answers.map((answer: any) => ({
          ...answer,
          form_options: answer.selected_option_id ? optionsMap.get(answer.selected_option_id) : null
        }))
      }

      // Sort answers by step order
      if (combinedData.response_answers) {
        combinedData.response_answers.sort((a: any, b: any) => {
          const aOrder = a.form_steps?.step_order || 0
          const bOrder = b.form_steps?.step_order || 0
          return aOrder - bOrder
        })
      }

      // Fetch frames for frames_plan steps
      const { data: framesData, error: framesError } = await supabase
        .from('response_frames')
        .select(`
          id,
          response_id,
          step_id,
          frame_number,
          image_url,
          location_text,
          measurements_text,
          form_steps!step_id (
            id,
            title,
            question_type,
            step_order
          )
        `)
        .eq('response_id', responseId)
        .order('step_id')
        .order('frame_number', { ascending: true })

      if (framesError) {
        console.error('Error fetching response_frames:', framesError)
      } else {
        combinedData.response_frames = framesData || []
      }

      setSelectedResponse(combinedData as unknown as Response)
    } catch (error) {
      console.error('Error fetching response details:', error)
      push({ type: 'error', message: 'Error loading response details' })
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
                        onClick={() => fetchResponseDetails(response.id)}
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

      {/* Response Details Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 z-50 animate-fade-in pt-10">
          <div className="bg-white/95 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/20 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">Response Details</h2>
                <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
                  Submitted {new Date(selectedResponse.submitted_at).toLocaleDateString()} at{' '}
                  {new Date(selectedResponse.submitted_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Contact Information */}
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-gray-600 dark:text-white/70 mb-1">Name</label>
                    <p className="text-gray-900 dark:text-white">{selectedResponse.contact_name || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-gray-600 dark:text-white/70 mb-1">Email</label>
                    <p className="text-gray-900 dark:text-white">{selectedResponse.contact_email || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-gray-600 dark:text-white/70 mb-1">Phone</label>
                    <p className="text-gray-900 dark:text-white">{selectedResponse.contact_phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-gray-600 dark:text-white/70 mb-1">Postcode</label>
                    <p className="text-gray-900 dark:text-white">{selectedResponse.contact_postcode || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-gray-600 dark:text-white/70 mb-1">Preferred Contact</label>
                    <p className="text-gray-900 dark:text-white">{selectedResponse.preferred_contact || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-gray-600 dark:text-white/70 mb-1">Project Details</label>
                    <p className="text-gray-900 dark:text-white">{selectedResponse.project_details || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Form Information */}
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Form Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-xl p-4 border border-blue-200 dark:border-blue-400/30">
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Form Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedResponse.forms?.[0]?.name}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20 rounded-xl p-4 border border-green-200 dark:border-green-400/30">
                    <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">Client</label>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedResponse.forms?.[0]?.clients?.name || 'No client assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Response Answers */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Response Answers</h3>
                {selectedResponse.response_answers && selectedResponse.response_answers.length > 0 ? (
                  <div className="space-y-6">
                    {selectedResponse.response_answers.map((answer, index) => (
                      <div key={answer.id} className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              {answer.form_steps?.title || `Question ${index + 1}`}
                            </h4>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-400/30">
                              {answer.form_steps?.question_type || 'Unknown'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg">#{index + 1}</span>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-600 dark:text-white/70 mb-2">Answer</label>
                          <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            {/* Handle different question types */}
                            {answer.form_steps?.question_type === 'dimensions' ? (
                              /* Dimensions Display */
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Ruler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-gray-900 dark:text-white font-medium">Dimensions</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                    <label className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wider">Width</label>
                                    <p className="text-gray-900 dark:text-white font-medium">{answer.width || 0} {answer.units || 'mm'}</p>
                                  </div>
                                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                    <label className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wider">Height</label>
                                    <p className="text-gray-900 dark:text-white font-medium">{answer.height || 0} {answer.units || 'mm'}</p>
                                  </div>
                                  {answer.depth && (
                                    <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                      <label className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wider">Depth</label>
                                      <p className="text-gray-900 dark:text-white font-medium">{answer.depth} {answer.units || 'mm'}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-white/50 mt-2">
                                  Type: {answer.depth ? '3D' : '2D'} • Units: {answer.units || 'mm'}
                                </div>
                              </div>
                            ) : answer.form_steps?.question_type === 'opinion_scale' ? (
                              /* Opinion Scale Display */
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="text-gray-900 dark:text-white font-medium">Opinion Scale</span>
                                </div>
                                <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                      {answer.scale_rating || 'Not rated'}
                                    </div>
                                    {answer.scale_rating && (
                                      <div className="flex justify-center">
                                        {/* Show stars if it's a star rating (1-5) or numbers if it's number scale */}
                                        {answer.scale_rating <= 5 ? (
                                          <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <span
                                                key={star}
                                                className={`text-xl ${
                                                  star <= answer.scale_rating! ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-600'
                                                }`}
                                              >
                                                ⭐
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-gray-600 dark:text-white/70">
                                            Number scale rating: {answer.scale_rating}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : answer.form_steps?.question_type === 'file_upload' ? (
                              /* File Upload Display */
                              answer.file_url || answer.file_name || (answer.answer_text && answer.answer_text.includes('.')) ? (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <FileText className="w-4 h-4 text-green-400" />
                                    <span className="text-white font-medium">File Upload</span>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <FileText className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-white font-medium truncate" title={answer.file_name || answer.answer_text || 'Uploaded file'}>
                                            {answer.file_name || answer.answer_text || 'Uploaded file'}
                                          </p>
                                          <div className="flex items-center space-x-2 text-xs text-white/60">
                                            {answer.file_size && (
                                              <span>{Math.round(answer.file_size / 1024)} KB</span>
                                            )}
                                            {answer.file_url ? (
                                              <span className="text-green-400">✓ Available for download</span>
                                            ) : (
                                              <span className="text-yellow-400">⚠ File reference only</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2 flex-shrink-0">
                                        {answer.file_url ? (
                                          <>
                                            <button
                                              onClick={() => window.open(answer.file_url!, '_blank')}
                                              className="inline-flex items-center px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg text-sm transition-colors border border-blue-400/30 hover:scale-105"
                                              title="View file in new tab"
                                            >
                                              <ExternalLink className="w-4 h-4 mr-1" />
                                              View
                                            </button>
                                            <button
                                              onClick={() => {
                                                const link = document.createElement('a')
                                                link.href = answer.file_url!
                                                link.download = answer.file_name || answer.answer_text || 'download'
                                                link.target = '_blank'
                                                document.body.appendChild(link)
                                                link.click()
                                                document.body.removeChild(link)
                                              }}
                                              className="inline-flex items-center px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg text-sm transition-colors border border-green-400/30 hover:scale-105"
                                              title="Download file"
                                            >
                                              <Download className="w-4 h-4 mr-1" />
                                              Download
                                            </button>
                                          </>
                                        ) : (
                                          <div className="text-xs text-yellow-200 bg-yellow-500/20 px-3 py-2 rounded-lg border border-yellow-400/30">
                                            File uploaded but URL not available
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-red-500/10 rounded-lg p-3 border border-red-400/20">
                                  <p className="text-red-200 text-sm">No file uploaded</p>
                                </div>
                              )
                            ) : answer.form_steps?.question_type === 'text_input' && answer.answer_text ? (
                              /* Text Input Answer */
                              <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{answer.answer_text}</p>
                              </div>
                            ) : answer.form_steps?.question_type === 'multiple_choice' && answer.form_options?.label ? (
                              /* Multiple Choice Answer */
                              <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <p className="text-gray-900 dark:text-white font-medium">{answer.form_options?.label}</p>
                                </div>
                              </div>
                            ) : answer.form_steps?.question_type === 'image_selection' && answer.form_options?.label ? (
                              /* Image Selection Answer */
                              <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                <div className="space-y-3">
                                  {answer.form_options?.image_url && (
                                    <div className="flex justify-center">
                                      <img 
                                        src={answer.form_options.image_url} 
                                        alt={answer.form_options.label}
                                        className="max-w-32 max-h-32 rounded-lg object-cover border border-gray-200 dark:border-white/20"
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <p className="text-gray-900 dark:text-white font-medium">{answer.form_options?.label}</p>
                                  </div>
                                </div>
                              </div>
                            ) : answer.answer_text ? (
                              /* Fallback Text Answer */
                              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                <p className="text-white whitespace-pre-wrap">{answer.answer_text}</p>
                              </div>
                            ) : answer.form_steps?.question_type === 'frames_plan' ? (
                              (() => {
                                const framesForStep = (selectedResponse.response_frames || []).filter(fr => fr.step_id === (answer.step_id || answer.form_steps?.id))
                                const requestedCount = answer.frames_count
                                if (framesForStep.length === 0 && !requestedCount) {
                                  return (
                                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20 text-blue-200 text-sm">No frames captured</div>
                                  )
                                }
                                return (
                                  <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
                                    {requestedCount && (
                                      <div className="text-blue-100 text-sm mb-2">Requested: {requestedCount} frame{requestedCount > 1 ? 's' : ''}</div>
                                    )}
                                    {framesForStep.length > 0 && (
                                      <>
                                        <div className="text-blue-100 text-sm mb-2">{framesForStep.length} frame{framesForStep.length > 1 ? 's' : ''} captured</div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                          {framesForStep.map(fr => (
                                            <div key={fr.id} className="bg-white/5 rounded border border-white/10 p-2">
                                              {fr.image_url ? (
                                                <img src={fr.image_url} alt={`Frame ${fr.frame_number}`} className="w-full h-24 object-cover rounded" />
                                              ) : (
                                                <div className="w-full h-24 flex items-center justify-center text-xs text-white/60 bg-white/5 rounded">No image</div>
                                              )}
                                              <div className="mt-2 text-xs text-white/80">
                                                <div><span className="font-medium">#{fr.frame_number}</span> {fr.location_text || ''}</div>
                                                {fr.measurements_text && <div className="text-white/60">{fr.measurements_text}</div>}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )
                              })()
                            ) : (
                              <p className="text-white/50 italic">No answer provided</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChevronRight className="w-8 h-8 text-white/60" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">No detailed answers available</h4>
                    <p className="text-white/70">This response doesn't contain detailed answer data.</p>
                  </div>
                )}
              </div>

              {/* Frames Plan Details */}
              {selectedResponse.response_frames && selectedResponse.response_frames.length > 0 && (
                <div className="px-6 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frames Plan</h3>
                  {(() => {
                    const frames = selectedResponse.response_frames as ResponseFrame[]
                    const grouped = frames.reduce((acc: Record<string, ResponseFrame[]>, fr) => {
                      const key = fr.step_id
                      if (!acc[key]) acc[key] = []
                      acc[key].push(fr)
                      return acc
                    }, {})
                    const stepIds = Object.keys(grouped)
                    return (
                      <div className="space-y-6">
                        {stepIds.map((stepId) => {
                          const stepFrames = grouped[stepId].sort((a, b) => (a.frame_number || 0) - (b.frame_number || 0))
                          const stepTitle = stepFrames[0]?.form_steps?.title || 'Frames'
                          return (
                            <div key={stepId} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">{stepTitle}</h4>
                                <span className="text-xs text-gray-500 dark:text-white/60">{stepFrames.length} frame{stepFrames.length > 1 ? 's' : ''}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stepFrames.map((fr) => (
                                  <div key={fr.id} className="bg-white dark:bg-white/10 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Frame {fr.frame_number}</div>
                                    {fr.image_url && (
                                      <div className="mb-3">
                                        <img src={fr.image_url} alt={`Frame ${fr.frame_number}`} className="max-h-40 rounded border border-gray-200 dark:border-white/10 object-cover" />
                                      </div>
                                    )}
                                    <div className="text-sm text-gray-700 dark:text-white/70">
                                      <div className="mb-1"><span className="font-medium">Location:</span> {fr.location_text || '—'}</div>
                                      <div><span className="font-medium">Measurements:</span> {fr.measurements_text || '—'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-white/10 bg-white/5 flex-shrink-0">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-6 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}