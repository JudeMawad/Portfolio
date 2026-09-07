/** The native cursor remains available until this enhancement is active. */
export function setupCursor() {
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const listeners = new AbortController();
  const { signal } = listeners;
  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let frame = 0;
  let enabled = false;

  const stop = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
  };
  const render = () => {
    frame = 0;
    if (!enabled) return;
    ringX += (mouseX - ringX) * .16;
    ringY += (mouseY - ringY) * .16;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    if (Math.hypot(mouseX - ringX, mouseY - ringY) > .1) frame = window.requestAnimationFrame(render);
  };
  const sync = () => {
    enabled = !motion.matches && pointer.matches && !document.hidden;
    document.documentElement.classList.toggle("has-custom-cursor", enabled);
    if (!enabled) stop();
  };

  window.addEventListener("pointermove", (event) => {
    if (!enabled) return;
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    if (!frame) frame = window.requestAnimationFrame(render);
  }, { passive: true, signal });
  document.addEventListener("pointerover", (event) => {
    if (enabled) ring.classList.toggle("is-active", Boolean(event.target.closest("a, button, [data-cursor]")));
  }, { signal });
  motion.addEventListener("change", sync, { signal });
  pointer.addEventListener("change", sync, { signal });
  document.addEventListener("visibilitychange", sync, { signal });
  sync();

  return { dispose() {
    listeners.abort();
    stop();
    document.documentElement.classList.remove("has-custom-cursor");
  } };
}
