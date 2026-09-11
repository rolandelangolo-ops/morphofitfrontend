import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { STATUS_TONE_VARS, type StatusTone } from './tokens'
import { AppIcon, type IconName } from './icons'

export interface ToastOptions {
  title: string
  description?: string
  tone?: StatusTone
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastItem extends ToastOptions {
  id: string
}

const DEFAULT_DURATION = 3600

const ToastContext = createContext<{ show: (opts: ToastOptions) => void } | null>(
  null
)

const TONE_ICON: Record<StatusTone, IconName> = {
  success: 'check',
  warning: 'alert',
  error: 'close',
  info: 'info',
  neutral: 'sparkles',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: string) => {
    setItems((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((opts: ToastOptions) => {
    const id = `t${counter.current++}`
    setItems((list) => [
      { id, tone: 'neutral', duration: DEFAULT_DURATION, ...opts },
      ...list.slice(0, 2), // Keep max 3 toasts
    ])
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toaster items={items} onDismiss={remove} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

function Toaster({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[1100] flex flex-col items-center gap-2.5 px-4 lg:top-6 lg:items-end lg:px-6"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <AnimatePresence>
        {items.map((t) => (
          <ToastRow key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const reduceMotion = useReducedMotion()
  const tone = toast.tone ?? 'neutral'
  const { bg, text } = STATUS_TONE_VARS[tone]
  const duration = toast.duration ?? DEFAULT_DURATION

  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(duration)
  const startedAtRef = useRef(Date.now())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    startedAtRef.current = Date.now()
    timeoutRef.current = setTimeout(
      () => onDismiss(toast.id),
      remainingRef.current
    )
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [toast.id, onDismiss])

  const pause = () => {
    if (timeoutRef.current === null) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    remainingRef.current -= Date.now() - startedAtRef.current
    setPaused(true)
  }

  const resume = () => {
    if (timeoutRef.current !== null) return
    if (remainingRef.current <= 0) {
      onDismiss(toast.id)
      return
    }
    startedAtRef.current = Date.now()
    timeoutRef.current = setTimeout(
      () => onDismiss(toast.id),
      remainingRef.current
    )
    setPaused(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.94,
        transition: { duration: reduceMotion ? 0 : 0.15 },
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 400, damping: 32 }
      }
      className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-parchment-dark bg-surface shadow-xl"
      role={tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full shadow-xs"
          style={{ background: bg, color: text }}
        >
          <AppIcon name={TONE_ICON[tone]} size={14} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold font-body text-ink">
            {toast.title}
          </div>
          {toast.description && (
            <div className="mt-0.5 text-xs font-body text-ink-subtle leading-relaxed">
              {toast.description}
            </div>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick()
                onDismiss(toast.id)
              }}
              className="mt-2 text-xs font-semibold text-forest hover:underline focus:outline-none"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss toast"
          className="flex-shrink-0 text-ink-subtle hover:text-ink transition-colors p-1"
        >
          <AppIcon name="close" size={14} />
        </button>
      </div>

      <div className="h-0.5 w-full bg-parchment-dark/50">
        <div
          className="toast-progress-bar h-full"
          style={{
            background: text,
            animationDuration: `${duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </div>
    </motion.div>
  )
}
