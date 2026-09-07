export function setupHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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
  let clockTimer = 0;
  const syncClock = () => {
    window.clearInterval(clockTimer);
    if (!document.hidden) {
      updateBrunswickTime();
      clockTimer = window.setInterval(updateBrunswickTime, 1000);
    }
  };
  syncClock();
  document.addEventListener("visibilitychange", syncClock);

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
    window.clearInterval(clockTimer);
    window.cancelAnimationFrame(readyFrame);
    window.cancelAnimationFrame(scrollFrame);
    document.removeEventListener("visibilitychange", syncClock);
    window.removeEventListener("scroll", queueScroll);
  } };
}
