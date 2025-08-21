import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: string; type?: 'success' | 'error' | 'info'; message: string }

interface ToastContextType {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    setToasts((t) => [...t, { id, ...toast }])
    // auto-remove after 4s
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full px-4 py-3 rounded-xl shadow-2xl text-sm text-white backdrop-blur-xl border animate-slide-in-right transform transition-all duration-300 hover:scale-105 ${
              t.type === 'error' 
                ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/30' 
                : t.type === 'info' 
                ? 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 border-slate-400/30' 
                : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30'
            }`}
            role="status"
            aria-live="polite"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const c = useContext(ToastContext)
  if (!c) throw new Error('useToast must be used within ToastProvider')
  return c
}

export default ToastContext
