export function setupProjectReveal() {
  const listeners = new AbortController();
  const { signal } = listeners;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.matches || !("IntersectionObserver" in window)) return;

  const nodes = [...document.querySelectorAll("[data-reveal]")];
  const pending = new Set(nodes);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, { rootMargin: "0px 0px -24px 0px", threshold: 0 });

  function reveal(node, animate = true) {
    const wasPending = pending.delete(node);
    observer.unobserve(node);
    if (!animate || motionQuery.matches) node.classList.remove("reveal-enabled", "is-visible");
    else if (wasPending) node.classList.add("is-visible");
  }

  nodes.forEach((node) => {
    if (node.contains(document.activeElement)) {
      reveal(node, false);
      return;
    }
    node.classList.add("reveal-enabled");
    observer.observe(node);
  });

  // Keyboard focus must never land in transparent content.
  document.addEventListener("focusin", (event) => {
    let node = event.target.closest("[data-reveal]");
    while (node) {
      reveal(node, false);
      node = node.parentElement?.closest("[data-reveal]");
    }
  }, { signal });

  motionQuery.addEventListener("change", (event) => {
    if (!event.matches) return;
    observer.disconnect();
    nodes.forEach((node) => reveal(node, false));
  }, { signal });
  return { dispose() { listeners.abort(); observer.disconnect(); } };
}
