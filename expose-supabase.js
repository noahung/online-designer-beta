// Script to expose Supabase client globally for diagnostic testing
// Run this in browser console BEFORE running the diagnostic

async function exposeSupabaseClient() {
  console.log('🔧 Exposing Supabase client globally...')

  try {
    // Try to find the Supabase client in the React app
    const rootElement = document.getElementById('root')
    if (!rootElement) {
      console.error('❌ Could not find root element')
      return false
    }

    // Look for Supabase in common places
    let supabaseClient = null

    // Check if it's already exposed
    if (window.supabase) {
      console.log('✅ Supabase already exposed globally')
      return true
    }

    // Try to find it in the React fiber tree (advanced)
    function findSupabaseInFiber(fiber) {
      if (!fiber) return null

      // Check if this fiber has Supabase in its state or props
      if (fiber.memoizedState) {
        const state = fiber.memoizedState
        if (state.supabase) return state.supabase
        if (state.client && state.client.from) return state.client
      }

      if (fiber.memoizedProps) {
        const props = fiber.memoizedProps
        if (props.supabase) return props.supabase
        if (props.client && props.client.from) return props.client
      }

      // Recursively search child fibers
      if (fiber.child) {
        const result = findSupabaseInFiber(fiber.child)
        if (result) return result
      }

      if (fiber.sibling) {
        const result = findSupabaseInFiber(fiber.sibling)
        if (result) return result
      }

      return null
    }

    // Get the React internal instance
    const reactInstance = rootElement._reactInternalInstance || rootElement._reactInternals
    if (reactInstance) {
      supabaseClient = findSupabaseInFiber(reactInstance)
    }

    if (supabaseClient) {
      window.supabase = supabaseClient
      console.log('✅ Successfully exposed Supabase client globally')
      console.log('🔧 You can now run the diagnostic script')
      return true
    }

    // Alternative: Try to create a new Supabase client using environment variables
    console.log('⚠️ Could not find existing Supabase client, trying to create new one...')

    // Look for environment variables in the page
    const scripts = document.querySelectorAll('script')
    let supabaseUrl = null
    let supabaseKey = null

    for (const script of scripts) {
      const content = script.innerHTML
      if (content.includes('VITE_SUPABASE_URL')) {
        const urlMatch = content.match(/VITE_SUPABASE_URL["\s]*:?\s*["']([^"']+)["']/)
        const keyMatch = content.match(/VITE_SUPABASE_ANON_KEY["\s]*:?\s*["']([^"']+)["']/)
        if (urlMatch) supabaseUrl = urlMatch[1]
        if (keyMatch) supabaseKey = keyMatch[1]
      }
    }

    if (supabaseUrl && supabaseKey) {
      // Dynamically import Supabase client
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        supabaseClient = createClient(supabaseUrl, supabaseKey)
        window.supabase = supabaseClient
        console.log('✅ Created and exposed new Supabase client')
        return true
      } catch (e) {
        console.error('❌ Failed to create Supabase client:', e)
      }
    }

    console.error('❌ Could not expose Supabase client')
    console.log('💡 Try running this from the main dashboard page after logging in')
    return false

  } catch (error) {
    console.error('❌ Error exposing Supabase client:', error)
    return false
  }
}

// Alternative simple approach - just try to find it in common locations
function simpleExpose() {
  // Check common global locations
  if (window.supabase) return true

  // Check if it's attached to any global objects
  const possibleLocations = [
    window,
    window.__APP__,
    window.__REACT_APP__,
    window.app,
    window.application
  ]

  for (const location of possibleLocations) {
    if (location && location.supabase) {
      window.supabase = location.supabase
      return true
    }
  }

  return false
}

// Try both methods
if (!simpleExpose()) {
  exposeSupabaseClient()
} else {
  console.log('✅ Supabase client found and exposed')
}