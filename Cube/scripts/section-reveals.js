// Preserve section reveals independently of the removed System Map.
export function setupSectionReveals() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealItems = [...document.querySelectorAll("[data-cube-reveal]")];
  const listeners = new AbortController();
  let observer = null;

  const showEverything = () => {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  };

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    showEverything();
  } else {
    document.documentElement.classList.add("cube-sections-ready");
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -7%",
      threshold: .08,
    });
    revealItems.forEach((item) => observer.observe(item));

    reducedMotion.addEventListener("change", (event) => {
      if (!event.matches) return;
      showEverything();
      observer.disconnect();
    }, { signal: listeners.signal });
  }

  return {
    dispose() {
      listeners.abort();
      observer?.disconnect();
    }
  };
}
