// Página: topo, galeria, plantas com zoom e carregamento diferido do 3D.

/* ---------- 01 · variante do panorama ---------- */
const PANO = {
  com: 'imagens/armazens_loule_panorama_rua_com_alfarrobeira',
  sem: 'imagens/armazens_loule_panorama_rua_sem_alfarrobeira',
};
const heroImg = document.getElementById('heroImg');
document.querySelectorAll('.hero-toggle button').forEach((b) => {
  b.addEventListener('click', () => {
    const k = b.dataset.pano;
    const base = PANO[k];
    const small = base.replace('imagens/', 'imagens/thumbs/') + '_1400.jpg';
    const pre = new Image();
    pre.srcset = `${small} 1400w, ${base}.jpg 2560w`;
    pre.sizes = '100vw';
    heroImg.style.opacity = .35;
    const swap = () => {
      heroImg.srcset = pre.srcset;
      heroImg.src = small;
      heroImg.alt = k === 'com'
        ? 'Vista da rua sobre os quatro armazéns, estacionamento e alfarrobeira em primeiro plano'
        : 'Vista da rua sobre os quatro armazéns e estacionamento, sem a alfarrobeira';
      heroImg.style.opacity = 1;
    };
    pre.decode ? pre.decode().then(swap, swap) : (pre.onload = swap);
    document.querySelectorAll('.hero-toggle button').forEach((x) => x.classList.toggle('on', x === b));
  });
});

/* ---------- 02 · 3D: só carrega quando a secção fica visível ---------- */
const viewerEl = document.getElementById('viewer');
let viewerStarted = false;
function startViewer() {
  if (viewerStarted) return;
  viewerStarted = true;
  import('./viewer.js').then((m) => m.initViewer(viewerEl)).catch((err) => {
    console.error(err);
    const l = document.getElementById('viewerLoading');
    l.hidden = false;
    l.innerHTML = '<span>Não foi possível abrir o visualizador 3D neste navegador.</span>';
  });
}
document.getElementById('viewerStart').addEventListener('click', startViewer);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); startViewer(); }
  }, { rootMargin: '150px 0px' });
  io.observe(viewerEl);
}

/* ---------- 03 · galeria / lightbox ---------- */
const items = [...document.querySelectorAll('.g-item')];
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('.lb-cap');
let lbIndex = 0;
let lastFocus = null;

function lbShow(i) {
  lbIndex = (i + items.length) % items.length;
  const it = items[lbIndex];
  const thumb = it.querySelector('img');
  lbImg.src = thumb.src; // mostra logo a miniatura
  lbImg.alt = thumb.alt;
  const full = new Image();
  full.onload = () => { if (items[lbIndex] === it) lbImg.src = full.src; };
  full.src = it.dataset.full;
  lbCap.textContent = it.querySelector('figcaption').textContent + `  ·  ${lbIndex + 1}/${items.length}`;
}
function lbOpen(i) { lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; lbShow(i); lb.querySelector('.lb-close').focus(); }
function lbClose() { lb.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }

items.forEach((it, i) => {
  it.tabIndex = 0;
  it.setAttribute('role', 'button');
  it.addEventListener('click', () => lbOpen(i));
  it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(i); } });
});
lb.querySelector('.lb-close').addEventListener('click', lbClose);
lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); lbShow(lbIndex - 1); });
lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); lbShow(lbIndex + 1); });
lb.addEventListener('click', (e) => { if (e.target === lb) lbClose(); });
let tx = null;
lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => {
  if (tx == null) return;
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
  tx = null;
});

/* ---------- 04 · plantas com zoom ---------- */
const pz = document.getElementById('planViewer');
const stage = pz.querySelector('.pz-stage');
const pzImg = stage.querySelector('img');
const pzTitle = pz.querySelector('.pz-title');
const pzDl = pz.querySelector('.pz-dl');
const st = { s: 1, x: 0, y: 0, fit: 1, w: 2481, h: 1755 };

function apply() { pzImg.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`; }
function clampPan() {
  const r = stage.getBoundingClientRect();
  const w = st.w * st.s, h = st.h * st.s;
  st.x = w <= r.width ? (r.width - w) / 2 : Math.min(0, Math.max(r.width - w, st.x));
  st.y = h <= r.height ? (r.height - h) / 2 : Math.min(0, Math.max(r.height - h, st.y));
}
function fit() {
  const r = stage.getBoundingClientRect();
  st.fit = Math.min(r.width / st.w, r.height / st.h) * 0.96;
  st.s = st.fit; clampPan(); apply();
}
function zoomAt(f, cx, cy) {
  const r = stage.getBoundingClientRect();
  if (cx == null) { cx = r.width / 2; cy = r.height / 2; }
  const ns = Math.min(Math.max(st.s * f, st.fit), 4);
  const k = ns / st.s;
  st.x = cx - (cx - st.x) * k;
  st.y = cy - (cy - st.y) * k;
  st.s = ns; clampPan(); apply();
}
function pzOpen(card) {
  lastFocus = document.activeElement;
  const thumb = card.querySelector('img');
  pzTitle.textContent = `Des. ${card.dataset.no} · ${card.dataset.title} · ${card.dataset.scale}`;
  pzDl.href = card.dataset.full;
  pz.hidden = false;
  document.body.style.overflow = 'hidden';
  pzImg.style.width = st.w + 'px';
  pzImg.style.height = st.h + 'px';
  pzImg.src = thumb.src;
  pzImg.alt = thumb.alt;
  const full = new Image();
  full.onload = () => {
    st.w = full.naturalWidth; st.h = full.naturalHeight;
    pzImg.style.width = st.w + 'px'; pzImg.style.height = st.h + 'px';
    pzImg.src = full.src;
  };
  full.src = card.dataset.full;
  requestAnimationFrame(fit);
  pz.querySelector('.pz-close').focus();
}
function pzClose() { pz.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }

document.querySelectorAll('.dwg').forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.addEventListener('click', () => pzOpen(card));
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pzOpen(card); } });
});
pz.querySelector('.pz-close').addEventListener('click', pzClose);
pz.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
  const z = b.dataset.z;
  if (z === 'fit') fit(); else zoomAt(z === 'in' ? 1.5 : 1 / 1.5);
}));
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });
stage.addEventListener('dblclick', (e) => {
  const r = stage.getBoundingClientRect();
  if (st.s > st.fit * 1.05) fit(); else zoomAt(2.5 / (st.s / st.fit), e.clientX - r.left, e.clientY - r.top);
});

// arrastar e pinça (pointer events)
const ptrs = new Map();
let pinch = null;
stage.addEventListener('pointerdown', (e) => {
  stage.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  stage.classList.add('drag');
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
  }
});
stage.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return;
  const prev = ptrs.get(e.pointerId);
  const cur = { x: e.clientX, y: e.clientY };
  ptrs.set(e.pointerId, cur);
  if (ptrs.size === 2 && pinch) {
    const [a, b] = [...ptrs.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const r = stage.getBoundingClientRect();
    zoomAt(d / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
    pinch.d = d;
  } else if (ptrs.size === 1) {
    st.x += cur.x - prev.x; st.y += cur.y - prev.y; clampPan(); apply();
  }
});
const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) stage.classList.remove('drag'); };
stage.addEventListener('pointerup', up);
stage.addEventListener('pointercancel', up);
window.addEventListener('resize', () => { if (!pz.hidden) fit(); });

/* ---------- teclado ---------- */
document.addEventListener('keydown', (e) => {
  if (!lb.hidden) {
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
  } else if (!pz.hidden) {
    if (e.key === 'Escape') pzClose();
    if (e.key === '+' || e.key === '=') zoomAt(1.5);
    if (e.key === '-') zoomAt(1 / 1.5);
    if (e.key === '0') fit();
  }
});
