import { setupDisplayPhoto } from "./display-photos.js?v=20260929-clean-pixels";

export function setupDisplayApps() {
  const section = document.querySelector("[data-display-apps]");
  if (!section) return;
  const viewer = section.querySelector("[data-display-viewer]");
  const media = viewer.querySelector(".cube-display-apps__media");
  const entries = [...section.querySelectorAll("[data-display-entry]")];
  const cards = entries.map((entry) => entry.firstElementChild);
  const list = section.querySelector(".cube-display-apps__entries");
  const scene = section.querySelector(".cube-display-apps__scene");
  const layout = section.querySelector(".cube-display-apps__layout");
  const photo = setupDisplayPhoto(media);
  if (!photo || !entries.length) return;
  const listeners = new AbortController();
  const { signal } = listeners;
  const sources = document.createElement("div");
  sources.hidden = true;
  sources.dataset.displaySources = "";
  const videos = entries.map((entry) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "none";
    video.tabIndex = -1;
    video.setAttribute("aria-hidden", "true");
    video.dataset.src = entry.dataset.videoSrc;
    sources.append(video);
    return video;
  });
  const posters = entries.map((entry) => {
    const poster = new Image();
    poster.alt = "";
    poster.src = entry.dataset.posterSrc;
    sources.append(poster);
    return poster;
  });
  section.append(sources);
  section.classList.add("is-display-ready");
  const unavailable = new Set();
  let activeIndex = -1;
  let playing = null;
  let rendering = false;
  let generation = 0;
  let frame = 0;
  let disposed = false;
  let stacked = false;
  let stickyTop = 0;
  let sectionPadding = 0;
  let cardOffset = 0;
  let positions = [];
  let cardHeights = [];
  let header = 0;
  let mobile = false;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const ease = (value) => value * value * (3 - 2 * value);

  const measure = () => {
    if (disposed) return;
    const sectionStyle = getComputedStyle(section);
    header = parseFloat(sectionStyle.scrollMarginTop) || 0;
    sectionPadding = parseFloat(sectionStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(sectionStyle.paddingBottom) || 0;
    mobile = window.innerWidth <= 900;
    stickyTop = header + (mobile ? 16 : 24);
    const sceneHeight = window.innerHeight - stickyTop - 24;
    section.style.setProperty("--display-scene-top", `${stickyTop}px`);
    section.style.setProperty("--display-scene-height", `${sceneHeight}px`);
    section.classList.add("is-display-stacked");
    cardHeights = cards.map((card) => card.offsetHeight);
    const cardHeight = Math.max(...cardHeights);
    const layoutHeight = layout.clientHeight;
    const mediaSize = mobile ? Math.min(208, layoutHeight - cardHeight - 60) : layoutHeight;
    // Short/zoomed viewports retain the readable, ordinary document flow.
    stacked = mobile ? mediaSize >= 132 : layoutHeight >= cardHeight + 36;
    section.classList.toggle("is-display-stacked", stacked);
    section.style.setProperty("--display-media-size", `${Math.max(132, mediaSize)}px`);
    if (stacked) {
      cardOffset = Math.max(36, (list.clientHeight - cardHeight) / 2);
      const step = cardHeight + window.innerHeight * (mobile ? .18 : .24);
      positions = entries.map((_, index) => index * step);
      const runway = positions.at(-1) + Math.max(80, window.innerHeight * .12);
      section.style.setProperty("--display-section-height", `${sectionPadding + sceneHeight + runway + paddingBottom}px`);
    }
    queueSync();
  };

  const stopPlayback = () => {
    generation += 1;
    photo.stop();
    videos.forEach((video) => video.pause());
    playing = null;
    rendering = false;
  };
  const visible = () => {
    const rect = media.getBoundingClientRect();
    const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, header));
    return rect.width > 0 && height >= rect.height * .25;
  };
  const select = (index) => {
    if (activeIndex === index) return;
    stopPlayback();
    activeIndex = index;
    entries.forEach((entry, i) => {
      if (i === index) entry.setAttribute("aria-current", "true");
      else entry.removeAttribute("aria-current");
    });
    viewer.setAttribute("aria-label", `Cube display preview: ${entries[index].querySelector("h3").textContent}`);
    // Reuse a decoded frame on return visits instead of briefly flashing its poster.
    if (videos[index].readyState >= 2 && !unavailable.has(videos[index])) photo.showFrame(videos[index]);
    else photo.showPoster(posters[index]);
  };
  const sync = () => {
    frame = 0;
    if (disposed) return;
    // Read geometry before updating transforms, avoiding read/write layout churn.
    const inView = visible();
    let next = 0;
    if (stacked) {
      // The section stays in normal flow while the entire scene is pinned.
      const cursor = Math.max(0, stickyTop - section.getBoundingClientRect().top - sectionPadding);
      // Select around the midpoint of a real overlap, with a small dead band
      // so tiny wheel/trackpad reversals cannot repeatedly restart playback.
      next = Math.max(0, activeIndex);
      while (next < cards.length - 1 && cursor >= positions[next + 1] - cardHeights[next] * .46) next += 1;
      while (next > 0 && cursor < positions[next] - cardHeights[next - 1] * .54) next -= 1;
      cards.forEach((card, index) => {
        entries[index].style.setProperty("--display-entry-offset", `${(cardOffset + Math.max(0, positions[index] - cursor)).toFixed(2)}px`);
        let depth = 0;
        for (let incoming = index + 1; incoming < cards.length; incoming += 1) {
          const overlap = clamp((cursor + cardHeights[index] - positions[incoming]) / cardHeights[index], 0, 1);
          depth += ease(overlap);
        }
        card.style.setProperty("--display-stack-scale", (1 - depth * .08).toFixed(4));
        card.style.setProperty("--display-stack-shift", `${(-depth * 12).toFixed(2)}px`);
        card.style.setProperty("--display-stack-brightness", (1 - depth * .065).toFixed(3));
      });
    } else {
      const top = mobile ? Math.max(0, Math.min(viewer.getBoundingClientRect().bottom, window.innerHeight)) : 0;
      const readingPosition = (top + window.innerHeight) / 2;
      let closest = Infinity;
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs((rect.top + rect.bottom) / 2 - readingPosition);
        if (distance < closest) { closest = distance; next = index; }
      });
    }
    select(next);
    const video = videos[activeIndex];
    if (document.hidden || !inView || unavailable.has(video)) {
      if (playing) {
        stopPlayback();
        photo.showPoster(posters[activeIndex]);
      }
      return;
    }
    if (playing === video) return;
    const request = ++generation;
    playing = video;
    if (!video.getAttribute("src")) video.src = video.dataset.src;
    video.play().then(() => {
      if (disposed || request !== generation) return;
      if (document.hidden || !visible()) {
        stopPlayback();
        photo.showPoster(posters[activeIndex]);
        return;
      }
      rendering = true;
      photo.play(video);
    }).catch(() => {
      if (disposed || request !== generation) return;
      unavailable.add(video);
      stopPlayback();
      photo.showPoster(posters[activeIndex]);
    });
  };
  const queueSync = () => {
    if (!frame && !disposed) frame = window.requestAnimationFrame(sync);
  };
  posters.forEach((poster, index) => {
    poster.addEventListener("load", () => {
      if (activeIndex === index && !rendering) photo.showPoster(poster);
    }, { signal });
  });
  videos.forEach((video, index) => {
    video.addEventListener("error", () => {
      unavailable.add(video);
      if (index === activeIndex) {
        stopPlayback();
        photo.showPoster(posters[index]);
      }
    }, { signal });
  });
  window.addEventListener("scroll", queueSync, { passive: true, signal });
  window.addEventListener("resize", measure, { passive: true, signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopPlayback();
      photo.showPoster(posters[activeIndex]);
    } else queueSync();
  }, { signal });
  const observer = new IntersectionObserver(queueSync, { threshold: [0, .25, 1] });
  observer.observe(media);
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(scene.querySelector("header"));
  cards.forEach((card) => resizeObserver.observe(card));
  document.fonts?.ready.then(measure);
  select(0);
  measure();

  return {
    dispose() {
      disposed = true;
      stopPlayback();
      photo.dispose();
      listeners.abort();
      observer.disconnect();
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
      videos.forEach((video) => { video.removeAttribute("src"); video.load(); });
      sources.remove();
      section.classList.remove("is-display-ready", "is-display-stacked");
      ["--display-scene-top", "--display-scene-height", "--display-media-size", "--display-section-height"].forEach((name) => section.style.removeProperty(name));
      cards.forEach((card) => {
        ["--display-stack-scale", "--display-stack-shift", "--display-stack-brightness"].forEach((name) => card.style.removeProperty(name));
      });
      entries.forEach((entry) => {
        entry.removeAttribute("aria-current");
        entry.style.removeProperty("--display-entry-offset");
      });
      viewer.setAttribute("aria-label", "Cube display preview");
    }
  };
}
