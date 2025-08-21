import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Download, Search, Calendar, User, Eye, X, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ResponseAnswer {
  id: string
  answer_text: string | null
  form_steps: {
    title: string
    question_type: string
  }[] | null
  form_options: {
    label: string
  }[] | null
}

interface Response {
  id: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_postcode: string | null
  submitted_at: string
  forms: {
    id: string
    name: string
    clients: {
      name: string
    }[] | null
  }[] | null
  response_answers?: ResponseAnswer[]
}

interface Client {
  name: string
}

export default function Responses() {
  const { user } = useAuth()
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [forms, setForms] = useState<{ id: string; name: string }[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const { push } = useToast()

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      // Fetch forms for filter dropdown
      const { data: formsData } = await supabase
        .from('forms')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')
      
      setForms(formsData || [])

      // Fetch clients for filter dropdown
      const { data: clientsData } = await supabase
        .from('clients')
        .select('name')
        .eq('user_id', user.id)
        .order('name')

      setClients(clientsData || [])

      // Fetch responses
      const { data: responsesData, error } = await supabase
        .from('responses')
        .select(`
          id,
          contact_name,
          contact_email,
          contact_phone,
          contact_postcode,
          submitted_at,
          forms (
            id,
            name,
            clients (
              name
            )
          )
        `)
        .in('form_id', (formsData || []).map(f => f.id))
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setResponses((responsesData || []) as unknown as Response[])
    } catch (error) {
      console.error('Error fetching responses:', error)
      push({ type: 'error', message: 'Error loading responses' })
    } finally {
      setLoading(false)
    }
  }

  const fetchResponseDetails = async (responseId: string) => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select(`
          id,
          contact_name,
          contact_email,
          contact_phone,
          contact_postcode,
          submitted_at,
          forms (
            id,
            name,
            clients (
              name
            )
          ),
          response_answers (
            id,
            answer_text,
            form_steps (
              title,
              question_type
            ),
            form_options (
              label
            )
          )
        `)
        .eq('id', responseId)
        .single()

      if (error) throw error

      setSelectedResponse(data as unknown as Response)
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
    
    const clientName = response.forms?.[0]?.clients?.[0]?.name
    const matchesClient = selectedClient === '' || clientName === selectedClient

    return matchesSearch && matchesForm && matchesClient
  })

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Postcode', 'Form', 'Client', 'Submitted At']
    const csvData = filteredResponses.map(response => [
      response.contact_name || '',
      response.contact_email || '',
      response.contact_phone || '',
      response.contact_postcode || '',
      response.forms?.[0]?.name || '',
      response.forms?.[0]?.clients?.[0]?.name || '',
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

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-orange-100 to-red-200 bg-clip-text text-transparent">Responses</h1>
          <p className="text-white/70 mt-2 text-lg">View and export form submissions</p>
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

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8 animate-fade-in" style={{animationDelay: '0.3s'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                placeholder="Search by name or email..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Form
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
            >
              <option value="" className="bg-slate-800 text-white">All Forms</option>
              {forms.map((form) => (
                <option key={form.id} value={form.name} className="bg-slate-800 text-white">
                  {form.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
            >
              <option value="" className="bg-slate-800 text-white">All Clients</option>
              {clients.map((client) => (
                <option key={client.name} value={client.name} className="bg-slate-800 text-white">
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <span className="text-sm text-white/60 px-3 py-3 bg-white/5 rounded-xl border border-white/10">
              {filteredResponses.length} of {responses.length} responses
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/20 rounded w-48"></div>
                    <div className="h-3 bg-white/20 rounded w-32"></div>
                  </div>
                  <div className="h-3 bg-white/20 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No responses yet</h3>
          <p className="text-white/70">
            {searchTerm || selectedForm 
              ? 'No responses match your current filters'
              : 'Responses will appear here when users submit your forms'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Form
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Submitted
                  </th>
                  <th className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredResponses.map((response, index) => (
                  <tr key={response.id} className="hover:bg-white/5 transition-all duration-200 group animate-slide-up" style={{animationDelay: `${0.1 * index}s`}}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {response.contact_name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-white/70">
                          {response.contact_email}
                        </div>
                        {response.contact_phone && (
                          <div className="text-sm text-white/60">
                            {response.contact_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border border-blue-400/30">
                        {response.forms?.[0]?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/80">
                      {response.forms?.[0]?.clients?.[0]?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-white/50" />
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

      {/* Response Details Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Response Details</h2>
                <p className="text-sm text-white/70 mt-1">
                  Submitted {new Date(selectedResponse.submitted_at).toLocaleDateString()} at{' '}
                  {new Date(selectedResponse.submitted_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Contact Information */}
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
                    <p className="text-white">{selectedResponse.contact_name || 'Not provided'}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                    <p className="text-white">{selectedResponse.contact_email || 'Not provided'}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <label className="block text-sm font-medium text-white/70 mb-1">Phone</label>
                    <p className="text-white">{selectedResponse.contact_phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <label className="block text-sm font-medium text-white/70 mb-1">Postcode</label>
                    <p className="text-white">{selectedResponse.contact_postcode || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Form Information */}
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Form Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-400/30">
                    <label className="block text-sm font-medium text-blue-200 mb-1">Form Name</label>
                    <p className="text-white font-medium">{selectedResponse.forms?.[0]?.name}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                    <label className="block text-sm font-medium text-green-200 mb-1">Client</label>
                    <p className="text-white font-medium">{selectedResponse.forms?.[0]?.clients?.[0]?.name || 'No client assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Response Answers */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Response Answers</h3>
                {selectedResponse.response_answers && selectedResponse.response_answers.length > 0 ? (
                  <div className="space-y-6">
                    {selectedResponse.response_answers.map((answer, index) => (
                      <div key={answer.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-2">
                              {answer.form_steps?.[0]?.title || `Question ${index + 1}`}
                            </h4>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-400/30">
                              {answer.form_steps?.[0]?.question_type || 'Unknown'}
                            </span>
                          </div>
                          <span className="text-sm text-white/50 bg-white/10 px-2 py-1 rounded-lg">#{index + 1}</span>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-white/70 mb-2">Answer</label>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-h-[60px] border border-white/10">
                            {answer.answer_text ? (
                              <p className="text-white whitespace-pre-wrap">{answer.answer_text}</p>
                            ) : answer.form_options?.[0]?.label ? (
                              <p className="text-white font-medium">{answer.form_options[0].label}</p>
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