import { setupCubePhotoCanvas } from "../../shared/scripts/cube-photo-canvas.js";

const setupCubeProjectCard = (section) => {
  const visual = section.querySelector(".projects-cube-render");
  return setupCubePhotoCanvas(visual, visual?.querySelector(".projects-cube-led-canvas"));
};

export function setupProjects() {
  const listeners = new AbortController();
  const { signal } = listeners;
  const cleanups = [];
  const sections = [...document.querySelectorAll('.projects-section')];
  if (!sections.length) return;

  const desktopQuery = window.matchMedia('(min-width: 900px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  sections.forEach((section) => {
    const track = section.querySelector('.projects-track');
    const intro = section.querySelector('.projects-intro');
    const cards = [...section.querySelectorAll('.projects-card')];
    const panels = [...section.querySelectorAll('.projects-panel')];
    let distance = 0;
    let frame = 0;
    let enhanced = false;
    let mobileCardObserver = null;
    const mobileCardCandidates = new Set();

    if (!track) return;
    const cubeOverlay = setupCubeProjectCard(section);

    const measure = () => {
      if (!enhanced) return;
      distance = Math.max(0, track.scrollWidth - window.innerWidth);
      section.style.setProperty('--projects-scroll-distance', `${Math.ceil(distance)}px`);
      update();
    };

    const update = () => {
      frame = 0;
      if (!enhanced) return;

      const sectionRect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-sectionRect.top / scrollable);
      const x = -distance * progress;

      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      section.style.setProperty('--projects-rail-progress', progress.toFixed(4));

      panels.forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        const delta = clamp((rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth, -1.25, 1.25);
        panel.style.setProperty('--projects-card-delta', delta.toFixed(4));
      });

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const centerDistance = Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2);
        card.classList.toggle('is-active', centerDistance < Math.min(window.innerWidth * 0.3, rect.width * 0.52));
      });

      if (intro) {
        const introExit = clamp(progress * 4.2, 0, 0.82);
        intro.style.opacity = String(1 - introExit);
        intro.style.filter = `blur(${(introExit * 4).toFixed(2)}px)`;
      }
    };

    const updateMobileCardState = () => {
      frame = 0;
      if (!mobileCardObserver || desktopQuery.matches || reducedMotionQuery.matches) return;

      const viewportCenter = window.innerHeight / 2;
      let activeCard = null;
      let closestDistance = Infinity;

      mobileCardCandidates.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const centerDistance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (centerDistance < closestDistance) {
          closestDistance = centerDistance;
          activeCard = card;
        }
      });

      cards.forEach((card) => card.classList.toggle('is-active', card === activeCard));
    };

    const requestUpdate = () => {
      if (frame) return;
      if (enhanced) {
        frame = window.requestAnimationFrame(update);
      } else if (mobileCardObserver) {
        frame = window.requestAnimationFrame(updateMobileCardState);
      }
    };

    const stopMobileCardObserver = () => {
      mobileCardObserver?.disconnect();
      mobileCardObserver = null;
      mobileCardCandidates.clear();
      section.classList.remove('is-projects-mobile-observed');
      cards.forEach((card) => card.classList.remove('is-active'));
    };

    const startMobileCardObserver = () => {
      stopMobileCardObserver();
      if (desktopQuery.matches || reducedMotionQuery.matches || !('IntersectionObserver' in window)) return;

      section.classList.add('is-projects-mobile-observed');
      mobileCardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            mobileCardCandidates.add(entry.target);
          } else {
            mobileCardCandidates.delete(entry.target);
          }
        });
        requestUpdate();
      }, {
        rootMargin: '-28% 0px -28% 0px',
        threshold: 0.01
      });

      cards.forEach((card) => mobileCardObserver.observe(card));
    };

    const disable = () => {
      enhanced = false;
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      section.classList.remove('is-projects-enhanced');
      section.style.removeProperty('--projects-scroll-distance');
      section.style.removeProperty('--projects-rail-progress');
      track.style.removeProperty('transform');
      panels.forEach((panel) => panel.style.removeProperty('--projects-card-delta'));
      cards.forEach((card) => card.classList.remove('is-active'));
      if (intro) {
        intro.style.removeProperty('opacity');
        intro.style.removeProperty('filter');
      }
    };

    const configure = () => {
      const shouldEnhance = desktopQuery.matches && !reducedMotionQuery.matches;
      if (!shouldEnhance) {
        disable();
        startMobileCardObserver();
        cubeOverlay?.resize(true);
        return;
      }

      stopMobileCardObserver();
      enhanced = true;
      section.classList.add('is-projects-enhanced');
      measure();
      cubeOverlay?.resize(true);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true, signal });
    window.addEventListener('resize', () => {
      measure();
      requestUpdate();
      cubeOverlay?.resize();
    }, { passive: true, signal });

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        measure();
        cubeOverlay?.resize();
      });
      cleanups.push(() => observer.disconnect());
      observer.observe(track);
      if (cubeOverlay?.element) observer.observe(cubeOverlay.element);
    }

    desktopQuery.addEventListener('change', configure, { signal });
    reducedMotionQuery.addEventListener('change', configure, { signal });
    cleanups.push(() => {
      disable();
      stopMobileCardObserver();
      cubeOverlay?.dispose();
    });
    configure();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (signal.aborted) return;
        measure();
        cubeOverlay?.resize();
      });
    }
  });
  return { dispose() { listeners.abort(); cleanups.forEach((cleanup) => cleanup()); } };
}
