/**
 * Take down the HTML splash painted by index.html.
 *
 * Called from App's mount effect rather than requestAnimationFrame: rAF does
 * not fire while a page isn't compositing — a backgrounded or throttled tab, a
 * PWA launched into the background — and if the callback never ran the splash
 * would sit over a fully working app indefinitely. A React effect fires on
 * commit regardless.
 *
 * Safe to call more than once.
 */
export function hideSplash() {
  const splash = document.getElementById('app-splash')
  if (!splash) return
  splash.classList.add('is-hiding')
  splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  // The transition won't fire under reduced-motion or in a background tab, so
  // don't make removal depend on it.
  setTimeout(() => splash.remove(), 400)
}
