(() => {
  "use strict";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-project-header]");
  const progress = document.querySelector(".scroll-progress");
  const heroImage = document.querySelector("[data-hero-visual] img");
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  const scrollScenes = [...document.querySelectorAll("[data-scroll-scene]")];
  const experienceSteps = [...document.querySelectorAll("[data-experience-step]")];
  const experiencePanels = [...document.querySelectorAll("[data-experience-panel]")];
  const stageLabel = document.querySelector("[data-stage-label]");
  const stageCurrent = document.querySelector("[data-stage-current]");
  const experienceLabels = ["Track", "Add", "Analyze", "Train"];
  let activeExperience = 0;

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
    }, { rootMargin: "0px 0px -9% 0px", threshold: .12 });

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
      heroImage.style.transform = `translate3d(0, ${(heroScroll * -.4).toFixed(2)}px, 0)`;
    }

    if (!motionQuery.matches && window.innerWidth > 900) {
      scrollScenes.forEach((scene) => {
        const rect = scene.getBoundingClientRect();
        const sceneProgress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
        scene.style.setProperty("--scene-progress", sceneProgress.toFixed(4));
      });

      let closestStep = activeExperience;
      let closestDistance = Number.POSITIVE_INFINITY;
      experienceSteps.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * .5 - window.innerHeight * .5);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestStep = index;
        }
      });
      setExperience(closestStep);
    }

    scrollFrame = 0;
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

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      ring.classList.toggle("is-active", Boolean(event.target.closest("a, button, [data-cursor]")));
    });

    const renderCursor = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(renderCursor);
    };
    renderCursor();
  }

  revealContent();
  setExperience(0);
  updateScrollEffects();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });
})();
