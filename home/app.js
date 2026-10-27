import { setupCursor } from "../shared/scripts/cursor.js";
import { setupPageEffects } from "./scripts/page-effects.js";
import { setupNavigation } from "./scripts/navigation.js";
import { setupHero } from "./scripts/hero.js";
import { setupProjects } from "./scripts/projects.js";

const features = [
  setupPageEffects(), setupNavigation(), setupHero(),
  setupProjects(), setupCursor()
];

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) features.forEach((feature) => feature?.dispose());
});
