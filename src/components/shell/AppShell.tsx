import { Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { pageVariants, pageTransition } from '../ui/motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { CommandPaletteProvider } from './CommandPalette'
import { CallProvider } from './CallProvider'
import { OfflineBanner } from '../ui/StatusBanner'
import { SupportRequestProvider } from '../../SupportRequestContext'

export function AppShell() {
  const loc = useLocation()
  const reduceMotion = useReducedMotion()

  return (
    <CommandPaletteProvider>
      <CallProvider>
        <SupportRequestProvider>
          <div
            className="fixed inset-0 w-full overflow-hidden text-ink"
            style={{ background: 'var(--gradient-surface)' }}
          >
            <OfflineBanner />
            <div className="mx-auto flex h-full max-w-[1600px] flex-col lg:flex-row">
              <Sidebar />

              <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
                <TopBar />

                <main
                  className="min-h-0 overflow-y-auto overscroll-contain"
                  style={{ touchAction: 'pan-y' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={loc.pathname}
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={reduceMotion ? { duration: 0 } : pageTransition}
                      className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12"
                    >
                      <Outlet />
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>
            </div>

            <BottomNav />
          </div>
        </SupportRequestProvider>
      </CallProvider>
    </CommandPaletteProvider>
  )
}

export default AppShell
