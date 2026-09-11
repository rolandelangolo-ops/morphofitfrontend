import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../AuthContext'
import { api, type UserPublic } from '../../api'
import { getSocket } from '../../socket'
import { C, FONT } from '../ui/tokens'
import { AppIcon } from '../ui/icons'

type CallPhase = 'outgoing' | 'incoming' | 'active' | 'ended'

interface CallState {
  phase: CallPhase
  conversationId: string
  counterpart: UserPublic
}

interface CallContextValue {
  startCall: (counterpart: UserPublic, conversationId: string) => void
}

const CallContext = createContext<CallContextValue | null>(null)

/** Global call-signaling layer, mounted once in AppShell so an incoming
 * call rings no matter which page the recipient is on — matching real
 * messaging-app behavior rather than only working inside an open chat
 * thread. Explicitly signaling-only: ring/accept/decline/live-timer state
 * is driven by real socket events between both users (see
 * MorphofitBackend/src/sockets/index.js's call:* relay), but there is no
 * actual audio/video — no WebRTC/telephony infra exists to carry it. */
export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [call, setCall] = useState<CallState | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => {
    if (!user) return
    const socket = getSocket()

    const onInvite = async ({ conversationId, fromUserId }: { conversationId: string; fromUserId: string }) => {
      try {
        const counterpart = await api.users.getById(fromUserId)
        setCall({ phase: 'incoming', conversationId, counterpart })
      } catch {
        // Caller's profile vanished (e.g. deactivated mid-call) — nothing to ring for.
      }
    }
    const onAccept = () => {
      setCall((c) => (c ? { ...c, phase: 'active' } : c))
      setElapsed(0)
      stopTimer()
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
    const onDeclineOrEnd = () => {
      stopTimer()
      setCall((c) => (c ? { ...c, phase: 'ended' } : c))
      setTimeout(() => setCall(null), 1200)
    }

    socket.on('call:invite', onInvite)
    socket.on('call:accept', onAccept)
    socket.on('call:decline', onDeclineOrEnd)
    socket.on('call:end', onDeclineOrEnd)
    return () => {
      socket.off('call:invite', onInvite)
      socket.off('call:accept', onAccept)
      socket.off('call:decline', onDeclineOrEnd)
      socket.off('call:end', onDeclineOrEnd)
    }
  }, [user])

  const startCall = useCallback((counterpart: UserPublic, conversationId: string) => {
    setCall({ phase: 'outgoing', conversationId, counterpart })
    getSocket().emit('call:invite', { toUserId: counterpart.id, conversationId })
  }, [])

  const accept = () => {
    if (!call) return
    getSocket().emit('call:accept', { toUserId: call.counterpart.id, conversationId: call.conversationId })
    setCall({ ...call, phase: 'active' })
    setElapsed(0)
    stopTimer()
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }
  const decline = () => {
    if (!call) return
    getSocket().emit('call:decline', { toUserId: call.counterpart.id, conversationId: call.conversationId })
    stopTimer()
    setCall(null)
  }
  const end = () => {
    if (!call) return
    getSocket().emit('call:end', { toUserId: call.counterpart.id, conversationId: call.conversationId })
    stopTimer()
    setCall(null)
  }

  return (
    <CallContext.Provider value={{ startCall }}>
      {children}
      {createPortal(
        <AnimatePresence>
          {call && <CallModal call={call} elapsed={elapsed} onAccept={accept} onDecline={decline} onEnd={end} />}
        </AnimatePresence>,
        document.body
      )}
    </CallContext.Provider>
  )
}

export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used within a CallProvider')
  return ctx
}

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function CallModal({ call, elapsed, onAccept, onDecline, onEnd }: {
  call: CallState; elapsed: number; onAccept: () => void; onDecline: () => void; onEnd: () => void
}) {
  const { counterpart, phase } = call
  const statusLabel = phase === 'outgoing' ? 'Calling…' : phase === 'incoming' ? 'Incoming call' : phase === 'active' ? formatElapsed(elapsed) : 'Call ended'

  return (
    <motion.div
      className="fixed inset-0 z-[1300] flex flex-col items-center justify-between p-8"
      style={{ background: 'rgba(10,10,13,0.94)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 ${phase === 'incoming' || phase === 'outgoing' ? 'animate-pulse' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.2)', background: C.forest }}>
          {counterpart.avatarUrl ? (
            <img src={counterpart.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span style={{ fontFamily: FONT.serif, color: '#fff' }} className="text-4xl font-bold">{counterpart.name[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <div style={{ fontFamily: FONT.serif, color: '#fff' }} className="text-xl font-bold">{counterpart.name}</div>
          <div style={{ fontFamily: FONT.mono, color: 'rgba(255,255,255,0.6)' }} className="mt-1 text-xs uppercase tracking-[0.2em]">{statusLabel}</div>
        </div>
      </div>

      <div className="flex items-center gap-6 pb-4">
        {phase === 'incoming' && (
          <>
            <button onClick={onDecline} aria-label="Decline" className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--status-error-text)' }}>
              <AppIcon name="phoneOff" size={22} style={{ color: '#fff' }} />
            </button>
            <button onClick={onAccept} aria-label="Accept" className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.forest }}>
              <AppIcon name="phone" size={22} style={{ color: '#fff' }} />
            </button>
          </>
        )}
        {(phase === 'outgoing' || phase === 'active') && (
          <button onClick={onEnd} aria-label="End call" className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--status-error-text)' }}>
            <AppIcon name="phoneOff" size={22} style={{ color: '#fff' }} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
