import { useState, useRef, useEffect, useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { scaleIn } from '@/components/ui/motion'
import { AppIcon, type IconName } from '@/components/ui/icons'

export interface SelectOption {
  value: string
  label: string
  icon?: IconName
}

export interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  className?: string
  searchable?: boolean
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  className = '',
  searchable = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Focus search input when opened
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearch('')
      setHighlightIndex(-1)
    }
  }, [open, searchable])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      )
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      const opt = filteredOptions[highlightIndex]
      if (opt) {
        onChange(opt.value)
        setOpen(false)
      }
    }
  }

  const hasValue = Boolean(value)

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* ── Trigger Button ──────────────────────────────────────────────── */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group relative flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-sm transition-all focus:outline-none ${
          disabled
            ? 'cursor-not-allowed opacity-50 bg-[var(--input-bg)] border-[var(--input-border)]'
            : error
            ? 'border-seal ring-2 ring-red-500/20 bg-[var(--input-bg)]'
            : open
            ? 'border-[var(--input-border-focus)] ring-2 ring-[var(--input-ring)] bg-[var(--input-bg)]'
            : 'border-[var(--input-border)] bg-[var(--input-bg)] hover:border-forest/50'
        }`}
      >
        {/* Floating Label */}
        <span
          className={`pointer-events-none absolute left-4 transition-all duration-200 ${
            hasValue || open
              ? '-top-2.5 bg-surface px-1 text-[10px] font-semibold tracking-wider uppercase text-forest'
              : 'top-3.5 text-xs text-ink-subtle'
          }`}
        >
          {label}
          {required && <span className="text-seal ml-0.5">*</span>}
        </span>

        {/* Selected Display Value */}
        <span
          className={`truncate font-body text-sm ${
            selectedOption ? 'text-ink font-medium' : 'text-transparent'
          }`}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon && (
                <AppIcon
                  name={selectedOption.icon}
                  size={15}
                  className="text-forest shrink-0"
                />
              )}
              <span>{selectedOption.label}</span>
            </span>
          ) : (
            placeholder || label
          )}
        </span>

        {/* Right chevron */}
        <AppIcon
          name="chevronDown"
          size={16}
          className={`text-ink-subtle transition-transform duration-200 ${
            open ? 'rotate-180 text-forest' : ''
          }`}
        />
      </button>

      {/* ── Error / Hint ────────────────────────────────────────────────── */}
      {error ? (
        <p className="mt-1 text-xs text-[var(--status-error-text)] font-sans">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-subtle font-sans">{hint}</p>
      ) : null}

      {/* ── Dropdown Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit="exit"
            role="listbox"
            aria-labelledby={id}
            className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-parchment-dark bg-surface p-1 shadow-xl backdrop-blur-xl"
          >
            {searchable && (
              <div className="sticky top-0 bg-surface p-1.5 pb-2 border-b border-parchment-dark/50">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setHighlightIndex(0)
                  }}
                  placeholder="Filter options..."
                  className="w-full rounded-lg border border-parchment-dark bg-parchment px-3 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none"
                />
              </div>
            )}

            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-ink-subtle">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value
                  const isHighlighted = idx === highlightIndex

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value)
                        setOpen(false)
                      }}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-forest/10 text-forest'
                          : isHighlighted
                          ? 'bg-parchment text-ink'
                          : 'text-ink-muted hover:bg-parchment/60 hover:text-ink'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {opt.icon && (
                          <AppIcon
                            name={opt.icon}
                            size={14}
                            className={
                              isSelected ? 'text-forest' : 'text-ink-subtle'
                            }
                          />
                        )}
                        <span>{opt.label}</span>
                      </span>

                      {isSelected && (
                        <AppIcon
                          name="check"
                          size={14}
                          className="text-forest shrink-0"
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Select
