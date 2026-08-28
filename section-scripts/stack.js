(() => {
  const section = document.querySelector('[data-stack]');
  const deck = section?.querySelector('[data-stack-deck]');
  const cardsList = section?.querySelector('[data-stack-cards]');
  const items = [...(section?.querySelectorAll('[data-stack-item]') || [])];
  const cards = [...(section?.querySelectorAll('[data-stack-card]') || [])];
  const dots = [...(section?.querySelectorAll('[data-stack-dot]') || [])];
  const status = section?.querySelector('[data-stack-status]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!section || !deck || !cardsList || items.length === 0 || items.length !== cards.length) return;

  let activeIndex = 0;
  let frame = 0;
  let announceChange = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const documentTop = (element) => {
    let top = 0;
    let node = element;
    while (node) {
      top += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return top;
  };

  const cardName = (index) => cards[index]?.querySelector('h3')?.innerText.replace(/\s+/g, ' ').trim() || `Card ${index + 1}`;

  const setActive = (index, announce = false) => {
    const next = clamp(index, 0, items.length - 1);
    if (next === activeIndex && !announce) return;

    activeIndex = next;
    dots.forEach((dot, dotIndex) => {
      if (dotIndex === activeIndex) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    if ((announce || announceChange) && status) {
      status.textContent = `${cardName(activeIndex)}, card ${activeIndex + 1} of ${items.length}.`;
      announceChange = false;
    }
  };

  const stickyTop = () => parseFloat(getComputedStyle(items[0]).top) || 0;

  const update = () => {
    frame = 0;
    if (reducedMotion.matches || window.innerHeight <= 560) {
      cards.forEach((card) => {
        card.style.removeProperty('--stack-scale');
        card.style.removeProperty('--stack-shift');
        card.style.removeProperty('--stack-brightness');
        card.style.removeProperty('--stack-blur');
        card.style.removeProperty('--stack-content-shift');
      });
      return;
    }

    const top = stickyTop();
    const listTop = documentTop(cardsList);
    const positions = items.map((item) => listTop + item.offsetTop);
    const cursor = window.scrollY + top;
    let position = 0;

    for (let index = 0; index < positions.length - 1; index += 1) {
      if (cursor >= positions[index]) {
        const span = Math.max(1, positions[index + 1] - positions[index]);
        position = index + clamp((cursor - positions[index]) / span, 0, 1);
      }
    }

    if (cursor >= positions.at(-1)) position = items.length - 1;
    setActive(Math.round(position));

    cards.forEach((card, index) => {
      const depth = clamp(position - index, 0, 3);
      card.style.setProperty('--stack-scale', (1 - depth * .1).toFixed(4));
      card.style.setProperty('--stack-shift', `${(-depth * 18).toFixed(2)}px`);
      card.style.setProperty('--stack-brightness', (1 - depth * .065).toFixed(3));
      card.style.setProperty('--stack-blur', `${(Math.max(0, depth - 1) * .35).toFixed(2)}px`);
      card.style.setProperty('--stack-content-shift', `${(depth * -5).toFixed(2)}px`);
    });
  };

  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const goToCard = (index) => {
    const next = clamp(index, 0, items.length - 1);
    announceChange = true;
    setActive(next, true);
    const top = stickyTop();
    window.scrollTo({
      top: documentTop(cardsList) + items[next].offsetTop - top,
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
  };

  dots.forEach((dot, index) => dot.addEventListener('click', () => goToCard(index)));

  deck.addEventListener('keydown', (event) => {
    const keys = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    if (event.key === 'Home') goToCard(0);
    else if (event.key === 'End') goToCard(items.length - 1);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') goToCard(activeIndex - 1);
    else goToCard(activeIndex + 1);
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  reducedMotion.addEventListener?.('change', requestUpdate);

  section.classList.add('is-stack-enhanced');
  update();
})();
