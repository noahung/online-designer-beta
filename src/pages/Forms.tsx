import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Copy, Eye, Sparkles, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

interface Form {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  client_id: string
  clients: {
    name: string
    primary_color: string
  } | null
}

export default function Forms() {
  const { user } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForms()
  }, [user])

  const fetchForms = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          clients (
            name,
            primary_color
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setForms(data || [])
    } catch (error) {
    console.error('Error fetching forms:', error)
    push({ type: 'error', message: 'Error loading forms' })
    } finally {
      setLoading(false)
    }
  }

  const { push } = useToast()
  const navigate = useNavigate()

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_active: !currentStatus })
        .eq('id', formId)

      if (error) throw error
  fetchForms()
  push({ type: 'success', message: 'Form status updated' })
    } catch (error) {
      console.error('Error updating form status:', error)
  push({ type: 'error', message: 'Error updating form' })
    }
  }

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)

      if (error) throw error
  fetchForms()
  push({ type: 'success', message: 'Form deleted' })
    } catch (error) {
      console.error('Error deleting form:', error)
  push({ type: 'error', message: 'Error deleting form' })
    }
  }

  const copyEmbedCode = (formId: string) => {
    const baseUrl = window.location.origin
    const basename = import.meta.env.PROD ? '/online-designer-beta' : ''
    const embedCode = `<iframe src="${baseUrl}${basename}/form/${formId}" width="100%" height="800" frameborder="0" style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></iframe>`
    navigator.clipboard.writeText(embedCode)
  push({ type: 'success', message: 'Embed code copied to clipboard' })
  }

  const openEditModal = async (formId: string) => {
    // Navigate to the FormBuilder in edit mode instead of opening a modal
    navigate(`/forms/edit/${formId}`)
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-orange-100 to-red-200 bg-clip-text text-transparent">
            Forms
          </h1>
          <p className="text-white/70 mt-2 text-lg">Create and manage your client forms</p>
        </div>
        <button 
          onClick={() => navigate('/forms/new')} 
          className="group flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 animate-slide-up"
          style={{animationDelay: '0.2s'}}
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
          Create Form
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-6 bg-white/20 rounded-lg w-48"></div>
                  <div className="h-4 bg-white/20 rounded-lg w-32"></div>
                  <div className="h-3 bg-white/20 rounded-lg w-24"></div>
                </div>
                <div className="flex space-x-3">
                  <div className="h-10 w-24 bg-white/20 rounded-lg"></div>
                  <div className="h-10 w-10 bg-white/20 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl border border-blue-400/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Sparkles className="w-10 h-10 text-blue-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No forms yet</h3>
          <p className="text-white/70 mb-8 text-lg max-w-md mx-auto">Create your first form to start collecting responses from your clients</p>
          <button 
            onClick={() => navigate('/forms/new')} 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Form
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {forms.map((form, index) => (
            <div key={form.id} className="group bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors duration-200">
                      {form.name}
                    </h3>
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full backdrop-blur-sm border ${
                      form.is_active 
                        ? 'bg-green-500/20 text-green-300 border-green-400/30'
                        : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                    }`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {form.description && (
                    <p className="text-white/70 mb-4 text-base leading-relaxed">{form.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-white/60">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      Client: {form.clients?.name}
                    </span>
                    <span>•</span>
                    <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyEmbedCode(form.id)}
                    className="p-3 text-white/60 hover:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-blue-400/30"
                    title="Copy embed code"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-3 text-white/60 hover:text-green-300 hover:bg-green-500/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-green-400/30"
                    title="Preview form"
                    onClick={() => window.open(`/form/${form.id}`, '_blank')}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-3 text-white/60 hover:text-purple-300 hover:bg-purple-500/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-purple-400/30"
                    title="Edit form"
                    onClick={() => openEditModal(form.id)}
                  >
                    <Edit className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => toggleFormStatus(form.id, form.is_active)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border ${
                      form.is_active
                        ? 'bg-slate-500/20 text-slate-300 border-slate-400/30 hover:bg-slate-500/30'
                        : 'bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30'
                    }`}
                  >
                    {form.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteForm(form.id)}
                    className="p-3 text-white/60 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-red-400/30"
                    title="Delete form"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}