(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopQuery = window.matchMedia("(min-width: 901px)");
  const header = document.querySelector("[data-project-header]");
  const progress = document.querySelector(".scroll-progress");
  const heroArtwork = document.querySelector("[data-hero-artwork]");
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  const systemSteps = [...document.querySelectorAll("[data-system-step]")];
  const systemPanels = [...document.querySelectorAll("[data-system-panel]")];
  const systemFlip = document.querySelector("[data-system-flip]");
  const systemLabel = document.querySelector("[data-system-label]");
  const systemCurrent = document.querySelector("[data-system-current]");
  const systemLabels = ["Nutrition", "Activity", "Hydration", "Supplements", "Body weight", "Progress"];

  let activeSystemIndex = -1;
  let activeSystemScreen = "";
  let flipSwapTimer = 0;
  let flipEndTimer = 0;
  let flipRun = 0;

  const showSystemScreen = (screen) => {
    systemPanels.forEach((panel) => {
      const isActive = panel.dataset.systemPanel === screen;
      panel.classList.toggle("is-active", isActive);
      if (isActive) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");
    });
    activeSystemScreen = screen;
  };

  const cancelFlip = () => {
    window.clearTimeout(flipSwapTimer);
    window.clearTimeout(flipEndTimer);
    systemFlip?.classList.remove("is-flipping");
  };

  const setSystem = (index, immediate = false) => {
    const step = systemSteps[index];
    if (!step || index === activeSystemIndex) return;

    activeSystemIndex = index;
    systemSteps.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));
    if (systemLabel) systemLabel.textContent = systemLabels[index] || "IGNITE";
    if (systemCurrent) systemCurrent.textContent = String(index + 1).padStart(2, "0");

    const nextScreen = step.dataset.systemScreen;
    if (!nextScreen || nextScreen === activeSystemScreen) return;

    const shouldFlip = !immediate && !motionQuery.matches && desktopQuery.matches && Boolean(activeSystemScreen && systemFlip);
    if (!shouldFlip) {
      cancelFlip();
      showSystemScreen(nextScreen);
      return;
    }

    cancelFlip();
    const run = ++flipRun;
    systemFlip.classList.add("is-flipping");

    flipSwapTimer = window.setTimeout(() => {
      if (run !== flipRun) return;
      showSystemScreen(nextScreen);
    }, 365);

    flipEndTimer = window.setTimeout(() => {
      if (run !== flipRun) return;
      systemFlip.classList.remove("is-flipping");
    }, 780);
  };

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

  const observeSystem = () => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const closest = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top + a.boundingClientRect.height * .5 - window.innerHeight * .5)
          - Math.abs(b.boundingClientRect.top + b.boundingClientRect.height * .5 - window.innerHeight * .5))[0];

      if (closest) setSystem(Number(closest.target.dataset.systemStep));
    }, { rootMargin: "-41% 0px -41% 0px", threshold: 0 });

    systemSteps.forEach((step) => observer.observe(step));
  };

  let scrollFrame = 0;
  const updateScrollEffects = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progressAmount = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progress) progress.style.transform = `scaleX(${progressAmount})`;

    if (heroArtwork) {
      const heroShift = motionQuery.matches ? 0 : Math.min(window.scrollY, window.innerHeight) * -.065;
      heroArtwork.style.setProperty("--hero-shift", heroShift.toFixed(2));
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

      if (Math.hypot(mouseX - ringX, mouseY - ringY) > .1 && !document.hidden) {
        cursorFrame = window.requestAnimationFrame(renderCursor);
      } else {
        cursorFrame = 0;
      }
    };

    const queueCursorFrame = () => {
      if (!cursorFrame && !document.hidden) cursorFrame = window.requestAnimationFrame(renderCursor);
    };

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      queueCursorFrame();
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      ring.classList.toggle("is-active", Boolean(event.target.closest("a, button, [data-cursor]")));
    });

    document.addEventListener("visibilitychange", queueCursorFrame);
  }

  setSystem(0, true);
  revealContent();
  observeSystem();
  updateScrollEffects();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });
})();
