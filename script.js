const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const panels = $$('.panel');
const header = $('.site-header');
const currentPage = $('#page-current');
const totalPage = $('#page-total');
const progress = $('.progress-bar span');
const menuToggle = $('.menu-toggle');
const nav = $('.site-nav');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

totalPage.textContent = String(panels.length).padStart(2, '0');

function updateScrollUI() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  header.classList.toggle('scrolled', scrollY > 20);
}
addEventListener('scroll', updateScrollUI, { passive: true });
updateScrollUI();

const panelObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const i = panels.indexOf(visible.target);
  currentPage.textContent = String(i + 1).padStart(2, '0');
  document.title = `${visible.target.dataset.title} — MITA Magazine`;
  if (visible.target.id === 'audience') animateCounters();
}, { threshold: [0.35, 0.55, 0.75] });
panels.forEach(p => panelObserver.observe(p));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: .14 });
$$('.reveal').forEach(el => revealObserver.observe(el));

menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.site-nav a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

// Service accordion
$$('.service-row>button').forEach(btn => btn.addEventListener('click', () => {
  const row = btn.closest('.service-row');
  $$('.service-row').forEach(item => item.classList.toggle('active', item === row ? !row.classList.contains('active') : false));
}));

// Portfolio filtering
$$('.filters button').forEach(btn => btn.addEventListener('click', () => {
  $$('.filters button').forEach(b => b.classList.toggle('active', b === btn));
  const filter = btn.dataset.filter;
  $$('.work-card').forEach(card => card.classList.toggle('hide', filter !== 'all' && card.dataset.category !== filter));
}));

// Image lightbox
const lightbox = $('.lightbox');
const lightboxImg = $('.lightbox img');
const lightboxText = $('.lightbox p');
$$('.work-card').forEach(card => card.addEventListener('click', () => {
  lightboxImg.src = card.dataset.full;
  lightboxImg.alt = card.dataset.caption;
  lightboxText.textContent = card.dataset.caption;
  lightbox.showModal();
}));
$('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });

// Video modal
const videoModal = $('.video-modal');
const modalVideo = $('.video-modal video');
$('.play-button').addEventListener('click', () => { videoModal.showModal(); modalVideo.play().catch(() => {}); });
$('.video-close').addEventListener('click', () => { modalVideo.pause(); videoModal.close(); });
videoModal.addEventListener('click', e => { if (e.target === videoModal) { modalVideo.pause(); videoModal.close(); } });

// Hide fallback only when video is playable
[['.hero-video','.hero-fallback'],['.showreel-video','.showreel-fallback']].forEach(([v,f]) => {
  const video = $(v); const fallback = $(f);
  video.addEventListener('canplay', () => fallback.style.display = 'none');
  video.addEventListener('error', () => fallback.style.display = 'block');
});

let countersDone = false;
function animateCounters() {
  if (countersDone) return;
  countersDone = true;
  $$('[data-count]').forEach(el => {
    const target = Number(el.dataset.count); const suffix = el.dataset.suffix || '';
    const start = performance.now(); const duration = 1500;
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

// Desktop custom cursor + magnetic interaction
if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
  const dot = $('.cursor-dot'); const ring = $('.cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx - 3.5}px,${my - 3.5}px)`; });
  function cursorLoop(){ rx += (mx-rx)*.14; ry += (my-ry)*.14; ring.style.transform=`translate(${rx-19}px,${ry-19}px)`; requestAnimationFrame(cursorLoop); }
  cursorLoop();
  $$('a,button,.work-card').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'));
  });
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => { const r=el.getBoundingClientRect(); const x=e.clientX-r.left-r.width/2; const y=e.clientY-r.top-r.height/2; el.style.transform=`translate(${x*.12}px,${y*.12}px)`; });
    el.addEventListener('mouseleave', () => el.style.transform='');
  });
  $$('.tilt-card').forEach(el => {
    el.addEventListener('mousemove', e => { const r=el.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5; el.style.transform=`perspective(900px) rotateY(${x*5}deg) rotateX(${-y*5}deg)`; });
    el.addEventListener('mouseleave', () => el.style.transform='');
  });
  addEventListener('mousemove', e => {
    $$('[data-parallax]').forEach(el => { const s=Number(el.dataset.parallax); el.style.transform=`translate(${(e.clientX-innerWidth/2)*s}px,${(e.clientY-innerHeight/2)*s}px)`; });
  });
}

$('#year').textContent = new Date().getFullYear();
