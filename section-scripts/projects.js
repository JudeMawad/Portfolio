import {
  CUBE_LED_MATRIX_SIZE,
  createCubeLedFrameGenerator
} from "../Cube/cube-led-animation.js?v=20260901-shared-card-1";

const CUBE_LED_CALIBRATION = false;
const CUBE_LED_CELL_SIZE = 10;
const CUBE_LED_SIZE = 5;
const CUBE_LED_SURFACE_SIZE = CUBE_LED_MATRIX_SIZE * CUBE_LED_CELL_SIZE;
const CUBE_LED_HANDLE_LABELS = ["TL", "TR", "BR", "BL"];
const CUBE_PHOTO_ANIMATION_STATE = "listening";
const CUBE_PHOTO_STATE_REFRESH_MS = 10000;

const CUBE_LED_CORNERS = Object.freeze({
  desktop: Object.freeze([
    Object.freeze({ x: 0.676648, y: 0.306452 }),
    Object.freeze({ x: 0.950270, y: 0.280059 }),
    Object.freeze({ x: 0.94877, y: 0.718475 }),
    Object.freeze({ x: 0.679945, y: 0.782919 })
  ]),
  mobile: Object.freeze([
    Object.freeze({ x: 0.455633, y: 0.380443 }),
    Object.freeze({ x: 0.895443, y: 0.352676 }),
    Object.freeze({ x: 0.886762, y: 0.777661 }),
    Object.freeze({ x: 0.457562, y: 0.840136 })
  ])
});

const clampCubeCoordinate = (value) => Math.min(1, Math.max(0, value));

const createPerspectiveTransform = (points, sourceWidth, sourceHeight) => {
  if (
    !Number.isFinite(sourceWidth) || sourceWidth <= 0 ||
    !Number.isFinite(sourceHeight) || sourceHeight <= 0 ||
    points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))
  ) return null;

  const [p0, p1, p2, p3] = points;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const denominator = dx1 * dy2 - dx2 * dy1;

  let projectiveX = 0;
  let projectiveY = 0;
  if (Math.abs(denominator) > .000001) {
    projectiveX = (dx3 * dy2 - dx2 * dy3) / denominator;
    projectiveY = (dx1 * dy3 - dx3 * dy1) / denominator;
  } else if (Math.abs(dx3) > .000001 || Math.abs(dy3) > .000001) {
    return null;
  }

  const scaleX = p1.x - p0.x + projectiveX * p1.x;
  const skewX = p3.x - p0.x + projectiveY * p3.x;
  const translateX = p0.x;
  const skewY = p1.y - p0.y + projectiveX * p1.y;
  const scaleY = p3.y - p0.y + projectiveY * p3.y;
  const translateY = p0.y;

  return `matrix3d(${[
    scaleX / sourceWidth, skewY / sourceWidth, 0, projectiveX / sourceWidth,
    skewX / sourceHeight, scaleY / sourceHeight, 0, projectiveY / sourceHeight,
    0, 0, 1, 0,
    translateX, translateY, 0, 1
  ].join(",")})`;
};

const setupCubeProjectCard = ({ section, desktopQuery, reducedMotionQuery }) => {
  const card = section.querySelector(".projects-card--cube");
  const stage = card?.querySelector(".projects-cube-stage");
  const render = stage?.querySelector(".projects-cube-render");
  const canvas = render?.querySelector(".projects-cube-led-canvas");
  const context = canvas?.getContext("2d", { alpha: true });
  if (!card || !stage || !render || !canvas || !context) return null;

  canvas.width = CUBE_LED_SURFACE_SIZE;
  canvas.height = CUBE_LED_SURFACE_SIZE;
  context.imageSmoothingEnabled = false;

  const corners = {
    desktop: CUBE_LED_CORNERS.desktop.map((point) => ({ ...point })),
    mobile: CUBE_LED_CORNERS.mobile.map((point) => ({ ...point }))
  };
  const handles = [];
  const ledGap = Math.floor((CUBE_LED_CELL_SIZE - CUBE_LED_SIZE) / 2);
  let profile = desktopQuery.matches ? "desktop" : "mobile";
  let measuredStageWidth = 0;
  let measuredStageHeight = 0;
  let measuredRenderLeft = 0;
  let measuredRenderTop = 0;
  let measuredRenderWidth = 0;
  let measuredRenderHeight = 0;
  let measuredProfile = "";
  let animationFrame = 0;
  let lastPhotoStateRefresh = 0;
  let isVisible = true;
  let disposed = false;
  let visibilityObserver = null;

  const drawFrame = (pixelData, brightness) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Match the shared idle brightness while compensating for the 3D material's
    // emission gain so the card remains readable over its static PNG.
    context.globalAlpha = Math.min(1, Math.max(.12, brightness / 10));

    for (let index = 0; index < pixelData.length / 4; index += 1) {
      const offset = index * 4;
      const red = pixelData[offset];
      const green = pixelData[offset + 1];
      const blue = pixelData[offset + 2];
      if (red + green + blue === 0) continue;

      context.fillStyle = `rgb(${red},${green},${blue})`;
      context.fillRect(
        (index % CUBE_LED_MATRIX_SIZE) * CUBE_LED_CELL_SIZE + ledGap,
        Math.floor(index / CUBE_LED_MATRIX_SIZE) * CUBE_LED_CELL_SIZE + ledGap,
        CUBE_LED_SIZE,
        CUBE_LED_SIZE
      );
    }

    context.globalAlpha = 1;
  };

  const frameGenerator = createCubeLedFrameGenerator({
    reducedMotion: reducedMotionQuery.matches,
    onFrame: drawFrame
  });

  const keepPhotoAnimationState = (now = performance.now(), force = false) => {
    if (!force && now - lastPhotoStateRefresh < CUBE_PHOTO_STATE_REFRESH_MS) return;
    frameGenerator.setState(CUBE_PHOTO_ANIMATION_STATE, now);
    lastPhotoStateRefresh = now;
  };

  keepPhotoAnimationState(performance.now(), true);

  const shouldAnimate = () => (
    !disposed &&
    !reducedMotionQuery.matches &&
    isVisible &&
    !document.hidden
  );

  const stopAnimation = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const animate = (now) => {
    animationFrame = 0;
    if (!shouldAnimate()) return;
    keepPhotoAnimationState(now);
    frameGenerator.update(now);
    animationFrame = window.requestAnimationFrame(animate);
  };

  const startAnimation = () => {
    if (animationFrame || !shouldAnimate()) return;
    animationFrame = window.requestAnimationFrame(animate);
  };

  const printCalibration = () => {
    const values = corners[profile].map(({ x, y }) => ({
      x: Number(x.toFixed(6)),
      y: Number(y.toFixed(6))
    }));
    console.info(`Cube LED ${profile} corners (TL, TR, BR, BL):`, values);
  };

  const updateHandlePositions = (stageWidth, stageHeight, renderLeft, renderWidth) => {
    handles.forEach((handle, index) => {
      const point = corners[profile][index];
      const logicalX = point.x * stageWidth;
      const mirroredX = renderLeft + renderWidth - (logicalX - renderLeft);
      handle.style.left = `${mirroredX}px`;
      handle.style.top = `${point.y * stageHeight}px`;
    });
  };

  const resize = (force = false) => {
    if (disposed) return;
    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const renderLeft = render.offsetLeft;
    const renderTop = render.offsetTop;
    const renderWidth = render.clientWidth;
    const renderHeight = render.clientHeight;
    const nextProfile = desktopQuery.matches ? "desktop" : "mobile";
    if (!stageWidth || !stageHeight || !renderWidth || !renderHeight) return;
    if (
      !force &&
      stageWidth === measuredStageWidth &&
      stageHeight === measuredStageHeight &&
      renderLeft === measuredRenderLeft &&
      renderTop === measuredRenderTop &&
      renderWidth === measuredRenderWidth &&
      renderHeight === measuredRenderHeight &&
      nextProfile === measuredProfile
    ) return;

    profile = nextProfile;
    measuredProfile = nextProfile;
    measuredStageWidth = stageWidth;
    measuredStageHeight = stageHeight;
    measuredRenderLeft = renderLeft;
    measuredRenderTop = renderTop;
    measuredRenderWidth = renderWidth;
    measuredRenderHeight = renderHeight;
    const destination = corners[profile].map((point) => ({
      x: point.x * stageWidth - renderLeft,
      y: point.y * stageHeight - renderTop
    }));
    const sourceWidth = canvas.width;
    const sourceHeight = canvas.height;
    const transform = createPerspectiveTransform(destination, sourceWidth, sourceHeight);
    if (transform) canvas.style.transform = transform;
    updateHandlePositions(stageWidth, stageHeight, renderLeft, renderWidth);
  };

  const updatePointFromPointer = (index, event) => {
    const rect = stage.getBoundingClientRect();
    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const renderWidth = render.clientWidth;
    if (!rect.width || !rect.height || !stageWidth || !stageHeight || !renderWidth) return;
    const displayedX = (event.clientX - rect.left) * (stageWidth / rect.width);
    const logicalX = render.offsetLeft + renderWidth - (displayedX - render.offsetLeft);
    corners[profile][index].x = clampCubeCoordinate(logicalX / stageWidth);
    corners[profile][index].y = clampCubeCoordinate((event.clientY - rect.top) / rect.height);
    resize(true);
    printCalibration();
  };

  if (CUBE_LED_CALIBRATION) {
    card.classList.add("is-cube-calibrating");
    CUBE_LED_HANDLE_LABELS.forEach((label, index) => {
      const handle = document.createElement("span");
      handle.className = "projects-cube-calibration-handle";
      handle.textContent = label;
      handle.tabIndex = 0;
      handle.setAttribute("role", "button");
      handle.setAttribute("aria-label", `Adjust Cube LED ${label} corner`);
      let activePointerId = null;

      handle.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        activePointerId = event.pointerId;
        handle.setPointerCapture(event.pointerId);
        updatePointFromPointer(index, event);
      });
      handle.addEventListener("pointermove", (event) => {
        if (event.pointerId !== activePointerId) return;
        event.preventDefault();
        event.stopPropagation();
        updatePointFromPointer(index, event);
      });
      const finishDrag = (event) => {
        if (event.pointerId !== activePointerId) return;
        event.preventDefault();
        event.stopPropagation();
        if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        activePointerId = null;
        printCalibration();
      };
      handle.addEventListener("pointerup", finishDrag);
      handle.addEventListener("pointercancel", finishDrag);
      handle.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const step = event.shiftKey ? .005 : .0005;
        const point = corners[profile][index];
        // The visual is mirrored, so screen-left increases the saved logical X value.
        if (event.key === "ArrowLeft") point.x = clampCubeCoordinate(point.x + step);
        if (event.key === "ArrowRight") point.x = clampCubeCoordinate(point.x - step);
        if (event.key === "ArrowUp") point.y = clampCubeCoordinate(point.y - step);
        if (event.key === "ArrowDown") point.y = clampCubeCoordinate(point.y + step);
        resize(true);
        printCalibration();
      });

      stage.append(handle);
      handles.push(handle);
    });
    card.addEventListener("click", (event) => event.preventDefault());
  }

  const handleVisibilityChange = () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver((entries) => {
      isVisible = entries.some((entry) => entry.isIntersecting);
      if (isVisible) startAnimation();
      else stopAnimation();
    }, { threshold: .01 });
    visibilityObserver.observe(card);
  }

  const setReducedMotion = (reduced) => {
    frameGenerator.setReducedMotion(reduced);
    keepPhotoAnimationState(performance.now(), true);
    if (reduced) stopAnimation();
    else startAnimation();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stopAnimation();
    visibilityObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handlePageHide);
    frameGenerator.dispose();
  };

  const handlePageHide = (event) => {
    if (!event.persisted) dispose();
  };

  resize(true);
  startAnimation();
  window.addEventListener("pagehide", handlePageHide);

  return { element: render, resize, setReducedMotion, dispose };
};

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
    let mobileCardObserver = null;
    const mobileCardCandidates = new Set();

    if (!track) return;
    const cubeOverlay = setupCubeProjectCard({ section, desktopQuery, reducedMotionQuery });

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
      cubeOverlay?.setReducedMotion(reducedMotionQuery.matches);
      const shouldEnhance = desktopQuery.matches && !reducedMotionQuery.matches;
      if (!shouldEnhance) {
        disable();
        startMobileCardObserver();
        videos.forEach((video) => video.pause());
        cubeOverlay?.resize(true);
        return;
      }

      stopMobileCardObserver();
      enhanced = true;
      section.classList.add('is-projects-enhanced');
      videos.forEach((video) => video.play().catch(() => {}));
      measure();
      cubeOverlay?.resize(true);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      requestUpdate();
      cubeOverlay?.resize();
    }, { passive: true });

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        measure();
        cubeOverlay?.resize();
      });
      observer.observe(track);
      if (cubeOverlay?.element) observer.observe(cubeOverlay.element);
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
      document.fonts.ready.then(() => {
        measure();
        cubeOverlay?.resize();
      });
    }
  });
})();
