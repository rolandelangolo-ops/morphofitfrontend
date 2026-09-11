import { motion, useReducedMotion } from 'framer-motion'
import { AppIcon, type IconName } from './icons'

export interface TabItem {
  id: string
  label: string
  icon?: IconName
}

export function Tabs({
  tabs,
  value,
  onChange,
  variant = 'underline',
}: {
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pill'
}) {
  const reduceMotion = useReducedMotion()
  const layoutId = `tabs-${variant}-indicator`

  return (
    <div
      className={`flex gap-1 ${
        variant === 'pill'
          ? 'rounded-2xl bg-parchment p-1 border border-parchment-dark/50'
          : 'border-b border-parchment-dark'
      }`}
    >
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold font-body transition-colors focus:outline-none ${
              variant === 'pill' ? 'rounded-xl' : ''
            } ${
              active
                ? variant === 'pill'
                  ? 'text-white'
                  : 'text-forest'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className={`absolute z-0 ${
                  variant === 'pill'
                    ? 'inset-0 rounded-xl bg-forest shadow-xs'
                    : 'inset-x-0 -bottom-px h-0.5 bg-forest'
                }`}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 400, damping: 34 }
                }
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {t.icon && <AppIcon name={t.icon} size={15} />}
              <span>{t.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
