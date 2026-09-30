import { setupProjectPage } from "../shared/scripts/project-page.js";
import { setupCursor } from "../shared/scripts/cursor.js";
import { setupSectionReveals } from "./scripts/section-reveals.js";
import { setupDesignGallery } from "./scripts/design-gallery.js";
import { setupDisclosures } from "./scripts/disclosures.js?v=20260929-feature-disclosures";
import { setupDisplayApps } from "./scripts/display-apps.js?v=20260930-stable-mobile";

const lifetime = new AbortController();
const features = [setupProjectPage(), setupSectionReveals(), setupDesignGallery(), setupDisclosures(), setupDisplayApps(), setupCursor()];
const modelUrl = new URL("../images/THE_CUBE.glb", import.meta.url).href;

// These controls are available before Three.js or the model finishes loading.
const controls = {
  state: "idle",
  voiceLevel: null,
  debug: new URLSearchParams(window.location.search).get("cubeLedDebug") === "1",
  animation: null,
  refresh() {}
};
const validStates = new Set(["idle", "wake", "listening", "thinking", "speaking", "speech", "followup"]);
const setCubeAnimationState = (state) => {
  const normalized = String(state).toLowerCase();
  if (!validStates.has(normalized)) return false;
  controls.state = normalized === "speech" ? "speaking" : normalized;
  controls.voiceLevel = null;
  const applied = controls.animation?.setState(controls.state) ?? true;
  controls.refresh();
  return applied;
};
const setCubeVoiceLevel = (level) => {
  const parsed = Number(level);
  if (!Number.isFinite(parsed)) return false;
  controls.state = "speaking";
  controls.voiceLevel = Math.min(1, Math.max(0, parsed));
  const applied = controls.animation?.setVoiceLevel(controls.voiceLevel) ?? true;
  controls.refresh();
  return applied;
};
const cubeLedApi = Object.freeze({
  setState: setCubeAnimationState,
  setVoiceLevel: setCubeVoiceLevel,
  setDebugMode(enabled) {
    controls.debug = Boolean(enabled);
    controls.animation?.setDebugMode(controls.debug);
    controls.refresh();
    return true;
  },
  getDiagnostics: () => controls.animation?.getDiagnostics() ?? null
});
window.setCubeAnimationState = setCubeAnimationState;
window.setCubeVoiceLevel = setCubeVoiceLevel;
window.cubeLedAnimation = cubeLedApi;

let readyFrame = window.requestAnimationFrame(() => {
  readyFrame = window.requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
    loadViewer();
  });
});

window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;
  lifetime.abort();
  window.cancelAnimationFrame(readyFrame);
  features.forEach((feature) => feature?.dispose());
  if (window.setCubeAnimationState === setCubeAnimationState) delete window.setCubeAnimationState;
  if (window.setCubeVoiceLevel === setCubeVoiceLevel) delete window.setCubeVoiceLevel;
  if (window.cubeLedAnimation === cubeLedApi) delete window.cubeLedAnimation;
});

// Ordinary page content is ready even if the viewer cannot load.
const loadViewer = () => import("./scripts/model-viewer.js")
  .then(({ setupModelViewer }) => {
    if (!lifetime.signal.aborted) return setupModelViewer({ modelUrl, controls, signal: lifetime.signal });
  })
  .catch(() => {
    if (lifetime.signal.aborted) return;
    document.querySelector("[data-cube-visual]")?.classList.add("is-model-error");
    const status = document.querySelector("[data-model-status]");
    if (status) status.textContent = "Product Render / Static";
  });
