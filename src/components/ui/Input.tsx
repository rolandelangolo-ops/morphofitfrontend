// ═══════════════════════════════════════════════════════════════════════════
// MorphoFit — Premium unified Input component
//
// Floating-label input with icon/prefix/suffix, error shake, multiline,
// full a11y. Styled exclusively via Tailwind + CSS custom properties.
// ═══════════════════════════════════════════════════════════════════════════
import { useId, useRef, useState, useEffect, type ReactNode } from 'react'
import { AppIcon } from '@/components/ui/icons'
import type { IconName } from '@/components/ui/icons'

/* ── Props ────────────────────────────────────────────────────────────────── */

export interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  icon?: IconName
  prefix?: string
  suffix?: ReactNode
  disabled?: boolean
  required?: boolean
  multiline?: boolean
  rows?: number
  className?: string
  name?: string
  autoComplete?: string
  min?: string
  max?: string
  step?: string
  onBlur?: () => void
  onFocus?: () => void
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  hint,
  icon,
  prefix,
  suffix,
  disabled = false,
  required = false,
  multiline = false,
  rows = 3,
  className,
  name,
  autoComplete,
  min,
  max,
  step,
  onBlur,
  onFocus,
}: InputProps) {
  const uid = useId()
  const inputId = `input-${uid}`
  const descId = `desc-${uid}`
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const [focused, setFocused] = useState(false)
  const [shaking, setShaking] = useState(false)
  const prevError = useRef(error)

  // Trigger shake animation when error changes to a non-empty value
  useEffect(() => {
    if (error && error !== prevError.current) {
      setShaking(true)
      const timer = setTimeout(() => setShaking(false), 400)
      return () => clearTimeout(timer)
    }
    prevError.current = error
  }, [error])

  const isFloated = focused || value.length > 0

  /* ── Padding logic ──────────────────────────────────────────────────────── */
  const hasLeading = !!(icon || prefix)
  const hasTrailing = !!suffix

  // Build left padding: icon gets pl-10, prefix gets pl based on length
  let paddingLeftClass = 'pl-4'
  if (icon && prefix) paddingLeftClass = 'pl-[4.5rem]'
  else if (icon) paddingLeftClass = 'pl-10'
  else if (prefix) paddingLeftClass = 'pl-12'

  const paddingRightClass = hasTrailing ? 'pr-10' : 'pr-4'

  /* ── Shared field classes ───────────────────────────────────────────────── */
  const fieldClasses = [
    'peer w-full rounded-xl border font-body text-sm text-ink',
    'bg-[var(--input-bg)]',
    'outline-none',
    paddingLeftClass,
    paddingRightClass,
    multiline ? 'py-3.5 resize-none' : 'py-3',
    // Normal state
    error
      ? 'border-seal ring-2 ring-seal/20'
      : focused
        ? 'border-[var(--input-border-focus)] ring-2 ring-[var(--input-ring)]'
        : 'border-[var(--input-border)]',
    // Focus-visible (keyboard nav)
    'focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2',
    // Disabled
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    // Placeholder transparent so we use the floating label instead
    'placeholder-transparent',
  ]
    .filter(Boolean)
    .join(' ')

  /* ── Floating label classes ─────────────────────────────────────────────── */
  const labelOriginLeft = icon ? 'left-10' : prefix ? 'left-12' : 'left-4'

  const labelClasses = [
    'pointer-events-none absolute font-body transition-all duration-200 ease-out',
    // Un-floated: sits as placeholder inside the field
    isFloated
      ? [
          'top-0 -translate-y-1/2 text-xs px-1.5',
          'left-3',
          'bg-[var(--input-bg)]',
          error ? 'text-seal' : focused ? 'text-forest' : 'text-ink-muted',
        ].join(' ')
      : [
          'top-1/2 -translate-y-1/2 text-sm',
          labelOriginLeft,
          'text-ink-subtle',
        ].join(' '),
  ].join(' ')

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleFocus = () => {
    setFocused(true)
    onFocus?.()
  }
  const handleBlur = () => {
    setFocused(false)
    onBlur?.()
  }
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(e.target.value)
  }

  /* ── Shared field props ─────────────────────────────────────────────────── */
  const sharedProps = {
    id: inputId,
    name,
    value,
    disabled,
    autoComplete,
    className: fieldClasses,
    placeholder: placeholder ?? label, // needed for :placeholder-shown, but hidden
    'aria-invalid': error ? (true as const) : undefined,
    // The native attribute (not just aria-required) so the browser blocks an
    // empty submit and points at the offending field — without it, a form's
    // own guard is the only thing standing between the user and a silently
    // dead submit button.
    required,
    'aria-required': required || undefined,
    'aria-describedby': error || hint ? descId : undefined,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className={['relative w-full', shaking && 'animate-shake', className].filter(Boolean).join(' ')}>
      {/* Container for the field + decorations */}
      <div className="relative">
        {/* Leading icon */}
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            <AppIcon name={icon} size={18} />
          </span>
        )}

        {/* Prefix text */}
        {prefix && (
          <span
            className={[
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-ink-muted font-body select-none',
              icon ? 'left-10' : 'left-4',
            ].join(' ')}
          >
            {prefix}
          </span>
        )}

        {/* Field */}
        {multiline ? (
          <textarea
            {...sharedProps}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
          />
        ) : (
          <input
            {...sharedProps}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            min={min}
            max={max}
            step={step}
          />
        )}

        {/* Floating label */}
        <label htmlFor={inputId} className={labelClasses}>
          {label}
          {required && <span className="ml-0.5 text-seal">*</span>}
        </label>

        {/* Suffix / trailing element */}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            {suffix}
          </span>
        )}
      </div>

      {/* Error / Hint message */}
      {(error || hint) && (
        <p
          id={descId}
          className={[
            'mt-1.5 text-xs font-body',
            error ? 'text-[var(--status-error-text)]' : 'text-ink-subtle',
          ].join(' ')}
          role={error ? 'alert' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export default Input
