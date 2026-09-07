export function setupPageEffects() {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const progress = document.querySelector(".scroll-progress");
  const nodes = [...document.querySelectorAll("[data-reveal]")];
  const listeners = new AbortController();
  const { signal } = listeners;
  let observer = null;
  let frame = 0;

  const showEverything = () => {
    observer?.disconnect();
    nodes.forEach((node) => node.classList.add("is-visible"));
  };
  if (motion.matches || !("IntersectionObserver" in window)) showEverything();
  else {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .12 });
    nodes.forEach((node) => observer.observe(node));
  }

  const updateProgress = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const amount = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) progress.style.transform = `scaleX(${amount})`;
  };
  const queueProgress = () => { if (!frame) frame = window.requestAnimationFrame(updateProgress); };
  window.addEventListener("scroll", queueProgress, { passive: true, signal });
  window.addEventListener("resize", queueProgress, { passive: true, signal });
  window.addEventListener("pageshow", queueProgress, { signal });
  motion.addEventListener("change", () => { if (motion.matches) showEverything(); }, { signal });
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: motion.matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", hash);
  }, { signal });
  updateProgress();

  return { dispose() {
    listeners.abort();
    observer?.disconnect();
    window.cancelAnimationFrame(frame);
  } };
}
