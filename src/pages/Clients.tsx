import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Client {
  id: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  created_at: string
}

export default function Clients() {
  const { user } = useAuth()
  const { push } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    primary_color: '#2563EB',
    secondary_color: '#475569'
  })

  useEffect(() => {
    fetchClients()
  }, [user])

  const fetchClients = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
  push({ type: 'error', message: 'Error loading clients' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color
          })
          .eq('id', editingClient.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            user_id: user.id
          })

        if (error) throw error
      }

      setShowModal(false)
      setEditingClient(null)
      setFormData({ name: '', primary_color: '#2563EB', secondary_color: '#475569' })
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
  push({ type: 'error', message: 'Error saving client' })
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      primary_color: client.primary_color,
      secondary_color: client.secondary_color
    })
    setShowModal(true)
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      push({ type: 'error', message: 'Error deleting client' })
    }
    push({ type: 'success', message: 'Client deleted' })
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-orange-100 to-red-200 bg-clip-text text-transparent">Clients</h1>
          <p className="text-white/70 mt-2 text-lg">Manage your client branding and settings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 animate-slide-up"
          style={{animationDelay: '0.2s'}}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Client
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-32 mb-4"></div>
              <div className="h-3 bg-white/20 rounded w-24 mb-2"></div>
              <div className="flex space-x-2 mt-4">
                <div className="h-8 w-8 bg-white/20 rounded-xl"></div>
                <div className="h-8 w-8 bg-white/20 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Users className="w-8 h-8 text-white/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No clients yet</h3>
          <p className="text-white/70 mb-6 text-lg">Get started by adding your first client</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client, index) => (
            <div key={client.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-200 hover:-translate-y-1 animate-slide-up" style={{animationDelay: `${0.1 * index}s`}}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white mb-1 text-lg">{client.name}</h3>
                  <p className="text-sm text-white/60">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-white/60 hover:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-all duration-200 hover:scale-110"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-white/60 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/70 uppercase tracking-wide mb-2 block">Brand Colors</label>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl border-2 border-white/30 shadow-lg ring-2 ring-white/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: client.primary_color }}
                      title={`Primary: ${client.primary_color}`}
                    />
                    <div 
                      className="w-10 h-10 rounded-xl border-2 border-white/30 shadow-lg ring-2 ring-white/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: client.secondary_color }}
                      title={`Secondary: ${client.secondary_color}`}
                    />
                  </div>
                </div>

                {client.logo_url && (
                  <div>
                    <label className="text-xs font-medium text-white/70 uppercase tracking-wide mb-2 block">Logo</label>
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                      <img 
                        src={client.logo_url} 
                        alt={`${client.name} logo`}
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md animate-scale-in shadow-2xl">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-6">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  placeholder="e.g., Premium Windows & Doors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-12 border border-white/20 rounded-xl cursor-pointer bg-white/10 backdrop-blur-sm hover:scale-110 transition-transform"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm font-mono placeholder-white/50 hover:bg-white/15 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-12 h-12 border border-white/20 rounded-xl cursor-pointer bg-white/10 backdrop-blur-sm hover:scale-110 transition-transform"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm font-mono placeholder-white/50 hover:bg-white/15 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingClient(null)
                    setFormData({ name: '', primary_color: '#2563EB', secondary_color: '#475569' })
                  }}
                  className="px-6 py-2 text-white/70 hover:text-white transition-colors hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
                >
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}