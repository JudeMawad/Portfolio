const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = [...document.querySelectorAll("[data-cube-reveal]")];
const systemMaps = [...document.querySelectorAll("[data-system-map]")];

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
