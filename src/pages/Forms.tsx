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
          onCreateForm={() => setIsTypeModalOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0d0d0d]">
          <div className="p-8 space-y-5 max-w-6xl mx-auto">
            {/* OpenAI API Keys-Style Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Forms
              </h1>

              {/* Underline Tabs */}
              <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 mt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(null)}
                  className={`pb-2.5 relative transition-colors ${
                    selectedFolderId === null
                      ? 'text-zinc-950 dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-950 dark:after:bg-white'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  All Forms
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId('uncategorized')}
                  className={`pb-2.5 relative transition-colors ${
                    selectedFolderId === 'uncategorized'
                      ? 'text-zinc-950 dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-950 dark:after:bg-white'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  Uncategorized
                </button>
              </div>
            </div>

            {/* Top Action Row */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTypeModalOpen(true)} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create new form</span>
                </button>
              </div>
            </div>

            {/* OpenAI Search & Filter Chips Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Search Pill */}
              <div className="relative min-w-[200px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>

              {/* Active Filter Chip */}
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span>✓ Active</span>
              </button>

              {/* Add Filter Chip */}
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add filter</span>
              </button>

              <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1 font-normal">
                {filteredForms.length} result{filteredForms.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900/60 animate-pulse border border-zinc-200/50 dark:border-zinc-800/40" />
                ))}
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">No forms yet</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4 text-xs max-w-md mx-auto">Create your first form to start collecting responses.</p>
                <button 
                  onClick={() => setIsTypeModalOpen(true)} 
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-semibold text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Form</span>
                </button>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">No forms found</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4 text-xs max-w-md mx-auto">No forms match your search query.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Workspace</th>
                        <th className="py-2.5 px-3">Responses</th>
                        <th className="py-2.5 px-3">Created</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForms.map((form, index) => (
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
                    </tbody>
                  </table>
                </div>
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