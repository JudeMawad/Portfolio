(() => {
  "use strict";

  const initializeJourney = () => {
    const section = document.querySelector("[data-journey]");
    if (!section || section.dataset.journeyInitialized === "true") return;

    const steps = [...section.querySelectorAll("[data-journey-step]")];
    if (!steps.length) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let motionEnabled = false;

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    const setActiveStep = (activeIndex) => {
      steps.forEach((step, index) => {
        const active = index === activeIndex;
        step.classList.toggle("is-active", active);
        step.dataset.journeyState = active ? "active" : index < activeIndex ? "past" : "future";

        if (active) {
          step.setAttribute("aria-current", "step");
        } else {
          step.removeAttribute("aria-current");
        }
      });
    };

    const updateJourney = () => {
      const viewportFocus = window.innerHeight * 0.52;
      const nodeCenters = steps.map((step) => {
        const node = step.querySelector(".journey-node");
        const bounds = (node || step).getBoundingClientRect();
        return bounds.top + bounds.height / 2;
      });

      let activeIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      nodeCenters.forEach((center, index) => {
        const distance = Math.abs(center - viewportFocus);
        if (distance < closestDistance) {
          closestDistance = distance;
          activeIndex = index;
        }
      });

      const firstCenter = nodeCenters[0];
      const lastCenter = nodeCenters[nodeCenters.length - 1];
      const journeyLength = Math.max(1, lastCenter - firstCenter);
      const progress = clamp((viewportFocus - firstCenter) / journeyLength, 0, 1);

      section.style.setProperty("--journey-progress", progress.toFixed(4));
      setActiveStep(activeIndex);
      frame = 0;
    };

    const requestJourneyUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateJourney);
    };

    const stopMotion = () => {
      if (!motionEnabled) return;
      motionEnabled = false;
      window.removeEventListener("scroll", requestJourneyUpdate);
      window.removeEventListener("resize", requestJourneyUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const showReducedMotionState = () => {
      stopMotion();
      section.classList.add("journey-reduced-motion");
      section.style.setProperty("--journey-progress", "1");
      steps.forEach((step) => {
        step.classList.remove("is-active");
        step.removeAttribute("data-journey-state");
        step.removeAttribute("aria-current");
      });
    };

    const startMotion = () => {
      section.classList.remove("journey-reduced-motion");

      if (!motionEnabled) {
        motionEnabled = true;
        window.addEventListener("scroll", requestJourneyUpdate, { passive: true });
        window.addEventListener("resize", requestJourneyUpdate, { passive: true });
      }

      requestJourneyUpdate();
    };

    const applyMotionPreference = () => {
      if (motionPreference.matches) {
        showReducedMotionState();
      } else {
        startMotion();
      }
    };

    section.dataset.journeyInitialized = "true";
    applyMotionPreference();

    if (typeof motionPreference.addEventListener === "function") {
      motionPreference.addEventListener("change", applyMotionPreference);
    } else if (typeof motionPreference.addListener === "function") {
      motionPreference.addListener(applyMotionPreference);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(requestJourneyUpdate).catch(() => {});
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeJourney, { once: true });
  } else {
    initializeJourney();
  }
})();
