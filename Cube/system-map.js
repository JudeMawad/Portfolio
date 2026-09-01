import {
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

// These are the current homepage card calibrations, normalized to its stage.
const CUBE_LED_CARD_CORNERS = Object.freeze({
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

const setupSystemMapCubeVisual = (visual) => {
  const canvas = visual.querySelector("[data-system-map-cube-canvas]");
  const context = canvas?.getContext("2d", { alpha: true });
  if (!canvas || !context) return null;

  canvas.width = CUBE_LED_SURFACE_SIZE;
  canvas.height = CUBE_LED_SURFACE_SIZE;
  context.imageSmoothingEnabled = false;

  const ledGap = Math.floor((CUBE_LED_CELL_SIZE - CUBE_LED_SIZE) / 2);
  let measuredWidth = 0;
  let measuredHeight = 0;
  let measuredProfile = "";
  let animationFrame = 0;
  let isVisible = true;
  let disposed = false;
  let visibilityObserver = null;
  let resizeObserver = null;

  const drawFrame = (pixelData, brightness) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
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
    reducedMotion: reducedMotion.matches,
    onFrame: drawFrame
  });

  const resize = (force = false) => {
    if (disposed) return;
    const width = visual.clientWidth;
    const height = visual.clientHeight;
    const profile = cubeLedDesktop.matches ? "desktop" : "mobile";
    if (!width || !height) return;
    if (
      !force &&
      width === measuredWidth &&
      height === measuredHeight &&
      profile === measuredProfile
    ) return;

    measuredWidth = width;
    measuredHeight = height;
    measuredProfile = profile;
    const geometry = CUBE_LED_CARD_GEOMETRY[profile];
    const destination = CUBE_LED_CARD_CORNERS[profile].map((point) => ({
      x: ((point.x * geometry.stageWidth - geometry.renderLeft) / geometry.renderWidth) * width,
      y: ((point.y * geometry.stageHeight - geometry.renderTop) / geometry.renderHeight) * height
    }));
    const transform = createPerspectiveTransform(destination, canvas.width, canvas.height);
    if (transform) canvas.style.transform = transform;
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
