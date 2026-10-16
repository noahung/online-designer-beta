import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Plus, Edit, Trash2, Users, Upload, X, Palette, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { ClientCard } from '../components/ui/client-card'

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
    <div className="w-full h-full overflow-y-auto p-8 animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
        <div className="animate-slide-up">
          <h1 className={`text-2xl font-bold tracking-tight ${
            theme === 'light' 
              ? 'text-zinc-900' 
              : 'text-white'
          }`}>Clients</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Manage your client branding, credentials, and settings.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-xs transition-colors gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Client</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#18181b] animate-pulse p-6" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">No clients yet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">Get started by adding your first client workspace.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-xs transition-colors gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Client</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client, index) => (
              <ClientCard
                key={client.id}
                client={client}
                index={index}
                onEdit={() => handleEdit(client)}
                onDelete={() => handleDelete(client.id)}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>

      {/* OpenAI Platform-Style Slide-in Client Drawer */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end font-sans">
          {/* Dim Backdrop */}
          <div
            onClick={() => {
              if (!uploading) {
                setShowModal(false)
                setEditingClient(null)
              }
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-full max-w-xl h-full shadow-2xl flex flex-col z-10 border-l bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transition-transform duration-300 ease-out animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#18181b]">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure client branding, portal access, and notifications.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingClient(null)
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} id="client-drawer-form" className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Section 1: General & Brand */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Branding & Identity
                </h3>

                {/* Client Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                    placeholder="e.g. Cathedral Windows"
                    required
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Company Logo
                  </label>
                  {logoPreview ? (
                    <div className="relative group border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-16 max-w-32 object-contain"
                      />
                      <button
                        type="button"
                        onClick={removeLogoPreview}
                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                        title="Remove logo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full">
                      <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group">
                        <Upload className="w-6 h-6 mx-auto mb-1.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Click to upload logo
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          PNG, JPG, SVG up to 5MB
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

                {/* Brand Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        placeholder="#2563EB"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        placeholder="#475569"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Client Portal Access */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Client Portal Access
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      placeholder="client@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Client Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.client_password}
                        onChange={(e) => setFormData({ ...formData, client_password: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Emails */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Additional Notification Recipients
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        additional_emails: [...formData.additional_emails, ''] 
                      })}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      + Add recipient
                    </button>
                  </div>

                  {formData.additional_emails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const updated = [...formData.additional_emails]
                          updated[idx] = e.target.value
                          setFormData({ ...formData, additional_emails: updated })
                        }}
                        className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                        placeholder="team@company.com"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.additional_emails.filter((_, i) => i !== idx)
                          setFormData({ ...formData, additional_emails: updated })
                        }}
                        className="p-1 text-zinc-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Credentials allow your client to log in and view responses specifically linked to their forms.
                </div>
              </div>

              {/* Section 3: Webhook URL & Notifications */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Automations & Webhooks
                </h3>

                {/* Email notifications checkbox */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="email_notifications"
                    checked={formData.email_notifications_enabled}
                    onChange={(e) => setFormData({ ...formData, email_notifications_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label 
                    htmlFor="email_notifications" 
                    className="text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    Send instant email alerts on new form submissions
                  </label>
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Zapier Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>
            </form>

            {/* Sticky Drawer Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#18181b] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingClient(null)
                }}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="client-drawer-form"
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingClient ? 'Update Client' : 'Save Client'}</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}