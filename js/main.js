/* Intellihelp — Home: interacciones de la página (sin dependencias). */
(() => {
  'use strict';

  const root = document.documentElement;
  const motion = root.classList.contains('anim'); // ver script en <head>

  /* ---------- Notas internas para Carlos ---------- */
  const notesBtn = document.querySelector('[data-notes-toggle]');
  if (notesBtn) {
    const sync = () => {
      const hidden = root.classList.contains('notes-hidden');
      notesBtn.textContent = `${hidden ? 'Mostrar' : 'Ocultar'} notas para Carlos`;
    };
    notesBtn.addEventListener('click', () => {
      const hidden = root.classList.toggle('notes-hidden');
      try { localStorage.setItem('ith-notas', hidden ? 'ocultas' : 'visibles'); } catch (e) { /* almacenamiento no disponible */ }
      sync();
    });
    sync();
  }

  /* ---------- Revelado al hacer scroll ---------- */
  if (motion) {
    const items = document.querySelectorAll('.rv');
    // Demora: `data-d` (segundos) o, si no hay, escalonada según la posición entre hermanos `.rv`.
    items.forEach((el) => {
      let delay = parseFloat(el.dataset.d);
      if (Number.isNaN(delay)) {
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('rv'));
        delay = siblings.indexOf(el) * 0.09;
      }
      el.style.animationDelay = `${delay}s`;
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => target.classList.toggle('show', isIntersecting));
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Contadores ---------- */
  // Cada `[data-counter="<demora ms>"]` anima sus `[data-count]` de 0 al valor final al entrar en pantalla.
  const DURATION = 2200;
  const runCounters = (group) => {
    const nums = [...group.querySelectorAll('[data-count]')];
    const delay = Number(group.dataset.counter) || 0;
    let raf = 0;
    let timer = 0;
    const render = (k) => nums.forEach((n) => {
      const v = String(Math.round(Number(n.dataset.count) * k));
      if (n.textContent !== v) n.textContent = v;
    });
    new IntersectionObserver((entries) => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      render(0);
      if (!entries[entries.length - 1].isIntersecting) return;
      timer = setTimeout(() => {
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - t0) / DURATION);
          render(1 - (1 - k) ** 3); // ease-out cúbico
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, delay);
    }, { threshold: 0.35 }).observe(group);
  };
  if (motion) document.querySelectorAll('[data-counter]').forEach(runCounters);

  /* ---------- Mapa de provincias ---------- */
  const map = document.querySelector('.armap');
  const mapName = document.querySelector('[data-map-name]');
  const mapStatus = document.querySelector('[data-map-status]');
  if (map && mapName && mapStatus) {
    map.addEventListener('pointerover', (e) => {
      const prov = e.target.closest('.prov');
      if (!prov) return;
      mapName.textContent = prov.dataset.name;
      mapStatus.textContent = prov.classList.contains('on') ? 'Con proyectos o partners' : 'A sumar';
    });
    map.addEventListener('pointerout', (e) => {
      if (!e.target.closest('.prov')) return;
      mapName.textContent = '';
      mapStatus.textContent = '';
    });
  }

  /* ---------- Formulario de reunión ---------- */
  const form = document.querySelector('[data-contact-form]');
  const formStatus = form && form.querySelector('[data-form-status]');
  if (form && formStatus) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // TODO: enviar los datos (backend propio, Formspree, Netlify Forms, etc.). Hoy solo se confirma en pantalla.
      formStatus.textContent = 'Recibimos tus datos. Te escribimos para coordinar la reunión.';
    });
  }
})();
