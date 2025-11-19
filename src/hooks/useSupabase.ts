import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

/**
 * Generic hook for managing CRUD operations with Supabase
 */
export function useSupabaseCRUD<T extends { id: string }>(
  table: string,
  options?: {
    select?: string
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
    filters?: Record<string, any>
  }
) {
  const { user } = useAuth()
  const { push } = useToast()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from(table)
        .select(options?.select || '*')

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      // Apply default user filter if no custom filters
      if (!options?.filters) {
        query = query.eq('user_id', user.id)
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options?.orderDirection === 'asc' 
        })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data: result, error } = await query as { data: T[] | null, error: any }

      if (error) throw error
      setData(result || [])
    } catch (error) {
      console.error(`Error fetching ${table}:`, error)
      push({ type: 'error', message: `Error loading ${table}` })
    } finally {
      setLoading(false)
    }
  }, [user, table, options, push])

  const create = useCallback(async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      push({ type: 'error', message: 'You must be signed in' })
      return null
    }

    try {
      setSaving(true)
      const { data: result, error } = await supabase
        .from(table)
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single() as { data: T | null, error: any }

      if (error) throw error
      
      if (result) {
        setData(prev => [result, ...prev])
        push({ type: 'success', message: `${table.slice(0, -1)} created successfully` })
      }
      return result
    } catch (error) {
      console.error(`Error creating ${table.slice(0, -1)}:`, error)
      push({ type: 'error', message: `Error creating ${table.slice(0, -1)}` })
      return null
    } finally {
      setSaving(false)
    }
  }, [user, table, push])

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ))
      push({ type: 'success', message: `${table.slice(0, -1)} updated successfully` })
      return true
    } catch (error) {
      console.error(`Error updating ${table.slice(0, -1)}:`, error)
      push({ type: 'error', message: `Error updating ${table.slice(0, -1)}` })
      return false
    } finally {
      setSaving(false)
    }
  }, [table, push])

  const remove = useCallback(async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${table.slice(0, -1)}?`)) {
      return false
    }

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setData(prev => prev.filter(item => item.id !== id))
      push({ type: 'success', message: `${table.slice(0, -1)} deleted successfully` })
      return true
    } catch (error) {
      console.error(`Error deleting ${table.slice(0, -1)}:`, error)
      push({ type: 'error', message: `Error deleting ${table.slice(0, -1)}` })
      return false
    }
  }, [table, push])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    saving,
    refetch: fetchData,
    create,
    update,
    remove
  }
}

/**
 * Hook for managing form state with validation
 */
export function useFormState<T>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const validateField = useCallback((field: keyof T, value: any) => {
    if (!validationRules?.[field]) return undefined
    return validationRules[field](value)
  }, [validationRules])

  const validateForm = useCallback(() => {
    if (!validationRules) return true

    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(validationRules).forEach(key => {
      const field = key as keyof T
      const error = validateField(field, values[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validationRules, validateField])

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

/**
 * Hook for managing loading states with automatic cleanup
 */
export function useLoadingState(initialState = false) {
  const [loading, setLoading] = useState(initialState)

  const withLoading = useCallback(async <T>(
    asyncFunction: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true)
      return await asyncFunction()
    } catch (error) {
      console.error('Error in async operation:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, setLoading, withLoading }
}
