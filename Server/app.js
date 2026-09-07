import { setupProjectPage } from "../shared/scripts/project-page.js";
import { setupProjectReveal } from "../shared/scripts/project-reveal.js";

const features = [setupProjectPage(), setupProjectReveal()];

const listeners = new AbortController();
features.push({ dispose: () => listeners.abort() });

const flowDetails = {
  request: ["STEP 01", "Request", "I choose the film or series I want to add."],
  overseerr: ["STEP 02", "Overseerr", "Overseerr receives the request and sends it to the correct organiser for a series or a film."],
  arr: ["STEP 03", "Sonarr / Radarr", "Sonarr handles series and Radarr handles films. They keep track of what was requested and pass the search forward."],
  prowlarr: ["STEP 04", "Prowlarr", "Prowlarr handles the search side and returns a suitable result to the service that asked for it."],
  qbittorrent: ["STEP 05", "qBittorrent", "qBittorrent receives the job and handles the download before the file moves into the media library."],
  library: ["STEP 06", "Library", "The completed file reaches the organised library path shared by the automation services and Jellyfin."],
  jellyfin: ["STEP 07", "Jellyfin", "Jellyfin sees the library update and makes the media available to watch from the devices I use."],
};

const flowNodes = [...document.querySelectorAll("[data-flow-step]")];
const flowTitle = document.querySelector("[data-flow-title]");
const flowDetail = document.querySelector("[data-flow-detail]");

const setFlowStep = (key) => {
  const detail = flowDetails[key];
  if (!detail) return;
  flowNodes.forEach((node) => {
    const isActive = node.dataset.flowStep === key;
    node.classList.toggle("is-active", isActive);
    node.setAttribute("aria-pressed", String(isActive));
  });
  if (flowTitle) flowTitle.textContent = detail[1];
  if (flowDetail) flowDetail.textContent = detail[2];
};

flowNodes.forEach((node) => {
  node.addEventListener("click", () => setFlowStep(node.dataset.flowStep), { signal: listeners.signal });
  node.addEventListener("focus", () => setFlowStep(node.dataset.flowStep), { signal: listeners.signal });
});

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) features.forEach((feature) => feature?.dispose());
});
