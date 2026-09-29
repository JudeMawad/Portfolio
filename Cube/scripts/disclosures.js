// Native details remain functional if animation support or JavaScript is absent.
export function setupDisclosures() {
  const listeners = new AbortController();
  const { signal } = listeners;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const settleActive = [];

  document.querySelectorAll("[data-disclosure]").forEach((details) => {
    const summary = details.querySelector("summary");
    const content = details.querySelector(".cube-disclosure__content");
    if (!summary || !content) return;

    let expanded = details.open;
    let animation = null;
    const cancelAnimation = () => {
      if (!animation) return;
      animation.onfinish = null;
      animation.cancel();
      animation = null;
    };
    const settle = () => {
      cancelAnimation();
      details.open = expanded;
      details.removeAttribute("data-disclosure-state");
      content.classList.remove("is-animating");
    };
    settleActive.push(() => { if (animation) settle(); });

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      const fromHeight = details.open ? content.getBoundingClientRect().height : 0;
      expanded = animation ? !expanded : !details.open;
      cancelAnimation();

      if (reducedMotion.matches || !content.animate) {
        settle();
        return;
      }

      details.open = true;
      details.dataset.disclosureState = expanded ? "open" : "closed";
      content.classList.add("is-animating");
      const toHeight = expanded ? content.scrollHeight : 0;
      const easing = getComputedStyle(details).getPropertyValue("--cube-ease").trim() || "ease-out";
      const currentAnimation = content.animate([
        { height: `${fromHeight}px` },
        { height: `${toHeight}px` }
      ], { duration: 220, easing, fill: "both" });
      animation = currentAnimation;
      animation.onfinish = () => {
        if (animation === currentAnimation) settle();
      };
    }, { signal });
  });

  const settleAll = () => settleActive.forEach((settle) => settle());
  window.addEventListener("resize", settleAll, { passive: true, signal });
  reducedMotion.addEventListener("change", settleAll, { signal });
  return {
    dispose() {
      settleAll();
      listeners.abort();
    }
  };
}
