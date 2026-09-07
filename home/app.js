import { setupCursor } from "../shared/scripts/cursor.js";
import { setupPageEffects } from "./scripts/page-effects.js";
import { setupNavigation } from "./scripts/navigation.js";
import { setupTerminalStatus } from "./scripts/terminal-status.js";
import { setupHero } from "./scripts/hero.js";
import { setupStack } from "./scripts/stack.js";
import { setupProjects } from "./scripts/projects.js";
import { setupJourney } from "./scripts/journey.js";

const features = [
  setupPageEffects(), setupNavigation(), setupTerminalStatus(), setupHero(),
  setupStack(), setupProjects(), setupJourney(), setupCursor()
];

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) features.forEach((feature) => feature?.dispose());
});
