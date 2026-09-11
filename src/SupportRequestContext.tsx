import { createContext, useContext, useState, type ReactNode } from 'react'
import { SupportRequestModal, type SupportRequestPrefill } from './components/shell/SupportRequestModal'

interface SupportRequestContextValue {
  open: (prefill?: SupportRequestPrefill) => void
}

const SupportRequestContext = createContext<SupportRequestContextValue | null>(null)

/** Mounted once inside AppShell (see components/shell/AppShell.tsx) — same
 * "global modal reachable from anywhere in the dashboard" pattern as
 * CommandPaletteProvider. Renders one SupportRequestModal instance so any
 * page can call useSupportRequest().open() to launch it, contextually
 * pre-filled with the current screen via useLocation() inside the modal. */
export function SupportRequestProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [prefill, setPrefill] = useState<SupportRequestPrefill | undefined>(undefined)

  const open = (nextPrefill?: SupportRequestPrefill) => {
    setPrefill(nextPrefill)
    setIsOpen(true)
  }

  return (
    <SupportRequestContext.Provider value={{ open }}>
      {children}
      <SupportRequestModal open={isOpen} onClose={() => setIsOpen(false)} prefill={prefill} />
    </SupportRequestContext.Provider>
  )
}

export function useSupportRequest() {
  const ctx = useContext(SupportRequestContext)
  if (!ctx) throw new Error('useSupportRequest must be used within a SupportRequestProvider')
  return ctx
}
