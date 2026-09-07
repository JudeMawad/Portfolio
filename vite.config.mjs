export default {
  // Only complete public pages are entrypoints. The template and fragments
  // contain URLs relative to the generated root homepage.
  optimizeDeps: {
    entries: ["index.html", "Cube/index.html", "Ignite/index.html", "Server/index.html"]
  }
};
