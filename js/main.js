/* ============================================================
   TUTORTIME — main.js
   Handles: navbar, scroll animations, hero cycling, form
   ============================================================ */

/* ---- NAVBAR ---- */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* ---- SCROLL ANIMATIONS ---- */
const animObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      animObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-up').forEach(el => animObs.observe(el));

/* ---- HERO SCORE CYCLING ---- */
const heroStudents = [
  { name: 'Isabella B.', score: 31, prev: 26, eng: 86, math: 80, read: 88, sci: 80 },
  { name: 'Sydney G.',   score: 32, prev: 27, eng: 94, math: 88, read: 86, sci: 86 },
  { name: 'Hannah M.',  score: 32, prev: 25, eng: 90, math: 85, read: 88, sci: 90 },
  { name: 'Tessa B.',   score: 31, prev: 25, eng: 86, math: 86, read: 86, sci: 80 },
  { name: 'Aidan G.',   score: 30, prev: 24, eng: 94, math: 91, read: 80, sci: 75 },
];

let heroIdx = 0;

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = to;
  };
  requestAnimationFrame(update);
}

function loadHeroStudent(i) {
  const s = heroStudents[i];
  const scoreEl = document.getElementById('heroScoreNum');
  const nameEl  = document.getElementById('heroStudentName');
  const changeEl = document.getElementById('heroScoreChange');
  if (!scoreEl) return;

  const prev = parseInt(scoreEl.textContent) || s.prev;
  animateNumber(scoreEl, prev, s.score, 1100);

  if (nameEl) nameEl.textContent = s.name;
  const nameEl2 = document.getElementById('heroStudentName2');
  if (nameEl2) nameEl2.textContent = s.name;
  if (changeEl) changeEl.textContent = `+${s.score - s.prev} pts`;

  const bars = [
    { id: 'barEng',  pct: s.eng,  val: Math.round(s.eng / 100 * 36) },
    { id: 'barMath', pct: s.math, val: Math.round(s.math / 100 * 36) },
    { id: 'barRead', pct: s.read, val: Math.round(s.read / 100 * 36) },
    { id: 'barSci',  pct: s.sci,  val: Math.round(s.sci / 100 * 36) },
  ];
  bars.forEach(({ id, pct, val }, idx) => {
    setTimeout(() => {
      const fill = document.getElementById(id);
      const valEl = document.getElementById(id + 'Val');
      if (fill) fill.style.width = pct + '%';
      if (valEl) valEl.textContent = val;
    }, 150 + idx * 100);
  });
}

// Init immediately — no loading state
loadHeroStudent(0);
// Then cycle every 4 seconds
setInterval(() => {
  heroIdx = (heroIdx + 1) % heroStudents.length;
  loadHeroStudent(heroIdx);
}, 4000);

/* ---- SIGNUP FORM ---- */
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = signupForm.querySelector('.form-submit');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const formData = new FormData(signupForm);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        signupForm.style.display = 'none';
        const successEl = document.getElementById('formSuccess');
        if (successEl) successEl.style.display = 'block';
      } else {
        submitBtn.textContent = 'Something went wrong — try again';
        submitBtn.disabled = false;
      }
    } catch {
      submitBtn.textContent = 'Connection error — try again';
      submitBtn.disabled = false;
    }
  });
}

/* ---- MOBILE NAV TOGGLE (hamburger if needed) ---- */
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu   = document.getElementById('mobileMenu');
if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}
