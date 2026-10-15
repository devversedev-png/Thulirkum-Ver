/**
 * Desktop zoom lock ("fit to width")
 * ------------------------------------------------------------------
 * Problem: browser zoom (Ctrl +/-) shrinks the CSS viewport. At 125% / 150%
 * / 175% / 200% the page suddenly matches the tablet / mobile @media rules
 * and the desktop layout collapses (header re-flows, hero stacks, cards
 * break alignment ...).
 *
 * Fix: on devices with a mouse/trackpad (pointer: fine) the site always
 * renders the SAME desktop layout, laid out on a canvas that is
 * CANVAS_WIDTH px wide.  When the real window is narrower than that
 * (because the user zoomed in or the window is small) the canvas is scaled
 * down with CSS `zoom` so the layout looks identical – nothing collapses.
 *
 * Phones / tablets (pointer: coarse) are NOT touched – they keep the normal
 * responsive layout.
 *
 * Works together with styles.css:
 *   1. every @media (max-width < CANVAS_WIDTH) rule is limited to
 *      `(pointer: coarse)` devices, so desktops never switch to them;
 *   2. every vw / vh / dvh / svh length is written as
 *      calc(N * var(--vw, 1vw)) so it follows the scaled canvas.
 *
 * Keep CANVAS_WIDTH in sync with the gating done in styles.css (1280).
 */
export const CANVAS_WIDTH = 1280
const MIN_SCALE = 0.2

const html = document.documentElement
const finePointer = window.matchMedia('(pointer: fine)')

const VARS = ['--fit-scale', '--vw', '--vh', '--dvh', '--svh', '--lvh']

function reset() {
  html.classList.remove('desktop-fit')
  VARS.forEach((name) => html.style.removeProperty(name))
}

function apply() {
  const width = window.innerWidth
  const height = window.innerHeight

  // Touch devices and normal / wide desktop windows: nothing to do.
  if (!finePointer.matches || width >= CANVAS_WIDTH) {
    reset()
    return
  }

  const scale = Math.max(MIN_SCALE, width / CANVAS_WIDTH)

  // 1vw / 1vh expressed in *zoomed* px so that after the zoom is applied
  // they are still exactly 1% of the real window.
  const vw = `${width / (100 * scale)}px`
  const vh = `${height / (100 * scale)}px`

  html.style.setProperty('--fit-scale', String(scale))
  html.style.setProperty('--vw', vw)
  ;['--vh', '--dvh', '--svh', '--lvh'].forEach((name) =>
    html.style.setProperty(name, vh)
  )
  html.classList.add('desktop-fit')
}

let frame = 0
function schedule() {
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    apply()
  })
}

export function initDesktopFit() {
  apply()
  window.addEventListener('resize', schedule)
  window.addEventListener('orientationchange', schedule)

  if (finePointer.addEventListener) {
    finePointer.addEventListener('change', schedule)
  } else if (finePointer.addListener) {
    finePointer.addListener(schedule)
  }
}
