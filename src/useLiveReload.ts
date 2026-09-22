import { useEffect, useRef } from 'react'
import type { AppNotification } from './api'
import { getSocket } from './socket'

/**
 * Keeps a page's data live without polling. Calls `reload` when:
 *  - a `notification:new` of one of the given `types` arrives (the backend
 *    pushes every notify() to the recipient's own socket room, so this works
 *    wherever the user is in the app, whichever record is currently open);
 *  - the socket reconnects, since events sent while it was down are lost;
 *  - a backgrounded tab becomes visible again (mobile browsers suspend
 *    sockets), throttled so tab-flicking doesn't hammer the API.
 *
 * `reload` should be a silent refresh (no loading skeleton, no error banner on
 * failure): it runs behind whatever the user is currently doing.
 */
export function useLiveReload(types: string[], reload: () => void) {
  const latest = useRef(reload)
  latest.current = reload
  const key = types.join('|')

  useEffect(() => {
    const socket = getSocket()
    const wanted = key.split('|')
    let lastRun = 0
    const run = () => {
      lastRun = Date.now()
      latest.current()
    }
    const onNotification = (n: AppNotification) => {
      if (wanted.includes(n.type)) run()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRun > 5000) run()
    }
    socket.on('notification:new', onNotification)
    socket.on('connect', run) // fires again only after a reconnect; the first connect precedes this hook
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      socket.off('notification:new', onNotification)
      socket.off('connect', run)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [key])
}
