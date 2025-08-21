import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Copy, Eye, ExternalLink } from 'lucide-react'

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
    } finally {
      setLoading(false)
    }
  }

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_active: !currentStatus })
        .eq('id', formId)

      if (error) throw error
      fetchForms()
    } catch (error) {
      console.error('Error updating form status:', error)
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
    } catch (error) {
      console.error('Error deleting form:', error)
    }
  }

  const copyEmbedCode = (formId: string) => {
    const embedCode = `<iframe src="${window.location.origin}/form/${formId}" width="100%" height="600" frameborder="0"></iframe>`
    navigator.clipboard.writeText(embedCode)
    // In a real app, you'd show a toast notification here
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Forms</h1>
          <p className="text-slate-600 mt-2">Create and manage your client forms</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Create Form
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-48"></div>
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-20 bg-slate-200 rounded"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No forms yet</h3>
          <p className="text-slate-600 mb-6">Create your first form to start collecting responses</p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Form
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{form.name}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      form.is_active 
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {form.description && (
                    <p className="text-slate-600 mb-3">{form.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span>Client: {form.clients?.name}</span>
                    <span>•</span>
                    <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyEmbedCode(form.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy embed code"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Preview form"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit form"
                  >
                    <Edit className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => toggleFormStatus(form.id, form.is_active)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      form.is_active
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {form.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteForm(form.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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