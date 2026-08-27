(() => {
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
    const videos = [...section.querySelectorAll('.projects-clockwise-video')];
    let distance = 0;
    let frame = 0;
    let enhanced = false;

    if (!track) return;

    const setVideoState = (video) => {
      const frameNode = video.closest('.projects-video-frame');
      if (!frameNode) return;
      frameNode.classList.toggle('is-video-ready', video.readyState >= 2);
    };

    videos.forEach((video) => {
      setVideoState(video);
      video.addEventListener('loadeddata', () => setVideoState(video));
      video.addEventListener('canplay', () => setVideoState(video));
      video.addEventListener('error', () => {
        video.closest('.projects-video-frame')?.classList.remove('is-video-ready');
      });
    });

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

    const requestUpdate = () => {
      if (frame || !enhanced) return;
      frame = window.requestAnimationFrame(update);
    };

    const disable = () => {
      enhanced = false;
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
        videos.forEach((video) => video.pause());
        return;
      }

      enhanced = true;
      section.classList.add('is-projects-enhanced');
      videos.forEach((video) => video.play().catch(() => {}));
      measure();
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', measure, { passive: true });

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(measure);
      observer.observe(track);
    }

    if ('IntersectionObserver' in window && !reducedMotionQuery.matches) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.12 });
      videos.forEach((video) => videoObserver.observe(video));
    }

    const listenForChange = (query) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', configure);
      } else if (typeof query.addListener === 'function') {
        query.addListener(configure);
      }
    };

    listenForChange(desktopQuery);
    listenForChange(reducedMotionQuery);
    configure();

    if (document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
  });
})();
