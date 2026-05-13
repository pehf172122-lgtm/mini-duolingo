import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

/* ── Types ───────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  success: (msg: string) => void
  error:   (msg: string) => void
  info:    (msg: string) => void
}

/* ── Context ─────────────────────────────────────── */
const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error:   () => {},
  info:    () => {},
})

export const useToast = () => useContext(ToastContext)

/* ── Individual toast ────────────────────────────── */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  useEffect(() => {
    const id = setTimeout(() => onRemove(toast.id), 3500)
    return () => clearTimeout(id)
  }, [toast.id, onRemove])

  const icons: Record<ToastType, string> = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
  }

  return (
    <div className={`toast toast-${toast.type}`} onClick={() => onRemove(toast.id)}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" aria-label="Cerrar">✕</button>
    </div>
  )
}

/* ── Provider ────────────────────────────────────── */
let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ctx: ToastContextType = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}