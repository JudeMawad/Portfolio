/** Shared document behavior; project animations stay in each page's entrypoint. */
export function setupProjectPage() {
  const listeners = new AbortController();
  const { signal } = listeners;
  let loadFrame = 0;
  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  const shouldStartAtTop = !window.location.hash && navigationEntry?.type !== "back_forward";

  if (shouldStartAtTop) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const resetScroll = () => {
      if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    const finishLoading = () => {
      resetScroll();
      loadFrame = window.requestAnimationFrame(() => {
        resetScroll();
        if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      });
    };
    resetScroll();
    if (document.readyState === "complete") finishLoading();
    else window.addEventListener("load", finishLoading, { once: true, signal });
  }

  const header = document.querySelector("[data-project-header]");
  const progress = document.querySelector(".scroll-progress");
  let scrollFrame = 0;

  const updateScrollState = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progress) progress.style.transform = `scaleX(${amount})`;
    scrollFrame = 0;
  };

  const queueScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  };

  window.addEventListener("scroll", queueScrollUpdate, { passive: true, signal });
  window.addEventListener("resize", queueScrollUpdate, { passive: true, signal });
  window.addEventListener("pageshow", queueScrollUpdate, { signal });
  window.addEventListener("load", queueScrollUpdate, { once: true, signal });
  updateScrollState();
  return { dispose() {
    listeners.abort();
    window.cancelAnimationFrame(scrollFrame);
    window.cancelAnimationFrame(loadFrame);
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
  } };
}
