import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type UserPublic } from '../../api'
import { AppIcon, type IconName } from '../ui/icons'
import { NAV_BY_ROLE } from './nav'

interface PaletteContextValue {
  show: () => void
}
const PaletteContext = createContext<PaletteContextValue | null>(null)

interface ResultItem {
  id: string
  icon: IconName
  title: string
  subtitle?: string
  action: () => void
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<UserPublic[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const nav = useNavigate()
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)

  const close = () => setOpen(false)
  const show = () => {
    setOpen(true)
    setQuery('')
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery('')
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40)
  }, [open])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setPeople([])
      return
    }
    const t = setTimeout(() => {
      api.users
        .search(query.trim())
        .then(setPeople)
        .catch(() => setPeople([]))
    }, 200)
    return () => clearTimeout(t)
  }, [query, open])

  const navItems: ResultItem[] = useMemo(() => {
    const items = user ? NAV_BY_ROLE[user.role] ?? [] : []
    const extra = [
      { label: 'Profile', to: '/dashboard/profile', icon: 'user' as const },
      { label: 'Settings', to: '/dashboard/settings', icon: 'settings' as const },
    ]
    return [...items, ...extra].map((item) => ({
      id: `nav-${item.to}`,
      icon: item.icon,
      title: item.label,
      subtitle: 'Navigation destination',
      action: () => {
        close()
        nav(item.to)
      },
    }))
  }, [user, nav])

  const filteredNav = query.trim()
    ? navItems.filter((i) =>
        i.title.toLowerCase().includes(query.trim().toLowerCase())
      )
    : navItems

  const peopleItems: ResultItem[] = people.map((p) => ({
    id: `person-${p.id}`,
    icon: 'message' as const,
    title: p.name,
    subtitle: `Message · ${p.role}`,
    action: async () => {
      close()
      const conversation = await api.messaging.createConversation(p.id)
      nav(`/dashboard/messages/${conversation.id}`)
    },
  }))

  const results = [...filteredNav, ...peopleItems]

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  function onKeyDownInput(e: ReactKeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[activeIndex]?.action()
    }
  }

  return (
    <PaletteContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[1200] flex items-start justify-center p-4 pt-[12vh]">
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
                onClick={close}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-parchment-dark bg-surface shadow-2xl"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
              >
                {/* Search input row */}
                <div className="flex items-center gap-3 border-b border-parchment-dark px-4 py-3.5 sm:px-5">
                  <AppIcon name="search" size={18} className="text-forest" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDownInput}
                    placeholder="Search destinations, tailors, or clients…"
                    className="flex-1 bg-transparent text-sm font-body text-ink placeholder:text-ink-subtle outline-none"
                  />
                  <kbd className="rounded-lg border border-parchment-dark bg-parchment px-2 py-0.5 text-[10px] font-data text-ink-subtle font-semibold shadow-2xs">
                    ESC
                  </kbd>
                </div>

                {/* Results list */}
                <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1">
                  {results.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm font-body text-ink-subtle">
                      No matching destinations or users found
                    </div>
                  ) : (
                    results.map((r, i) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={r.action}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                          i === activeIndex
                            ? 'bg-parchment text-ink shadow-2xs'
                            : 'hover:bg-parchment/60 text-ink-muted'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            i === activeIndex
                              ? 'border-forest bg-forest text-white shadow-xs'
                              : 'border-parchment-dark bg-surface text-forest'
                          }`}
                        >
                          <AppIcon name={r.icon} size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold font-body text-ink">
                            {r.title}
                          </span>
                          {r.subtitle && (
                            <span className="block truncate text-[10px] font-data text-ink-subtle uppercase tracking-wider">
                              {r.subtitle}
                            </span>
                          )}
                        </span>
                        {i === activeIndex && (
                          <span className="text-[10px] font-data text-ink-subtle">
                            ↵ Enter
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </PaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(PaletteContext)
  if (!ctx)
    throw new Error(
      'useCommandPalette must be used within a CommandPaletteProvider'
    )
  return ctx
}

export default CommandPaletteProvider
