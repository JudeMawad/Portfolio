export function setupNavigation() {
  const header = document.querySelector("[data-site-header]");
  const menu = document.querySelector("[data-site-menu]");
  const menuToggle = document.querySelector("[data-site-menu-toggle]");
  const menuLabel = document.querySelector("[data-site-menu-label]");
  const menuLinks = [...document.querySelectorAll("[data-site-menu-link]")];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new AbortController();
  const { signal } = listeners;
  let menuOpen = false;
  let scrollFrame = 0;
  let focusTimer = 0;
  let focusFrame = 0;
  let previouslyFocused = null;
  const updateHeader = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);

    scrollFrame = 0;
  };

  const requestScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateHeader);
  };

  const setMenu = (shouldOpen, returnFocus = true) => {
    if (!menu || !menuToggle) return;
    window.clearTimeout(focusTimer);
    window.cancelAnimationFrame(focusFrame);
    menuOpen = shouldOpen;

    if (shouldOpen) previouslyFocused = document.activeElement;

    menu.classList.toggle("is-open", shouldOpen);
    header?.classList.toggle("is-menu-open", shouldOpen);
    document.documentElement.classList.toggle("site-menu-lock", shouldOpen);
    document.body?.classList.toggle("site-menu-lock", shouldOpen);
    menu.setAttribute("aria-hidden", String(!shouldOpen));
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
    if (menuLabel) menuLabel.textContent = shouldOpen ? "Close" : "Menu";

    if (shouldOpen) {
      // Focus after the open state reaches layout, including reduced motion.
      focusTimer = window.setTimeout(() => {
        focusFrame = window.requestAnimationFrame(() => {
          if (menuOpen) menuLinks[0]?.focus();
        });
      }, reduceMotion.matches ? 0 : 260);
    } else if (returnFocus && previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
  };

  const trapMenuFocus = (event) => {
    if (!menuOpen || event.key !== "Tab" || !menu || !menuToggle) return;
    const focusable = [
      menuToggle,
      ...menu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  menuToggle?.addEventListener("click", () => setMenu(!menuOpen), { signal });
  menuLinks.forEach((link) => link.addEventListener("click", () => setMenu(false, false), { signal }));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) setMenu(false);
    trapMenuFocus(event);
  }, { signal });

  window.addEventListener("resize", () => {
    if (menuOpen && window.innerWidth > 1050) setMenu(false, false);
  }, { passive: true, signal });

  window.addEventListener("scroll", requestScrollUpdate, { passive: true, signal });
  updateHeader();

  return { dispose() {
    setMenu(false, false);
    listeners.abort();
    window.cancelAnimationFrame(scrollFrame);
  } };
}
