import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { type StatusTone, STATUS_TONE_VARS } from './tokens'
import { AppIcon, type IconName } from './icons'

export function StatusBanner({
  show,
  icon,
  label,
  tone = 'neutral',
}: {
  show: boolean
  icon: IconName
  label: string
  tone?: StatusTone
}) {
  const { bg, text } = STATUS_TONE_VARS[tone]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-x-0 top-4 z-[1050] flex justify-center px-4"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div
            className="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold font-body shadow-lg border border-black/5"
            style={{ background: bg, color: text }}
          >
            <AppIcon name={icon} size={14} strokeWidth={2.25} />
            <span>{label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  )

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return (
    <StatusBanner
      show={!online}
      icon="alert"
      label="You're offline — changes will sync once you're back online."
      tone="warning"
    />
  )
}

export default StatusBanner
