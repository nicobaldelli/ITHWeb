/* Intellihelp — Home: interacciones de la página (sin dependencias). */
(() => {
  'use strict';

  const root = document.documentElement;
  const motion = root.classList.contains('anim'); // ver script en <head>
  const lastEntry = (entries) => entries[entries.length - 1];

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

  /* ---------- Menú en pantallas angostas ---------- */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = navToggle && document.getElementById(navToggle.getAttribute('aria-controls'));
  if (navToggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
      setOpen(false);
      navToggle.focus();
    });
  }

  /* ---------- CTAs "Agendá tu asesoría": parámetros de campaña + medición ---------- */
  // Los UTM (y los click IDs de Google, Meta y Microsoft) de la URL de entrada se reenvían a /asesoria.
  // Se guardan en la sesión para no perderlos si el visitante navega antes de hacer clic.
  const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
  const campaign = (() => {
    const qs = new URLSearchParams(location.search);
    let pairs = CAMPAIGN_KEYS.filter((k) => qs.get(k)).map((k) => [k, qs.get(k)]);
    try {
      if (pairs.length) sessionStorage.setItem('ith-campania', JSON.stringify(pairs));
      else pairs = JSON.parse(sessionStorage.getItem('ith-campania')) || [];
    } catch (e) { /* almacenamiento no disponible */ }
    return pairs;
  })();
  document.querySelectorAll('a[data-cta]').forEach((link) => {
    if (campaign.length) {
      const url = new URL(link.getAttribute('href'), location.href);
      campaign.forEach(([k, v]) => { if (!url.searchParams.has(k)) url.searchParams.set(k, v); });
      link.href = url.href;
    }
    // Además de los atributos id/data-cta (para triggers de clic en GTM), se publica un evento propio.
    link.addEventListener('click', () => {
      (window.dataLayer = window.dataLayer || []).push({
        event: 'cta_click',
        cta_id: link.id,
        cta_section: link.dataset.cta,
        cta_url: link.href,
      });
    });
  });

  /* ---------- Revelado al hacer scroll ---------- */
  if (motion) {
    const items = document.querySelectorAll('.rv');
    // Demora: `data-d` (segundos) o, si no hay, escalonada según la posición entre hermanos `.rv`.
    // `items` viene en orden de documento, así que basta contar cuántos `.rv` ya pasaron por cada padre.
    const seen = new Map();
    items.forEach((el) => {
      const index = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, index + 1);
      const delay = parseFloat(el.dataset.d);
      el.style.animationDelay = `${Number.isNaN(delay) ? index * 0.09 : delay}s`;
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
      if (!lastEntry(entries).isIntersecting) return;
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

  /* ---------- Carruseles (servicios de a tres; láminas de casos de a una) ---------- */
  // Sin JS quedan como scroll horizontal con snap; con JS suman flechas, puntos y, salvo
  // `data-carousel-autoplay="off"`, avance automático con pausa.
  const initCarousel = (carousel) => {
    const AUTOPLAY_MS = 7000;
    const autoplay = motion && carousel.dataset.carouselAutoplay !== 'off';
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = [...track.children];
    const controls = carousel.querySelector('[data-carousel-controls]');
    const dotsBox = carousel.querySelector('[data-carousel-dots]');
    const pauseBtn = carousel.querySelector('[data-carousel-pause]');
    const offset = (i) => slides[i].offsetLeft - slides[0].offsetLeft;
    let index = 0;
    let timer = 0;
    let userPaused = false;
    let hovering = false;
    let focusInside = false;
    let inView = false;

    // Avanza solo si nadie está mirando o usando una tarjeta, y nunca con "reducir movimiento".
    const schedule = () => {
      clearTimeout(timer);
      const busy = userPaused || hovering || focusInside || !inView || document.hidden
        || track.querySelector('details[open]');
      if (autoplay && !busy) timer = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    };
    const render = () => {
      slides.forEach((slide, i) => { slide.inert = i !== index; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    };
    const go = (i) => {
      index = (i + slides.length) % slides.length;
      track.scrollTo({ left: offset(index), behavior: motion ? 'smooth' : 'auto' });
      render();
      schedule();
    };
    const dots = slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', slide.getAttribute('aria-label'));
      dot.addEventListener('click', () => go(i));
      dotsBox.append(dot);
      return dot;
    });

    carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => go(index - 1));
    carousel.querySelector('[data-carousel-next]').addEventListener('click', () => go(index + 1));
    if (autoplay) {
      pauseBtn.hidden = false;
      pauseBtn.addEventListener('click', () => {
        userPaused = !userPaused;
        pauseBtn.textContent = userPaused ? 'Reanudar' : 'Pausar';
        schedule();
      });
    } else {
      pauseBtn.hidden = true;
    }

    // Deslizar con el dedo: al terminar el scroll, el grupo más cercano pasa a ser el activo.
    let settle = 0;
    track.addEventListener('scroll', () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const x = track.scrollLeft;
        const nearest = slides.reduce((best, _, i) => (Math.abs(offset(i) - x) < Math.abs(offset(best) - x) ? i : best), 0);
        if (nearest === index) return;
        index = nearest;
        render();
        schedule();
      }, 120);
    }, { passive: true });

    track.addEventListener('pointerenter', () => { hovering = true; schedule(); });
    track.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    track.addEventListener('focusin', () => { focusInside = true; schedule(); });
    track.addEventListener('focusout', (e) => {
      if (track.contains(e.relatedTarget)) return;
      focusInside = false;
      schedule();
    });
    track.addEventListener('toggle', schedule, true); // el `toggle` de <details> no burbujea
    document.addEventListener('visibilitychange', schedule);
    addEventListener('resize', () => track.scrollTo({ left: offset(index), behavior: 'auto' }));
    new IntersectionObserver((entries) => {
      inView = lastEntry(entries).isIntersecting;
      schedule();
    }, { threshold: 0.4 }).observe(carousel);

    controls.hidden = slides.length < 2;
    render();
  };
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);

  /* ---------- Mapa de provincias ---------- */
  const map = document.querySelector('[data-map]');
  if (map) {
    const active = [...map.querySelectorAll('.prov.on')];
    // La descripción accesible se arma con las provincias marcadas con `on`.
    try {
      const names = new Intl.ListFormat('es').format(active.map((p) => p.dataset.name));
      map.setAttribute('aria-label', `Mapa de Argentina por provincias. Con proyectos o partners: ${names}.`);
    } catch (e) { /* queda la descripción del HTML */ }

    // Al entrar en pantalla, las provincias se prenden de a una: de CABA hacia afuera.
    if (motion) {
      const ORDER = ['Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Santa Fe', 'Entre Ríos', 'Córdoba', 'San Luis', 'Mendoza', 'San Juan', 'Neuquén', 'Corrientes', 'Misiones', 'Salta'];
      const rank = (p) => { const i = ORDER.indexOf(p.dataset.name); return i === -1 ? ORDER.length : i; };
      [...active].sort((a, b) => rank(a) - rank(b)).forEach((p, i) => { p.style.animationDelay = `${0.5 + i * 0.25}s`; });
      new IntersectionObserver((entries) => {
        map.classList.toggle('is-lit', lastEntry(entries).isIntersecting);
      }, { threshold: 0.35 }).observe(map);
    }

    const mapName = document.querySelector('[data-map-name]');
    const mapStatus = document.querySelector('[data-map-status]');
    if (mapName && mapStatus) {
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
  }
})();
