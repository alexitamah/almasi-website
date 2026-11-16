gsap.registerPlugin(ScrollTrigger);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Lenis ── */
let lenis = null;
if (!prefersReduced && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── Preloader (home page, first visit per session only) ── */
const preEl = document.getElementById('preloader');
let preSeen = false;
try { preSeen = sessionStorage.getItem('almasi-pre') === '1'; sessionStorage.setItem('almasi-pre', '1'); } catch (e) {}
const preNum = document.getElementById('pre-num');
const preFill = document.getElementById('pre-fill');
if (!preEl || preSeen) { if (preEl) preEl.style.display = 'none'; pageIntro(); }
else (function(){
  const counter = { v: 0 };
  gsap.to(counter, {
    v: 100, duration: prefersReduced ? 0.01 : 2, ease: 'power2.inOut',
    onUpdate(){ const n = Math.round(counter.v); preNum.textContent = n; preFill.style.width = n + '%'; },
    onComplete: finishLoad
  });
})();
function finishLoad(){
  gsap.timeline()
    .to('#preloader > *', { opacity: 0, y: -30, duration: .5, ease: 'power2.in', stagger: .05 })
    .to('#preloader', { clipPath: 'inset(0 0 100% 0)', duration: prefersReduced ? .01 : 1, ease: 'power4.inOut' })
    .set('#preloader', { display: 'none' })
    .add(pageIntro, prefersReduced ? '>' : '-=0.55');
}

/* ── Page intro ── */
function pageIntro(){
  if (document.getElementById('hero')) return heroIntro();
  gsap.from('.nav-inner', { y: -40, opacity: 0, duration: .8, ease: 'power4.out', clearProps: 'all' });
}

/* ── Hero intro + map animation ── */
function heroIntro(){
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to('.hero-title .line > span', { y: 0, duration: 1.2, stagger: .13 })
    .to('#hero [data-reveal]', { opacity: 1, y: 0, duration: 1, stagger: .1 }, '-=0.75')
    .from('.nav-inner', { y: -40, opacity: 0, duration: .8, clearProps: 'all' }, '-=0.9');
  animateMap();
}

function animateMap(){
  const svg = document.getElementById('africa-svg');
  if (!svg) return;
  // countries fade in
  gsap.fromTo('#africa-svg .country', { opacity: 0 }, { opacity: 1, duration: .04, stagger: { each: .012, from: 'random' }, ease: 'none' });
  // routes draw
  document.querySelectorAll('#africa-svg .route').forEach((r, i) => {
    const len = r.getTotalLength();
    r.style.strokeDasharray = len;
    r.style.strokeDashoffset = len;
    gsap.to(r, { strokeDashoffset: 0, duration: 1.6, delay: .8 + i * .18, ease: 'power2.inOut' });
  });
  // node pulses
  gsap.fromTo('#africa-svg .node', { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' },
    { scale: 1, duration: .5, delay: .8, stagger: .14, ease: 'back.out(2.5)' });
  document.querySelectorAll('#africa-svg .node-ring').forEach((ring, i) => {
    gsap.fromTo(ring, { attr: { r: 4 }, opacity: .6 }, { attr: { r: 15 }, opacity: 0, duration: 1.8, repeat: -1, delay: i * .35, ease: 'power1.out' });
  });
  // abuja rings
  document.querySelectorAll('#africa-svg .abuja-ring').forEach((ring, i) => {
    gsap.fromTo(ring, { attr: { r: 16 }, opacity: .8 }, { attr: { r: 46 }, opacity: 0, duration: 2.2, repeat: -1, delay: i * .7, ease: 'power1.out' });
  });
  // crest breathing
  gsap.to('#africa-svg .map-crest', { scale: 1.06, transformOrigin: 'center', transformBox: 'fill-box', duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  // travelling sparks along routes
  if (!prefersReduced) {
    document.querySelectorAll('#africa-svg .route').forEach((r, i) => {
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      spark.setAttribute('r', '2.6');
      spark.setAttribute('class', 'spark');
      svg.appendChild(spark);
      const len = r.getTotalLength();
      const st = { t: 0 };
      gsap.to(st, {
        t: 1, duration: 3 + (i % 3), repeat: -1, delay: 2 + i * .5, ease: 'none', repeatDelay: .8,
        onUpdate(){
          const p = r.getPointAtLength(st.t * len);
          spark.setAttribute('cx', p.x); spark.setAttribute('cy', p.y);
          spark.setAttribute('opacity', st.t < .05 || st.t > .95 ? 0 : 1);
        }
      });
    });
  }
  // gentle float of whole map
  gsap.to('.map-wrap', { y: -12, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/* ── Hero copy parallax on scroll ── */
if (document.querySelector('.hero-grid')) gsap.to('.hero-grid', {
  yPercent: -8, opacity: .3, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});

/* ── Particles ── */
(function(){
  const c = document.getElementById('beams');
  if (!c || prefersReduced) return;
  const ctx = c.getContext('2d');
  let w, h, parts = [];
  function size(){ w = c.width = c.offsetWidth * devicePixelRatio; h = c.height = c.offsetHeight * devicePixelRatio; }
  size(); addEventListener('resize', size);
  for (let i = 0; i < 55; i++) parts.push({
    x: Math.random(), y: Math.random(), r: Math.random() * 2 + .4,
    vx: (Math.random() - .5) * .0004, vy: -Math.random() * .0005 - .0002, o: Math.random() * .5 + .1
  });
  (function draw(){
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,215,255,${p.o * .5})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
})();

/* ── Marquee ── */
(function(){
  const track = document.getElementById('marquee');
  if (!track) return;
  track.innerHTML += track.innerHTML;
  gsap.to(track, { xPercent: -50, ease: 'none', duration: 26, repeat: -1 });
})();

/* ── Reveals ── */
document.querySelectorAll('[data-reveal]').forEach(el => {
  if (el.closest('#hero')) return;
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});
document.querySelectorAll('.mask-line > span').forEach(el => {
  gsap.to(el, {
    y: 0, duration: 1.2, ease: 'power4.out',
    scrollTrigger: { trigger: el.closest('.mask-line'), start: 'top 90%' }
  });
});

/* ── Counters ── */
document.querySelectorAll('[data-count]').forEach(el => {
  const target = +el.dataset.count;
  ScrollTrigger.create({
    trigger: el, start: 'top 88%', once: true,
    onEnter(){
      gsap.fromTo(el, { innerText: 0 }, { innerText: target, duration: 1.8, ease: 'power2.out', snap: { innerText: 1 } });
    }
  });
});

/* ── Parallax images ── */
document.querySelectorAll('[data-parallax]').forEach(img => {
  const amt = +img.dataset.parallax || 10;
  gsap.fromTo(img, { yPercent: -amt }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: img.closest('section') || img, start: 'top bottom', end: 'bottom top', scrub: true }
  });
});

/* ── Gallery drift ── */
document.querySelectorAll('.gal-col').forEach(col => {
  const sp = +col.dataset.speed || 0;
  if (!sp) return;
  gsap.fromTo(col, { y: 0 }, {
    y: sp, ease: 'none',
    scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: true }
  });
});

/* ── 3D tilt ── */
document.querySelectorAll('.gcard, .p-card').forEach(card => {
  const target = card.classList.contains('gcard') ? card.querySelector('.face') : card;
  card.addEventListener('pointermove', e => {
    if (prefersReduced || matchMedia('(hover: none)').matches) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    gsap.to(target, { rotateY: (px - .5) * 10, rotateX: (py - .5) * -10, transformPerspective: 900, duration: .5, ease: 'power2.out' });
  });
  card.addEventListener('pointerleave', () => {
    gsap.to(target, { rotateX: 0, rotateY: 0, duration: .9, ease: 'elastic.out(1,0.5)' });
  });
});

/* ── Cursor ── */
(function(){
  const cur = document.querySelector('.cursor');
  if (!cur || matchMedia('(hover: none)').matches) return;
  const dot = cur.querySelector('.cursor-dot'), ring = cur.querySelector('.cursor-ring');
  let rx = innerWidth/2, ry = innerHeight/2;
  addEventListener('pointermove', e => {
    gsap.set(dot, { x: e.clientX, y: e.clientY });
    rx = e.clientX; ry = e.clientY;
  });
  gsap.ticker.add(() => {
    gsap.to(ring, { x: rx, y: ry, duration: .35, ease: 'power2.out', overwrite: 'auto' });
  });
  document.querySelectorAll('a, button, [data-hover]').forEach(el => {
    el.addEventListener('pointerenter', () => cur.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => cur.classList.remove('is-hover'));
  });
})();

/* ── Nav hide ── */
let lastY = 0;
ScrollTrigger.create({
  onUpdate(){
    const y = lenis ? lenis.scroll : scrollY;
    document.getElementById('nav').classList.toggle('hidden', y > 500 && y > lastY);
    lastY = y;
  }
});

/* ── Mobile menu ── */
const burger = document.getElementById('burger');
const mmenu = document.getElementById('mmenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mmenu.classList.toggle('open');
});
mmenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open'); mmenu.classList.remove('open');
}));

/* ── Anchors ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: 0 }) : t.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ── Lightbox ── */
if (document.getElementById('lightbox')) {
document.querySelectorAll('.g-item').forEach(g => g.addEventListener('click', () => {
  document.getElementById('lb-img').src = g.querySelector('img').src;
  document.getElementById('lightbox').classList.add('open');
}));
document.getElementById('lightbox').addEventListener('click', () => document.getElementById('lightbox').classList.remove('open'));
addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('lightbox').classList.remove('open'); });
}

if (document.getElementById('roster')) {
/* ── ROSTER ── */
const P = (name, nation, flag, pos, group, yob, lead = 1) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const order = [lead, ...[1,2,3].filter(i => i !== lead)];
  return { name, nation, flag, pos, group, yob, shots: order.map(i => `assets/players/${slug}-${i}.jpg`) };
};
const PLAYERS = [
  Object.assign(P("Modoulamin Mass","The Gambia","🇬🇲","Attacking Midfielder","Midfielder",2007), { signed: { club: "ETO FC Győr", country: "Hungary", flag: "🇭🇺", ig: "https://www.instagram.com/p/DavySRNDPko/" } }),
  P("Kwabena Frimpong","Ghana","🇬🇭","Centre Forward","Forward",2008),
  P("Abdoulrahman Diallo","Guinea","🇬🇳","Centre Back","Defender",2009),
  P("Alagie Samukai","Liberia","🇱🇷","Defensive Midfielder","Midfielder",2006),
  P("Iddrisu Hassan","Ghana","🇬🇭","Defensive Midfielder","Midfielder",2008),
  P("Vincent Kokou","Togo","🇹🇬","Winger","Forward",2008),
  P("Traore Elhadj","Côte d'Ivoire","🇨🇮","Centre Back","Defender",2008,3),
  P("Mohammed Konate","The Gambia","🇬🇲","Attacking Midfielder","Midfielder",2009,2),
  P("Barham Bittaye","The Gambia","🇬🇲","Central Defender","Defender",2009),
  P("Fabakary Badji","The Gambia","🇬🇲","Defensive Midfielder","Midfielder",2008),
  P("Ousman Drammeh","The Gambia","🇬🇲","Left Back","Defender",2009),
  P("Alagie Jarju","The Gambia","🇬🇲","Left Winger","Forward",2008,3),
  P("Fallou Njie","The Gambia","🇬🇲","Centre Forward","Forward",2008),
  Object.assign(P("Mustapha Ahmed Fateh","The Gambia","🇬🇲","Midfielder","Midfielder",2009), { shots: [2,1,3].map(i => `assets/players/mustapha-fatty-${i}.jpg`) }),
  P("Joseph Tholley","Sierra Leone","🇸🇱","Midfielder","Midfielder",2008),
  P("Ibrahima Souma","Guinea","🇬🇳","Midfielder","Midfielder",2010,3),
  P("Yaya Njie","The Gambia","🇬🇲","Centre Forward","Forward",2010),
  P("Thierno Mansare","Guinea","🇬🇳","Defensive Midfielder","Midfielder",2009,2),
  P("Mamadou Diallo","Guinea","🇬🇳","Winger","Forward",2007),
  P("Saikou Manneh","The Gambia","🇬🇲","Right Back","Defender",2008,2),
  P("Modou Bah","The Gambia","🇬🇲","Goalkeeper","Goalkeeper",2007),
  P("Abdoulrahman Bah","The Gambia","🇬🇲","Central Defender","Defender",2007),
];
const rosterEl = document.getElementById('roster');
const rosterN = document.getElementById('roster-n');
const rosterEmpty = document.getElementById('roster-empty');
let fGroup = 'all', fNation = 'all', fYear = 'all';

// populate selects
(function(){
  const ns = document.getElementById('f-nation'), ys = document.getElementById('f-year');
  [...new Set(PLAYERS.map(p => p.nation))].sort().forEach(n => ns.insertAdjacentHTML('beforeend', `<option>${n}</option>`));
  [...new Set(PLAYERS.map(p => p.yob))].sort().forEach(y => ys.insertAdjacentHTML('beforeend', `<option>${y}</option>`));
  ns.addEventListener('change', () => { fNation = ns.value; renderRoster(); });
  ys.addEventListener('change', () => { fYear = ys.value; renderRoster(); });
})();
document.querySelectorAll('#filters .fchip').forEach(ch => ch.addEventListener('click', () => {
  document.querySelectorAll('#filters .fchip').forEach(c => c.classList.remove('active'));
  ch.classList.add('active');
  fGroup = ch.dataset.group;
  renderRoster();
}));

function bindTilt(card){
  card.addEventListener('pointermove', e => {
    if (prefersReduced || matchMedia('(hover: none)').matches) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    gsap.to(card, { rotateY: (px - .5) * 8, rotateX: (py - .5) * -8, transformPerspective: 900, duration: .5, ease: 'power2.out' });
  });
  card.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,0.6)' }));
}

function renderRoster(){
  const list = PLAYERS.filter(p =>
    (fGroup === 'all' || p.group === fGroup) &&
    (fNation === 'all' || p.nation === fNation) &&
    (fYear === 'all' || String(p.yob) === String(fYear))
  );
  rosterN.textContent = list.length;
  rosterEmpty.style.display = list.length ? 'none' : 'block';
  rosterEl.innerHTML = '';
  list.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'r-card';
    card.setAttribute('data-hover','');
    card.innerHTML = `
      <img src="${p.shots[0]}" alt="${p.name} — ${p.pos}, Almasi Football Academy" loading="lazy"/>
      <div class="r-yob">'${String(p.yob).slice(2)}</div>
      ${p.signed ? `<div class="r-signed">★ Signed — ${p.signed.club}</div>` : `<div class="r-view">View Profile</div>`}
      <div class="r-meta">
        <strong>${p.name}</strong>
        <span class="r-pos">${p.pos}</span>
        <div class="r-tags"><span class="r-tag">${p.flag} ${p.nation}</span><span class="r-tag">b. ${p.yob}</span></div>
      </div>`;
    card.addEventListener('click', () => openPlayer(p));
    bindTilt(card);
    rosterEl.appendChild(card);
    gsap.fromTo(card, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .7, delay: Math.min(i * .05, .6), ease: 'power3.out' });
  });
  if (fGroup === 'all' && fNation === 'all' && fYear === 'all') {
    const ghost = document.createElement('div');
    ghost.className = 'r-card ghost';
    ghost.innerHTML = `<div class="n">+8</div><span>New boys —<br/>profiles in production</span>`;
    rosterEl.appendChild(ghost);
  }
  ScrollTrigger.refresh();
}
renderRoster();

/* ── PLAYER MODAL ── */
const pmodal = document.getElementById('pmodal');
let currentPlayer = null;
function openPlayer(p){
  currentPlayer = p;
  document.getElementById('pm-img').src = p.shots[0];
  document.getElementById('pm-img').alt = `${p.name} — ${p.pos}`;
  document.getElementById('pm-flag').textContent = p.flag;
  document.getElementById('pm-name').textContent = p.name;
  document.getElementById('pm-pos').textContent = p.pos;
  document.getElementById('pm-pos2').textContent = p.pos;
  document.getElementById('pm-nation').textContent = p.nation;
  document.getElementById('pm-yob').textContent = p.yob;
  const st = document.getElementById('pm-status');
  if (p.signed) { st.textContent = `Signed — ${p.signed.club} ${p.signed.flag}`; st.style.color = 'var(--orange-hot)'; }
  else { st.textContent = 'Available for trials'; st.style.color = '#2fd573'; }
  const th = document.getElementById('pm-thumbs');
  th.innerHTML = '';
  p.shots.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'pm-thumb' + (i === 0 ? ' active' : '');
    b.innerHTML = `<img src="${s}" alt="" loading="lazy"/>`;
    b.addEventListener('click', () => {
      document.getElementById('pm-img').src = s;
      th.querySelectorAll('.pm-thumb').forEach(t => t.classList.remove('active'));
      b.classList.add('active');
    });
    th.appendChild(b);
  });
  pmodal.classList.add('open');
  if (lenis) lenis.stop();
}
function closePlayer(){
  pmodal.classList.remove('open');
  if (lenis) lenis.start();
}
document.getElementById('pm-close').addEventListener('click', closePlayer);
pmodal.addEventListener('click', e => { if (e.target === pmodal) closePlayer(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });
document.getElementById('pm-request').addEventListener('click', () => {
  if (!currentPlayer) return;
  const msg = `I'd like the full profile for ${currentPlayer.name} (${currentPlayer.pos}, b. ${currentPlayer.yob}, ${currentPlayer.nation}).`;
  location.href = 'scouts.html?enquiry=' + encodeURIComponent(msg) + '#scouts';
});
}

/* ── Forms — all requests route to almasifootballacademy@gmail.com ── */
const ACADEMY_EMAIL = 'almasifootballacademy@gmail.com';
function notifyMe(){
  const input = document.getElementById('notify-email');
  if (input.value && input.value.includes('@')) {
    const subject = 'Scout updates — add me to the list';
    const body = `Please add me to the Almasi scout updates list.\n\nEmail: ${input.value}`;
    window.location.href = `mailto:${ACADEMY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    input.value = '✓ Opening your email app…'; input.disabled = true; input.style.borderColor = '#25D366';
  } else { input.style.borderColor = 'var(--orange)'; input.focus(); }
}
function submitForm(){
  const v = id => (document.getElementById(id)?.value || '').trim();
  const name = v('sf-name'), email = v('sf-email');
  if (!name) { document.getElementById('sf-name').focus(); document.getElementById('sf-name').style.borderColor = 'var(--orange)'; return; }
  if (!email || !email.includes('@')) { document.getElementById('sf-email').focus(); document.getElementById('sf-email').style.borderColor = 'var(--orange)'; return; }
  const subject = `Player shortlist request — ${name}${v('sf-club') ? ' (' + v('sf-club') + ')' : ''}`;
  const body =
`Hello Almasi Football Academy,

I would like to request a player shortlist.

Name: ${name}
Club / Organisation: ${v('sf-club') || '—'}
Role: ${v('sf-role') || '—'}
Email: ${email}
Country: ${v('sf-country') || '—'}
Position of interest: ${v('sf-pos') || 'Any'}
Age group: ${v('sf-age') || 'Any'}

Notes:
${v('sf-notes') || '—'}

Sent via almasifootballacademy website`;
  window.location.href = `mailto:${ACADEMY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ── Scouts page: prefill enquiry coming from a player profile ── */
(function(){
  const ta = document.getElementById('sf-notes');
  if (!ta) return;
  const q = new URLSearchParams(location.search).get('enquiry');
  if (q) ta.value = q;
})();
