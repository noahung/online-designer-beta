import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Download, Filter, Search, Calendar, User } from 'lucide-react'

interface Response {
  id: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_postcode: string | null
  submitted_at: string
  forms: {
    name: string
    clients: {
      name: string
    } | null
  } | null
}

export default function Responses() {
  const { user } = useAuth()
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState('')
  const [forms, setForms] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      // Fetch forms for filter dropdown
      const { data: formsData } = await supabase
        .from('forms')
        .select('id, name, clients(name)')
        .eq('user_id', user.id)
      
      setForms(formsData || [])

      // Fetch responses
      const { data: responsesData, error } = await supabase
        .from('responses')
        .select(`
          *,
          forms (
            name,
            clients (
              name
            )
          )
        `)
        .in('form_id', (formsData || []).map(f => f.id))
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setResponses(responsesData || [])
    } catch (error) {
      console.error('Error fetching responses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredResponses = responses.filter(response => {
    const matchesSearch = searchTerm === '' || 
      response.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesForm = selectedForm === '' || response.forms?.name === selectedForm

    return matchesSearch && matchesForm
  })

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Postcode', 'Form', 'Client', 'Submitted At']
    const csvData = filteredResponses.map(response => [
      response.contact_name || '',
      response.contact_email || '',
      response.contact_phone || '',
      response.contact_postcode || '',
      response.forms?.name || '',
      response.forms?.clients?.name || '',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      {response.forms?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {response.forms?.clients?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
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
    </div>
  )
}