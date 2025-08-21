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
            className={`max-w-sm w-full px-4 py-2 rounded-lg shadow-md text-sm text-white ${
              t.type === 'error' ? 'bg-red-600' : t.type === 'info' ? 'bg-slate-600' : 'bg-green-600'
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
