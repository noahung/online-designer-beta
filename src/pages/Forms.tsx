import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Plus, Edit, Trash2, Eye, Code, Search, BarChart3, MoreVertical, Copy as Duplicate, FileText } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import FolderSidebar from '../components/folders/FolderSidebar'
import FormTypeSelectionModal from '../components/FormTypeSelectionModal'
import EmbedModal from '../components/ui/EmbedModal'
import FolderModal from '../components/folders/FolderModal'
import FolderBadge from '../components/folders/FolderBadge'
import BulkActions from '../components/folders/BulkActions'
import { FormCard } from '../components/ui/form-card'
import { Pagination } from '../components/ui/pagination'
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
  form_type?: string | null
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
  
  // Duplication progress state
  const [duplicatingState, setDuplicatingState] = useState<{
    isDuplicating: boolean;
    currentStep: string;
    progress: number;
  }>({
    isDuplicating: false,
    currentStep: '',
    progress: 0
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
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

  // Form type selection modal
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)

  // Embed modal state
  const [embedModalForm, setEmbedModalForm] = useState<{ id: string; name: string } | null>(null)

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
    const form = forms.find(f => f.id === formId)
    setEmbedModalForm({ id: formId, name: form?.name || 'Form' })
  }

  const openEditModal = async (formId: string) => {
    // Find the form to check its type
    const form = forms.find(f => f.id === formId)
    if (form?.form_type === 'single_page') {
      navigate(`/forms/edit-single/${formId}`)
    } else {
      navigate(`/forms/edit/${formId}`)
    }
  }

  const duplicateForm = async (formId: string) => {
    try {
      setDuplicatingState({
        isDuplicating: true,
        currentStep: 'Fetching form details...',
        progress: 2
      })

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

      // Get all step logic for this form
      const { data: originalLogic, error: logicError } = await supabase
        .from('step_logic')
        .select('*')
        .eq('form_id', formId)

      if (logicError) {
        console.error('Error fetching original step logic:', logicError)
        throw logicError
      }

      setDuplicatingState(prev => ({
        ...prev,
        currentStep: 'Creating form clone...',
        progress: 8
      }))

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
          internal_name: originalForm.internal_name,
          form_type: originalForm.form_type || 'multi_step'
        })
        .select()
        .single()

      if (createError) throw createError

      const stepIdMap = new Map<string, string>()
      const optionIdMap = new Map<string, string>()

      // Pass 1: Copy all form steps and map their IDs
      const stepsCount = originalSteps?.length || 0
      let stepIndex = 0
      for (const step of originalSteps || []) {
        stepIndex++
        setDuplicatingState({
          isDuplicating: true,
          currentStep: `Copying step ${stepIndex} of ${stepsCount}: ${step.title || 'Untitled'}`,
          progress: 8 + (stepIndex / stepsCount) * 35 // maps 8% to 43%
        })

        const { data: newStep, error: stepError } = await supabase
          .from('form_steps')
          .insert({
            form_id: newForm.id,
            title: step.title,
            description: step.description || null,
            question_type: step.question_type,
            is_required: step.is_required,
            step_order: step.step_order,
            max_file_size: step.max_file_size,
            allowed_file_types: step.allowed_file_types,
            dimension_type: step.dimension_type,
            dimension_units: step.dimension_units,
            scale_type: step.scale_type,
            scale_min: step.scale_min,
            scale_max: step.scale_max,
            images_per_row: step.images_per_row,
            crop_images_to_square: step.crop_images_to_square ?? true,
            frames_max_count: step.frames_max_count,
            frames_require_image: step.frames_require_image,
            frames_require_location: step.frames_require_location,
            frames_require_measurements: step.frames_require_measurements
          })
          .select()
          .single()

        if (stepError) throw stepError
        stepIdMap.set(step.id, newStep.id)
      }

      // Pass 2: Copy all options for all steps and map their IDs
      stepIndex = 0
      for (const step of originalSteps || []) {
        stepIndex++
        const newStepId = stepIdMap.get(step.id)
        if (!newStepId) continue

        const optionsList = step.form_options || []
        const optionsCount = optionsList.length
        let optIndex = 0

        for (const option of optionsList) {
          optIndex++
          setDuplicatingState({
            isDuplicating: true,
            currentStep: `Copying options for step ${stepIndex} of ${stepsCount}...`,
            progress: 43 + (stepIndex / stepsCount) * 32 // maps 43% to 75%
          })

          const { data: newOption, error: optionError } = await supabase
            .from('form_options')
            .insert({
              step_id: newStepId,
              label: option.label,
              image_url: option.image_url,
              option_order: option.option_order,
              jump_to_step: option.jump_to_step
            })
            .select()
            .single()

          if (optionError) {
            console.error('[Duplicate] Error inserting option:', optionError)
            throw optionError
          }
          optionIdMap.set(option.id, newOption.id)
        }
      }

      // Pass 3: Copy and rewrite step logic rules
      const logicCount = originalLogic?.length || 0
      let logicIndex = 0
      for (const logic of originalLogic || []) {
        logicIndex++
        setDuplicatingState({
          isDuplicating: true,
          currentStep: `Copying step logic ${logicIndex} of ${logicCount}...`,
          progress: 75 + (logicIndex / logicCount) * 20 // maps 75% to 95%
        })

        const newStepId = stepIdMap.get(logic.step_id)
        if (!newStepId) {
          console.warn('[Duplicate] Logic step_id not found in stepIdMap:', logic.step_id)
          continue
        }

        // Rewrite rules
        const mappedRules = (logic.rules || []).map((rule: any) => {
          const newRuleStepId = stepIdMap.get(rule.step_id) || rule.step_id
          const newActionTarget = rule.action?.target_step_id ? (stepIdMap.get(rule.action.target_step_id) || rule.action.target_step_id) : undefined

          const mappedConditions = (rule.conditions || []).map((cond: any) => {
            const mappedCond = { ...cond }
            if (cond.option_id) {
              mappedCond.option_id = optionIdMap.get(cond.option_id) || cond.option_id
            }
            return mappedCond
          })

          const mappedAction = { ...rule.action }
          if (newActionTarget !== undefined) {
            mappedAction.target_step_id = newActionTarget
          }

          return {
            ...rule,
            step_id: newRuleStepId,
            conditions: mappedConditions,
            action: mappedAction
          }
        })

        // Rewrite default action
        let mappedDefaultAction = null
        if (logic.default_action) {
          const newDefaultStepId = stepIdMap.get(logic.default_action.step_id) || logic.default_action.step_id
          const newDefaultTarget = logic.default_action.action?.target_step_id
            ? (stepIdMap.get(logic.default_action.action.target_step_id) || logic.default_action.action.target_step_id)
            : undefined

          const mappedAction = { ...logic.default_action.action }
          if (newDefaultTarget !== undefined) {
            mappedAction.target_step_id = newDefaultTarget
          }

          mappedDefaultAction = {
            ...logic.default_action,
            step_id: newDefaultStepId,
            action: mappedAction
          }
        }

        const { error: insertLogicError } = await supabase
          .from('step_logic')
          .insert({
            step_id: newStepId,
            form_id: newForm.id,
            rules: mappedRules,
            default_action: mappedDefaultAction
          })

        if (insertLogicError) {
          console.error('[Duplicate] Error inserting duplicated step logic:', insertLogicError)
          throw insertLogicError
        }
      }

      setDuplicatingState({
        isDuplicating: true,
        currentStep: 'Completing duplication...',
        progress: 98
      })

      await fetchForms() // Refresh the forms list
      push({ type: 'success', message: 'Form duplicated successfully!' })
    } catch (error) {
      console.error('Error duplicating form:', error)
      push({ type: 'error', message: 'Failed to duplicate form' })
    } finally {
      setDuplicatingState({
        isDuplicating: false,
        currentStep: '',
        progress: 0
      })
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

  // Pagination logic
  const totalPages = Math.ceil(filteredForms.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedForms = filteredForms.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedFolderId])

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
                <h1 className={`text-3xl font-semibold text-zinc-900 dark:text-white`}>
                  Forms
                </h1>
                <p className={`mt-2 text-base text-zinc-500 dark:text-zinc-400`}>
                  Create and manage your client forms
                </p>
              </div>
              <button 
                onClick={() => setIsTypeModalOpen(true)} 
                className="group flex items-center px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-medium transition-colors duration-150 animate-slide-up"
                style={{animationDelay: '0.2s'}}
              >
                <Plus className="w-4 h-4 mr-2" />
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
                  ? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-800'
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
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
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
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <FileText className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No forms yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-base max-w-md mx-auto">Create your first form to start collecting responses from your clients</p>
          <button 
            onClick={() => setIsTypeModalOpen(true)} 
            className="inline-flex items-center px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-medium transition-colors duration-150"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Form
          </button>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Search className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No forms found</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-base max-w-md mx-auto">No forms match your search criteria. Try a different search term.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-medium transition-colors duration-150"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {paginatedForms.map((form, index) => (
              <FormCard
                key={form.id}
                form={form}
                index={index}
                responseCount={responseCounts[form.id] || 0}
                isSelected={selectedFormIds.has(form.id)}
                onToggleSelect={() => toggleFormSelection(form.id)}
                onViewResponses={() => navigate(`/forms/${form.id}/responses`)}
                onMoveToFolder={(folderId) => handleMoveFormToFolder(form.id, folderId)}
                onCopyEmbed={() => copyEmbedCode(form.id)}
                onPreview={() => window.open(`/form/${form.id}`, '_blank')}
                onEdit={() => openEditModal(form.id)}
                onDuplicate={() => duplicateForm(form.id)}
                onToggleStatus={() => toggleFormStatus(form.id, form.is_active)}
                onDelete={() => deleteForm(form.id)}
                folders={folders}
                openMenuId={openMenuId}
                onToggleMenu={() => setOpenMenuId(openMenuId === form.id ? null : form.id)}
                theme={theme}
                FolderBadge={FolderBadge}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            theme={theme}
          />
        </>
      )}
          </div>
        </div>
      </div>

      {/* Form type selection modal */}
      <FormTypeSelectionModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSelect={(type) => {
          setIsTypeModalOpen(false)
          if (type === 'single_page') {
            navigate('/forms/new-single')
          } else {
            navigate('/forms/new')
          }
        }}
      />

      {/* Embed modal */}
      {embedModalForm && (
        <EmbedModal
          formId={embedModalForm.id}
          formName={embedModalForm.name}
          isOpen={true}
          onClose={() => setEmbedModalForm(null)}
        />
      )}

      {/* Duplication Progress Modal */}
      {duplicatingState.isDuplicating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4">
            {/* Spinning loading icon */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
              ></div>
              <span className="text-xs font-bold text-blue-400">{Math.round(duplicatingState.progress)}%</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Duplicating Form</h3>
              <p className="text-xs text-white/60 min-h-[32px]">{duplicatingState.currentStep}</p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out" 
                style={{ width: `${duplicatingState.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}