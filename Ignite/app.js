(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-project-header]");
  const progress = document.querySelector(".scroll-progress");
  const heroImage = document.querySelector("[data-hero-visual] img");
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  const experienceSteps = [...document.querySelectorAll("[data-experience-step]")];
  const experiencePanels = [...document.querySelectorAll("[data-experience-panel]")];
  const stageLabel = document.querySelector("[data-stage-label]");
  const stageCurrent = document.querySelector("[data-stage-current]");
  const experienceLabels = ["Dashboard", "Food entry", "History", "Health & training"];
  let activeExperience = -1;

  const setExperience = (index) => {
    if (index === activeExperience && experienceSteps[index]?.classList.contains("is-active")) return;
    activeExperience = index;

    experienceSteps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === index);
    });

    experiencePanels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === index;
      panel.classList.toggle("is-active", isActive);
      if (isActive) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");
    });

    if (stageLabel) stageLabel.textContent = experienceLabels[index] || "Track";
    if (stageCurrent) stageCurrent.textContent = String(index + 1).padStart(2, "0");
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
    }, { rootMargin: "0px 0px -5% 0px", threshold: .08 });

    revealNodes.forEach((node) => observer.observe(node));
  };

  let scrollFrame = 0;
  const updateScrollEffects = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progressAmount = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progress) progress.style.transform = `scaleX(${progressAmount})`;

    if (heroImage && !motionQuery.matches) {
      const heroScroll = Math.min(window.scrollY, window.innerHeight);
      heroImage.style.transform = `translate3d(0, ${(heroScroll * -.08).toFixed(2)}px, 0)`;
    }

    scrollFrame = 0;
  };

  const observeExperience = () => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top + a.boundingClientRect.height * .5 - window.innerHeight * .5)
          - Math.abs(b.boundingClientRect.top + b.boundingClientRect.height * .5 - window.innerHeight * .5))[0];

      if (!visibleEntry) return;
      setExperience(Number(visibleEntry.target.dataset.experienceStep));
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });

    experienceSteps.forEach((step) => observer.observe(step));
  };

  window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  }, { passive: true });

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

  revealContent();
  setExperience(0);
  observeExperience();
  updateScrollEffects();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });
})();
