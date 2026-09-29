import { setupProjectPage } from "../shared/scripts/project-page.js";
import { setupProjectReveal } from "../shared/scripts/project-reveal.js";

const features = [setupProjectPage(), setupProjectReveal()];

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) features.forEach((feature) => feature?.dispose());
});
