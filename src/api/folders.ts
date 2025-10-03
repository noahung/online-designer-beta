import { supabase } from '../lib/supabase'

export interface Folder {
  id: string
  name: string
  description: string | null
  user_id: string
  color: string
  created_at: string
  updated_at: string
  form_count?: number
}

export interface CreateFolderData {
  name: string
  description?: string
  color?: string
}

export interface UpdateFolderData {
  name?: string
  description?: string
  color?: string
}

/**
 * Fetch all folders for the current user with form counts
 */
export async function getFolders(userId: string): Promise<{ data: Folder[] | null; error: any }> {
  try {
    // Fetch folders
    const { data: folders, error: foldersError } = await supabase
      .from('form_folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (foldersError) throw foldersError

    // Get form counts for each folder
    const { data: formCounts, error: countsError } = await supabase
      .from('forms')
      .select('folder_id')
      .eq('user_id', userId)

    if (countsError) throw countsError

    // Count forms per folder
    const counts = formCounts?.reduce((acc: Record<string, number>, form) => {
      if (form.folder_id) {
        acc[form.folder_id] = (acc[form.folder_id] || 0) + 1
      }
      return acc
    }, {})

    // Attach counts to folders
    const foldersWithCounts = folders?.map(folder => ({
      ...folder,
      form_count: counts?.[folder.id] || 0
    }))

    return { data: foldersWithCounts, error: null }
  } catch (error) {
    console.error('Error fetching folders:', error)
    return { data: null, error }
  }
}

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  folderData: CreateFolderData
): Promise<{ data: Folder | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('form_folders')
      .insert({
        user_id: userId,
        name: folderData.name,
        description: folderData.description || null,
        color: folderData.color || '#FF6B35'
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating folder:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing folder
 */
export async function updateFolder(
  folderId: string,
  folderData: UpdateFolderData
): Promise<{ data: Folder | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('form_folders')
      .update(folderData)
      .eq('id', folderId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating folder:', error)
    return { data: null, error }
  }
}

/**
 * Delete a folder
 * Note: Forms in this folder will have their folder_id set to NULL (handled by ON DELETE SET NULL)
 */
export async function deleteFolder(folderId: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('form_folders')
      .delete()
      .eq('id', folderId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting folder:', error)
    return { error }
  }
}

/**
 * Move a single form to a folder (or set to null for uncategorized)
 */
export async function updateFormFolder(
  formId: string,
  folderId: string | null
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('forms')
      .update({ folder_id: folderId })
      .eq('id', formId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error updating form folder:', error)
    return { error }
  }
}

/**
 * Move multiple forms to a folder (bulk operation)
 */
export async function moveFormsToFolder(
  formIds: string[],
  folderId: string | null
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('forms')
      .update({ folder_id: folderId })
      .in('id', formIds)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error moving forms to folder:', error)
    return { error }
  }
}

/**
 * Get count of uncategorized forms (forms without a folder)
 */
export async function getUncategorizedCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    const { count, error } = await supabase
      .from('forms')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('folder_id', null)

    if (error) throw error
    return { count: count || 0, error: null }
  } catch (error) {
    console.error('Error getting uncategorized count:', error)
    return { count: 0, error }
  }
}
