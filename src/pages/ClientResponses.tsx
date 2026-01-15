import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { 
  Download,
  Eye,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  BarChart3
} from 'lucide-react'

interface Response {
  id: string
  form_id: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_postcode: string | null
  submitted_at: string
  form: {
    name: string
    client: {
      name: string
    }
  }
}

export default function ClientResponses() {
  const { userProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (userProfile?.client_id) {
      fetchResponses()
    }
  }, [userProfile])

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select(`
          id,
          form_id,
          contact_name,
          contact_email,
          contact_phone,
          contact_postcode,
          submitted_at,
          form:forms (
            name,
            client:clients (
              name
            )
          )
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      
      setResponses(data || [])
    } catch (error) {
      console.error('Error fetching responses:', error)
      showToast('Failed to load responses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    setExporting(true)
    try {
      // Create CSV headers
      const headers = [
        'Submission Date',
        'Form Name', 
        'Contact Name',
        'Contact Email',
        'Contact Phone',
        'Contact Postcode'
      ]

      // Add unique question titles as headers
      const allQuestions = new Set<string>()
      for (const response of responses) {
        const { data } = await supabase
          .from('response_answers')
          .select(`
            step:form_steps (
              title
            )
          `)
          .eq('response_id', response.id)
        
        data?.forEach(answer => {
          if (answer.step?.title) {
            allQuestions.add(answer.step.title)
          }
        })
      }

      headers.push(...Array.from(allQuestions))

      // Create CSV rows
      const csvRows = [headers.join(',')]
      
      for (const response of responses) {
        const row = [
          new Date(response.submitted_at).toLocaleDateString(),
          response.form.name,
          response.contact_name || '',
          response.contact_email || '',
          response.contact_phone || '',
          response.contact_postcode || ''
        ]

        // Get answers for this response
        const { data: answers } = await supabase
          .from('response_answers')
          .select(`
            answer_text,
            step:form_steps (
              title
            ),
            selected_option:form_options (
              label
            )
          `)
          .eq('response_id', response.id)

        // Map answers to questions
        const answerMap = new Map()
        answers?.forEach(answer => {
          if (answer.step?.title) {
            const value = answer.answer_text || answer.selected_option?.label || ''
            answerMap.set(answer.step.title, value)
          }
        })

        // Add answer values in same order as headers
        Array.from(allQuestions).forEach(question => {
          row.push(answerMap.get(question) || '')
        })

        csvRows.push(row.map(value => `"${value}"`).join(','))
      }

      // Download CSV
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `responses-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      showToast('Responses exported successfully', 'success')
    } catch (error) {
      console.error('Error exporting responses:', error)
      showToast('Failed to export responses', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-orange-100 to-red-200 bg-clip-text text-transparent">My Responses</h1>
          <p className="text-white/70 mt-2">View and export responses to your forms</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={exporting || responses.length === 0}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 animate-slide-up disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="mr-2 h-5 w-5" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {responses.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500/20 to-red-600/20 backdrop-blur-xl rounded-2xl border border-orange-400/30 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-orange-300" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">No responses yet</h3>
          <p className="text-white/70 text-lg">Responses to your forms will appear here.</p>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-6">Recent Responses</h2>
          
          <div className="space-y-4">
            {responses.map((response, index) => (
              <div
                key={response.id}
                onClick={() => navigate(`/response/${response.id}`)}
                className="p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 animate-fade-in bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-200 border border-orange-400/30">
                      {response.forms?.[0]?.name || 'Form'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <Calendar className="mr-1 h-4 w-4" />
                    {new Date(response.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {response.contact_name && (
                      <div className="flex items-center text-sm text-white/80">
                        <User className="mr-2 h-4 w-4 text-white/60" />
                        {response.contact_name}
                      </div>
                    )}
                    {response.contact_email && (
                      <div className="flex items-center text-sm text-white/80">
                        <Mail className="mr-2 h-4 w-4 text-white/60" />
                        {response.contact_email}
                      </div>
                    )}
                  </div>
                  <Eye className="h-5 w-5 text-white/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
