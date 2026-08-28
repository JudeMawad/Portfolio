(() => {
  "use strict";

  const initializeHero = () => {
    const hero = document.querySelector("[data-hero]");
    const header = document.querySelector("[data-site-header]");
    const menu = document.querySelector("[data-site-menu]");
    const menuToggle = document.querySelector("[data-site-menu-toggle]");
    const menuLabel = document.querySelector("[data-site-menu-label]");
    const menuLinks = [...document.querySelectorAll("[data-site-menu-link]")];

    if (!hero || hero.dataset.heroInitialized === "true") return;
    hero.dataset.heroInitialized = "true";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let menuOpen = false;
    let scrollFrame = 0;
    let previouslyFocused = null;

    const updateHeader = () => {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);

      if (!reduceMotion.matches) {
        hero.style.setProperty("--hero-scroll", Math.min(window.scrollY, window.innerHeight).toFixed(1));
      }
      scrollFrame = 0;
    };

    const requestScrollUpdate = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateHeader);
    };

    const setMenu = (shouldOpen, returnFocus = true) => {
      if (!menu || !menuToggle) return;
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
        window.setTimeout(() => menuLinks[0]?.focus(), reduceMotion.matches ? 0 : 260);
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

    menuToggle?.addEventListener("click", () => setMenu(!menuOpen));
    menuLinks.forEach((link) => link.addEventListener("click", () => setMenu(false, false)));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) setMenu(false);
      trapMenuFocus(event);
    });

    window.addEventListener("resize", () => {
      if (menuOpen && window.innerWidth > 1050) setMenu(false, false);
    }, { passive: true });

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    updateHeader();

    const clock = hero.querySelector("[data-hero-time]");
    const clockMain = hero.querySelector("[data-hero-time-main]");
    const secondsTile = hero.querySelector("[data-hero-time-seconds]");
    const secondsValue = hero.querySelector("[data-hero-seconds-value]");
    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    let previousSecond = "";

    const updateBrunswickTime = () => {
      if (!clock || !clockMain || !secondsTile || !secondsValue) return;

      const now = new Date();
      const parts = Object.fromEntries(
        timeFormatter.formatToParts(now).map(({ type, value }) => [type, value])
      );
      const currentSecond = parts.second;
      const readableTime = `${parts.hour}:${parts.minute}:${currentSecond}`;

      clockMain.textContent = `${parts.hour}:${parts.minute}`;
      secondsValue.textContent = currentSecond;
      clock.dateTime = now.toISOString();
      clock.setAttribute("aria-label", `Current time in Brunswick: ${readableTime}`);

      if (previousSecond && currentSecond !== previousSecond && !reduceMotion.matches) {
        secondsTile.classList.remove("is-flipping");
        void secondsTile.offsetWidth;
        secondsTile.classList.add("is-flipping");
      }

      previousSecond = currentSecond;
    };

    updateBrunswickTime();
    window.setInterval(updateBrunswickTime, 1000);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => hero.classList.add("hero-ready"));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeHero, { once: true });
  } else {
    initializeHero();
  }
})();
