import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { PillButton } from './primitives'
import { scaleIn } from './motion'
import { AppIcon } from './icons'

const SIZES: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'sm',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal Card / Bottom Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative z-10 w-full ${SIZES[size]} max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-parchment-dark bg-surface p-6 shadow-2xl sm:rounded-3xl`}
            variants={reduceMotion ? undefined : scaleIn}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="mx-auto -mt-2 mb-4 h-1.5 w-10 rounded-full bg-parchment-dark sm:hidden" />

            {/* Header row */}
            <div className="mb-4 flex items-center justify-between">
              {title ? (
                <h2 className="text-lg font-bold font-display text-ink tracking-tight">
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-subtle hover:bg-parchment hover:text-ink transition-colors"
              >
                <AppIcon name="close" size={16} />
              </button>
            </div>

            {/* Body */}
            <div>{children}</div>

            {/* Footer */}
            {footer && (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-parchment-dark/60">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <PillButton variant="secondary" onClick={onCancel}>
            Cancel
          </PillButton>
          <PillButton
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </PillButton>
        </>
      }
    >
      {description && (
        <p className="text-sm font-body text-ink-muted leading-relaxed">
          {description}
        </p>
      )}
    </Modal>
  )
}

export default Modal
