import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { slideInRight } from '@/components/ui/motion'
import { AppIcon } from '@/components/ui/icons'
import { EmptyState } from '@/components/ui/EmptyState'

export interface MasterDetailProps {
  masterContent: ReactNode
  detailContent: ReactNode | null
  detailPlaceholder?: ReactNode
  hasSelection: boolean
  onBack: () => void
  backLabel?: string
  masterWidth?: 'narrow' | 'default' | 'wide'
  className?: string
}

export function MasterDetail({
  masterContent,
  detailContent,
  detailPlaceholder,
  hasSelection,
  onBack,
  backLabel = 'Back',
  masterWidth = 'default',
  className = '',
}: MasterDetailProps) {
  const masterColSpan =
    masterWidth === 'narrow'
      ? 'lg:col-span-3'
      : masterWidth === 'wide'
      ? 'lg:col-span-5'
      : 'lg:col-span-4'

  const detailColSpan =
    masterWidth === 'narrow'
      ? 'lg:col-span-9'
      : masterWidth === 'wide'
      ? 'lg:col-span-7'
      : 'lg:col-span-8'

  return (
    <div className={`w-full ${className}`}>
      {/* ── Mobile Layout (< lg) ────────────────────────────────────────── */}
      <div className="block lg:hidden">
        <AnimatePresence mode="wait" initial={false}>
          {!hasSelection ? (
            <motion.div
              key="master"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {masterContent}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              variants={slideInRight}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full"
            >
              <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-parchment-dark bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-parchment active:scale-95"
              >
                <AppIcon name="chevronLeft" size={16} />
                <span>{backLabel}</span>
              </button>
              {detailContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop Layout (>= lg) ───────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
        <div className={masterColSpan}>{masterContent}</div>
        <div className={detailColSpan}>
          {hasSelection && detailContent ? (
            detailContent
          ) : detailPlaceholder ? (
            detailPlaceholder
          ) : (
            <EmptyState
              icon="sparkles"
              title="No item selected"
              description="Choose an item from the list to view specifications, actions, and details."
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default MasterDetail
