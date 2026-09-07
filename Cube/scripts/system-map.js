import { setupCubePhotoCanvas } from "../../shared/scripts/cube-photo-canvas.js";
import {
  CUBE_ANIMATION_STATES,
  CUBE_LED_MATRIX_SIZE,
  createCubeLedFrameGenerator
} from "../../shared/scripts/cube-led-frames.js";

export function setupSystemMap() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealItems = [...document.querySelectorAll("[data-cube-reveal]")];
  const systemMaps = [...document.querySelectorAll("[data-system-map]")];

  const CUBE_LED_CELL_SIZE = 10;
  const CUBE_LED_SIZE = 5;
  const CUBE_LED_SURFACE_SIZE = CUBE_LED_MATRIX_SIZE * CUBE_LED_CELL_SIZE;

  const MATRIX_STATE_CYCLE = Object.freeze([
    Object.freeze({ state: "idle", duration: 3000 }),
    Object.freeze({ state: "listening", duration: 3000 }),
    Object.freeze({ state: "speaking", duration: 3000 })
  ]);

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

  const photos = [...document.querySelectorAll("[data-system-map-cube-visual]")].map((visual) => (
    setupCubePhotoCanvas(visual, visual.querySelector("[data-system-map-cube-canvas]"))
  ));

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

  const demos = [...document.querySelectorAll("[data-matrix-demo]")].map(setupSystemMapMatrixDemo);
  const observers = new Set();
  const listeners = new AbortController();

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

    observers.add(observer);
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

    observers.add(revealObserver);
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
      if (event.matches) {
        showEverything();
        observers.forEach((observer) => observer.disconnect());
      }
    }, { signal: listeners.signal });
  }

  return {
    dispose() {
      listeners.abort();
      observers.forEach((observer) => observer.disconnect());
      [...photos, ...demos].forEach((feature) => feature?.dispose());
    }
  };
}
