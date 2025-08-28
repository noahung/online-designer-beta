import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Users, Upload, X, Palette, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Client {
  id: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  client_email: string | null
  client_password_hash: string | null
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
    secondary_color: '#475569',
    logo_file: null as File | null,
    client_email: '',
    client_password: ''
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const uploadLogo = async (file: File, clientId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${clientId}-${Date.now()}.${fileExt}`
    const filePath = `client-logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('client-logos')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      throw new Error('Failed to upload logo')
    }

    const { data } = supabase.storage
      .from('client-logos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setUploading(true)

    try {
      let logoUrl: string | null = null

      if (editingClient) {
        // Upload new logo if provided
        if (formData.logo_file) {
          logoUrl = await uploadLogo(formData.logo_file, editingClient.id)
        }

        // Update existing client
        const updateData: any = {
          name: formData.name,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          client_email: formData.client_email || null,
          client_password_hash: formData.client_password || null
        }

        if (logoUrl) {
          updateData.logo_url = logoUrl
        }

        const { error } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', editingClient.id)

        if (error) throw error
        push({ type: 'success', message: 'Client updated successfully' })
      } else {
        // Create new client first
        console.log('Creating new client with data:', {
          name: formData.name,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          client_email: formData.client_email || null,
          client_password_hash: formData.client_password || null,
          user_id: user.id
        })
        
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            client_email: formData.client_email || null,
            client_password_hash: formData.client_password || null,
            user_id: user.id
          })
          .select()
          .single()

        console.log('Client creation result:', { newClient, error })

        if (error) throw error

        // Upload logo if provided
        if (formData.logo_file && newClient) {
          logoUrl = await uploadLogo(formData.logo_file, newClient.id)
          
          // Update client with logo URL
          const { error: updateError } = await supabase
            .from('clients')
            .update({ logo_url: logoUrl })
            .eq('id', newClient.id)

          if (updateError) throw updateError
        }

        push({ type: 'success', message: 'Client created successfully' })
      }

      setShowModal(false)
      setEditingClient(null)
      setFormData({
        name: '',
        primary_color: '#2563EB',
        secondary_color: '#475569',
        logo_file: null,
        client_email: '',
        client_password: ''
      })
      setLogoPreview(null)
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
      push({ type: 'error', message: 'Error saving client' })
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      primary_color: client.primary_color,
      secondary_color: client.secondary_color,
      logo_file: null,
      client_email: client.client_email || '',
      client_password: client.client_password_hash || ''
    })
    setLogoPreview(client.logo_url)
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        push({ type: 'error', message: 'Please select an image file' })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        push({ type: 'error', message: 'File size must be less than 5MB' })
        return
      }

      setFormData({ ...formData, logo_file: file })
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogoPreview = () => {
    setFormData({ ...formData, logo_file: null })
    setLogoPreview(null)
  }

  const predefinedColors = [
    '#2563EB', '#7C3AED', '#DC2626', '#EA580C', '#D97706', '#65A30D',
    '#059669', '#0891B2', '#4338CA', '#9333EA', '#C2410C', '#BE123C',
    '#475569', '#374151', '#1F2937', '#111827', '#0F172A', '#18181B'
  ]

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
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-white/60">
                      Created {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </div>
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-2xl animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-6">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Name */}
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

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Company Logo
                </label>
                {logoPreview ? (
                  <div className="relative group">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 flex items-center justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-16 max-w-32 object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogoPreview}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="mt-2 text-center">
                      <label className="text-xs text-blue-300 hover:text-blue-200 cursor-pointer underline">
                        Change Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="block w-full">
                    <div className="bg-white/10 backdrop-blur-sm border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:bg-white/15 hover:border-white/40 transition-all duration-200 cursor-pointer group">
                      <Upload className="w-8 h-8 text-white/60 mx-auto mb-2 group-hover:text-white/80 transition-colors" />
                      <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Client Access Credentials */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-blue-300 mr-2" />
                  <h3 className="text-lg font-medium text-white">Client Portal Access</h3>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  Set up login credentials for your client to access their form responses
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                      placeholder="client@company.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Client Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.client_password}
                        onChange={(e) => setFormData({ ...formData, client_password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                        placeholder="Enter secure password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-4 mt-4">
                  <p className="text-sm text-blue-200">
                    <strong>Note:</strong> These credentials will allow your client to log in and view only their form responses. Leave blank if you don't want to provide client access.
                  </p>
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Primary Color
                </label>
                <div className="space-y-3">
                  {/* Predefined Colors */}
                  <div className="grid grid-cols-6 gap-2">
                    {predefinedColors.slice(0, 12).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, primary_color: color })}
                        className={`w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 border-2 ${
                          formData.primary_color === color 
                            ? 'border-white shadow-lg ring-2 ring-white/50' 
                            : 'border-white/30 hover:border-white/60'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  {/* Custom Color Input */}
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
                      placeholder="#2563EB"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Secondary Color
                </label>
                <div className="space-y-3">
                  {/* Predefined Colors */}
                  <div className="grid grid-cols-6 gap-2">
                    {predefinedColors.slice(6).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, secondary_color: color })}
                        className={`w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 border-2 ${
                          formData.secondary_color === color 
                            ? 'border-white shadow-lg ring-2 ring-white/50' 
                            : 'border-white/30 hover:border-white/60'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  {/* Custom Color Input */}
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
                      placeholder="#475569"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingClient(null)
                    setFormData({ 
                      name: '', 
                      primary_color: '#2563EB', 
                      secondary_color: '#475569',
                      logo_file: null,
                      client_email: '',
                      client_password: ''
                    })
                    setLogoPreview(null)
                  }}
                  className="px-6 py-2 text-white/70 hover:text-white transition-colors hover:bg-white/10 rounded-xl disabled:opacity-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 disabled:scale-100 disabled:shadow-none flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      {editingClient ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingClient ? 'Update Client' : 'Add Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}