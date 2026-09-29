export function setupDesignGallery() {
  const gallery = document.querySelector("[data-design-gallery]");
  if (!gallery) return;

  const image = gallery.querySelector("[data-design-image]");
  const thumbnails = gallery.querySelector("[data-design-thumbnails]");
  const buttons = [...thumbnails.querySelectorAll("button")];
  const listeners = new AbortController();

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const preview = button.querySelector("img");
      image.src = preview.src;
      image.alt = button.dataset.designAlt;
      buttons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
    }, { signal: listeners.signal });
  });
  thumbnails.hidden = false;

  return { dispose() { listeners.abort(); } };
}
