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

  /* ---------- Carruseles (servicios de a tres; casos de a uno) ---------- */
  // Sin JS quedan como scroll horizontal con snap; con JS suman flechas, puntos o contador y, salvo
  // `data-carousel-autoplay="off"`, avance automático con pausa. Si una tarjeta tiene una lista `data-steps`
  // (varios proyectos de un cliente), se muestran de a uno antes de pasar a la tarjeta siguiente.
  // Con `data-carousel-order="random"` el orden se baraja (y se vuelve a barajar en cada vuelta). Devuelve una API
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
      if (pinned && steps.length < 2) return; // una sola tarjeta con un solo proyecto: nada que pasar
      timer = setTimeout(() => {
        if (steps.length > 1 && step < steps.length - 1) { setStep(step + 1); schedule(); }
        else if (pinned) { setStep(0); schedule(); } // tarjeta elegida: sus proyectos vuelven a empezar
        else go(neighbor(1));
      }, steps.length > 1 ? STEP_MS : AUTOPLAY_MS);
    };
    const render = () => {
      slides.forEach((slide, i) => { slide.inert = i !== index; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
      if (!dots.length) dotsBox.textContent = `${seq.indexOf(index) + 1} de ${seq.length}`;
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

    carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => go(neighbor(-1)));
    carousel.querySelector('[data-carousel-next]').addEventListener('click', () => go(neighbor(1)));
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
        projects: Math.max(1, slide.querySelectorAll('[data-steps] > li').length),
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

    sectorBtns.forEach((btn) => {
      const n = cases.filter((c) => c.sector === btn.dataset.sector).length;
      btn.querySelector('[data-sector-count]').textContent = n;
    });

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
        btn.setAttribute('aria-label', `${c.name}: ${c.projects} ${c.projects === 1 ? 'proyecto' : 'proyectos'}`);
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
        status.textContent = `${c.name}: ${c.projects === 1 ? 'un proyecto' : `${c.projects} proyectos`}.`;
      } else if (sector) {
        const group = cases.filter((c) => c.sector === sector).map((c) => c.i);
        api.setPool(group);
        status.textContent = `Pasan al azar los ${group.length} casos del ${SECTOR_NAME[sector]}. Elegí un cliente para ver solo el suyo.`;
      } else {
        api.setPool([]);
        status.textContent = `Sin filtro: pasan al azar los ${cases.length} casos.`;
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
  }

  /* ---------- Clientes: fichero ---------- */
  // Los logos salen de la lista .filecab__all (un li por cliente, con data-group). Se arman fichas de hasta seis
  // logos de un mismo rubro y pasan solas; los rubros son pestañas que filtran (sin elegir, se muestran todos).
  const filecab = document.querySelector('[data-filecab]');
  if (filecab) {
    const PER_CARD = 6;
    const FLIP_MS = 3800;
    const ANIM_MS = 600;
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
    let hovering = false;
    let focusInside = false;
    let inView = false;

    const schedule = () => {
      clearTimeout(timer);
      if (!motion || cards.length < 2 || hovering || focusInside || !inView || document.hidden) return;
      timer = setTimeout(() => go(1), FLIP_MS);
    };
    const render = () => {
      const n = cards.length;
      [...stack.children].forEach((el, i) => {
        const pos = (i - current + n) % n;
        el.dataset.pos = Math.min(pos, 3);
        el.inert = pos !== 0;
      });
      status.textContent = n ? `${labels[cards[current].group]} · ficha ${current + 1} de ${n}` : '';
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
        const tab = document.createElement('p');
        tab.className = 'filecab__card-tab';
        tab.textContent = labels[card.group];
        const ul = document.createElement('ul');
        ul.className = 'filecab__logos list-reset';
        card.logos.forEach((l) => ul.append(l.node.cloneNode(true)));
        el.append(tab, ul);
        return el;
      }));
      current = 0;
      render();
      schedule();
    };

    filecab.addEventListener('click', (e) => {
      const tab = e.target.closest('.filecab__tab');
      if (tab) {
        group = group === tab.dataset.group ? null : tab.dataset.group; // volver a tocarla la destilda
        tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.group === group)));
        build();
      } else if (e.target.closest('[data-filecab-prev]')) go(-1);
      else if (e.target.closest('[data-filecab-next]')) go(1);
      else if (e.target.closest('.filecab__card')) go(1); // tocar la ficha también la pasa
    });
    stack.addEventListener('pointerenter', () => { hovering = true; schedule(); });
    stack.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    filecab.addEventListener('focusin', () => { focusInside = true; schedule(); });
    filecab.addEventListener('focusout', (e) => {
      if (filecab.contains(e.relatedTarget)) return;
      focusInside = false;
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver((entries) => {
      inView = lastEntry(entries).isIntersecting;
      schedule();
    }, { threshold: 0.4 }).observe(filecab);

    source.hidden = true;
    stack.hidden = false;
    build();
  }

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
