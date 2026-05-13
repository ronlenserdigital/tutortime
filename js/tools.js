/* ============================================================
   TUTORTIME — tools.js
   All interactive study tool logic
   ============================================================ */

/* ============================================================
   TOOL TAB NAVIGATION
   ============================================================ */
function initToolNav() {
  const navBtns = document.querySelectorAll('.tool-nav-btn');
  const panels  = document.querySelectorAll('.tool-panel');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tool;
      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ============================================================
   SCORE ESTIMATOR
   ============================================================ */
const ACT_TIERS = [
  { min: 35, label: '🏆 Elite — Ivy League & Top 10',     color: '#7C5CFC' },
  { min: 33, label: '⭐ Excellent — Top 25 Universities', color: '#38B6FF' },
  { min: 30, label: '✅ Strong — Most State Flagships',   color: '#00C48C' },
  { min: 27, label: '📈 Above Average — Good Options',   color: '#FFB347' },
  { min: 24, label: '📊 Average — Still Competitive',    color: '#FF7F50' },
  { min: 0,  label: '📚 Room to Grow — Let\'s get there', color: '#FF5E7E' },
];

// Simplified but realistic ACT raw→scaled conversion
function rawToScaled(raw, maxRaw) {
  if (raw === '' || raw === null || isNaN(raw)) return null;
  raw = Math.max(0, Math.min(parseInt(raw), maxRaw));
  const pct = raw / maxRaw;
  const breakpoints = [
    [1.00, 36], [0.97, 35], [0.93, 34], [0.89, 33], [0.85, 32],
    [0.81, 31], [0.77, 30], [0.73, 29], [0.68, 28], [0.63, 27],
    [0.58, 26], [0.53, 25], [0.49, 24], [0.45, 23], [0.41, 22],
    [0.37, 21], [0.33, 20], [0.29, 19], [0.25, 18], [0.21, 17],
    [0.17, 16], [0.13, 15], [0.09, 14], [0.06, 13], [0.00, 11],
  ];
  for (const [threshold, score] of breakpoints) {
    if (pct >= threshold) return score;
  }
  return 1;
}

function getTier(composite) {
  for (const tier of ACT_TIERS) {
    if (composite >= tier.min) return tier;
  }
  return ACT_TIERS[ACT_TIERS.length - 1];
}

function updateEstimator() {
  const fields = [
    { inputId: 'estEngInput',  barId: 'estEngBar',  valId: 'estEngScore',  max: 75 },
    { inputId: 'estMathInput', barId: 'estMathBar', valId: 'estMathScore', max: 60 },
    { inputId: 'estReadInput', barId: 'estReadBar', valId: 'estReadScore', max: 40 },
    { inputId: 'estSciInput',  barId: 'estSciBar',  valId: 'estSciScore',  max: 40 },
  ];

  const bdIds = ['estBdEng', 'estBdMath', 'estBdRead', 'estBdSci'];
  const scores = [];

  fields.forEach(({ inputId, barId, valId, max }, i) => {
    const input  = document.getElementById(inputId);
    const bar    = document.getElementById(barId);
    const valEl  = document.getElementById(valId);
    const bdVal  = document.getElementById(bdIds[i]);
    if (!input) return;

    const raw = input.value;
    const scaled = rawToScaled(raw, max);
    const rawInt = parseInt(raw);

    if (scaled !== null && !isNaN(rawInt)) {
      const pct = (rawInt / max) * 100;
      if (bar) bar.style.width = Math.min(pct, 100) + '%';
      if (valEl) { valEl.textContent = scaled; valEl.style.color = 'var(--c-purple)'; }
      if (bdVal) bdVal.textContent = scaled;
      scores.push(scaled);
    } else {
      if (bar) bar.style.width = '0%';
      if (valEl) { valEl.textContent = '—'; valEl.style.color = 'var(--c-muted)'; }
      if (bdVal) bdVal.textContent = '—';
    }
  });

  const compEl  = document.getElementById('estComposite');
  const tierEl  = document.getElementById('estTier');
  const hintEl  = document.getElementById('estCTAHint');

  if (scores.length === 4) {
    const composite = Math.round(scores.reduce((a, b) => a + b) / 4);
    if (compEl) compEl.textContent = composite;
    const tier = getTier(composite);
    if (tierEl) { tierEl.textContent = tier.label; tierEl.style.color = tier.color; tierEl.style.borderColor = tier.color + '44'; tierEl.style.background = tier.color + '18'; }
    if (hintEl) hintEl.textContent = composite >= 30
      ? 'Amazing score — let\'s push it even higher.'
      : `You\'re ${30 - composite} point${30 - composite === 1 ? '' : 's'} from the 30 milestone. Book a session.`;
  } else {
    if (compEl) compEl.textContent = '—';
    if (tierEl) { tierEl.textContent = 'Enter all 4 sections'; tierEl.style.color = ''; tierEl.style.borderColor = ''; tierEl.style.background = ''; }
    if (hintEl) hintEl.textContent = 'Enter your raw scores above to see your estimate.';
  }
}

/* ============================================================
   SECTION TRACKER
   ============================================================ */
const TRACKER_SUBJECTS = ['eng', 'math', 'read', 'sci'];
const TRACKER_LABELS   = ['English', 'Math', 'Reading', 'Science'];

function levelDescription(v) {
  if (v <= 2) return 'Critical priority — focus here first every study session';
  if (v <= 4) return 'Below average — big gains available with targeted practice';
  if (v <= 6) return 'Average — consistent work will push your score up';
  if (v <= 8) return 'Strong — polish the edge cases to gain more points';
  return 'Near perfect — maintain and focus time on other sections';
}

function levelPriority(v) {
  if (v <= 3) return 1;
  if (v <= 5) return 2;
  if (v <= 7) return 3;
  return 4;
}

function updateRadar() {
  const vals = TRACKER_SUBJECTS.map(s => {
    const sl = document.getElementById(s + 'Slider');
    return sl ? parseInt(sl.value) / 10 : 0.5;
  });

  // Simple radar SVG polygon (centered at 100,100, radius 80)
  const cx = 100, cy = 100, r = 80;
  const angles = [-90, 0, 90, 180]; // top, right, bottom, left
  const points = vals.map((v, i) => {
    const angle = angles[i] * (Math.PI / 180);
    const radius = r * v;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(' ');

  const radarFill = document.getElementById('radarFill');
  if (radarFill) radarFill.setAttribute('points', points);
}

function updateTracker() {
  // Get values and update labels
  const vals = TRACKER_SUBJECTS.map((s, i) => {
    const slider = document.getElementById(s + 'Slider');
    const lvlEl  = document.getElementById(s + 'Level');
    const descEl = document.getElementById(s + 'Desc');
    const val = slider ? parseInt(slider.value) : 5;
    if (lvlEl) lvlEl.textContent = val;
    if (descEl) descEl.textContent = levelDescription(val);
    return { name: TRACKER_LABELS[i], val, priority: levelPriority(val) };
  });

  // Sort by priority (lowest val = highest priority)
  const sorted = [...vals].sort((a, b) => a.val - b.val);

  // Update plan items
  sorted.forEach(({ name, val, priority }, i) => {
    const planItem = document.getElementById('planItem' + i);
    const planSubj = document.getElementById('planSubj' + i);
    const planDesc = document.getElementById('planDesc' + i);
    const planNum  = document.getElementById('planNum' + i);

    if (planItem) {
      if (planSubj) planSubj.textContent = name;
      if (planNum) {
        planNum.textContent = i + 1;
        planNum.className = 'tracker-plan-priority priority-' + Math.min(i + 1, 4);
      }
      const descriptions = [
        'Your weakest area — dedicate the most study time here.',
        'Second priority — work on this after your top focus.',
        'Solid foundation — occasional practice to maintain gains.',
        'Your strength — just maintain before test day.',
      ];
      if (planDesc) planDesc.textContent = descriptions[i];
    }
  });

  updateRadar();
}

/* ============================================================
   FLASHCARDS
   ============================================================ */
const ALL_FLASHCARDS = [
  { subject: 'English', q: 'Read what comes before AND after the underlined portion.', a: 'The ACT tests how sentences connect — transitions, tone, and flow all depend on surrounding context. You literally cannot pick the right answer without reading both neighbors. This is the #1 mistake students make on English.' },
  { subject: 'English', q: 'On ACT English, "NO CHANGE" is correct roughly 25% of the time.', a: 'Students are trained to always fix something. The ACT knows this — many traps are unchanged originals that are already correct. If it sounds right and follows the rules, pick NO CHANGE confidently.' },
  { subject: 'English', q: 'The shortest answer is usually correct — but only if grammatically complete.', a: 'ACT English rewards concise writing. Redundant or wordy options are almost always wrong. The shortest answer that\'s grammatically correct and logically fits is your best bet.' },
  { subject: 'Math',    q: 'Skip hard problems immediately. Come back with remaining time.', a: 'The ACT Math section gives equal points to every question. A 45-second easy problem and a 5-minute hard problem are worth exactly the same. Never sacrifice easy wins for hard problems.' },
  { subject: 'Math',    q: 'When answer choices have variables, plug in real numbers.', a: 'Pick a simple number like x=2 or x=3, solve the problem yourself, then test which answer choice gives the same result. This beats algebra for many students and eliminates careless errors.' },
  { subject: 'Math',    q: 'Circle the units before you solve every math problem.', a: 'The ACT loves unit traps — the answer in feet when you calculated inches, or hours when they want minutes. Circling units first takes 2 seconds and prevents one of the most common ACT Math mistakes.' },
  { subject: 'Reading', q: 'Read the questions before you read the passage.', a: 'Knowing what you\'re looking for transforms reading from passive to active. You\'ll naturally flag the right sentences as you read instead of having to re-read everything. Saves 2-4 minutes per passage.' },
  { subject: 'Reading', q: 'Every correct Reading answer is directly supported by the text.', a: 'The ACT is not a test of your opinion or general knowledge. If answering requires you to assume anything not written in the passage, it\'s wrong. The answer is always IN the text — find the line that proves it.' },
  { subject: 'Reading', q: 'Tackle your easiest passage type first, hardest last.', a: 'You control the order. Most students find Natural Science or Social Studies easier to read quickly. Fiction is often slowest. Identify your fastest passage type in practice and always do it first on test day.' },
  { subject: 'Science', q: 'Science is NOT about science knowledge — it\'s about data reading.', a: '80% of Science questions are answered by reading the right number from the right chart. You don\'t need to know biology, chemistry, or physics. You need to be fast at finding data in tables and figures.' },
  { subject: 'Science', q: 'For Conflicting Viewpoints, read each scientist\'s position separately.', a: 'The conflicting viewpoints passage has 7 questions and is its own mini-section. Read Scientist 1 and answer all their questions, then read Scientist 2. Never mix up their positions — that\'s how you lose points.' },
  { subject: 'Test Day', q: 'The night before the ACT: sleep 8+ hours. Do not study.', a: 'Every study showing cramming the night before hurts performance on standardized tests. Your brain consolidates memory during sleep. If you\'ve prepared well, the best thing you can do is rest. Eat, sleep, trust your prep.' },
];

let currentCardIdx = 0;
let currentCategory = 'All';
let isFlipped = false;
let sessionCorrect = 0;
let sessionWrong = 0;
let filteredCards = [...ALL_FLASHCARDS];

function getFilteredCards(category) {
  if (category === 'All') return [...ALL_FLASHCARDS];
  return ALL_FLASHCARDS.filter(c => c.subject === category);
}

function renderCard(idx) {
  const card = filteredCards[idx];
  if (!card) return;

  isFlipped = false;
  const fc = document.getElementById('flashcard');
  if (fc) fc.classList.remove('flipped');

  const cardSubj = document.getElementById('cardSubject');
  const cardQ    = document.getElementById('cardQuestion');
  const cardA    = document.getElementById('cardAnswer');
  const cardNum  = document.getElementById('fcCardNum');
  const cardTot  = document.getElementById('fcCardTotal');
  const progBar  = document.getElementById('fcProgressBar');
  const resultBtns = document.getElementById('fcResultBtns');
  const flipHint = document.getElementById('fcFlipHint');

  if (cardSubj) cardSubj.textContent = card.subject;
  if (cardQ) cardQ.textContent = card.q;
  if (cardA) cardA.textContent = card.a;
  if (cardNum) cardNum.textContent = idx + 1;
  if (cardTot) cardTot.textContent = filteredCards.length;
  if (progBar) progBar.style.width = ((idx + 1) / filteredCards.length * 100) + '%';
  if (resultBtns) resultBtns.style.display = 'none';
  if (flipHint) flipHint.style.display = 'block';

  updateFCStats();
}

function flipCard() {
  isFlipped = !isFlipped;
  const fc = document.getElementById('flashcard');
  if (fc) fc.classList.toggle('flipped', isFlipped);
  if (isFlipped) {
    const resultBtns = document.getElementById('fcResultBtns');
    const flipHint   = document.getElementById('fcFlipHint');
    if (resultBtns) resultBtns.style.display = 'flex';
    if (flipHint) flipHint.style.display = 'none';
  }
}

function nextCard() {
  currentCardIdx = (currentCardIdx + 1) % filteredCards.length;
  renderCard(currentCardIdx);
}

function prevCard() {
  currentCardIdx = (currentCardIdx - 1 + filteredCards.length) % filteredCards.length;
  renderCard(currentCardIdx);
}

function markKnewIt() {
  sessionCorrect++;
  updateFCStats();
  nextCard();
}

function markMissedIt() {
  sessionWrong++;
  updateFCStats();
  nextCard();
}

function updateFCStats() {
  const corrEl  = document.getElementById('fcStatCorrect');
  const wrongEl = document.getElementById('fcStatWrong');
  const totEl   = document.getElementById('fcStatTotal');
  if (corrEl) corrEl.textContent = sessionCorrect;
  if (wrongEl) wrongEl.textContent = sessionWrong;
  if (totEl) totEl.textContent = filteredCards.length;
}

function setFCCategory(category) {
  currentCategory = category;
  filteredCards = getFilteredCards(category);
  currentCardIdx = 0;
  sessionCorrect = 0;
  sessionWrong = 0;

  document.querySelectorAll('.fc-category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  renderCard(0);
}

/* ============================================================
   PRACTICE QUIZ
   ============================================================ */
const QUIZ_QUESTIONS = [
  {
    section: 'English',
    passage: null,
    question: 'Which of the following alternatives to the underlined portion would NOT be acceptable?\n\n"The report, written by three senior researchers, concluded that the program had been unsuccessful."',
    underlined: 'written by three senior researchers',
    options: [
      'which was written by three senior researchers',
      'authored by three senior researchers',
      'that three senior researchers had written',
      'whom three senior researchers wrote',
    ],
    correct: 3,
    explanation: 'Answer D is wrong because "whom" refers to people as objects — you can\'t say a report "was written" by whom in this construction. All other options correctly modify the report using different but acceptable phrasings.',
  },
  {
    section: 'Math',
    passage: null,
    question: 'If 3x + 7 = 22, what is the value of 6x + 5?',
    options: ['29', '33', '35', '37'],
    correct: 2,
    explanation: 'Solve: 3x = 15, so x = 5. Then 6x + 5 = 30 + 5 = 35. Shortcut: 6x + 5 = 2(3x) + 5 = 2(15) + 5 = 35. No need to find x explicitly.',
  },
  {
    section: 'Reading',
    passage: 'The Amazon rainforest produces about 20% of the world\'s oxygen and is home to an estimated 10% of all species on Earth. Despite this, deforestation continues at an alarming rate, with scientists warning that the forest could reach a "tipping point" within decades if current trends persist.',
    question: 'Based on the passage, what would most likely happen if deforestation trends continue?',
    options: [
      'Oxygen production would increase globally.',
      'The Amazon could undergo irreversible ecological changes.',
      'Scientists would discover new species more quickly.',
      'The rainforest would adapt to produce more oxygen.',
    ],
    correct: 1,
    explanation: 'The passage directly states scientists warn of a "tipping point" if deforestation continues. This is closest to irreversible change. The other answers either contradict the passage or aren\'t supported by anything in it.',
  },
  {
    section: 'Science',
    passage: 'In an experiment, researchers measured plant growth under three light conditions: full sun (8 hrs/day), partial shade (4 hrs/day), and full shade (0 hrs/day). After 30 days, average heights were 42 cm, 28 cm, and 11 cm respectively.',
    question: 'According to the experiment results, which conclusion is best supported?',
    options: [
      'Plants cannot survive without sunlight.',
      'Increasing sunlight consistently increases plant height.',
      'Partial shade produces the healthiest plants.',
      'Full sun plants grew 4 times taller than full shade plants.',
    ],
    correct: 1,
    explanation: 'The data shows: full sun = 42 cm, partial = 28 cm, shade = 11 cm. Each step down in sunlight reduces growth. This directly supports B. D is wrong (42/11 ≈ 3.8, not 4). A is wrong — shade plants grew 11 cm, not zero.',
  },
  {
    section: 'Math',
    passage: null,
    question: 'A car travels 240 miles in 4 hours. At the same rate, how many miles will it travel in 7 hours?',
    options: ['360', '400', '420', '480'],
    correct: 2,
    explanation: 'Rate = 240 ÷ 4 = 60 mph. Distance in 7 hours = 60 × 7 = 420 miles. Always identify rate first on ACT distance problems.',
  },
];

let quizCurrentQ = 0;
let quizAnswers = new Array(QUIZ_QUESTIONS.length).fill(null);
let quizCorrectCount = 0;
let quizWrongCount = 0;

function renderQuizQuestion(idx) {
  const q = QUIZ_QUESTIONS[idx];
  if (!q) return;

  const qContainer = document.getElementById('quizQuestion');
  const resultsEl  = document.getElementById('quizResults');
  if (qContainer) qContainer.style.display = 'block';
  if (resultsEl) resultsEl.classList.remove('show');

  // Meta
  const qNum     = document.getElementById('qNum');
  const qSection = document.getElementById('qSection');
  const qProgress = document.getElementById('qProgressText');
  if (qNum) qNum.textContent = idx + 1;
  if (qSection) qSection.textContent = q.section;
  if (qProgress) qProgress.textContent = `Question ${idx + 1} of ${QUIZ_QUESTIONS.length}`;

  // Passage
  const passageEl = document.getElementById('qPassage');
  if (passageEl) {
    if (q.passage) {
      passageEl.textContent = q.passage;
      passageEl.style.display = 'block';
    } else {
      passageEl.style.display = 'none';
    }
  }

  // Question text
  const qText = document.getElementById('qText');
  if (qText) qText.textContent = q.question;

  // Options
  const optList = document.getElementById('qOptions');
  if (optList) {
    optList.innerHTML = '';
    q.options.forEach((opt, i) => {
      const li = document.createElement('div');
      li.className = 'quiz-option';
      li.innerHTML = `<div class="quiz-option-letter">${String.fromCharCode(65 + i)}</div><div class="quiz-option-text">${opt}</div>`;
      li.addEventListener('click', () => selectAnswer(idx, i));
      optList.appendChild(li);
    });
  }

  // Explanation
  const explEl = document.getElementById('qExplanation');
  if (explEl) explEl.classList.remove('show');

  // Nav buttons
  const nextBtn = document.getElementById('quizNextBtn');
  if (nextBtn) nextBtn.textContent = idx === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next Question →';

  // Live score
  const cEl = document.getElementById('quizCorrectCount');
  const wEl = document.getElementById('quizWrongCount');
  if (cEl) cEl.textContent = quizCorrectCount;
  if (wEl) wEl.textContent = quizWrongCount;

  // Restore answer if going back
  if (quizAnswers[idx] !== null) {
    showAnswerResult(idx, quizAnswers[idx]);
  }
}

function selectAnswer(qIdx, ansIdx) {
  if (quizAnswers[qIdx] !== null) return; // already answered

  quizAnswers[qIdx] = ansIdx;
  const q = QUIZ_QUESTIONS[qIdx];
  const isCorrect = ansIdx === q.correct;

  if (isCorrect) quizCorrectCount++;
  else quizWrongCount++;

  showAnswerResult(qIdx, ansIdx);
}

function showAnswerResult(qIdx, selectedIdx) {
  const q = QUIZ_QUESTIONS[qIdx];
  const optList = document.getElementById('qOptions');
  if (!optList) return;

  const options = optList.querySelectorAll('.quiz-option');
  options.forEach((opt, i) => {
    if (i === q.correct) opt.classList.add('correct');
    else if (i === selectedIdx && selectedIdx !== q.correct) opt.classList.add('wrong');
    opt.style.pointerEvents = 'none';
  });

  const explEl = document.getElementById('qExplanation');
  const explText = document.getElementById('qExplanationText');
  if (explEl) explEl.classList.add('show');
  if (explText) explText.textContent = q.explanation;

  const cEl = document.getElementById('quizCorrectCount');
  const wEl = document.getElementById('quizWrongCount');
  if (cEl) cEl.textContent = quizCorrectCount;
  if (wEl) wEl.textContent = quizWrongCount;
}

function nextQuizQuestion() {
  if (quizCurrentQ < QUIZ_QUESTIONS.length - 1) {
    quizCurrentQ++;
    renderQuizQuestion(quizCurrentQ);
  } else {
    showQuizResults();
  }
}

function showQuizResults() {
  const qContainer = document.getElementById('quizQuestion');
  const resultsEl  = document.getElementById('quizResults');
  if (qContainer) qContainer.style.display = 'none';
  if (resultsEl) resultsEl.classList.add('show');

  const pct = Math.round((quizCorrectCount / QUIZ_QUESTIONS.length) * 100);
  const scoreEl  = document.getElementById('quizFinalScore');
  const msgEl    = document.getElementById('quizFinalMsg');
  const detailEl = document.getElementById('quizFinalDetail');

  if (scoreEl) scoreEl.textContent = pct + '%';

  const messages = [
    [80, '🎉 Excellent work!', `You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. Strong performance — keep it up!`],
    [60, '📈 Good progress!', `You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. Review the explanations and try again.`],
    [0,  '📚 Keep practicing.', `You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. This is exactly why we have a tutor — let\'s work on these together.`],
  ];

  for (const [threshold, msg, detail] of messages) {
    if (pct >= threshold) {
      if (msgEl) msgEl.textContent = msg;
      if (detailEl) detailEl.textContent = detail;
      break;
    }
  }
}

function restartQuiz() {
  quizCurrentQ = 0;
  quizAnswers = new Array(QUIZ_QUESTIONS.length).fill(null);
  quizCorrectCount = 0;
  quizWrongCount = 0;
  renderQuizQuestion(0);
  const resultsEl = document.getElementById('quizResults');
  if (resultsEl) resultsEl.classList.remove('show');
  const qContainer = document.getElementById('quizQuestion');
  if (qContainer) qContainer.style.display = 'block';
}

/* ============================================================
   INIT — run everything on DOM ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initToolNav();

  // Score estimator inputs
  ['estEngInput', 'estMathInput', 'estReadInput', 'estSciInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateEstimator);
  });

  // Tracker sliders
  ['eng', 'math', 'read', 'sci'].forEach(s => {
    const el = document.getElementById(s + 'Slider');
    if (el) el.addEventListener('input', updateTracker);
  });
  updateTracker(); // init on load

  // Flashcard — init
  renderCard(0);
  const fcEl = document.getElementById('flashcard');
  if (fcEl) fcEl.addEventListener('click', flipCard);

  document.querySelectorAll('.fc-category-btn').forEach(btn => {
    btn.addEventListener('click', () => setFCCategory(btn.dataset.category));
  });

  const prevBtn = document.getElementById('fcPrev');
  const nextBtn = document.getElementById('fcNext');
  const knewBtn = document.getElementById('fcKnewIt');
  const missBtn = document.getElementById('fcMissedIt');
  if (prevBtn) prevBtn.addEventListener('click', prevCard);
  if (nextBtn) nextBtn.addEventListener('click', nextCard);
  if (knewBtn) knewBtn.addEventListener('click', markKnewIt);
  if (missBtn) missBtn.addEventListener('click', markMissedIt);

  // Quiz — init
  renderQuizQuestion(0);
  const quizNextBtn = document.getElementById('quizNextBtn');
  if (quizNextBtn) quizNextBtn.addEventListener('click', nextQuizQuestion);

  const quizRestart = document.getElementById('quizRestart');
  if (quizRestart) quizRestart.addEventListener('click', restartQuiz);
});

/* ============================================================
   POMODORO TIMER
   ============================================================ */
let pomoInterval = null;
let pomoRunning = false;
let pomoTotal = 1500;
let pomoRemaining = 1500;
let pomoSessions = 0;
const POMO_CIRCUMFERENCE = 2 * Math.PI * 88; // 552.9

function setPomoMode(btn, duration, label) {
  document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  pomoTotal = duration;
  pomoRemaining = duration;
  pomoRunning = false;
  clearInterval(pomoInterval);
  const startBtn = document.getElementById('pomoStartBtn');
  if (startBtn) startBtn.textContent = 'Start';
  const modeLabel = document.getElementById('pomoModeLabel');
  if (modeLabel) modeLabel.textContent = label;
  updatePomoDisplay();
}

function togglePomo() {
  const btn = document.getElementById('pomoStartBtn');
  if (pomoRunning) {
    clearInterval(pomoInterval);
    pomoRunning = false;
    if (btn) btn.textContent = 'Resume';
  } else {
    pomoRunning = true;
    if (btn) btn.textContent = 'Pause';
    pomoInterval = setInterval(() => {
      pomoRemaining--;
      updatePomoDisplay();
      if (pomoRemaining <= 0) {
        clearInterval(pomoInterval);
        pomoRunning = false;
        if (btn) btn.textContent = 'Start';
        const modeLabel = document.getElementById('pomoModeLabel');
        const isBreak = modeLabel && (modeLabel.textContent.includes('Break'));
        if (!isBreak) {
          pomoSessions++;
          const sessionEl = document.getElementById('pomoSession');
          if (sessionEl) sessionEl.textContent = `Session ${pomoSessions} complete! Take a break.`;
        }
        // Try browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('TutorTime Timer', { body: 'Session complete! Take a break.', icon: 'assets/tutortime-logo-transparent.png' });
        }
      }
    }, 1000);
  }
}

function resetPomo() {
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoRemaining = pomoTotal;
  const btn = document.getElementById('pomoStartBtn');
  if (btn) btn.textContent = 'Start';
  const sessionEl = document.getElementById('pomoSession');
  if (sessionEl) sessionEl.textContent = `Session ${pomoSessions + 1} of 4 — complete 4 to earn a long break`;
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const min = Math.floor(pomoRemaining / 60).toString().padStart(2, '0');
  const sec = (pomoRemaining % 60).toString().padStart(2, '0');
  const displayEl = document.getElementById('pomoDisplay');
  if (displayEl) displayEl.textContent = `${min}:${sec}`;
  // Update ring
  const ring = document.getElementById('pomoRingFill');
  if (ring) {
    const progress = pomoRemaining / pomoTotal;
    const offset = POMO_CIRCUMFERENCE * (1 - progress);
    ring.style.strokeDashoffset = offset;
  }
}
