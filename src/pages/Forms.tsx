import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Plus, Edit, Trash2, Eye, Code, Search, BarChart3, MoreVertical, Copy as Duplicate, FileText } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import FolderSidebar from '../components/folders/FolderSidebar'
import FolderModal from '../components/folders/FolderModal'
import FolderBadge from '../components/folders/FolderBadge'
import BulkActions from '../components/folders/BulkActions'
import { 
  getFolders, 
  createFolder, 
  updateFolder, 
  deleteFolder, 
  updateFormFolder,
  moveFormsToFolder,
  getUncategorizedCount,
  Folder as FolderType 
} from '../api/folders'

interface Form {
  id: string
  name: string
  internal_name?: string | null
  description: string | null
  is_active: boolean
  created_at: string
  client_id: string
  folder_id: string | null
  clients: {
    name: string
    primary_color: string
  } | null
  form_folders?: {
    id: string
    name: string
    color: string
  } | null
}

export default function Forms() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { push } = useToast()
  const navigate = useNavigate()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Folder state
  const [folders, setFolders] = useState<FolderType[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [uncategorizedCount, setUncategorizedCount] = useState(0)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Bulk selection state
  const [selectedFormIds, setSelectedFormIds] = useState<Set<string>>(new Set())
  
  // Response counts state
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({})
  
  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetchForms()
    if (user) {
      fetchFolders()
      fetchUncategorizedCount()
    }
  }, [user])

  useEffect(() => {
    if (forms.length > 0) {
      fetchResponseCounts()
    }
  }, [forms.length])

  const fetchFolders = async () => {
    if (!user) return
    const { data, error } = await getFolders(user.id)
    if (error) {
      console.error('Error fetching folders:', error)
    } else {
      setFolders(data || [])
    }
  }

  const fetchUncategorizedCount = async () => {
    if (!user) return
    const { count, error } = await getUncategorizedCount(user.id)
    if (error) {
      console.error('Error fetching uncategorized count:', error)
    } else {
      setUncategorizedCount(count)
    }
  }

  const fetchResponseCounts = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('form_id')
        .in('form_id', forms.map(f => f.id))

      if (error) throw error

      const counts: Record<string, number> = {}
      data?.forEach(response => {
        counts[response.form_id] = (counts[response.form_id] || 0) + 1
      })

      setResponseCounts(counts)
    } catch (error) {
      console.error('Error fetching response counts:', error)
    }
  }

  const fetchForms = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          internal_name,
          clients (
            name,
            primary_color
          ),
          form_folders (
            id,
            name,
            color
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
    const baseUrl = window.location.origin;
    // Use custom domain detection - if on custom domain, no basename needed
    const isCustomDomain = window.location.hostname !== 'noahung.github.io';
    const basename = import.meta.env.PROD && !isCustomDomain ? '/online-designer-beta' : '';
    const embedCode = `<div style="width:100%;"><iframe id="designerFormIframe" src="${baseUrl}${basename}/form/${formId}" style="width:100%;border:none;min-height:400px;" allowfullscreen></iframe></div>
<script>
window.addEventListener("message", function(event) {
  if (event.data && event.data.type === "designerFormHeight" && event.data.height) {
    var iframe = document.getElementById("designerFormIframe");
    if (iframe) {
      var newHeight = Math.max(event.data.height, 200); // Ensure minimum height
      iframe.style.height = newHeight + "px";
      console.log('[Parent] Updated iframe height to:', newHeight);
    }
  }
}, false);

// Also listen for load events to ensure initial sizing
document.addEventListener("DOMContentLoaded", function() {
  var iframe = document.getElementById("designerFormIframe");
  if (iframe) {
    // Set a reasonable initial height
    iframe.style.height = "400px";
  }
});
</script>`;
    navigator.clipboard.writeText(embedCode);
    push({ type: 'success', message: 'Embed code copied to clipboard' });
  }

  const openEditModal = async (formId: string) => {
    // Navigate to the FormBuilder in edit mode instead of opening a modal
    navigate(`/forms/edit/${formId}`)
  }

  const duplicateForm = async (formId: string) => {
    try {
      // Get the original form
      const { data: originalForm, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (fetchError) throw fetchError

      // Get all form steps with their options
      const { data: originalSteps, error: stepsError } = await supabase
        .from('form_steps')
        .select(`
          *,
          form_options (*)
        `)
        .eq('form_id', formId)
        .order('step_order')

      if (stepsError) throw stepsError

      // Create a new form with the same data but new ID and name
      const { data: newForm, error: createError } = await supabase
        .from('forms')
        .insert({
          name: `${originalForm.name} (Copy)`,
          description: originalForm.description,
          form_data: originalForm.form_data,
          user_id: user?.id,
          client_id: originalForm.client_id, // Include the required client_id
          is_active: false, // Start as inactive
          primary_color: originalForm.primary_color,
          secondary_color: originalForm.secondary_color,
          background_color: originalForm.background_color,
          welcome_message: originalForm.welcome_message,
          form_theme: originalForm.form_theme,
          primary_button_color: originalForm.primary_button_color,
          primary_button_text_color: originalForm.primary_button_text_color,
          secondary_button_color: originalForm.secondary_button_color,
          secondary_button_text_color: originalForm.secondary_button_text_color,
          internal_name: originalForm.internal_name
        })
        .select()
        .single()

      if (createError) throw createError

      // Copy all form steps and their options
      for (const step of originalSteps || []) {
        const { data: newStep, error: stepError } = await supabase
          .from('form_steps')
          .insert({
            form_id: newForm.id,
            title: step.title,
            question_type: step.question_type,
            is_required: step.is_required,
            step_order: step.step_order,
            max_file_size: step.max_file_size,
            allowed_file_types: step.allowed_file_types,
            dimension_type: step.dimension_type,
            scale_type: step.scale_type,
            scale_min: step.scale_min,
            scale_max: step.scale_max,
            images_per_row: step.images_per_row,
            frames_max_count: step.frames_max_count,
            frames_require_image: step.frames_require_image,
            frames_require_location: step.frames_require_location,
            frames_require_measurements: step.frames_require_measurements
          })
          .select()
          .single()

        if (stepError) throw stepError

        // Copy all options for this step
        for (const option of step.form_options || []) {
          const { error: optionError } = await supabase
            .from('form_options')
            .insert({
              step_id: newStep.id,
              label: option.label,
              image_url: option.image_url,
              option_order: option.option_order,
              jump_to_step: option.jump_to_step
            })

          if (optionError) throw optionError
        }
      }

      fetchForms() // Refresh the forms list
      push({ type: 'success', message: 'Form duplicated successfully!' })
    } catch (error) {
      console.error('Error duplicating form:', error)
      push({ type: 'error', message: 'Failed to duplicate form' })
    }
  }

  // Folder management handlers
  const handleCreateFolder = async (data: { name: string; description: string; color: string }) => {
    if (!user) return
    const { error } = await createFolder(user.id, data)
    if (error) {
      push({ type: 'error', message: 'Failed to create folder' })
    } else {
      push({ type: 'success', message: 'Folder created successfully!' })
      fetchFolders()
    }
  }

  const handleUpdateFolder = async (data: { name: string; description: string; color: string }) => {
    if (!editingFolder) return
    const { error } = await updateFolder(editingFolder.id, data)
    if (error) {
      push({ type: 'error', message: 'Failed to update folder' })
    } else {
      push({ type: 'success', message: 'Folder updated successfully!' })
      fetchFolders()
      fetchForms() // Refresh to update folder badges
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Forms inside will be moved to Uncategorized.')) return
    
    const { error } = await deleteFolder(folderId)
    if (error) {
      push({ type: 'error', message: 'Failed to delete folder' })
    } else {
      push({ type: 'success', message: 'Folder deleted successfully!' })
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null)
      }
      fetchFolders()
      fetchForms()
      fetchUncategorizedCount()
    }
  }

  const handleMoveFormToFolder = async (formId: string, folderId: string | null) => {
    const { error } = await updateFormFolder(formId, folderId)
    if (error) {
      push({ type: 'error', message: 'Failed to move form' })
    } else {
      push({ type: 'success', message: 'Form moved successfully!' })
      fetchForms()
      fetchFolders() // Update folder counts
      fetchUncategorizedCount()
    }
  }

  const handleBulkMoveToFolder = async (folderId: string | null) => {
    const formIds = Array.from(selectedFormIds)
    const { error } = await moveFormsToFolder(formIds, folderId)
    if (error) {
      push({ type: 'error', message: 'Failed to move forms' })
    } else {
      push({ type: 'success', message: `${formIds.length} form(s) moved successfully!` })
      setSelectedFormIds(new Set())
      fetchForms()
      fetchFolders()
      fetchUncategorizedCount()
    }
  }

  const toggleFormSelection = (formId: string) => {
    const newSelection = new Set(selectedFormIds)
    if (newSelection.has(formId)) {
      newSelection.delete(formId)
    } else {
      newSelection.add(formId)
    }
    setSelectedFormIds(newSelection)
  }

  // Filter forms based on search query and selected folder
  const filteredForms = forms.filter(form => {
    // Filter by search query
    const query = searchQuery.toLowerCase()
    const matchesSearch = (
      form.name.toLowerCase().includes(query) ||
      form.internal_name?.toLowerCase().includes(query) ||
      form.description?.toLowerCase().includes(query) ||
      form.clients?.name.toLowerCase().includes(query)
    )
    
    if (!matchesSearch) return false
    
    // Filter by selected folder
    if (selectedFolderId === null) {
      return true // Show all forms
    } else if (selectedFolderId === 'uncategorized') {
      return form.folder_id === null
    } else {
      return form.folder_id === selectedFolderId
    }
  })

  return (
    <>
      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false)
          setEditingFolder(null)
        }}
        onSave={editingFolder ? handleUpdateFolder : handleCreateFolder}
        initialData={editingFolder ? {
          name: editingFolder.name,
          description: editingFolder.description || '',
          color: editingFolder.color
        } : undefined}
        mode={editingFolder ? 'edit' : 'create'}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedFormIds.size}
        folders={folders}
        onMoveToFolder={handleBulkMoveToFolder}
        onClearSelection={() => setSelectedFormIds(new Set())}
      />

      <div className="flex h-screen">
        {/* Folder Sidebar */}
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          uncategorizedCount={uncategorizedCount}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={() => setIsFolderModalOpen(true)}
          onEditFolder={(folder) => {
            setEditingFolder(folder)
            setIsFolderModalOpen(true)
          }}
          onDeleteFolder={handleDeleteFolder}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div className="animate-slide-up">
                <h1 className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                  theme === 'light' 
                    ? 'from-gray-800 via-orange-600 to-red-600' 
                    : 'from-white via-orange-100 to-red-200'
                }`}>
                  Forms
                </h1>
                <p className={`mt-2 text-lg ${
                  theme === 'light' ? 'text-gray-600' : 'text-white/70'
                }`}>Create and manage your client forms</p>
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

      {/* Search Bar */}
      {forms.length > 0 && (
        <div className="mb-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'light' ? 'text-gray-400' : 'text-white/40'
            }`} />
            <input
              type="text"
              placeholder="Search forms by name, internal name, description, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
              } focus:outline-none`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'text-gray-500 hover:text-gray-700'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <p className={`mt-2 text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-white/60'
            }`}>
              Found {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`backdrop-blur-xl rounded-2xl border p-6 animate-pulse ${
              theme === 'light' 
                ? 'bg-white/50 border-gray-200' 
                : 'bg-white/10 border-white/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className={`h-6 rounded-lg w-48 ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
                  }`}></div>
                  <div className={`h-4 rounded-lg w-32 ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
                  }`}></div>
                  <div className={`h-3 rounded-lg w-24 ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
                  }`}></div>
                </div>
                <div className="flex space-x-3">
                  <div className={`h-10 w-24 rounded-lg ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
                  }`}></div>
                  <div className={`h-10 w-10 rounded-lg ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
                  }`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl border border-blue-400/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <FileText className="w-10 h-10 text-blue-300" />
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
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500/20 to-red-600/20 backdrop-blur-xl rounded-2xl border border-orange-400/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Search className="w-10 h-10 text-orange-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No forms found</h3>
          <p className="text-white/70 mb-8 text-lg max-w-md mx-auto">No forms match your search criteria. Try a different search term.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredForms.map((form, index) => (
            <div key={form.id} className={`group bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-fade-in ${openMenuId === form.id ? 'relative z-50' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-start justify-between">
                {/* Checkbox for bulk selection */}
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedFormIds.has(form.id)}
                    onChange={() => toggleFormSelection(form.id)}
                    className="mt-1 w-5 h-5 rounded border-2 border-white/30 bg-white/10 checked:bg-orange-500 checked:border-orange-500 cursor-pointer transition-all"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors duration-200">
                        {form.name}
                      </h3>
                      {form.internal_name && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-500/20 text-orange-300 border border-orange-400/30">
                          {form.internal_name}
                        </span>
                      )}
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full backdrop-blur-sm border ${
                        form.is_active 
                          ? 'bg-green-500/20 text-green-300 border-green-400/30'
                          : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                      }`}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {form.form_folders && (
                        <FolderBadge
                          folderName={form.form_folders.name}
                          folderColor={form.form_folders.color}
                          size="sm"
                        />
                      )}
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
                </div>

                <div className="flex items-center space-x-2">
                  {/* Responses Button */}
                  <button
                    onClick={() => navigate(`/forms/${form.id}/responses`)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white hover:from-blue-500/30 hover:to-purple-600/30 hover:scale-105"
                    title="View responses"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Responses</span>
                    {responseCounts[form.id] > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-400 text-white font-semibold">
                        {responseCounts[form.id]}
                      </span>
                    )}
                  </button>
                  
                  {/* Move to Folder dropdown */}
                  <select
                    value={form.folder_id || ''}
                    onChange={(e) => handleMoveFormToFolder(form.id, e.target.value || null)}
                    className="px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    title="Move to folder"
                  >
                    <option value="" className="bg-gray-800">📭 Uncategorized</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id} className="bg-gray-800">
                        📁 {folder.name}
                      </option>
                    ))}
                  </select>

                  {/* Embed Code Button */}
                  <button
                    onClick={() => copyEmbedCode(form.id)}
                    className="p-3 text-white/60 hover:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-blue-400/30"
                    title="Copy embed code"
                  >
                    <Code className="w-5 h-5" />
                  </button>

                  {/* More Actions Dropdown */}
                  <div className="relative z-50">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === form.id ? null : form.id)}
                      className="p-3 text-white/60 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/30"
                      title="More actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openMenuId === form.id && (
                      <>
                        {/* Backdrop to close menu */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setOpenMenuId(null)}
                        />
                        
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-gray-800 border border-white/20 shadow-2xl overflow-hidden z-50 animate-scale-in">
                          <button
                            onClick={() => {
                              window.open(`/form/${form.id}`, '_blank')
                              setOpenMenuId(null)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-green-300" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => {
                              openEditModal(form.id)
                              setOpenMenuId(null)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                          >
                            <Edit className="w-4 h-4 text-purple-300" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              duplicateForm(form.id)
                              setOpenMenuId(null)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                          >
                            <Duplicate className="w-4 h-4 text-orange-300" />
                            <span>Duplicate</span>
                          </button>

                          <div className="h-px bg-white/10 my-1" />

                          <button
                            onClick={() => {
                              toggleFormStatus(form.id, form.is_active)
                              setOpenMenuId(null)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                          >
                            {form.is_active ? (
                              <>
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                                </div>
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-green-400" />
                                </div>
                                <span>Activate</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              deleteForm(form.id)
                              setOpenMenuId(null)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
          </div>
        </div>
      </div>
    </>
  )
}