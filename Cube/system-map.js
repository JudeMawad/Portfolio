import {
  CUBE_ANIMATION_STATES,
  CUBE_LED_MATRIX_SIZE,
  createCubeLedFrameGenerator
} from "./cube-led-animation.js?v=20260901-fastled-3";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const cubeLedDesktop = window.matchMedia("(min-width: 900px)");
const revealItems = [...document.querySelectorAll("[data-cube-reveal]")];
const systemMaps = [...document.querySelectorAll("[data-system-map]")];

const CUBE_LED_CELL_SIZE = 10;
const CUBE_LED_SIZE = 5;
const CUBE_LED_SURFACE_SIZE = CUBE_LED_MATRIX_SIZE * CUBE_LED_CELL_SIZE;
const CUBE_PHOTO_ANIMATION_STATE = "listening";
const CUBE_PHOTO_STATE_REFRESH_MS = 10000;

const MATRIX_STATE_CYCLE = Object.freeze([
  Object.freeze({ state: "idle", duration: 3000 }),
  Object.freeze({ state: "listening", duration: 3000 }),
  Object.freeze({ state: "speaking", duration: 3000 })
]);

// System Map Cube LED corners, normalized to the original card stage.
const CUBE_LED_CARD_CORNERS = Object.freeze({
  desktop: Object.freeze([
    Object.freeze({ x: 0.680703, y: 0.308493 }),
    Object.freeze({ x: 0.951297, y: 0.282535 }),
    Object.freeze({ x: 0.946047, y: 0.715952 }),
    Object.freeze({ x: 0.681359, y: 0.779827 })
  ]),
  mobile: Object.freeze([
    Object.freeze({ x: 0.457475, y: 0.382154 }),
    Object.freeze({ x: 0.889725, y: 0.357234 }),
    Object.freeze({ x: 0.881675, y: 0.773034 }),
    Object.freeze({ x: 0.457825, y: 0.835194 })
  ])
});

// Convert the card-stage coordinates into the square PNG's local coordinates.
const CUBE_LED_CARD_GEOMETRY = Object.freeze({
  desktop: Object.freeze({
    stageWidth: 4,
    stageHeight: 3,
    renderLeft: 1.78,
    renderTop: .45,
    renderWidth: 2.1,
    renderHeight: 2.1
  }),
  mobile: Object.freeze({
    stageWidth: 4,
    stageHeight: 5,
    renderLeft: .32,
    renderTop: 1.15,
    renderWidth: 3.36,
    renderHeight: 3.36
  })
});

const createPerspectiveProjector = (points) => {
  if (
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

  return (sourceX, sourceY) => {
    const divisor = projectiveX * sourceX + projectiveY * sourceY + 1;
    if (Math.abs(divisor) <= .000001) return null;
    return {
      x: (scaleX * sourceX + skewX * sourceY + translateX) / divisor,
      y: (skewY * sourceX + scaleY * sourceY + translateY) / divisor
    };
  };
};

const createCubeLedCanvasRenderer = (canvas, { brightnessScale = 10 } = {}) => {
  const context = canvas?.getContext("2d", { alpha: true });
  if (!canvas || !context) return null;

  canvas.width = CUBE_LED_SURFACE_SIZE;
  canvas.height = CUBE_LED_SURFACE_SIZE;
  context.imageSmoothingEnabled = false;

  const ledGap = Math.floor((CUBE_LED_CELL_SIZE - CUBE_LED_SIZE) / 2);

  const drawFrame = (pixelData, brightness) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const intensity = Math.min(1, Math.max(.12, brightness / brightnessScale));

    for (let index = 0; index < pixelData.length / 4; index += 1) {
      const offset = index * 4;
      const red = pixelData[offset];
      const green = pixelData[offset + 1];
      const blue = pixelData[offset + 2];
      if (red + green + blue === 0) continue;

      context.fillStyle = `rgb(${Math.round(red * intensity)},${Math.round(green * intensity)},${Math.round(blue * intensity)})`;
      context.fillRect(
        (index % CUBE_LED_MATRIX_SIZE) * CUBE_LED_CELL_SIZE + ledGap,
        Math.floor(index / CUBE_LED_MATRIX_SIZE) * CUBE_LED_CELL_SIZE + ledGap,
        CUBE_LED_SIZE,
        CUBE_LED_SIZE
      );
    }
  };

  return { drawFrame };
};

const createProjectedCubeLedCanvasRenderer = (canvas, { brightnessScale = 10 } = {}) => {
  const context = canvas?.getContext("2d", { alpha: true });
  if (!canvas || !context) return null;

  const ledGap = Math.floor((CUBE_LED_CELL_SIZE - CUBE_LED_SIZE) / 2);
  let displayWidth = 0;
  let displayHeight = 0;
  let ledQuads = [];
  let lastPixelData = null;
  let lastBrightness = 0;

  const drawFrame = (pixelData, brightness) => {
    lastPixelData = pixelData;
    lastBrightness = brightness;
    if (!displayWidth || !displayHeight || ledQuads.length !== CUBE_LED_MATRIX_SIZE ** 2) return;

    context.clearRect(0, 0, displayWidth, displayHeight);
    const intensity = Math.min(1, Math.max(.12, brightness / brightnessScale));

    for (let index = 0; index < pixelData.length / 4; index += 1) {
      const offset = index * 4;
      const red = pixelData[offset];
      const green = pixelData[offset + 1];
      const blue = pixelData[offset + 2];
      if (red + green + blue === 0) continue;

      const quad = ledQuads[index];
      if (!quad) continue;
      context.fillStyle = `rgb(${Math.round(red * intensity)},${Math.round(green * intensity)},${Math.round(blue * intensity)})`;
      context.beginPath();
      context.moveTo(quad[0].x, quad[0].y);
      context.lineTo(quad[1].x, quad[1].y);
      context.lineTo(quad[2].x, quad[2].y);
      context.lineTo(quad[3].x, quad[3].y);
      context.closePath();
      context.fill();
    }
  };

  const resize = (width, height, destination, pixelRatio = 1) => {
    const projector = createPerspectiveProjector(destination);
    if (!projector || !width || !height || !Number.isFinite(pixelRatio) || pixelRatio <= 0) return;

    displayWidth = width;
    displayHeight = height;
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    canvas.style.removeProperty("transform");
    canvas.style.removeProperty("left");
    canvas.style.removeProperty("top");
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
    const outputScaleX = canvas.width / width;
    const outputScaleY = canvas.height / height;
    context.setTransform(outputScaleX, 0, 0, outputScaleY, 0, 0);

    ledQuads = new Array(CUBE_LED_MATRIX_SIZE ** 2);
    for (let y = 0; y < CUBE_LED_MATRIX_SIZE; y += 1) {
      const sourceTop = (y * CUBE_LED_CELL_SIZE + ledGap) / CUBE_LED_SURFACE_SIZE;
      const sourceBottom = (y * CUBE_LED_CELL_SIZE + ledGap + CUBE_LED_SIZE) / CUBE_LED_SURFACE_SIZE;
      for (let x = 0; x < CUBE_LED_MATRIX_SIZE; x += 1) {
        const sourceLeft = (x * CUBE_LED_CELL_SIZE + ledGap) / CUBE_LED_SURFACE_SIZE;
        const sourceRight = (x * CUBE_LED_CELL_SIZE + ledGap + CUBE_LED_SIZE) / CUBE_LED_SURFACE_SIZE;
        const quad = [
          projector(sourceLeft, sourceTop),
          projector(sourceRight, sourceTop),
          projector(sourceRight, sourceBottom),
          projector(sourceLeft, sourceBottom)
        ];
        if (quad.every(Boolean)) ledQuads[y * CUBE_LED_MATRIX_SIZE + x] = quad;
      }
    }

    if (lastPixelData) drawFrame(lastPixelData, lastBrightness);
  };

  return { drawFrame, resize };
};

const setupSystemMapCubeVisual = (visual) => {
  const canvas = visual.querySelector("[data-system-map-cube-canvas]");
  const renderer = createProjectedCubeLedCanvasRenderer(canvas);
  if (!canvas || !renderer) return null;

  const corners = Object.fromEntries(
    ["desktop", "mobile"].map((profile) => {
      const geometry = CUBE_LED_CARD_GEOMETRY[profile];
      return [profile, CUBE_LED_CARD_CORNERS[profile].map((point) => ({
        x: (point.x * geometry.stageWidth - geometry.renderLeft) / geometry.renderWidth,
        y: (point.y * geometry.stageHeight - geometry.renderTop) / geometry.renderHeight
      }))];
    })
  );

  let measuredWidth = 0;
  let measuredHeight = 0;
  let measuredProfile = "";
  let measuredPixelRatio = 0;
  let animationFrame = 0;
  let lastPhotoStateRefresh = 0;
  let isVisible = true;
  let disposed = false;
  let visibilityObserver = null;
  let resizeObserver = null;

  const frameGenerator = createCubeLedFrameGenerator({
    reducedMotion: reducedMotion.matches,
    onFrame: renderer.drawFrame
  });

  const keepPhotoAnimationState = (now = performance.now(), force = false) => {
    if (!force && now - lastPhotoStateRefresh < CUBE_PHOTO_STATE_REFRESH_MS) return;
    frameGenerator.setState(CUBE_PHOTO_ANIMATION_STATE, now);
    lastPhotoStateRefresh = now;
  };

  keepPhotoAnimationState(performance.now(), true);

  const resize = (force = false) => {
    if (disposed) return;
    const width = visual.clientWidth;
    const height = visual.clientHeight;
    const profile = cubeLedDesktop.matches ? "desktop" : "mobile";
    const pixelRatio = window.devicePixelRatio || 1;
    if (!width || !height) return;
    if (
      !force &&
      width === measuredWidth &&
      height === measuredHeight &&
      profile === measuredProfile &&
      pixelRatio === measuredPixelRatio
    ) return;

    measuredWidth = width;
    measuredHeight = height;
    measuredProfile = profile;
    measuredPixelRatio = pixelRatio;
    const destination = corners[profile].map((point) => ({
      x: point.x * width,
      y: point.y * height
    }));
    renderer.resize(width, height, destination, pixelRatio);
  };

  const shouldAnimate = () => (
    !disposed &&
    !reducedMotion.matches &&
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

  const handleVisibilityChange = () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
  };

  const handleReducedMotionChange = (event) => {
    frameGenerator.setReducedMotion(event.matches);
    keepPhotoAnimationState(performance.now(), true);
    if (event.matches) stopAnimation();
    else startAnimation();
  };

  const handleBreakpointChange = () => resize(true);
  const handleResize = () => resize();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stopAnimation();
    visibilityObserver?.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.removeEventListener("change", handleReducedMotionChange);
    cubeLedDesktop.removeEventListener("change", handleBreakpointChange);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("pagehide", handlePageHide);
    frameGenerator.dispose();
  };

  const handlePageHide = (event) => {
    if (!event.persisted) dispose();
  };

  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver((entries) => {
      isVisible = entries.some((entry) => entry.isIntersecting);
      if (isVisible) startAnimation();
      else stopAnimation();
    }, { threshold: .01 });
    visibilityObserver.observe(visual);
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(visual);
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  reducedMotion.addEventListener("change", handleReducedMotionChange);
  cubeLedDesktop.addEventListener("change", handleBreakpointChange);
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("pagehide", handlePageHide);
  resize(true);
  startAnimation();

  return { resize, dispose };
};

document.querySelectorAll("[data-system-map-cube-visual]").forEach(setupSystemMapCubeVisual);

const setupSystemMapMatrixDemo = (card) => {
  const canvas = card.querySelector("[data-matrix-canvas]");
  const matrixSurface = card.querySelector(".cube-system-feedback__matrix");
  const stateLabels = [...card.querySelectorAll("[data-matrix-state-label]")];
  const renderer = createCubeLedCanvasRenderer(canvas, { brightnessScale: 50 });
  if (!canvas || !matrixSurface || !renderer || !stateLabels.length) return null;

  const frameGenerator = createCubeLedFrameGenerator({
    reducedMotion: reducedMotion.matches,
    onFrame: renderer.drawFrame
  });

  let stateIndex = 0;
  let animationFrame = 0;
  let stateTimer = 0;
  let isRunning = false;
  let isVisible = !("IntersectionObserver" in window);
  let disposed = false;
  let visibilityObserver = null;
  let resizeObserver = null;

  const syncCanvasSize = () => {
    const availableSize = Math.floor(Math.min(matrixSurface.clientWidth, matrixSurface.clientHeight));
    if (!availableSize) return;

    const usableSize = Math.max(0, availableSize - 16);
    const canvasSize = [256, 192, 128, 64].find((size) => size <= usableSize)
      ?? Math.min(64, availableSize);
    matrixSurface.style.setProperty("--matrix-led-size", `${canvasSize}px`);
    matrixSurface.style.setProperty("--matrix-led-left", `${Math.floor((matrixSurface.clientWidth - canvasSize) / 2)}px`);
    matrixSurface.style.setProperty("--matrix-led-top", `${Math.floor((matrixSurface.clientHeight - canvasSize) / 2)}px`);
  };

  const currentCycleEntry = () => MATRIX_STATE_CYCLE[stateIndex];

  const updateStateLabels = (state) => {
    stateLabels.forEach((label) => {
      const isActive = label.dataset.matrixStateLabel === state;
      label.classList.toggle("is-active", isActive);
      if (isActive) label.setAttribute("aria-current", "true");
      else label.removeAttribute("aria-current");
    });
  };

  const setActiveState = (nextIndex, now = performance.now()) => {
    stateIndex = (nextIndex + MATRIX_STATE_CYCLE.length) % MATRIX_STATE_CYCLE.length;
    const { state } = currentCycleEntry();
    frameGenerator.setState(state, now);
    updateStateLabels(state);
  };

  const shouldRun = () => (
    !disposed &&
    !reducedMotion.matches &&
    isVisible &&
    !document.hidden
  );

  const stopStateTimer = () => {
    if (stateTimer) window.clearTimeout(stateTimer);
    stateTimer = 0;
  };

  const scheduleNextState = () => {
    stopStateTimer();
    if (!isRunning || !shouldRun()) return;

    stateTimer = window.setTimeout(() => {
      stateTimer = 0;
      if (!isRunning || !shouldRun()) return;
      setActiveState(stateIndex + 1);
      scheduleNextState();
    }, currentCycleEntry().duration);
  };

  const animate = (now) => {
    animationFrame = 0;
    if (!isRunning || !shouldRun()) return;

    if (currentCycleEntry().state === "speaking") {
      const voiceLevel = .32 + Math.sin(now * .004) * .14 + Math.sin(now * .009) * .06;
      frameGenerator.setVoiceLevel(voiceLevel, now);
    }

    frameGenerator.update(now);
    animationFrame = window.requestAnimationFrame(animate);
  };

  const stopPlayback = () => {
    isRunning = false;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    stopStateTimer();
  };

  const startPlayback = () => {
    if (isRunning || !shouldRun()) return;
    isRunning = true;
    frameGenerator.setState(currentCycleEntry().state, performance.now());
    animationFrame = window.requestAnimationFrame(animate);
    scheduleNextState();
  };

  const syncPlayback = () => {
    if (shouldRun()) startPlayback();
    else stopPlayback();
  };

  const handleVisibilityChange = () => syncPlayback();

  const handleReducedMotionChange = (event) => {
    stopPlayback();
    setActiveState(0);
    frameGenerator.setReducedMotion(event.matches);
    if (event.matches) {
      renderer.drawFrame(
        frameGenerator.pixelData,
        CUBE_ANIMATION_STATES.idle.brightness
      );
    }
    syncPlayback();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stopPlayback();
    visibilityObserver?.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.removeEventListener("change", handleReducedMotionChange);
    window.removeEventListener("resize", syncCanvasSize);
    window.removeEventListener("pagehide", handlePageHide);
    frameGenerator.dispose();
  };

  const handlePageHide = (event) => {
    if (!event.persisted) dispose();
  };

  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver((entries) => {
      isVisible = entries.some((entry) => entry.isIntersecting);
      syncPlayback();
    }, { threshold: .01 });
    visibilityObserver.observe(card);
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(syncCanvasSize);
    resizeObserver.observe(matrixSurface);
  } else {
    window.addEventListener("resize", syncCanvasSize, { passive: true });
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  reducedMotion.addEventListener("change", handleReducedMotionChange);
  window.addEventListener("pagehide", handlePageHide);
  syncCanvasSize();
  setActiveState(0);
  if (reducedMotion.matches) {
    renderer.drawFrame(
      frameGenerator.pixelData,
      CUBE_ANIMATION_STATES.idle.brightness
    );
  }
  syncPlayback();

  return { dispose };
};

document.querySelectorAll("[data-matrix-demo]").forEach(setupSystemMapMatrixDemo);

const mapStageClasses = [
  "has-cube",
  "has-trunk",
  "has-branches",
  "has-pc",
  "has-server-line",
  "has-server",
  "has-capabilities",
  "has-feedback-line",
  "has-feedback",
];

function showEverything() {
  revealItems.forEach((item) => item.classList.add("is-visible"));
  systemMaps.forEach((map) => map.classList.add(...mapStageClasses));
}

function showThrough(map, stageClass) {
  const stageIndex = mapStageClasses.indexOf(stageClass);
  if (stageIndex < 0) return;
  map.classList.add(...mapStageClasses.slice(0, stageIndex + 1));
}

function viewportMargin(fraction) {
  return `0px 0px -${Math.round(window.innerHeight * fraction)}px`;
}

function observeOnce(target, rootMargin, onEnter) {
  if (!target) return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    onEnter();
    observer.disconnect();
  }, {
    rootMargin,
    threshold: 0,
  });

  observer.observe(target);
}

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  showEverything();
} else {
  document.documentElement.classList.add("cube-sections-ready");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -7%",
    threshold: .08,
  });

  revealItems.forEach((item) => revealObserver.observe(item));

  systemMaps.forEach((map) => {
    const cubeNode = map.querySelector("[data-map-node='cube']");
    const pcBranch = map.querySelector(".cube-system-map__branch");
    const systems = map.querySelector(".cube-system-map__systems");
    const pcNode = map.querySelector("[data-map-node='pc']");
    const serverNode = map.querySelector("[data-map-node='server']");
    const serverCapabilities = serverNode?.querySelector(".cube-system-node__capabilities");
    const mobileServerLine = map.querySelector(".cube-system-map__mobile-line--server");
    const feedbackConnection = map.querySelector(".cube-system-map__feedback-connection");
    const feedbackNode = map.querySelector("[data-map-node='feedback']");

    map.classList.add("is-animated");

    observeOnce(cubeNode, viewportMargin(.12), () => showThrough(map, "has-cube"));
    observeOnce(pcBranch, viewportMargin(.15), () => showThrough(map, "has-trunk"));
    observeOnce(systems, viewportMargin(.25), () => showThrough(map, "has-branches"));
    observeOnce(pcNode, viewportMargin(.38), () => showThrough(map, "has-pc"));

    observeOnce(mobileServerLine, viewportMargin(.18), () => showThrough(map, "has-server-line"));
    observeOnce(serverNode, viewportMargin(.38), () => showThrough(map, "has-server"));
    observeOnce(serverCapabilities, viewportMargin(.15), () => showThrough(map, "has-capabilities"));

    observeOnce(feedbackConnection, viewportMargin(.2), () => showThrough(map, "has-feedback-line"));
    observeOnce(feedbackNode, viewportMargin(.34), () => showThrough(map, "has-feedback"));
  });

  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) showEverything();
  });
}
