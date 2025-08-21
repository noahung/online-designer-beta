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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Responses</h1>
          <p className="text-slate-600 mt-2">View and export form submissions</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by name or email..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Form
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Forms</option>
              {forms.map((form) => (
                <option key={form.id} value={form.name}>
                  {form.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.name} value={client.name}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <span className="text-sm text-slate-600">
              {filteredResponses.length} of {responses.length} responses
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                    <div className="h-3 bg-slate-200 rounded w-32"></div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No responses yet</h3>
          <p className="text-slate-600">
            {searchTerm || selectedForm 
              ? 'No responses match your current filters'
              : 'Responses will appear here when users submit your forms'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {response.contact_name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {response.contact_email}
                        </div>
                        {response.contact_phone && (
                          <div className="text-sm text-slate-500">
                            {response.contact_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {response.forms?.[0]?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {response.forms?.[0]?.clients?.[0]?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => fetchResponseDetails(response.id)}
                        className="flex items-center text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Response Details</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Submitted {new Date(selectedResponse.submitted_at).toLocaleDateString()} at{' '}
                  {new Date(selectedResponse.submitted_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Contact Information */}
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <p className="text-slate-900">{selectedResponse.contact_name || 'Not provided'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <p className="text-slate-900">{selectedResponse.contact_email || 'Not provided'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <p className="text-slate-900">{selectedResponse.contact_phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                    <p className="text-slate-900">{selectedResponse.contact_postcode || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Form Information */}
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Form Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-700 mb-1">Form Name</label>
                    <p className="text-blue-900 font-medium">{selectedResponse.forms?.[0]?.name}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-green-700 mb-1">Client</label>
                    <p className="text-green-900 font-medium">{selectedResponse.forms?.[0]?.clients?.[0]?.name || 'No client assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Response Answers */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-6">Response Answers</h3>
                {selectedResponse.response_answers && selectedResponse.response_answers.length > 0 ? (
                  <div className="space-y-6">
                    {selectedResponse.response_answers.map((answer, index) => (
                      <div key={answer.id} className="border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 mb-2">
                              {answer.form_steps?.[0]?.title || `Question ${index + 1}`}
                            </h4>
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                              {answer.form_steps?.[0]?.question_type || 'Unknown'}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">#{index + 1}</span>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Answer</label>
                          <div className="bg-slate-50 rounded-lg p-4 min-h-[60px]">
                            {answer.answer_text ? (
                              <p className="text-slate-900 whitespace-pre-wrap">{answer.answer_text}</p>
                            ) : answer.form_options?.[0]?.label ? (
                              <p className="text-slate-900 font-medium">{answer.form_options[0].label}</p>
                            ) : (
                              <p className="text-slate-400 italic">No answer provided</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChevronRight className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">No detailed answers available</h4>
                    <p className="text-slate-600">This response doesn't contain detailed answer data.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
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