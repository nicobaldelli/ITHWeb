/* Intellihelp — Home: interacciones de la página (sin dependencias). */
(() => {
  'use strict';

  const root = document.documentElement;
  const motion = root.classList.contains('anim'); // ver script en <head>
  const lastEntry = (entries) => entries[entries.length - 1];

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

  /* ---------- Barra: resalta la sección que se está viendo ---------- */
  // Cada link de la barra cubre una o más secciones (Quiénes somos abarca Equipo e Historia).
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  if (navLinks.length && 'IntersectionObserver' in window) {
    const COVERS = { '#equipo': ['equipo', 'historia'] };
    const linkFor = {};
    navLinks.forEach((a) => (COVERS[a.getAttribute('href')] || [a.getAttribute('href').slice(1)]).forEach((id) => { linkFor[id] = a; }));
    const sections = Object.keys(linkFor).map((id) => document.getElementById(id)).filter(Boolean);
    const visible = new Map();
    const paint = () => {
      let best = null;
      visible.forEach((ratio, el) => { if (ratio > 0 && (!best || ratio > visible.get(best))) best = el; });
      navLinks.forEach((a) => a.classList.toggle('is-active', Boolean(best) && linkFor[best.id] === a));
    };
    new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
      paint();
    }, { threshold: [0, .2, .4, .6, .8], rootMargin: '-77px 0px -40% 0px' }).observe && sections.forEach((sec) => {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => visible.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
        paint();
      }, { threshold: [0, .2, .4, .6, .8], rootMargin: '-77px 0px -40% 0px' }).observe(sec);
    });
  }

  /* ---------- Enlaces internos: medición y apertura del texto plegado al llegar ---------- */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.getAttribute('href') === '#') return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    const more = target.querySelector('.section-head details.more--text, .presence__text details.more--text, .history__more');
    if (more) more.open = true; // que el visitante no aterrice en un párrafo plegado
    (window.dataLayer = window.dataLayer || []).push({
      event: 'internal_nav',
      link_text: link.textContent.replace('→', '').trim(),
      link_target: link.getAttribute('href'),
      link_from: (link.closest('section[id]') || link.closest('header, footer') || {}).id || (link.closest('footer') ? 'footer' : link.closest('header') ? 'header' : ''),
    });
  });

  /* ---------- CTAs "Agendá reunión": parámetros de campaña + medición ---------- */
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

  /* ---------- Hero: solo video hasta que el visitante toca la flecha o scrollea ---------- */
  const hero = document.querySelector('[data-hero]');
  if (hero && motion) {
    const openBtn = hero.querySelector('[data-hero-open]');
    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      hero.classList.remove('is-idle');
      // Replay del revelado escalonado del texto (ya se había disparado, oculto, al cargar)
      hero.querySelectorAll('.rv.show').forEach((el) => {
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
      });
      ['wheel', 'touchmove', 'keydown', 'scroll'].forEach((ev) => removeEventListener(ev, onIntent));
    };
    const onIntent = (e) => {
      if (e.type === 'wheel' && e.deltaY <= 0) return;
      if (e.type === 'keydown' && !['ArrowDown', 'PageDown', 'End', ' ', 'Spacebar'].includes(e.key)) return;
      if (e.type === 'scroll' && scrollY < 8) return;
      open();
    };
    hero.classList.add('is-idle');
    openBtn.hidden = false;
    openBtn.addEventListener('click', open);
    if (scrollY > 8) open(); // la página ya venía scrolleada (recarga, ancla)
    else ['wheel', 'touchmove', 'keydown', 'scroll'].forEach((ev) => addEventListener(ev, onIntent, { passive: true }));
  }

  /* ---------- Párrafos largos detrás de "Ver más" ---------- */
  // Cada párrafo marcado con `data-more` se envuelve en el mismo desplegable que usan las cards (details.more).
  // Sin JS, el párrafo se ve completo.
  document.querySelectorAll('[data-more]').forEach((par) => {
    const details = document.createElement('details');
    details.className = 'more more--text';
    details.innerHTML = '<summary class="more__btn"><span class="more__label--closed">Ver más</span><span class="more__label--open">Ver menos</span>'
      + '<svg class="more__chev" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary>'
      + '<div class="more__body"></div>';
    par.replaceWith(details);
    details.querySelector('.more__body').append(par);
  });

  /* ---------- Revelado al hacer scroll ---------- */
  if (motion) {
    const items = document.querySelectorAll('.rv');
    // Demora: `data-d` (segundos) o, si no hay, escalonada según la posición entre hermanos `.rv`, con tope: en listas
    // largas (la línea de tiempo) cada ítem aparece apenas entra en pantalla, sin arrastrar la espera de los anteriores.
    // `items` viene en orden de documento, así que basta contar cuántos `.rv` ya pasaron por cada padre.
    const seen = new Map();
    items.forEach((el) => {
      const index = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, index + 1);
      const delay = parseFloat(el.dataset.d);
      el.style.animationDelay = `${Number.isNaN(delay) ? Math.min(index, 3) * 0.09 : delay}s`;
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
    }, { threshold: 0.15 }).observe(group); // arranca apenas asoma el bloque
  };
  if (motion) document.querySelectorAll('[data-counter]').forEach(runCounters);

  /* ---------- Carruseles (servicios de a tres; casos de a uno) ---------- */
  // Sin JS quedan como scroll horizontal con snap; con JS suman flechas, puntos o contador y, salvo
  // `data-carousel-autoplay="off"`, avance automático con pausa. Si una tarjeta tiene una lista `data-steps`
  // (varios proyectos de un cliente), se muestran de a uno antes de pasar a la tarjeta siguiente.
  // Con `data-carousel-order="random"` el avance automático se baraja (y se vuelve a barajar en cada vuelta); las
  // flechas siempre van en orden lineal. Devuelve una API
  // con `setPool(indices, { pinned })` para limitar las tarjetas visibles (la usa el mini menú de casos).
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const initCarousel = (carousel) => {
    const AUTOPLAY_MS = 7000;
    const STEP_MS = 3500;
    const MAX_DOTS = 10; // con más tarjetas, contador "n de N" en vez de puntos
    const autoplay = motion && carousel.dataset.carouselAutoplay !== 'off';
    carousel.classList.toggle('is-auto', autoplay);
    carousel.style.setProperty('--step-ms', `${STEP_MS}ms`);
    carousel.style.setProperty('--auto-ms', `${AUTOPLAY_MS}ms`);
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = [...track.children];
    const controls = carousel.querySelector('[data-carousel-controls]');
    const dotsBox = carousel.querySelector('[data-carousel-dots]');
    const pauseBtn = carousel.querySelector('[data-carousel-pause]');
    const random = carousel.dataset.carouselOrder === 'random';
    let pool = slides.map((_, i) => i); // tarjetas habilitadas (todas, o las que elige el mini menú)
    let seq = [];                        // orden de reproducción (barajado si `random`)
    let pinned = false;                  // una sola tarjeta elegida: no se pasa a otra
    const buildSeq = (first) => {
      seq = random ? shuffle([...pool]) : [...pool];
      if (first !== undefined && seq.includes(first)) seq.splice(seq.indexOf(first), 1), seq.unshift(first);
    };
    buildSeq();
    const neighbor = (dir) => {
      const p = seq.indexOf(index);
      if (p === -1) return seq[0];
      if (random && dir > 0 && p === seq.length - 1 && seq.length > 1) {
        // Fin de la vuelta: se baraja de nuevo, cuidando que no se repita la última
        do buildSeq(); while (seq[0] === index);
        return seq[0];
      }
      return seq[(p + dir + seq.length) % seq.length];
    };
    // Flechas: orden lineal dentro de las tarjetas habilitadas, aunque el automático sea al azar
    const linear = (dir) => pool[(pool.indexOf(index) + dir + pool.length) % pool.length];
    const firstShown = () => slides.find((slide) => !slide.hidden) || slides[0];
    const offset = (i) => slides[i].offsetLeft - firstShown().offsetLeft;
    let index = seq[0] || 0;
    let step = 0;
    let timer = 0;
    let userPaused = false;
    let hovering = false;
    let focusInside = false;
    let inView = false;

    // Avanza solo si nadie está mirando o usando una tarjeta, y nunca con "reducir movimiento".
    const stepsOf = (i) => [...slides[i].querySelectorAll('[data-steps] > li')];
    const setStep = (k) => {
      step = k;
      stepsOf(index).forEach((li, j) => li.setAttribute('aria-current', String(j === k)));
    };
    const schedule = () => {
      clearTimeout(timer);
      const busy = userPaused || hovering || focusInside || !inView || document.hidden
        || track.querySelector('details[open]');
      carousel.classList.toggle('is-paused', Boolean(busy));
      if (!autoplay || busy) return;
      const steps = stepsOf(index);
      if (pinned) return; // tarjeta elegida a mano: queda quieta, sin barras ni avance automático
      timer = setTimeout(() => {
        if (steps.length > 1 && step < steps.length - 1) { setStep(step + 1); schedule(); }
        else go(neighbor(1));
      }, steps.length > 1 ? STEP_MS : AUTOPLAY_MS);
    };
    const render = () => {
      slides.forEach((slide, i) => { slide.inert = i !== index; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
      if (!dots.length) dotsBox.textContent = carousel.dataset.carouselCounter === 'off' ? '' : `${pool.indexOf(index) + 1} de ${pool.length}`;
      setStep(0);
    };
    const go = (i, instant) => {
      index = pool.includes(i) ? i : seq[0];
      track.scrollTo({ left: offset(index), behavior: motion && !instant ? 'smooth' : 'auto' });
      render();
      schedule();
    };
    // Limita el carrusel a un grupo de tarjetas. `pinned`: una sola, elegida a mano (no se pasa a otra).
    const setPool = (indices, opts = {}) => {
      pool = indices.length ? [...indices] : slides.map((_, i) => i);
      pinned = Boolean(opts.pinned);
      carousel.classList.toggle('is-pinned', pinned);
      slides.forEach((slide, i) => { slide.hidden = !pool.includes(i); });
      dots.forEach((dot, i) => { dot.hidden = !pool.includes(i); });
      buildSeq(pool.includes(index) && !pinned ? index : undefined);
      controls.hidden = seq.length < 2;
      go(pool.includes(index) && !pinned ? index : seq[0], true);
    };
    const dots = slides.length > MAX_DOTS ? [] : slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', slide.getAttribute('aria-label'));
      dot.addEventListener('click', () => go(i));
      dotsBox.append(dot);
      return dot;
    });

    carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => go(linear(-1)));
    carousel.querySelector('[data-carousel-next]').addEventListener('click', () => go(linear(1)));
    // Elegir un proyecto a mano dentro de la tarjeta activa
    track.addEventListener('click', (e) => {
      const li = e.target.closest('[data-steps] > li');
      if (!li || !slides[index].contains(li)) return;
      setStep(stepsOf(index).indexOf(li));
      schedule();
    });
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
        const nearest = pool.reduce((best, i) => (Math.abs(offset(i) - x) < Math.abs(offset(best) - x) ? i : best), pool[0]);
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

    controls.hidden = seq.length < 2;
    if (random) track.scrollTo({ left: offset(index), behavior: 'auto' }); // arranca en una tarjeta al azar
    render();
    return { slides, setPool };
  };
  const carousels = new Map();
  document.querySelectorAll('[data-carousel]').forEach((c) => carousels.set(c, initCarousel(c)));

  /* ---------- Casos: mini menú (sector → cliente) ---------- */
  // Se arma con los datos de las tarjetas: sector por el eyebrow, logo por .case-card__logo. Sin elección, pasan
  // todos al azar; con sector, pasan al azar los de ese sector; con cliente, queda fija su tarjeta.
  const caseMenu = document.querySelector('[data-case-menu]');
  const caseCarousel = caseMenu && caseMenu.parentElement.querySelector('[data-carousel]');
  if (caseMenu && carousels.has(caseCarousel)) {
    const api = carousels.get(caseCarousel);
    const cases = api.slides.map((slide, i) => {
      const logo = slide.querySelector('.case-card__logo');
      const img = logo && logo.querySelector('img');
      return {
        i,
        name: slide.querySelector('.case-card__name').textContent.trim(),
        sector: /privad/i.test(slide.querySelector('.case-card__who .eyebrow').textContent) ? 'privado' : 'publico',
        logoSrc: img ? img.getAttribute('src') : '',
      };
    });
    const sectorBtns = [...caseMenu.querySelectorAll('[data-sector]')];
    const clientsBox = caseMenu.querySelector('[data-case-clients]');
    const logosList = caseMenu.querySelector('[data-case-logos]');
    const status = caseMenu.querySelector('[data-case-status]');
    const resetBtn = caseMenu.querySelector('[data-case-reset]');
    const SECTOR_NAME = { publico: 'sector público', privado: 'sector privado' };
    let sector = null;
    let client = null;

    const renderLogos = () => {
      logosList.replaceChildren();
      if (!sector) return;
      cases.filter((c) => c.sector === sector).forEach((c, k) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'case-menu__logo';
        btn.dataset.case = c.i;
        btn.title = c.name;
        btn.setAttribute('aria-label', c.name);
        btn.setAttribute('aria-pressed', String(c.i === client));
        btn.style.animationDelay = `${k * 0.03}s`;
        if (c.logoSrc) {
          const img = document.createElement('img');
          img.src = c.logoSrc; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
          btn.append(img);
        } else {
          btn.textContent = c.name;
        }
        li.append(btn);
        logosList.append(li);
      });
    };
    const apply = () => {
      sectorBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.sector === sector)));
      clientsBox.hidden = !sector;
      resetBtn.hidden = !sector && client === null;
      renderLogos();
      if (client !== null) {
        const c = cases[client];
        api.setPool([client], { pinned: true });
        status.textContent = `${c.name}.`;
      } else if (sector) {
        const group = cases.filter((c) => c.sector === sector).map((c) => c.i);
        api.setPool(group);
        status.textContent = `Pasan al azar los casos del ${SECTOR_NAME[sector]}. Elegí un cliente para ver solo el suyo.`;
      } else {
        api.setPool([]);
        status.textContent = 'Sin filtro: pasan al azar todos los casos.';
      }
    };
    caseMenu.addEventListener('click', (e) => {
      const sBtn = e.target.closest('[data-sector]');
      const lBtn = e.target.closest('[data-case]');
      if (sBtn) {
        sector = sector === sBtn.dataset.sector ? null : sBtn.dataset.sector; // volver a tocarlo lo destilda
        client = null;
      } else if (lBtn) {
        const i = Number(lBtn.dataset.case);
        client = client === i ? null : i;
      } else if (e.target.closest('[data-case-reset]')) {
        sector = null; client = null;
      } else return;
      apply();
    });
    caseMenu.hidden = false;
    caseMenu.parentElement.classList.add('cases-layout--menu');
    apply();
    // Para que otras secciones (el fichero de clientes) puedan abrir un caso: por el archivo del logo
    caseMenu.selectByLogo = (src) => {
      const c = cases.find((x) => x.logoSrc && src.endsWith(x.logoSrc.replace(/^.*\//, '')));
      if (!c) return false;
      sector = c.sector; client = c.i; apply();
      return true;
    };
    caseMenu.hasLogo = (src) => cases.some((x) => x.logoSrc && src.endsWith(x.logoSrc.replace(/^.*\//, '')));
  }

  /* ---------- Clientes: fichero ---------- */
  // Los logos salen de la lista .filecab__all (un li por cliente, con data-group). Se arman fichas de hasta seis
  // logos de un mismo rubro y pasan solas; los rubros son pestañas que filtran (sin elegir, se muestran todos).
  const filecab = document.querySelector('[data-filecab]');
  if (filecab) {
    const PER_CARD = 6;
    const FLIP_MS = 2800;
    const FIRST_MS = 1400; // la primera pasada al entrar en pantalla, más corta
    const ANIM_MS = 700;
    const source = filecab.querySelector('[data-filecab-logos]');
    const stack = filecab.querySelector('[data-filecab-stack]');
    const tabs = [...filecab.querySelectorAll('.filecab__tab')];
    const controls = filecab.querySelector('[data-filecab-controls]');
    const status = filecab.querySelector('[data-filecab-status]');
    const labels = Object.fromEntries(tabs.map((t) => [t.dataset.group, t.textContent.trim()]));
    const logos = [...source.children].map((li) => ({ group: li.dataset.group, node: li }));
    let group = null;
    let cards = [];
    let current = 0;
    let timer = 0;
    let animating = false;
    let focusInside = false;
    let inView = false;
    let fresh = true; // recién entrado en pantalla

    // Sin pausa por mouse encima: al scrollear con la rueda el puntero queda sobre las fichas y la primera pasada
    // tardaba más que las demás. Se pausa solo con foco adentro (teclado), fuera de pantalla o con la pestaña oculta.
    const schedule = () => {
      clearTimeout(timer);
      if (!motion || cards.length < 2 || focusInside || !inView || document.hidden) return;
      timer = setTimeout(() => { fresh = false; go(1); }, fresh ? FIRST_MS : FLIP_MS);
    };
    const render = () => {
      const n = cards.length;
      [...stack.children].forEach((el, i) => {
        const pos = (i - current + n) % n;
        el.dataset.pos = Math.min(pos, 3);
        el.inert = pos !== 0;
      });
      status.textContent = n ? `${labels[cards[current].group]} · ficha ${current + 1} de ${n}` : '';
      tabs.forEach((t) => t.classList.toggle('is-current', n > 0 && t.dataset.group === cards[current].group));
      controls.hidden = n < 2;
    };
    const go = (dir) => {
      const n = cards.length;
      if (n < 2 || animating) return;
      const leaving = stack.children[current];
      current = (current + dir + n) % n;
      if (motion) {
        // Hacia adelante, la ficha de adelante se levanta y gira hacia atrás; hacia atrás, la anterior baja girando.
        const el = dir > 0 ? leaving : stack.children[current];
        el.classList.add(dir > 0 ? 'is-out' : 'is-in');
        animating = true;
        setTimeout(() => { el.classList.remove('is-out', 'is-in'); animating = false; }, ANIM_MS);
      }
      render();
      schedule();
    };
    const build = () => {
      const byGroup = new Map();
      logos.filter((l) => !group || l.group === group).forEach((l) => {
        if (!byGroup.has(l.group)) byGroup.set(l.group, []);
        byGroup.get(l.group).push(l);
      });
      cards = [];
      byGroup.forEach((list, g) => {
        // Fichas parejas: 16 logos van 6+5+5, no 6+6+4
        const count = Math.ceil(list.length / PER_CARD);
        const size = Math.ceil(list.length / count);
        for (let i = 0; i < list.length; i += size) cards.push({ group: g, logos: list.slice(i, i + size) });
      });
      stack.replaceChildren(...cards.map((card, i) => {
        const el = document.createElement('article');
        el.className = 'filecab__card';
        el.setAttribute('aria-label', `${labels[card.group]}, ficha ${i + 1} de ${cards.length}`);
        const tab = document.createElement('span');
        tab.className = 'filecab__card-tab';
        tab.setAttribute('aria-hidden', 'true');
        tab.textContent = labels[card.group];
        tab.style.setProperty('--i', tabs.findIndex((t) => t.dataset.group === card.group));
        const ul = document.createElement('ul');
        ul.className = 'filecab__logos list-reset';
        card.logos.forEach((l) => {
          const li = l.node.cloneNode(true);
          li.querySelector('img').removeAttribute('loading'); // que no aparezcan a medio cargar en el primer giro
          ul.append(li);
        });
        el.append(tab, ul);
        return el;
      }));
      current = 0;
      render();
      schedule();
      markLinks();
    };

    // Logos con caso de éxito: al tocarlos se abre su caso en la sección Casos
    const casesMenu = document.querySelector('[data-case-menu]');
    function markLinks() {
      if (!casesMenu || !casesMenu.hasLogo) return;
      stack.querySelectorAll('.logo img').forEach((img) => {
        const li = img.closest('.logo');
        const linked = casesMenu.hasLogo(img.getAttribute('src'));
        li.classList.toggle('logo--link', linked);
        if (linked) { li.setAttribute('role', 'link'); li.setAttribute('tabindex', '0'); li.title = `Ver el caso de ${img.alt}`; }
      });
    }
    filecab.addEventListener('click', (e) => {
      const logo = e.target.closest('.logo--link');
      if (logo && casesMenu && casesMenu.selectByLogo(logo.querySelector('img').getAttribute('src'))) {
        e.stopPropagation();
        document.getElementById('casos').scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
        (window.dataLayer = window.dataLayer || []).push({ event: 'internal_nav', link_text: logo.querySelector('img').alt, link_target: '#casos', link_from: 'clientes' });
        return;
      }
      const tab = e.target.closest('.filecab__tab');
      if (tab) {
        group = group === tab.dataset.group ? null : tab.dataset.group; // volver a tocarla la destilda
        tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.group === group)));
        build();
      } else if (e.target.closest('[data-filecab-prev]')) go(-1);
      else if (e.target.closest('[data-filecab-next]')) go(1);
      else if (e.target.closest('.filecab__card')) go(1); // tocar la ficha también la pasa
    });
    filecab.addEventListener('focusin', () => { focusInside = true; schedule(); });
    filecab.addEventListener('focusout', (e) => {
      if (filecab.contains(e.relatedTarget)) return;
      focusInside = false;
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver((entries) => {
      inView = lastEntry(entries).isIntersecting;
      if (inView) fresh = true;
      schedule();
    }, { threshold: 0.4 }).observe(filecab);

    source.hidden = true;
    stack.hidden = false;
    build();
  }

  /* ---------- Socios tecnológicos: slots que rotan en barrido ---------- */
  // Dos grillas (mayoristas arriba, marcas abajo), cada una muestra una fila (tres en celular) y guarda el resto de
  // sus logos en una cola propia. Al entrar en pantalla, al segundo arranca el recorrido: una celda por segundo, en
  // orden de lectura por las dos grillas, en loop. Cada celda toma el próximo logo de su cola y manda el suyo al final.
  const slotsWrap = document.querySelector('[data-slots-groups]');
  if (slotsWrap && motion) {
    const START_MS = 1000;  // espera antes del primer giro
    const STEP_MS = 1000;   // entre el giro de una celda y la siguiente
    const FLIP_MS = 320;
    const setLogo = (li, logo) => {
      const img = li.querySelector('img');
      img.src = logo.src; img.alt = logo.alt; img.width = logo.w; img.height = logo.h;
    };
    const grids = [...slotsWrap.querySelectorAll('[data-slots]')].map((grid) => {
      const cells = [...grid.children];
      const logos = cells.map((li) => { const img = li.querySelector('img'); return { src: img.getAttribute('src'), alt: img.alt, w: img.width, h: img.height }; });
      return { grid, cells, logos, visible: 0, shown: [], queue: [] };
    });
    let timer = 0;
    let inView = false;
    let cursor = 0;
    const layout = () => {
      grids.forEach((g) => {
        const cols = getComputedStyle(g.grid).gridTemplateColumns.split(' ').length;
        const n = Math.min(g.cells.length, cols * (cols <= 2 ? 3 : 1));
        if (n === g.visible) return;
        g.visible = n;
        g.shown = g.logos.map((_, i) => i).slice(0, n);
        g.queue = g.logos.map((_, i) => i).slice(n);
        g.cells.forEach((li, i) => { li.hidden = i >= n; if (i < n) setLogo(li, g.logos[i]); });
      });
    };
    const flipCell = (g, cell) => {
      if (!g.queue.length) return;
      const incoming = g.queue.shift();
      const li = g.cells[cell];
      li.classList.add('is-flip');
      setTimeout(() => {
        g.queue.push(g.shown[cell]);
        g.shown[cell] = incoming;
        setLogo(li, g.logos[incoming]);
        li.classList.remove('is-flip');
      }, FLIP_MS);
    };
    const total = () => grids.reduce((n, g) => n + g.visible, 0);
    const schedule = (first) => {
      clearTimeout(timer);
      if (!inView || document.hidden) return;
      timer = setTimeout(() => {
        let k = cursor;
        for (const g of grids) {
          if (k < g.visible) { flipCell(g, k); break; }
          k -= g.visible;
        }
        cursor = (cursor + 1) % total();
        schedule(false);
      }, first ? START_MS : STEP_MS);
    };
    layout();
    addEventListener('resize', layout);
    document.addEventListener('visibilitychange', () => schedule(true));
    new IntersectionObserver((entries) => {
      inView = lastEntry(entries).isIntersecting;
      schedule(true);
    }, { threshold: 0.3 }).observe(slotsWrap);
  }

  /* ---------- Mapas (provincias y países) ---------- */
  // Cada `[data-map]` pinta sus zonas con `on`, las prende de a una al entrar en pantalla (en el orden de
  // `data-map-order`, o el del documento) y muestra el nombre al pasar el mouse. El texto va en la .map-card.
  document.querySelectorAll('[data-map]').forEach((map) => {
    const active = [...map.querySelectorAll('.prov.on')];
    const order = (map.dataset.mapOrder || '').split('|').filter(Boolean);
    const isRegion = map.classList.contains('armap--region');
    try {
      const names = new Intl.ListFormat('es').format(active.map((p) => p.dataset.name));
      map.setAttribute('aria-label', isRegion
        ? `Mapa de Latinoamérica por países. Con presencia: ${names}.`
        : `Mapa de Argentina por provincias. Con proyectos o partners: ${names}.`);
    } catch (e) { /* queda la descripción del HTML */ }

    if (motion) {
      const rank = (p) => { const i = order.indexOf(p.dataset.name); return i === -1 ? order.length : i; };
      [...active].sort((a, b) => rank(a) - rank(b)).forEach((p, i) => { p.style.animationDelay = `${0.5 + i * 0.25}s`; });
      new IntersectionObserver((entries) => {
        map.classList.toggle('is-lit', lastEntry(entries).isIntersecting);
      }, { threshold: 0.35 }).observe(map);
    }

    const card = map.closest('.map-card') || document;
    const mapName = card.querySelector('[data-map-name]');
    const mapStatus = card.querySelector('[data-map-status]');
    if (mapName && mapStatus) {
      const onText = isRegion ? 'Con presencia' : 'Con proyectos o partners';
      map.addEventListener('pointerover', (e) => {
        const prov = e.target.closest('.prov');
        if (!prov) return;
        mapName.textContent = prov.dataset.name;
        mapStatus.textContent = prov.classList.contains('on') ? onText : 'A sumar';
      });
      map.addEventListener('pointerout', (e) => {
        if (!e.target.closest('.prov')) return;
        mapName.textContent = '';
        mapStatus.textContent = '';
      });
    }
  });
})();
