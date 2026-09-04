(() => {
  "use strict";

  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  const shouldStartAtTop = !window.location.hash && navigationEntry?.type !== "back_forward";
  if (shouldStartAtTop) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    resetScroll();
    window.addEventListener("load", () => {
      resetScroll();
      window.requestAnimationFrame(() => {
        resetScroll();
        if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      });
    }, { once: true });
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-project-header]");
  const progress = document.querySelector(".scroll-progress");
  const heroVisual = document.querySelector("[data-hero-visual]");
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  const firmwareAge = document.querySelector("[data-firmware-age]");

  const getBerlinDate = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  };

  const getCalendarAge = (start, end) => {
    let years = end.getUTCFullYear() - start.getUTCFullYear();
    let cursor = new Date(Date.UTC(start.getUTCFullYear() + years, start.getUTCMonth(), start.getUTCDate()));
    if (cursor > end) {
      years -= 1;
      cursor = new Date(Date.UTC(start.getUTCFullYear() + years, start.getUTCMonth(), start.getUTCDate()));
    }

    let months = (end.getUTCFullYear() - cursor.getUTCFullYear()) * 12 + end.getUTCMonth() - cursor.getUTCMonth();
    let monthCursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + months, cursor.getUTCDate()));
    if (monthCursor > end) {
      months -= 1;
      monthCursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + months, cursor.getUTCDate()));
    }

    const remainingDays = Math.floor((end - monthCursor) / 86400000);
    return { years, months, weeks: Math.floor(remainingDays / 7), days: remainingDays % 7 };
  };

  const updateFirmwareAge = () => {
    if (!firmwareAge) return;
    const age = getCalendarAge(new Date(Date.UTC(2025, 0, 18)), getBerlinDate());
    firmwareAge.textContent = `${age.years}y ${age.months}month ${age.weeks}w ${age.days}d`;
  };

  const flowDetails = {
    request: ["STEP 01", "Request", "I choose a film or series I want to add. This is the only part of the workflow that needs a manual decision."],
    overseerr: ["STEP 02", "Overseerr", "Overseerr receives the request and sends it to the correct organiser for a series or a film."],
    arr: ["STEP 03", "Sonarr / Radarr", "Sonarr handles series and Radarr handles films. They keep track of what was requested and pass the search forward."],
    prowlarr: ["STEP 04", "Prowlarr", "Prowlarr handles the search side and returns a suitable result to the service that asked for it."],
    qbittorrent: ["STEP 05", "qBittorrent", "qBittorrent receives the job and handles the download before the file moves into the media library."],
    library: ["STEP 06", "Library", "The completed file reaches the organised library path shared by the automation services and Jellyfin."],
    jellyfin: ["STEP 07", "Jellyfin", "Jellyfin sees the library update and makes the media available to watch from the devices I use."],
  };

  const flowNodes = [...document.querySelectorAll("[data-flow-step]")];
  const flowNumber = document.querySelector("[data-flow-number]");
  const flowTitle = document.querySelector("[data-flow-title]");
  const flowDetail = document.querySelector("[data-flow-detail]");

  const setFlowStep = (key) => {
    const detail = flowDetails[key];
    if (!detail) return;
    flowNodes.forEach((node) => {
      const isActive = node.dataset.flowStep === key;
      node.classList.toggle("is-active", isActive);
      node.setAttribute("aria-pressed", String(isActive));
    });
    if (flowNumber) flowNumber.textContent = detail[0];
    if (flowTitle) flowTitle.textContent = detail[1];
    if (flowDetail) flowDetail.textContent = detail[2];
  };

  flowNodes.forEach((node) => {
    node.addEventListener("click", () => setFlowStep(node.dataset.flowStep));
    node.addEventListener("mouseenter", () => setFlowStep(node.dataset.flowStep));
  });

  const revealContent = () => {
    if (motionQuery.matches || !("IntersectionObserver" in window)) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: .08 });

    revealNodes.forEach((node) => observer.observe(node));
  };

  let scrollFrame = 0;
  const updateScrollEffects = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progressAmount = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progress) progress.style.transform = `scaleX(${progressAmount})`;

    if (heroVisual) {
      const shift = motionQuery.matches ? 0 : Math.min(window.scrollY, window.innerHeight) * -.045;
      heroVisual.style.setProperty("--hero-shift", shift.toFixed(2));
    }
    scrollFrame = 0;
  };

  const queueScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate, { passive: true });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: motionQuery.matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", link.getAttribute("href"));
  });

  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!motionQuery.matches && dot && ring && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let cursorFrame = 0;

    const renderCursor = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      if (Math.hypot(mouseX - ringX, mouseY - ringY) > .1 && !document.hidden) cursorFrame = window.requestAnimationFrame(renderCursor);
      else cursorFrame = 0;
    };

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      if (!cursorFrame) cursorFrame = window.requestAnimationFrame(renderCursor);
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      ring.classList.toggle("is-active", Boolean(event.target.closest("a, button, [data-cursor]")));
    });
  }

  revealContent();
  updateFirmwareAge();
  window.setInterval(updateFirmwareAge, 60 * 60 * 1000);
  updateScrollEffects();
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.body.classList.add("is-ready")));
})();
