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
      const shouldEnhance = desktopQuery.matches && !reducedMotionQuery.matches;
      if (!shouldEnhance) {
        disable();
        startMobileCardObserver();
        videos.forEach((video) => video.pause());
        return;
      }

      stopMobileCardObserver();
      enhanced = true;
      section.classList.add('is-projects-enhanced');
      videos.forEach((video) => video.play().catch(() => {}));
      measure();
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      requestUpdate();
    }, { passive: true });

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

// ============================================================
// THE CUBE — LED OVERLAY + PERSPECTIVE + ANIMATION
// ============================================================

const cubeRender = document.querySelector(".projects-cube-render");
const cubeCanvas = document.querySelector(".projects-cube-led-canvas");

if (cubeRender && cubeCanvas) {

  // ----------------------------------------------------------
  // CALIBRATED LED PANEL CORNERS
  // Coordinates are normalized relative to .projects-cube-render
  // Order: top-left, top-right, bottom-right, bottom-left
  // ----------------------------------------------------------

  const CUBE_LED_CORNERS = {
    desktop: [
      { x: 0.676648, y: 0.306452 }, // top-left
      { x: 0.854270, y: 0.280059 }, // top-right
      { x: 0.848077, y: 0.718475 }, // bottom-right
      { x: 0.679945, y: 0.782919 }  // bottom-left
    ],

    mobile: [
      { x: 0.445000, y: 0.376000 }, // top-left
      { x: 0.870000, y: 0.352676 }, // top-right
      { x: 0.862000, y: 0.763661 }, // bottom-right
      { x: 0.450000, y: 0.823000 }  // bottom-left
    ]
  };


  // ==========================================================
  // PERSPECTIVE MAPPING
  // ==========================================================

  const applyCubePerspective = () => {
    const rect = cubeRender.getBoundingClientRect();

    const points = desktopQuery.matches
      ? CUBE_LED_CORNERS.desktop
      : CUBE_LED_CORNERS.mobile;

    const p0 = {
      x: points[0].x * rect.width,
      y: points[0].y * rect.height
    };

    const p1 = {
      x: points[1].x * rect.width,
      y: points[1].y * rect.height
    };

    const p2 = {
      x: points[2].x * rect.width,
      y: points[2].y * rect.height
    };

    const p3 = {
      x: points[3].x * rect.width,
      y: points[3].y * rect.height
    };

    const dx1 = p1.x - p2.x;
    const dx2 = p3.x - p2.x;
    const dx3 = p0.x - p1.x + p2.x - p3.x;

    const dy1 = p1.y - p2.y;
    const dy2 = p3.y - p2.y;
    const dy3 = p0.y - p1.y + p2.y - p3.y;

    const denominator = dx1 * dy2 - dx2 * dy1;

    let g = 0;
    let h = 0;

    if (Math.abs(denominator) > 0.000001) {
      g = (dx3 * dy2 - dx2 * dy3) / denominator;
      h = (dx1 * dy3 - dx3 * dy1) / denominator;
    }

    const a = p1.x - p0.x + g * p1.x;
    const b = p3.x - p0.x + h * p3.x;
    const c = p0.x;

    const d = p1.y - p0.y + g * p1.y;
    const e = p3.y - p0.y + h * p3.y;
    const f = p0.y;

    /*
     * The CSS canvas itself is 64 × 64 px.
     * Its internal drawing resolution can be higher without
     * changing these values.
     */
    const sourceWidth = cubeCanvas.width;
    const sourceHeight = cubeCanvas.height;

    cubeCanvas.style.transform = `matrix3d(
      ${a / sourceWidth},
      ${d / sourceWidth},
      0,
      ${g / sourceWidth},

      ${b / sourceHeight},
      ${e / sourceHeight},
      0,
      ${h / sourceHeight},

      0,
      0,
      1,
      0,

      ${c},
      ${f},
      0,
      1
    )`;
  };


  // ==========================================================
  // LED CANVAS
  // ==========================================================

  const MATRIX_SIZE = 64;

  /*
   * Each logical LED gets an 8×8 drawing cell.
   * The actual colored LED occupies only part of that cell,
   * leaving transparent gaps between LEDs.
   */
  const CELL_SIZE = 10;
  const LED_SIZE = 5;

  // ~30 FPS, matching the physical animation.
  const FRAME_TIME_MS = 33;

  // Same Perlin scale as the Cube implementation.
  const NOISE_SCALE = 31;

  cubeCanvas.width = MATRIX_SIZE * CELL_SIZE;
  cubeCanvas.height = MATRIX_SIZE * CELL_SIZE;

  const ctx = cubeCanvas.getContext("2d", {
    alpha: true
  });

  if (ctx) {
    ctx.imageSmoothingEnabled = false;


    // --------------------------------------------------------
    // Exact Cube palette
    // --------------------------------------------------------

    const PALETTE = new Uint8Array([
      0, 110, 32,
      0, 110, 32,

      230, 8, 4,
      230, 8, 4,

      255, 92, 0,
      255, 92, 0,

      0, 110, 32
    ]);


    // --------------------------------------------------------
    // Helpers
    // --------------------------------------------------------

    const randomUint16 = () => {
      if (globalThis.crypto?.getRandomValues) {
        return globalThis.crypto.getRandomValues(
          new Uint16Array(1)
        )[0];
      }

      return Math.floor(Math.random() * 65536);
    };


    // --------------------------------------------------------
    // LOAD THE SAME NOISE FUNCTION USED BY THE 3D CUBE
    // --------------------------------------------------------

   const animationModuleUrl =
  new URL("/Cube/cube-led-animation.js", window.location.origin).href;


    import(animationModuleUrl)
      .then(({ noise8 }) => {

        if (typeof noise8 !== "function") {
          throw new Error(
            "cube-led-animation.js does not export noise8()"
          );
        }


        // ====================================================
        // ANIMATION STATE
        // ====================================================

        const noise = new Uint8Array(
          MATRIX_SIZE * MATRIX_SIZE
        );

        const xCoordinates = new Uint16Array(MATRIX_SIZE);
        const yCoordinates = new Uint16Array(MATRIX_SIZE);

        const noiseX = randomUint16();
        const noiseY = randomUint16();

        let noiseZ = randomUint16();

        let huePhase = 0;

        // Same idle animation values as the 3D Cube.
        let speed = 3.5;
        let hueRate = 0.12;

        let lastFrameTime = 0;


        // ----------------------------------------------------
        // PRECOMPUTE X/Y PERLIN COORDINATES
        // ----------------------------------------------------

        for (let index = 0; index < MATRIX_SIZE; index += 1) {
          xCoordinates[index] =
            (noiseX + NOISE_SCALE * index) & 0xffff;

          yCoordinates[index] =
            (noiseY + NOISE_SCALE * index) & 0xffff;
        }


        // ====================================================
        // DRAW ONE LED FRAME
        // ====================================================

        const drawLedFrame = () => {

          const sampledZ =
            Math.trunc(noiseZ) & 0xffff;


          // --------------------------------------------------
          // Generate 64×64 Perlin field
          // --------------------------------------------------

          for (let x = 0; x < MATRIX_SIZE; x += 1) {
            for (let y = 0; y < MATRIX_SIZE; y += 1) {

              noise[y * MATRIX_SIZE + x] = noise8(
                xCoordinates[x],
                yCoordinates[y],
                sampledZ
              );
            }
          }

          noiseZ += speed;


          // --------------------------------------------------
          // Clear previous LED frame
          // Gaps remain transparent so the PNG stays visible.
          // --------------------------------------------------

          ctx.clearRect(
            0,
            0,
            cubeCanvas.width,
            cubeCanvas.height
          );


          const roundedHue =
            Math.round(huePhase) & 0xff;

          const gap =
            (CELL_SIZE - LED_SIZE) / 2;


          // --------------------------------------------------
          // Draw all 4096 LEDs
          // --------------------------------------------------

          for (let y = 0; y < MATRIX_SIZE; y += 1) {
            for (let x = 0; x < MATRIX_SIZE; x += 1) {

              const pixelBrightness =
                noise[y * MATRIX_SIZE + x];

              /*
               * Matches the original Cube implementation:
               * brightness lookup is normal,
               * palette lookup is transposed.
               */
              const transposedNoise =
                noise[x * MATRIX_SIZE + y];

              const palettePosition =
                (roundedHue + transposedNoise) & 0xff;

              const scaledPosition =
                palettePosition * 6;

              const segment =
                Math.min(scaledPosition >> 8, 5);

              const amount =
                scaledPosition & 0xff;

              const inverse =
                255 - amount;

              const from =
                segment * 3;

              const to =
                from + 3;


              let red = 0;
              let green = 0;
              let blue = 0;


              // ----------------------------------------------
              // RED
              // ----------------------------------------------

              let blended = Math.floor(
                (
                  PALETTE[from] * inverse +
                  PALETTE[to] * amount +
                  127
                ) / 255
              );

              red = Math.floor(
                (blended * pixelBrightness + 127) / 255
              );


              // ----------------------------------------------
              // GREEN
              // ----------------------------------------------

              blended = Math.floor(
                (
                  PALETTE[from + 1] * inverse +
                  PALETTE[to + 1] * amount +
                  127
                ) / 255
              );

              green = Math.floor(
                (blended * pixelBrightness + 127) / 255
              );


              // ----------------------------------------------
              // BLUE
              // ----------------------------------------------

              blended = Math.floor(
                (
                  PALETTE[from + 2] * inverse +
                  PALETTE[to + 2] * amount +
                  127
                ) / 255
              );

              blue = Math.floor(
                (blended * pixelBrightness + 127) / 255
              );


              // ----------------------------------------------
              // Draw physical LED
              // ----------------------------------------------

              ctx.fillStyle =
                `rgb(${red}, ${green}, ${blue})`;

              ctx.fillRect(
                x * CELL_SIZE + gap,
                y * CELL_SIZE + gap,
                LED_SIZE,
                LED_SIZE
              );
            }
          }


          // --------------------------------------------------
          // Advance palette animation
          // --------------------------------------------------

          huePhase += hueRate;

          if (huePhase >= 256) {
            huePhase %= 256;
          }
        };


        // ====================================================
        // ANIMATION LOOP
        // ====================================================

        const renderFrame = (now) => {

          window.requestAnimationFrame(renderFrame);

          if (
            now - lastFrameTime <
            FRAME_TIME_MS
          ) {
            return;
          }

          lastFrameTime =
            now - (
              (now - lastFrameTime) %
              FRAME_TIME_MS
            );

          drawLedFrame();
        };


        // Draw immediately so the panel isn't blank initially.
        drawLedFrame();

        window.requestAnimationFrame(renderFrame);
      })
      .catch((error) => {
        console.error(
          "Cube LED animation failed to load:",
          error
        );
      });
  }


  // ==========================================================
  // INITIAL PERSPECTIVE + RESPONSIVE UPDATES
  // ==========================================================

  applyCubePerspective();

  window.addEventListener(
    "resize",
    applyCubePerspective,
    { passive: true }
  );

  /*
   * desktopQuery already exists near the top of projects.js.
   */
  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener(
      "change",
      applyCubePerspective
    );
  }
}

    listenForChange(desktopQuery);
    listenForChange(reducedMotionQuery);
    configure();

    if (document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
  });
})();
