export function setupHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let readyFrame = window.requestAnimationFrame(() => {
    readyFrame = window.requestAnimationFrame(() => hero.classList.add("hero-ready"));
  });

  let scrollFrame = 0;
  const updateScroll = () => {
    scrollFrame = 0;
    if (!reduceMotion.matches) hero.style.setProperty("--hero-scroll", Math.min(window.scrollY, window.innerHeight).toFixed(1));
  };
  const queueScroll = () => { if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll); };
  window.addEventListener("scroll", queueScroll, { passive: true });
  updateScroll();
  return { dispose() {
    window.cancelAnimationFrame(readyFrame);
    window.cancelAnimationFrame(scrollFrame);
    window.removeEventListener("scroll", queueScroll);
  } };
}
