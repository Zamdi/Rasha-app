/**
 * fetch with a deadline.
 *
 * The API runs on Render's free tier, which spins the instance down after
 * ~15 minutes of inactivity. The first request after that has to wait for a
 * cold start — routinely 30-60 seconds. Plain fetch has no timeout, so a
 * request made while the server is waking would sit unresolved for as long as
 * the browser felt like waiting, leaving the page stuck on its loading state
 * with nothing to tell the customer what was happening.
 *
 * @param {string} url
 * @param {RequestInit & { timeout?: number }} options
 */
export function fetchWithTimeout(url, { timeout = 20000, ...options } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

/** True when a rejection came from our own timeout rather than the network. */
export const isTimeout = (err) => err?.name === 'AbortError'

/**
 * Wake the API and resolve once it answers, so the pages that need data aren't
 * each independently absorbing the cold start.
 */
export function warmUp(apiBase, timeout = 60000) {
  return fetchWithTimeout(`${apiBase}/health`, { timeout }).catch(() => null)
}
