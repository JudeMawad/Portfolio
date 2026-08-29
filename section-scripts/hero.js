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

    const statusLine = header?.querySelector("[data-header-status]");
    const statusText = statusLine?.querySelector("[data-header-status-text]");
    const statusExchanges = [
      { command: "~/Portfolio$ whoami", answer: "JUDE MAWAD" },
      { command: "~/Portfolio$ pwd", answer: "/home/jude/Portfolio" },
      { command: "~/Portfolio$ cat focus.txt", answer: "SOFTWARE / SYSTEMS / PRODUCT" },
      { command: "~/Portfolio$ git branch --show-current", answer: "building" },
      { command: "~/Portfolio$ git status --short", answer: "M  currently-building" },
      { command: "~/Portfolio$ ls projects/", answer: "ignite  syndexus  the-cube" },
      { command: "~/Portfolio$ echo $STATUS", answer: "ACTIVE" }
    ];
    let statusIndex = 0;
    let statusTimer = 0;

    const getStatusPause = (text, baseDuration, perCharacter, maximumDuration) => (
      Math.min(maximumDuration, baseDuration + text.length * perCharacter)
    );

    const stopStatusAnimation = () => {
      window.clearTimeout(statusTimer);
      statusTimer = 0;
    };

    const typeStatusText = (text, characterDelay, onComplete) => {
      if (!statusText || reduceMotion.matches) return;
      let characterIndex = 0;
      statusText.textContent = "";
      statusLine?.classList.add("is-typing");

      const typeNextCharacter = () => {
        if (reduceMotion.matches || !statusText) {
          configureStatusAnimation();
          return;
        }

        characterIndex += 1;
        statusText.textContent = text.slice(0, characterIndex);

        if (characterIndex < text.length) {
          statusTimer = window.setTimeout(typeNextCharacter, characterDelay);
          return;
        }

        statusLine?.classList.remove("is-typing");
        onComplete();
      };

      statusTimer = window.setTimeout(typeNextCharacter, characterDelay);
    };

    const switchStatusText = (isAnswer, text, characterDelay, onComplete) => {
      statusLine?.classList.add("is-switching");
      statusTimer = window.setTimeout(() => {
        statusLine?.classList.toggle("is-answer", isAnswer);
        statusLine?.classList.remove("is-switching");
        typeStatusText(text, characterDelay, onComplete);
      }, 140);
    };

    const runStatusExchange = (transitionIn = false) => {
      if (!statusText || reduceMotion.matches) return;
      const exchange = statusExchanges[statusIndex];

      const showAnswer = () => {
        statusTimer = window.setTimeout(() => {
          switchStatusText(true, exchange.answer, 38, () => {
            statusTimer = window.setTimeout(() => {
              statusIndex = (statusIndex + 1) % statusExchanges.length;
              runStatusExchange(true);
            }, getStatusPause(exchange.answer, 1900, 40, 3100));
          });
        }, getStatusPause(exchange.command, 850, 18, 1600));
      };

      if (transitionIn) {
        switchStatusText(false, exchange.command, 58, showAnswer);
        return;
      }

      statusLine?.classList.remove("is-answer");
      typeStatusText(exchange.command, 58, showAnswer);
    };

    const configureStatusAnimation = () => {
      stopStatusAnimation();
      statusIndex = 0;
      statusLine?.classList.remove("is-typing", "is-switching");
      statusLine?.classList.toggle("is-answer", reduceMotion.matches);
      if (statusText) statusText.textContent = reduceMotion.matches
        ? statusExchanges[0].answer
        : "";
      if (!reduceMotion.matches) runStatusExchange();
    };

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", configureStatusAnimation);
    } else if (typeof reduceMotion.addListener === "function") {
      reduceMotion.addListener(configureStatusAnimation);
    }
    configureStatusAnimation();

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
