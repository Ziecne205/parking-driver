// One-shot MSW initialization.
//
// React Strict Mode (and remounts) invoke the Providers effect more than once, which
// previously called worker.start() repeatedly and could leave the service worker in a
// "redundant"/uncontrolled state — the symptom was /api/* intermittently 404-ing
// mid-session. We memoize the init promise so registration happens exactly once per
// page load; every caller awaits the same promise.
let initPromise: Promise<void> | null = null

async function doInit(): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side (SSR) — Node interceptor.
    const { setupServer } = await import('msw/node')
    const { handlers } = await import('./handlers')
    setupServer(...handlers).listen({ onUnhandledRequest: 'bypass' })
    return
  }

  const { worker } = await import('./browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    // Explicit URL + scope so the worker reliably controls the whole app.
    serviceWorker: { url: '/mockServiceWorker.js', options: { scope: '/' } },
    quiet: true,
  })
}

export function initMocks(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit().catch((err) => {
      // Reset so a later attempt can retry instead of being stuck on a failed promise.
      initPromise = null
      throw err
    })
  }
  return initPromise
}
