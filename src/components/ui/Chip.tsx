import { motion } from 'framer-motion'

export function Chip({
  children,
  selected,
  onClick,
  tone = 'forest',
}: {
  children: string
  selected?: boolean
  onClick?: () => void
  tone?: 'forest' | 'amber'
}) {
  const selectedClass =
    tone === 'amber'
      ? 'bg-amber text-white border-amber shadow-xs'
      : 'bg-forest text-white border-forest shadow-xs'

  const unselectedClass =
    'bg-surface text-ink-muted border-parchment-dark hover:border-forest/40 hover:text-ink'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold font-body transition-colors ${
        selected ? selectedClass : unselectedClass
      }`}
    >
      {children}
    </motion.button>
  )
}

export function ChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  tone,
}: {
  options: string[]
  value: string | string[]
  onChange: (v: string | string[]) => void
  multiple?: boolean
  tone?: 'forest' | 'amber'
}) {
  const selectedSet = new Set(Array.isArray(value) ? value : [value])

  function toggle(opt: string) {
    if (multiple) {
      const arr = Array.isArray(value) ? value : []
      onChange(
        arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]
      )
    } else {
      onChange(opt)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip
          key={opt}
          selected={selectedSet.has(opt)}
          onClick={() => toggle(opt)}
          tone={tone}
        >
          {opt}
        </Chip>
      ))}
    </div>
  )
}
