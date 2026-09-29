import {
  createProjectedCubeLedCanvasRenderer,
  getCubePhotoCorners
} from "../../shared/scripts/cube-photo-canvas.js?v=20260929-pinned-scene";

// H.264 can turn OFF pixels into RGB values of 1–3. The shared renderer
// skips exact black, so normalize this codec noise instead of painting dark dots.
const MP4_BLACK_FLOOR = 4;

// One stationary photo and projection shared by every app and its poster.
export function setupDisplayPhoto(media) {
  const sample = document.createElement("canvas");
  sample.width = sample.height = 64;
  const context = sample.getContext("2d", { willReadFrequently: true });
  const renderer = createProjectedCubeLedCanvasRenderer(media.querySelector("canvas"));
  if (!context || !renderer) return null;
  let source = null;
  let video = null;
  let callback = 0;
  let width = 0;
  let pixelRatio = 0;
  let profile = "";
  let disposed = false;

  const draw = () => {
    if (!source || !width || disposed) return;
    try {
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 64, 64);
      context.drawImage(source, 0, 0, 64, 64);
      const pixels = context.getImageData(0, 0, 64, 64).data;
      if (source instanceof HTMLVideoElement) {
        for (let i = 0; i < pixels.length; i += 4) {
          if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) <= MP4_BLACK_FLOOR) {
            pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
          }
        }
      }
      renderer.drawFrame(pixels, 10);
      media.classList.add("is-photo-ready");
    } catch {
      media.classList.remove("is-photo-ready");
    }
  };
  const stop = () => {
    if (video?.cancelVideoFrameCallback) video.cancelVideoFrameCallback(callback);
    else window.cancelAnimationFrame(callback);
    video = null;
    callback = 0;
  };
  const schedule = () => {
    const current = video;
    if (!current || disposed) return;
    const render = () => {
      if (disposed || video !== current) return;
      if (current.readyState >= 2) { source = current; draw(); }
      schedule();
    };
    callback = current.requestVideoFrameCallback
      ? current.requestVideoFrameCallback(render)
      : window.requestAnimationFrame(render);
  };
  const resize = () => {
    if (disposed) return;
    const nextWidth = media.getBoundingClientRect().width;
    const nextRatio = window.devicePixelRatio || 1;
    const nextProfile = window.innerWidth > 900 ? "desktop" : "mobile";
    if (!nextWidth || (width === nextWidth && pixelRatio === nextRatio && profile === nextProfile)) return;
    width = nextWidth;
    pixelRatio = nextRatio;
    profile = nextProfile;
    const points = getCubePhotoCorners(profile);
    // Mirror the photo, but reverse the corner order to keep display text readable.
    const destination = [points[1], points[0], points[3], points[2]].map((point) => ({
      x: (1 - point.x) * width, y: point.y * width
    }));
    renderer.resize(width, width, destination, pixelRatio);
    draw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(media);
  window.addEventListener("resize", resize, { passive: true });
  resize();

  return {
    showFrame(frame) {
      stop();
      source = frame;
      draw();
    },
    showPoster(poster) {
      stop();
      source = poster?.complete && poster.naturalWidth ? poster : null;
      if (source) draw();
      else media.classList.remove("is-photo-ready");
    },
    play(nextVideo) {
      stop();
      video = nextVideo;
      if (video.readyState >= 2) { source = video; draw(); }
      schedule();
    },
    stop,
    dispose() {
      stop();
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", resize);
      media.classList.remove("is-photo-ready");
    }
  };
}
