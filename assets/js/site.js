// Portfolio interactions. No dependencies; everything degrades to a complete static page.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Theme: explicit choice wins, otherwise the system preference.
  const toggle = $('[data-theme-toggle]');
  const isLight = () => (root.dataset.theme ? root.dataset.theme === 'light' : matchMedia('(prefers-color-scheme: light)').matches);
  const syncToggle = () => toggle && toggle.setAttribute('aria-label', isLight() ? 'Switch to dark theme' : 'Switch to light theme');
  syncToggle();
  toggle?.addEventListener('click', () => {
    const next = isLight() ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f5f6fa' : '#0a0c12');
    syncToggle();
  });

  // Nav background once scrolled.
  const nav = $('[data-nav]');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 12);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu sheet: focus moves in, Escape and links close it, focus returns to the button.
  const sheet = $('[data-sheet]');
  const menuBtn = $('[data-menu-btn]');
  const setMenu = (open) => {
    sheet.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', sheet).focus(); else menuBtn.focus();
  };
  menuBtn?.addEventListener('click', () => setMenu(sheet.hidden));
  sheet?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet && !sheet.hidden) setMenu(false);
    if (e.key === 'Tab' && sheet && !sheet.hidden) {
      const items = [...$$('a, button', sheet), menuBtn];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });

  // Active section in the nav.
  const links = $$('.nav-links a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => sectionObserver.observe(s));

  // Scroll reveals (content is visible without JS or with reduced motion).
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealer.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach((el) => revealer.observe(el));

  // Count-up for the key results.
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      counter.unobserve(en.target);
      const end = Number(en.target.dataset.count);
      if (reduce || !end) return;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 1200);
        en.target.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => counter.observe(el));

  // Timeline line fills as you read.
  const timeline = $('[data-timeline]');
  if (timeline) {
    let ticking = false;
    const update = () => {
      const r = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      timeline.style.setProperty('--progress', p.toFixed(3));
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  if (finePointer && !reduce) {
    // Light that follows the pointer on project cards.
    $$('[data-glow]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    // Magnetic primary calls to action.
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    // Architecture stack tilts with the pointer.
    const scene = $('.stack-scene');
    const hero = $('.hero');
    if (scene && hero) {
      hero.addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        scene.style.setProperty('--rx', `${56 - y * 10}deg`);
        scene.style.setProperty('--rz', `${-36 + x * 12}deg`);
      });
      hero.addEventListener('pointerleave', () => { scene.style.removeProperty('--rx'); scene.style.removeProperty('--rz'); });
    }
  }

  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
