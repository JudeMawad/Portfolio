document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
if (menuButton && navigation) {
  menuButton.hidden = false;
  const mobileMenu = matchMedia('(max-width: 760px)');
  const setMenuOpen = isOpen => {
    menuButton.setAttribute('aria-expanded', String(isOpen));
    navigation.classList.toggle('is-open', isOpen);
    navigation.inert = mobileMenu.matches && !isOpen;
  };
  const closeMenu = () => setMenuOpen(false);
  closeMenu();
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  mobileMenu.addEventListener('change', closeMenu);
}

// Keep deep-linked price groups visible before moving focus to them.
function revealPriceGroup(hash) {
  if (!hash || !hash.startsWith('#')) return;
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (target?.matches('details')) target.open = true;
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) revealPriceGroup(link.getAttribute('href'));
});
window.addEventListener('hashchange', () => revealPriceGroup(location.hash));
revealPriceGroup(location.hash);

const galleryLinks = [...document.querySelectorAll('[data-gallery]')];
const dialog = document.querySelector('.lightbox');
if (dialog && typeof dialog.showModal === 'function' && galleryLinks.length) {
  const photo = dialog.querySelector('#lightbox-image');
  const caption = dialog.querySelector('#gallery-caption');
  let selected = 0;
  let returnFocus;
  function showImage(index) {
    selected = (index + galleryLinks.length) % galleryLinks.length;
    const source = galleryLinks[selected];
    const originalImage = source.querySelector('img');
    photo.src = source.href;
    photo.alt = originalImage.alt;
    caption.textContent = `Look ${selected + 1} von ${galleryLinks.length} · Mrs.Goodcut`;
  }
  galleryLinks.forEach((link, index) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      // Preserve native open-in-new-tab and modifier-click behavior.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      returnFocus = link;
      showImage(index);
      dialog.showModal();
      dialog.querySelector('.lightbox-close').focus();
    });
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => showImage(selected - 1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => showImage(selected + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
}

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Intl.DateTimeFormat('de-DE', { year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date());
});

// Animate only incoming content. Nothing is hidden while waiting for JavaScript.
function enableScrollReveals() {
  if (!('IntersectionObserver' in window) || typeof Element.prototype.animate !== 'function') return;

  const targets = [...document.querySelectorAll('[data-reveal]')].filter(element =>
    !element.parentElement.closest('[data-reveal]') &&
    !element.closest('header, .hero, dialog')
  );
  if (!targets.length) return;

  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet();
  const active = new Map();
  let observer;

  function showImmediately(element) {
    seen.add(element);
    observer?.unobserve(element);
    active.get(element)?.cancel();
    active.delete(element);
  }

  function reveal(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      observer.unobserve(element);
      if (seen.has(element)) return;
      seen.add(element);
      if (motionPreference.matches || element.contains(document.activeElement)) return;

      const requestedDelay = Number(element.dataset.revealDelay);
      const delay = Number.isFinite(requestedDelay) ? Math.min(140, Math.max(0, requestedDelay)) : 0;
      const animation = element.animate(
        [{ opacity: 0.25, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 550, delay, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'backwards' }
      );
      active.set(element, animation);
      animation.onfinish = animation.oncancel = () => active.delete(element);
    });
  }

  function updateMotion() {
    observer?.disconnect();
    active.forEach(animation => animation.cancel());
    active.clear();
    if (motionPreference.matches) return;

    observer = new IntersectionObserver(reveal, { threshold: 0, rootMargin: '0px' });
    targets.forEach(element => {
      if (seen.has(element)) return;
      // Existing viewport content and restored scroll positions stay stable.
      if (element.getBoundingClientRect().top < window.innerHeight) seen.add(element);
      else observer.observe(element);
    });
  }

  function keepTargetVisible(target) {
    if (!(target instanceof Element)) return;
    targets.forEach(element => {
      if (element.contains(target) || target.contains(element)) showImmediately(element);
    });
  }

  document.addEventListener('focusin', event => keepTargetVisible(event.target));
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    try {
      keepTargetVisible(document.getElementById(decodeURIComponent(anchor.hash.slice(1))));
    } catch { /* A malformed fragment must not affect navigation or visibility. */ }
  });
  window.addEventListener('hashchange', () => {
    try {
      keepTargetVisible(document.getElementById(decodeURIComponent(location.hash.slice(1))));
    } catch { /* Native navigation remains available. */ }
  });
  motionPreference.addEventListener('change', updateMotion);
  updateMotion();
}

enableScrollReveals();
