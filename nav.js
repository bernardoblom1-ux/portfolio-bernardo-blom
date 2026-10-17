/* Shared header behaviour: compact-on-scroll, the small-screen menu, and
   highlighting the section being read on the home page. */
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  // compact once the page has moved
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // small-screen menu
  const toggle = nav.querySelector('.nav-toggle');
  const panel  = nav.querySelector('.menu-panel');
  const wide   = window.matchMedia('(min-width: 801px)');
  const setOpen = open => {
    nav.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('menu-lock', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  if (toggle && panel) {
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('menu-open')));
    panel.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('menu-open')) { setOpen(false); toggle.focus(); }
    });
    wide.addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  // home page only: mark the link of the section in the middle of the screen
  const spied = [...nav.querySelectorAll('a[data-spy]')];
  if (!spied.length || !('IntersectionObserver' in window)) return;
  const sections = [...new Set(spied.map(a => a.dataset.spy))]
    .map(id => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;
  const mark = id => spied.forEach(a => {
    if (a.dataset.spy === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) mark(en.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => io.observe(s));
  // back at the top (the hero): nothing is current
  window.addEventListener('scroll', () => {
    const first = sections[0];
    if (first && first.getBoundingClientRect().top > window.innerHeight * 0.55) mark(null);
  }, { passive: true });
})();
