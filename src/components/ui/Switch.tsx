import { motion, useReducedMotion } from 'framer-motion'

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  const reduceMotion = useReducedMotion()

  const track = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-forest' : 'bg-parchment-dark'
      }`}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 20 : 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 500, damping: 32 }
        }
      />
    </button>
  )

  if (!label) return track

  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
      <span className="text-sm font-medium font-body text-ink">{label}</span>
      {track}
    </label>
  )
}

export default Switch
