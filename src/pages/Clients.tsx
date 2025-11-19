import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Plus, Edit, Trash2, Users, Upload, X, Palette, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Client {
  id: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  client_email: string | null
  additional_emails: string[]
  client_password_hash: string | null
  email_notifications_enabled: boolean
  webhook_url: string | null
  created_at: string
}

// Email validation function - matches Brevo's strict validation requirements
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  // Remove any whitespace
  email = email.trim()

  // Basic format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!emailRegex.test(email)) return false

  // Split into local and domain parts
  const [localPart, domain] = email.split('@')

  // Local part validations (RFC 5322 compliant)
  if (!localPart || localPart.length === 0 || localPart.length > 64) return false
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false
  if (localPart.includes('..')) return false

  // Domain validations
  if (!domain || domain.length === 0 || domain.length > 253) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.includes('..')) return false

  // Domain must have at least one dot
  if (!domain.includes('.')) return false

  // Check domain parts (each part should be valid)
  const domainParts = domain.split('.')
  for (const part of domainParts) {
    if (part.length === 0 || part.length > 63) return false
    if (part.startsWith('-') || part.endsWith('-')) return false
    // Domain parts should only contain valid characters
    if (!/^[a-zA-Z0-9-]+$/.test(part)) return false
  }

  // Additional Brevo-specific validations
  // Reject obviously invalid patterns that Brevo doesn't accept
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) return false
  if (localPart.includes('..') || domain.includes('..')) return false

  return true
}

export default function Clients() {
  const { user } = useAuth()
  const { theme } = useTheme()
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
    additional_emails: [] as string[],
    client_password: '',
    email_notifications_enabled: true,
    webhook_url: ''
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
      // Validate primary email if provided
      if (formData.client_email && !isValidEmail(formData.client_email)) {
        push({
          title: 'Invalid Email',
          description: 'Please enter a valid primary email address',
          type: 'error'
        })
        setUploading(false)
        return
      }

      // Validate additional emails
      const invalidEmails = formData.additional_emails.filter(email => email && !isValidEmail(email))
      if (invalidEmails.length > 0) {
        push({
          title: 'Invalid Additional Emails',
          description: `Please fix these invalid email addresses: ${invalidEmails.join(', ')}`,
          type: 'error'
        })
        setUploading(false)
        return
      }

      // Filter out empty additional emails
      const validAdditionalEmails = formData.additional_emails.filter(email => email && email.trim())

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
          additional_emails: validAdditionalEmails,
          client_password_hash: formData.client_password || null,
          email_notifications_enabled: formData.email_notifications_enabled,
          webhook_url: formData.webhook_url || null
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
            additional_emails: validAdditionalEmails,
            client_password_hash: formData.client_password || null,
            email_notifications_enabled: formData.email_notifications_enabled,
            webhook_url: formData.webhook_url || null,
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
        additional_emails: [],
        client_password: '',
        email_notifications_enabled: true,
        webhook_url: ''
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
      additional_emails: client.additional_emails || [],
      client_password: client.client_password_hash || '',
      email_notifications_enabled: client.email_notifications_enabled ?? true,
      webhook_url: client.webhook_url || ''
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
          <h1 className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
            theme === 'light' 
              ? 'from-gray-800 via-orange-600 to-red-600' 
              : 'from-white via-orange-100 to-red-200'
          }`}>Clients</h1>
          <p className={`mt-2 text-lg ${
            theme === 'light' ? 'text-gray-600' : 'text-white/70'
          }`}>Manage your client branding and settings</p>
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
            <div key={i} className={`backdrop-blur-xl rounded-2xl border p-6 animate-pulse ${
              theme === 'light' 
                ? 'bg-white/50 border-gray-200' 
                : 'bg-white/10 border-white/20'
            }`}>
              <div className={`h-4 rounded w-32 mb-4 ${
                theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
              }`}></div>
              <div className={`h-3 rounded w-24 mb-2 ${
                theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
              }`}></div>
              <div className="flex space-x-2 mt-4">
                <div className={`h-8 w-8 rounded-xl ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
                }`}></div>
                <div className={`h-8 w-8 rounded-xl ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
                }`}></div>
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className={`w-16 h-16 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 border ${
            theme === 'light' 
              ? 'bg-gray-100 border-gray-200' 
              : 'bg-white/10 border-white/20'
          }`}>
            <Users className={`w-8 h-8 ${
              theme === 'light' ? 'text-gray-400' : 'text-white/60'
            }`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>No clients yet</h3>
          <p className={`mb-6 text-lg ${
            theme === 'light' ? 'text-gray-600' : 'text-white/70'
          }`}>Get started by adding your first client</p>
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
            <div key={client.id} className={`backdrop-blur-xl rounded-2xl border p-6 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-200 hover:-translate-y-1 animate-slide-up ${
              theme === 'light'
                ? 'bg-white/60 border-gray-200 hover:bg-white/80'
                : 'bg-white/10 border-white/20 hover:bg-white/15'
            }`} style={{animationDelay: `${0.1 * index}s`}}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`font-semibold mb-1 text-lg ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>{client.name}</h3>
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-500' : 'text-white/60'
                    }`}>
                      Created {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                      theme === 'light'
                        ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                        : 'text-white/60 hover:text-blue-300 hover:bg-blue-500/20'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                      theme === 'light'
                        ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        : 'text-white/60 hover:text-red-300 hover:bg-red-500/20'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wide mb-2 block ${
                    theme === 'light' ? 'text-gray-500' : 'text-white/70'
                  }`}>Brand Colors</label>
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`w-10 h-10 rounded-xl border-2 shadow-lg ring-2 transition-transform hover:scale-110 ${
                        theme === 'light'
                          ? 'border-gray-200 ring-gray-100'
                          : 'border-white/30 ring-white/10'
                      }`}
                      style={{ backgroundColor: client.primary_color }}
                      title={`Primary: ${client.primary_color}`}
                    />
                    <div 
                      className={`w-10 h-10 rounded-xl border-2 shadow-lg ring-2 transition-transform hover:scale-110 ${
                        theme === 'light'
                          ? 'border-gray-200 ring-gray-100'
                          : 'border-white/30 ring-white/10'
                      }`}
                      style={{ backgroundColor: client.secondary_color }}
                      title={`Secondary: ${client.secondary_color}`}
                    />
                  </div>
                </div>

                {client.logo_url && (
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wide mb-2 block ${
                      theme === 'light' ? 'text-gray-500' : 'text-white/70'
                    }`}>Logo</label>
                    <div className={`backdrop-blur-sm p-3 rounded-xl border ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-100'
                        : 'bg-white/10 border-white/20'
                    }`}>
                      <img 
                        src={client.logo_url} 
                        alt={`${client.name} logo`}
                        className="h-8"
                      />
                    </div>
                  </div>
                )}

                {client.webhook_url && (
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wide mb-2 block ${
                      theme === 'light' ? 'text-gray-500' : 'text-white/70'
                    }`}>Webhook</label>
                    <div className={`backdrop-blur-sm p-3 rounded-xl border ${
                      theme === 'light'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-green-500/10 border-green-400/30'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          theme === 'light' ? 'bg-green-500' : 'bg-green-400'
                        }`}></div>
                        <span className={`text-xs font-medium ${
                          theme === 'light' ? 'text-green-700' : 'text-green-300'
                        }`}>
                          Zapier Connected
                        </span>
                      </div>
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
        <div className={`fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4 ${
          theme === 'light' ? 'bg-black/50' : 'bg-black/70'
        }`} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className={`border rounded-2xl p-8 w-full max-w-2xl animate-scale-in shadow-2xl max-h-[85vh] overflow-y-auto my-auto ${
            theme === 'light'
              ? 'bg-white/95 border-gray-200 backdrop-blur-sm'
              : 'bg-gray-900/95 border-white/10 backdrop-blur-sm'
          }`}>
            <h2 className={`text-2xl font-semibold mb-6 bg-gradient-to-r bg-clip-text text-transparent ${
              theme === 'light'
                ? 'from-gray-800 to-blue-600'
                : 'from-white to-blue-200'
            }`}>
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white/70 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white/90'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:bg-white/15'
                  }`}
                  placeholder="e.g., Premium Windows & Doors"
                  required
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>
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
                      Additional Recipients
                    </label>
                    <div className="space-y-2">
                      {formData.additional_emails.map((email, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              const newEmails = [...formData.additional_emails]
                              newEmails[index] = e.target.value
                              setFormData({ ...formData, additional_emails: newEmails })
                              
                              // Validate email format
                              if (e.target.value && !isValidEmail(e.target.value)) {
                                push({
                                  title: 'Invalid Email',
                                  description: 'Please enter a valid email address',
                                  type: 'warning'
                                })
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-sm"
                            placeholder="additional@company.com"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newEmails = formData.additional_emails.filter((_, i) => i !== index)
                              setFormData({ ...formData, additional_emails: newEmails })
                            }}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Remove email"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          additional_emails: [...formData.additional_emails, ''] 
                        })}
                        className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white/70 hover:text-white hover:bg-white/15 hover:border-white/30 transition-all duration-200 text-sm font-medium"
                      >
                        + Add Another Email
                      </button>
                    </div>
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

              {/* Email Notifications */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>
                  📧 Email Notifications
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="email_notifications"
                    checked={formData.email_notifications_enabled}
                    onChange={(e) => setFormData({ ...formData, email_notifications_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-2 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label 
                    htmlFor="email_notifications" 
                    className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}
                  >
                    Send email notifications for new form responses
                  </label>
                </div>
                <div className={`bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-3 mt-3 ${
                  formData.email_notifications_enabled ? 'block' : 'hidden'
                }`}>
                  <p className="text-sm text-yellow-200">
                    <strong>📬 Email Alert:</strong> When enabled, email notifications will be sent to <strong>{formData.client_email || '[primary email]'}</strong>{formData.additional_emails.length > 0 && ` and ${formData.additional_emails.length} additional recipient${formData.additional_emails.length > 1 ? 's' : ''}`} whenever someone submits a response to their forms.
                  </p>
                </div>
              </div>

              {/* Webhook URL */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>
                  🔗 Webhook URL (Zapier)
                </label>
                <input
                  type="url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white/70 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-white/90'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/15'
                  }`}
                />
                <p className={`text-xs mt-2 ${
                  theme === 'light' ? 'text-gray-500' : 'text-white/60'
                }`}>
                  Enter your Zapier webhook URL to automatically send form responses to your workflows
                </p>
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
                      additional_emails: [],
                      client_password: '',
                      email_notifications_enabled: true,
                      webhook_url: ''
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