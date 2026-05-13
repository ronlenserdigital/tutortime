/* ============================================================
   TUTORTIME — tools.js
   Score Estimator · Section Tracker · Flashcards · Quiz · Pomodoro
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
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tool');
  if (t) {
    const btn = document.querySelector(`.tool-nav-btn[data-tool="${t}"]`);
    if (btn) btn.click();
  }
}

/* ============================================================
   SCORE ESTIMATOR — English 50, Math 45, Reading 36, Science 40
   ============================================================ */
const ACT_TIERS = [
  { min: 35, label: 'Elite — Ivy League & Top 10',       color: '#7C5CFC' },
  { min: 33, label: 'Excellent — Top 25 Universities',   color: '#38B6FF' },
  { min: 30, label: 'Strong — Most State Flagships',     color: '#00C48C' },
  { min: 27, label: 'Above Average — Good Options',      color: '#FFB347' },
  { min: 24, label: 'Average — Still Competitive',       color: '#FF7F50' },
  { min:  0, label: 'Room to Grow — Let\'s work on it', color: '#FF5E7E' },
];

function rawToScaled(raw, maxRaw) {
  if (raw === '' || raw === null || isNaN(raw)) return null;
  raw = Math.max(0, Math.min(parseInt(raw), maxRaw));
  const pct = raw / maxRaw;
  const bp = [
    [1.00,36],[0.97,35],[0.93,34],[0.89,33],[0.85,32],
    [0.81,31],[0.77,30],[0.73,29],[0.68,28],[0.63,27],
    [0.58,26],[0.53,25],[0.49,24],[0.45,23],[0.41,22],
    [0.37,21],[0.33,20],[0.29,19],[0.25,18],[0.21,17],
    [0.17,16],[0.13,15],[0.09,14],[0.06,13],[0.00,11],
  ];
  for (const [t, s] of bp) { if (pct >= t) return s; }
  return 1;
}

function getTier(composite) {
  for (const tier of ACT_TIERS) { if (composite >= tier.min) return tier; }
  return ACT_TIERS[ACT_TIERS.length - 1];
}

function updateEstimator() {
  const fields = [
    { inputId:'estEngInput',  barId:'estEngBar',  valId:'estEngScore',  bdId:'estBdEng',  max:50 },
    { inputId:'estMathInput', barId:'estMathBar', valId:'estMathScore', bdId:'estBdMath', max:45 },
    { inputId:'estReadInput', barId:'estReadBar', valId:'estReadScore', bdId:'estBdRead', max:36 },
    { inputId:'estSciInput',  barId:'estSciBar',  valId:'estSciScore',  bdId:'estBdSci',  max:40 },
  ];
  const scores = [];
  fields.forEach(({ inputId, barId, valId, bdId, max }) => {
    const input = document.getElementById(inputId);
    const bar   = document.getElementById(barId);
    const valEl = document.getElementById(valId);
    const bdVal = document.getElementById(bdId);
    if (!input) return;
    // Clamp value in UI if user typed over max
    if (input.value !== '' && parseInt(input.value) > max) input.value = max;
    if (input.value !== '' && parseInt(input.value) < 0)   input.value = 0;
    const raw    = input.value;
    const scaled = rawToScaled(raw, max);
    const rawInt = parseInt(raw);
    if (scaled !== null && !isNaN(rawInt)) {
      const pct = Math.min((rawInt / max) * 100, 100);
      if (bar)   bar.style.width = pct + '%';
      if (valEl) { valEl.textContent = scaled; valEl.style.color = 'var(--c-purple)'; }
      if (bdVal) bdVal.textContent = scaled;
      scores.push(scaled);
    } else {
      if (bar)   bar.style.width = '0%';
      if (valEl) { valEl.textContent = '—'; valEl.style.color = 'var(--c-muted)'; }
      if (bdVal) bdVal.textContent = '—';
    }
  });
  const compEl = document.getElementById('estComposite');
  const tierEl = document.getElementById('estTier');
  const hintEl = document.getElementById('estCTAHint');
  if (scores.length === 4) {
    const composite = Math.round(scores.reduce((a, b) => a + b) / 4);
    if (compEl) compEl.textContent = composite;
    const tier = getTier(composite);
    if (tierEl) {
      tierEl.textContent = tier.label;
      tierEl.style.color = tier.color;
      tierEl.style.borderColor = tier.color + '44';
      tierEl.style.background  = tier.color + '18';
    }
    if (hintEl) hintEl.textContent = composite >= 30
      ? 'Strong score — let\'s push it even higher with a session.'
      : `${30 - composite} point${30 - composite === 1 ? '' : 's'} from 30. Book a session to close the gap.`;
  } else {
    if (compEl) compEl.textContent = '—';
    if (tierEl) { tierEl.textContent = 'Enter all 4 sections above'; tierEl.style.color = ''; tierEl.style.borderColor = ''; tierEl.style.background = ''; }
    if (hintEl) hintEl.textContent = 'Approximation only — not an official ACT score.';
  }
}

/* ============================================================
   SECTION TRACKER
   ============================================================ */
const TRACKER_SUBJECTS = ['eng','math','read','sci'];
const TRACKER_LABELS   = ['English','Math','Reading','Science'];

function levelDescription(v) {
  if (v <= 2) return 'Critical — study this first, every session';
  if (v <= 4) return 'Below average — big gains possible here';
  if (v <= 6) return 'Average — consistent work will push the score';
  if (v <= 8) return 'Strong — polish edge cases for more points';
  return 'Near perfect — maintain, shift time elsewhere';
}

function updateRadar() {
  const vals = TRACKER_SUBJECTS.map(s => {
    const sl = document.getElementById(s + 'Slider');
    return sl ? parseInt(sl.value) / 10 : 0.5;
  });
  const cx = 100, cy = 100, r = 80;
  const angles = [-90, 0, 90, 180];
  const points = vals.map((v, i) => {
    const angle = angles[i] * (Math.PI / 180);
    const radius = r * v;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(' ');
  const radarFill = document.getElementById('radarFill');
  if (radarFill) radarFill.setAttribute('points', points);
}

function updateTracker() {
  const vals = TRACKER_SUBJECTS.map((s, i) => {
    const slider = document.getElementById(s + 'Slider');
    const lvlEl  = document.getElementById(s + 'Level');
    const descEl = document.getElementById(s + 'Desc');
    const val = slider ? parseInt(slider.value) : 5;
    if (lvlEl) lvlEl.textContent = val;
    if (descEl) descEl.textContent = levelDescription(val);
    return { name: TRACKER_LABELS[i], val };
  });
  const sorted = [...vals].sort((a, b) => a.val - b.val);
  const descriptions = [
    'Your weakest section — dedicate the most study time here.',
    'Second priority — work on this after your primary focus.',
    'Solid — occasional practice to maintain your gains.',
    'Your strength — just maintain leading up to test day.',
  ];
  sorted.forEach(({ name }, i) => {
    const planSubj = document.getElementById('planSubj' + i);
    const planDesc = document.getElementById('planDesc' + i);
    const planNum  = document.getElementById('planNum' + i);
    if (planSubj) planSubj.textContent = name;
    if (planDesc) planDesc.textContent = descriptions[i];
    if (planNum) {
      planNum.textContent = i + 1;
      planNum.className = 'tracker-plan-priority priority-' + Math.min(i + 1, 4);
    }
  });
  updateRadar();
}

/* ============================================================
   FLASHCARD DATA — 86 Real ACT Study Cards
   ============================================================ */
const ALL_FLASHCARDS = [

  /* ---- ENGLISH: 25 cards ---- */
  { subject:'English', topic:'Subject-Verb Agreement', difficulty:'Easy',
    q:'A singular subject requires what form of the verb?',
    a:'A singular subject requires a singular verb. The verb must agree with its subject, not with nearby nouns or prepositional phrases.',
    example:'"The box of chocolates IS on the table." (Subject = box, not chocolates)',
    whyItMatters:'Subject-verb agreement errors are among the highest-frequency mistakes on ACT English.' },

  { subject:'English', topic:'Comma Splice', difficulty:'Medium',
    q:'What is a comma splice and how do you fix one?',
    a:'A comma splice is two independent clauses joined only by a comma. Fix it with: (1) a period, (2) a semicolon, or (3) a comma + coordinating conjunction (FANBOYS: for, and, nor, but, or, yet, so).',
    example:'"She studied hard, she passed." Fix: "She studied hard; she passed." or "She studied hard, so she passed."',
    whyItMatters:'Comma splices are one of the most commonly tested punctuation errors on ACT English.' },

  { subject:'English', topic:'Semicolon Rule', difficulty:'Medium',
    q:'When is it correct to use a semicolon?',
    a:'Use a semicolon to join two complete independent clauses without a coordinating conjunction. Never use a semicolon before a dependent clause or between a list item and its label.',
    example:'"He finished the exam; he felt confident." Both sides are complete sentences.',
    whyItMatters:'The ACT offers semicolons as traps — if one side is incomplete, the semicolon is wrong.' },

  { subject:'English', topic:'Independent vs. Dependent Clause', difficulty:'Easy',
    q:'What distinguishes an independent clause from a dependent clause?',
    a:'An independent clause stands alone as a complete sentence. A dependent clause begins with a subordinating conjunction (because, although, since, when, if) and cannot stand alone.',
    example:'"Because she practiced daily" is dependent. "She improved" is independent.',
    whyItMatters:'Clause identification is the foundation of almost every punctuation question on ACT English.' },

  { subject:'English', topic:'Apostrophe — Possessives', difficulty:'Easy',
    q:'How do you form the possessive of a singular noun?',
    a:"Add 's to a singular noun to show possession — even if it ends in s. Apostrophes do NOT create plurals.",
    example:'"The student\'s essay." / "James\'s book." Plural: "The students\' essays." (apostrophe after s)',
    whyItMatters:"Students constantly confuse possessives with plurals — this mistake appears on every ACT English section." },

  { subject:'English', topic:"Its vs. It's", difficulty:'Easy',
    q:'When do you use "its" versus "it\'s"?',
    a:'"It\'s" is ALWAYS a contraction of "it is" or "it has." "Its" is the possessive pronoun. Pronouns never use apostrophes for possession.',
    example:'"It\'s raining." (= It is raining) / "The dog wagged its tail." (possession)',
    whyItMatters:'This is one of the most common ACT traps — the apostrophe does NOT mark possession in pronouns.' },

  { subject:'English', topic:'Who vs. Whom', difficulty:'Medium',
    q:'When do you use "who" versus "whom"?',
    a:'Use "who" when it is the subject of a verb. Use "whom" when it is the object. Test: substitute he/she = who; substitute him/her = whom.',
    example:'"Who called?" (He called → who) / "To whom did you send it?" (You sent it to him → whom)',
    whyItMatters:'Who/whom questions appear directly on the ACT — the substitution trick solves them instantly.' },

  { subject:'English', topic:'Affect vs. Effect', difficulty:'Easy',
    q:'What is the difference between "affect" and "effect"?',
    a:'"Affect" is almost always a verb meaning to influence. "Effect" is almost always a noun meaning a result.',
    example:'"The cold weather affected her score." (verb) / "The effect of practice was dramatic." (noun)',
    whyItMatters:'Affect/effect is a classic ACT vocabulary-in-grammar trap tested in context.' },

  { subject:'English', topic:"There / Their / They're", difficulty:'Easy',
    q:'When do you use "there," "their," and "they\'re"?',
    a:'"There" indicates place or introduces a clause. "Their" is possessive. "They\'re" = they are. Expand the contraction to check.',
    example:'"They\'re going to their favorite restaurant over there."',
    whyItMatters:'These are easy points if you know the rules — but careless students lose them every time.' },

  { subject:'English', topic:'Misplaced Modifier', difficulty:'Medium',
    q:'What is a misplaced modifier and what does the ACT require?',
    a:'A misplaced modifier is a descriptive phrase placed too far from the word it modifies, creating absurdity. The ACT requires modifying phrases to immediately precede the noun they describe.',
    example:'Wrong: "Running down the street, the bus nearly hit Marcus." (the bus was running?) / Right: "Running down the street, Marcus nearly got hit by the bus."',
    whyItMatters:'Misplaced modifiers are a high-frequency ACT error tested in full-sentence revision questions.' },

  { subject:'English', topic:'Parallel Structure', difficulty:'Medium',
    q:'What is parallel structure and when does the ACT test it?',
    a:'All items in a list, comparison, or paired construction must use the same grammatical form — all nouns, all infinitives, all gerunds, etc.',
    example:'Wrong: "She likes swimming, to run, and hiking." / Right: "She likes swimming, running, and hiking."',
    whyItMatters:'Parallel structure errors appear in almost every ACT English section, especially with lists and comparisons.' },

  { subject:'English', topic:'Redundancy and Concision', difficulty:'Easy',
    q:'What does "redundancy" mean on the ACT?',
    a:'Redundancy means saying the same thing twice. The ACT rewards the most concise answer that fully preserves the meaning. Shorter is almost always better when two choices are grammatically equal.',
    example:'"The reason why he failed was because he didn\'t study." → "He failed because he didn\'t study."',
    whyItMatters:'The ACT is obsessed with concision — redundant phrasing is always wrong even if grammatically harmless.' },

  { subject:'English', topic:'Transition Words', difficulty:'Medium',
    q:'How do you choose the correct transition word on ACT English?',
    a:'Identify the logical relationship: contrast (however, although, but), addition (furthermore, also), cause/effect (therefore, thus, as a result), or example (for instance, specifically). The meaning matters, not just the grammar.',
    example:'"She was exhausted. ______, she kept studying." → "Nevertheless" (contrast/concession)',
    whyItMatters:'Transition questions test logical reasoning — pick the word that matches the actual relationship.' },

  { subject:'English', topic:'Nonessential Clause Punctuation', difficulty:'Medium',
    q:'How do you correctly punctuate a nonessential (nonrestrictive) clause?',
    a:'Enclose a nonessential clause with matching punctuation on both sides: two commas, two dashes, or two parentheses. A nonessential clause can be removed without changing the core meaning.',
    example:'"Mr. Davis, who has taught here for ten years, is retiring." Remove clause: "Mr. Davis is retiring" — still complete.',
    whyItMatters:'Comma pairs around nonessential clauses are tested repeatedly — missing one comma is always wrong.' },

  { subject:'English', topic:'Colon Rules', difficulty:'Medium',
    q:'When is it correct to use a colon?',
    a:'Use a colon after a complete independent clause to introduce a list, explanation, quotation, or elaboration. Never place a colon directly after a verb or preposition.',
    example:'Correct: "She needed three things: a pencil, a calculator, and patience." / Wrong: "She needed: a pencil and a calculator."',
    whyItMatters:'The ACT tests colon misuse — the rule is simple but students who don\'t know it guess wrong every time.' },

  { subject:'English', topic:'Dash Rules', difficulty:'Medium',
    q:'How is an em dash used correctly?',
    a:'A single dash introduces a summary, contrast, or elaboration after an independent clause. A pair of dashes sets off nonessential information for emphasis, exactly like commas. Open with a dash, close with one.',
    example:'"The answer — surprisingly — was much simpler than expected." / "He finally admitted it — he had known all along."',
    whyItMatters:'Dash questions appear regularly; knowing dash means emphasis/pause prevents confusion with commas.' },

  { subject:'English', topic:'Verb Tense Consistency', difficulty:'Medium',
    q:'What is verb tense consistency and why does the ACT test it?',
    a:'All verbs in a passage should stay in the same time frame unless there is a specific logical reason to shift. Unnecessary tense shifts are errors.',
    example:'Wrong: "She walked into the room and sits down." / Right: "She walked into the room and sat down."',
    whyItMatters:'Tense shift errors appear in paragraph-level editing questions and are easy to miss when reading quickly.' },

  { subject:'English', topic:'Active vs. Passive Voice', difficulty:'Medium',
    q:'What is the difference between active and passive voice, and which does the ACT prefer?',
    a:'Active voice: subject performs the action. Passive: subject receives it. The ACT prefers active voice because it is more direct and concise.',
    example:'Active: "The coach explained the drill." / Passive: "The drill was explained by the coach."',
    whyItMatters:'Passive voice is a common wrong answer in concision questions — active is direct and preferred.' },

  { subject:'English', topic:'Vague Pronoun Reference', difficulty:'Medium',
    q:'What is a vague pronoun reference and how do you fix it?',
    a:'A vague pronoun has no clear antecedent — the reader cannot tell which noun it refers to. Fix it by replacing the pronoun with the specific noun or restructuring the sentence.',
    example:'Vague: "When Maya called her sister, she was nervous." (Who was nervous?) / Clear: "When Maya called her sister, Maya was nervous."',
    whyItMatters:'Clarity is a core ACT English priority — vague pronoun references appear frequently in revision questions.' },

  { subject:'English', topic:'Comparison Errors', difficulty:'Medium',
    q:'What is a comparison error in ACT English?',
    a:'A comparison error occurs when two things being compared are not logically equivalent. You must compare like to like. Use "those of" or "that of" to make comparisons parallel.',
    example:'Wrong: "Her essay was better than the other students." / Right: "Her essay was better than those of the other students."',
    whyItMatters:'Illogical comparisons are a consistent ACT trap that many students miss because the sentence sounds fine.' },

  { subject:'English', topic:'Pronoun Case', difficulty:'Medium',
    q:'What is the rule for subject vs. object pronoun forms?',
    a:'Subject pronouns (I, he, she, we, they) serve as subjects of verbs. Object pronouns (me, him, her, us, them) serve as objects of verbs or prepositions. Remove the other person and read the sentence alone to test.',
    example:'"Between you and I" is wrong: "between you and me" (object of preposition). / "Him and I went" is wrong: "He and I went."',
    whyItMatters:'"Between you and I" type errors are among the most tested grammar mistakes on the ACT.' },

  { subject:'English', topic:'Comma Rules — Lists', difficulty:'Easy',
    q:'What is the rule for commas in a list of three or more items?',
    a:'Use a comma between every item in a series, including before the final conjunction (Oxford comma). The last comma before "and" or "or" is required on the ACT.',
    example:'"She studied English, math, and science." All three commas are correct.',
    whyItMatters:'List comma rules are tested consistently and are easy points once you know the pattern.' },

  { subject:'English', topic:'Rhetorical Purpose — Add/Delete', difficulty:'Hard',
    q:'How do you decide whether to add, keep, or delete a sentence on ACT English?',
    a:'Identify the paragraph\'s main purpose first. A sentence should stay only if it directly supports that purpose. Delete if it is off-topic, a digression, or redundant. The question often tells you the goal — match your answer to it.',
    example:'A paragraph about study habits: a sentence about the cafeteria menu → delete it (irrelevant).',
    whyItMatters:'Add/delete questions test big-picture reading comprehension — they\'re often worth more than grammar questions.' },

  { subject:'English', topic:'Sentence Placement', difficulty:'Hard',
    q:'How do you determine where a sentence belongs in a paragraph?',
    a:'Read the sentences around each proposed position. Look for: pronoun references, transition words, and logical progression. The sentence should flow naturally into and out of its location.',
    whyItMatters:'Sentence order questions require reading the paragraph as a whole — rushing causes errors on these.' },

  { subject:'English', topic:'Tone and Style Consistency', difficulty:'Hard',
    q:'How does tone affect correct answer choices on ACT English?',
    a:'The ACT requires consistent tone within a passage. Formal passages need formal phrasing; casual passages need casual phrasing. Answer choices that change the register are almost always wrong, even if grammatically correct.',
    example:'In a formal scientific passage, "The results were super weird" is wrong — "anomalous" fits the tone.',
    whyItMatters:'Tone questions test stylistic judgment alongside grammar — students who only check grammar miss these.' },

  /* ---- MATH: 30 cards ---- */
  { subject:'Math', topic:'Slope Formula', difficulty:'Easy',
    q:'What is the slope formula?',
    a:'m = (y₂ - y₁) / (x₂ - x₁) — "rise over run." Positive slope goes up left-to-right; negative slope goes down.',
    example:'Points (2, 3) and (6, 11): m = (11-3)/(6-2) = 8/4 = 2',
    whyItMatters:'Slope appears in linear equations, parallel/perpendicular lines, and rate-of-change problems.' },

  { subject:'Math', topic:'Slope-Intercept Form', difficulty:'Easy',
    q:'What is slope-intercept form and what do m and b represent?',
    a:'y = mx + b. m is the slope. b is the y-intercept (where the line crosses the y-axis when x = 0).',
    example:'y = 3x + 7 → slope = 3, y-intercept = (0, 7)',
    whyItMatters:'Slope-intercept is the single most-used linear equation form on ACT Math.' },

  { subject:'Math', topic:'Point-Slope Form', difficulty:'Medium',
    q:'What is point-slope form and when do you use it?',
    a:'y - y₁ = m(x - x₁). Use when you know the slope and one point. Convert to slope-intercept if needed.',
    example:'Slope = 4, passes through (2, 5): y - 5 = 4(x - 2) → y = 4x - 3',
    whyItMatters:'Point-slope form is the fastest setup when the ACT gives you a slope and a point.' },

  { subject:'Math', topic:'Systems of Equations', difficulty:'Medium',
    q:'How do you solve a system of equations using substitution?',
    a:'Solve one equation for one variable, substitute into the other equation, solve for the remaining variable, then back-substitute.',
    example:'x + y = 10 and x - y = 4 → x = 10-y → (10-y)-y = 4 → y = 3, x = 7',
    whyItMatters:'Systems appear multiple times per ACT — both substitution and elimination are tested.' },

  { subject:'Math', topic:'Factoring Quadratics', difficulty:'Medium',
    q:'How do you factor a quadratic of the form x² + bx + c?',
    a:'Find two numbers that multiply to c AND add to b. Write as (x + p)(x + q).',
    example:'x² + 5x + 6 → 2 × 3 = 6, 2 + 3 = 5 → (x + 2)(x + 3)',
    whyItMatters:'Factoring is used to solve quadratics, find function zeros, and simplify rational expressions.' },

  { subject:'Math', topic:'FOIL', difficulty:'Easy',
    q:'What does FOIL stand for, and how do you use it?',
    a:'First, Outer, Inner, Last. Multiply each pair in order and combine like terms.',
    example:'(x + 3)(x + 4) = x² + 4x + 3x + 12 = x² + 7x + 12',
    whyItMatters:'FOIL is used to expand expressions and in reverse for factoring — tested throughout ACT Math.' },

  { subject:'Math', topic:'Exponent Rules', difficulty:'Medium',
    q:'What are the five key exponent rules?',
    a:'1. aᵐ × aⁿ = aᵐ⁺ⁿ\n2. aᵐ ÷ aⁿ = aᵐ⁻ⁿ\n3. (aᵐ)ⁿ = aᵐⁿ\n4. a⁰ = 1\n5. a⁻ⁿ = 1/aⁿ',
    example:'x³ × x⁵ = x⁸ / x⁶ ÷ x² = x⁴ / (x²)³ = x⁶ / 5⁰ = 1 / x⁻² = 1/x²',
    whyItMatters:'All five rules appear on the ACT — in direct questions and algebraic simplification.' },

  { subject:'Math', topic:'Quadratic Formula', difficulty:'Medium',
    q:'What is the quadratic formula and when do you use it?',
    a:'x = (-b ± √(b² - 4ac)) / 2a. Use to solve ax² + bx + c = 0 when factoring is difficult. The discriminant (b² - 4ac) tells you how many real solutions exist.',
    example:'x² + 2x - 8 = 0 → x = (-2 ± √36)/2 → x = 2 or x = -4',
    whyItMatters:'When factoring fails, the quadratic formula always works.' },

  { subject:'Math', topic:'Percentages', difficulty:'Easy',
    q:'How do you find X% of a number? How do you find what percent A is of B?',
    a:'X% of N = (X/100) × N. What % is A of B? = (A/B) × 100. Percent change = (change/original) × 100.',
    example:'35% of 80 = 0.35 × 80 = 28. What % is 15 of 60? = 25%.',
    whyItMatters:'Percentage problems appear in word problems, statistics, and data interpretation on every ACT.' },

  { subject:'Math', topic:'Ratios and Proportions', difficulty:'Easy',
    q:'How do you set up and solve a proportion?',
    a:'Set two equal ratios: a/b = c/d → cross-multiply: ad = bc.',
    example:'If 3 books cost $12, how much do 7 cost? 3/12 = 7/x → x = $28',
    whyItMatters:'Proportions solve real-world ratio and scaling problems that appear consistently in ACT word problems.' },

  { subject:'Math', topic:'Mean (Average)', difficulty:'Easy',
    q:'What is the formula for mean, and what is the most useful rearrangement?',
    a:'Mean = Sum / Count. Rearranged: Sum = Mean × Count. This is far more useful — use it to find a missing value when the average is given.',
    example:'Average of 5 tests = 82. Sum = 82 × 5 = 410. If four scores total 328, the fifth = 82.',
    whyItMatters:'ACT problems give the average and ask for a missing score — the sum formula is the key shortcut.' },

  { subject:'Math', topic:'Probability', difficulty:'Medium',
    q:'What is the basic probability formula?',
    a:'P(event) = favorable outcomes / total possible outcomes. Independent events: P(A and B) = P(A) × P(B). Mutually exclusive: P(A or B) = P(A) + P(B).',
    example:'Bag: 3 red, 7 blue. P(red) = 3/10. Two draws with replacement: P(red, red) = 9/100.',
    whyItMatters:'Probability appears in data and word problem sections — the ACT tests both single and compound events.' },

  { subject:'Math', topic:'Median and Mode', difficulty:'Easy',
    q:'What are median and mode, and how do you find each?',
    a:'Median: middle value of sorted data (or average of two middle values). Mode: most frequent value.',
    example:'{2, 4, 4, 7, 9} → Median = 4, Mode = 4',
    whyItMatters:'Mean/median/mode questions appear in statistics problems — confusing them is an easy mistake.' },

  { subject:'Math', topic:'Area Formulas', difficulty:'Easy',
    q:'What are the area formulas for the five common shapes?',
    a:'Rectangle: lw / Triangle: ½bh / Circle: πr² / Trapezoid: ½(b₁+b₂)h / Parallelogram: bh. None provided on the ACT.',
    example:'Triangle base 10, height 6: A = ½ × 10 × 6 = 30 sq units.',
    whyItMatters:'Area formulas are used directly and in multi-step geometry word problems.' },

  { subject:'Math', topic:'Volume Formulas', difficulty:'Medium',
    q:'What are the volume formulas for common 3D shapes?',
    a:'Rectangular prism: lwh / Cylinder: πr²h / Sphere: (4/3)πr³ / Cone: (1/3)πr²h / Pyramid: (1/3)Bh',
    example:'Cylinder r=3, h=10: V = 90π ≈ 282.7 cubic units.',
    whyItMatters:'Volume appears in geometry word problems — not provided on the ACT.' },

  { subject:'Math', topic:'Pythagorean Theorem', difficulty:'Easy',
    q:'What is the Pythagorean theorem?',
    a:'a² + b² = c², where c is the hypotenuse (opposite the right angle). Use any time you have a right triangle and need a missing side.',
    example:'Legs 6 and 8: c² = 36 + 64 = 100 → c = 10.',
    whyItMatters:'The Pythagorean theorem appears in geometry, distance, and trigonometry problems throughout ACT Math.' },

  { subject:'Math', topic:'Special Right Triangles', difficulty:'Medium',
    q:'What are the two special right triangles and their side ratios?',
    a:'45-45-90: sides 1 : 1 : √2 (hypotenuse = leg × √2). 30-60-90: sides 1 : √3 : 2.',
    example:'30-60-90, shortest leg = 5 → sides: 5, 5√3, 10.',
    whyItMatters:'Recognizing special triangles saves time — no quadratic formula or calculator needed.' },

  { subject:'Math', topic:'Distance Formula', difficulty:'Medium',
    q:'What is the distance formula between two coordinate points?',
    a:'d = √[(x₂-x₁)² + (y₂-y₁)²] — the Pythagorean theorem on a coordinate plane.',
    example:'(1,2) and (4,6): d = √[9+16] = √25 = 5',
    whyItMatters:'Distance formula connects coordinate geometry to the Pythagorean theorem — a cross-topic ACT favorite.' },

  { subject:'Math', topic:'Midpoint Formula', difficulty:'Easy',
    q:'What is the midpoint formula?',
    a:'Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2). Average the x-coordinates, average the y-coordinates.',
    example:'Midpoint of (2,4) and (8,10) = (5,7).',
    whyItMatters:'Midpoint questions appear directly and as setups for longer coordinate geometry problems.' },

  { subject:'Math', topic:'Circle Equation', difficulty:'Hard',
    q:'What is the standard equation of a circle?',
    a:'(x-h)² + (y-k)² = r², where (h,k) is the center and r is the radius. Note: if you see (x+3)², the center is x = -3 (h is subtracted).',
    example:'Center (3,-2), radius 5: (x-3)² + (y+2)² = 25.',
    whyItMatters:'Circle equation questions appear in coordinate geometry — the sign flip is the most common error.' },

  { subject:'Math', topic:'Circumference and Area of Circle', difficulty:'Easy',
    q:'What are the circumference and area formulas for a circle?',
    a:'C = 2πr = πd. A = πr². If given diameter, halve it first.',
    example:'Radius 7: C = 14π ≈ 43.98, A = 49π ≈ 153.94.',
    whyItMatters:'These are not given on the ACT — they appear in arc length, sector area, and rate problems.' },

  { subject:'Math', topic:'SOH-CAH-TOA', difficulty:'Medium',
    q:'What do SOH-CAH-TOA stand for?',
    a:'Sin = Opposite/Hypotenuse. Cos = Adjacent/Hypotenuse. Tan = Opposite/Adjacent. Ratios for a right triangle\'s sides relative to a given angle.',
    example:'Opposite=3, adjacent=4, hypotenuse=5: sin=3/5, cos=4/5, tan=3/4.',
    whyItMatters:'Trig ratios are directly tested — expect 4-6 trig questions per ACT Math section.' },

  { subject:'Math', topic:'Functions and Notation', difficulty:'Medium',
    q:'What does f(x) mean, and how do you evaluate a function?',
    a:'f(x) assigns one output to each input x. To evaluate f(a): replace every x with a and simplify. f(a+b) does NOT equal f(a)+f(b).',
    example:'f(x) = 2x² - 3x + 1 → f(4) = 32 - 12 + 1 = 21.',
    whyItMatters:'Function notation is tested frequently — misreading f(a+b) is a classic ACT error.' },

  { subject:'Math', topic:'Absolute Value Equations', difficulty:'Medium',
    q:'How do you solve |x - 3| = 7?',
    a:'Split into two equations: x-3 = 7 AND x-3 = -7. Solve both — absolute value always creates two cases.',
    example:'|x-3| = 7 → x = 10 or x = -4.',
    whyItMatters:'Forgetting the negative case means half-credit — absolute value always creates two possibilities.' },

  { subject:'Math', topic:'Inequalities', difficulty:'Medium',
    q:'What is the most important rule when solving inequalities?',
    a:'Solve like an equation, BUT flip the inequality sign when you multiply or divide both sides by a negative. Open circle for < or >; filled for ≤ or ≥.',
    example:'-2x + 4 > 10 → -2x > 6 → x < -3 (sign flips because divided by -2).',
    whyItMatters:'Forgetting to flip the sign is the #1 inequality error on ACT Math.' },

  { subject:'Math', topic:'Radical Simplification', difficulty:'Medium',
    q:'How do you simplify a radical like √72?',
    a:'Find the largest perfect square factor. Split: √(perfect square × remaining), simplify.',
    example:'√72 = √(36×2) = 6√2. / √48 = √(16×3) = 4√3.',
    whyItMatters:'Unsimplified radicals never appear as ACT answer choices — you must simplify to match.' },

  { subject:'Math', topic:'Similar Triangles', difficulty:'Medium',
    q:'What are similar triangles and how do you use them?',
    a:'Similar triangles have equal angles and proportional sides. Set up a proportion: side₁/side₂ = corresponding side₁/corresponding side₂.',
    example:'Triangle A: 3,4,5. Similar B with shortest side 9. Scale factor = 3 → B: 9,12,15.',
    whyItMatters:'Similar triangles appear in geometry diagrams and real-world scaling problems on ACT Math.' },

  { subject:'Math', topic:'Domain and Range', difficulty:'Hard',
    q:'What are domain and range of a function?',
    a:'Domain = all valid x inputs. Range = all resulting y outputs. Restrictions: denominators cannot be 0; square roots of negatives are undefined in real numbers.',
    example:'f(x)=1/(x-3): domain = all reals except x=3. f(x)=√(x+2): domain = x ≥ -2.',
    whyItMatters:'Domain and range appear in both algebra and function questions — students who skip them leave easy points.' },

  { subject:'Math', topic:'Unit Conversions', difficulty:'Easy',
    q:'How do you set up a unit conversion to avoid errors?',
    a:'Use dimensional analysis: multiply by a conversion fraction arranged so unwanted units cancel.',
    example:'180 min × (1 hr/60 min) = 3 hrs. (Minutes cancel.)',
    whyItMatters:'Unit errors — computing in minutes when the answer needs hours — are common ACT mistakes.' },

  { subject:'Math', topic:'Word Problem Setup', difficulty:'Medium',
    q:'What is the strategy for setting up an ACT word problem?',
    a:'(1) Identify what you\'re solving for and assign a variable. (2) Translate: "is" = equals, "of" = multiply, "more than" = add. (3) Write the equation. (4) Check your answer.',
    example:'"A number increased by 12 is three times the number." → x+12 = 3x → x = 6.',
    whyItMatters:'Setting up the equation incorrectly is the most common word problem error.' },

  { subject:'Math', topic:'Percent Increase/Decrease', difficulty:'Medium',
    q:'How do you calculate percent increase or decrease?',
    a:'Percent change = (New - Original) / Original × 100. For repeated percent changes, apply each individually — do NOT simply add or subtract percents.',
    example:'$80 to $100: 20/80 × 100 = 25% increase. Then drops 25%: 100 × 0.75 = $75 (not $80).',
    whyItMatters:'Compound percent change is a classic ACT trap — students who add percents get the wrong answer.' },

  /* ---- READING: 12 cards ---- */
  { subject:'Reading', topic:'Main Idea', difficulty:'Easy',
    q:'How do you identify the main idea of an ACT Reading passage?',
    a:'The main idea is the central claim developed throughout the entire passage — not a single detail, not an extreme statement. Ask: what is almost every paragraph contributing to?',
    example:'Passage about salt\'s history and economics → main idea: salt\'s cultural and economic significance, not "salt is a mineral."',
    whyItMatters:'Main idea questions anchor all other reading questions — getting it wrong affects everything else.' },

  { subject:'Reading', topic:"Author's Purpose", difficulty:'Medium',
    q:"How do you determine an author's purpose on ACT Reading?",
    a:'Ask why the author wrote the piece. Common purposes: to inform/explain, to argue/persuade, to narrate, to analyze, to describe. Look at the overall structure and the opening and closing paragraphs.',
    whyItMatters:'Purpose questions test your ability to read the passage as a whole — not just individual sentences.' },

  { subject:'Reading', topic:'Inference vs. Direct Evidence', difficulty:'Medium',
    q:'What is the difference between inference and direct evidence on ACT Reading?',
    a:'Direct evidence: explicitly stated in the text. Inference: logically implied from what IS stated, without going beyond the passage. ACT inferences stay very close to the text.',
    whyItMatters:'Many wrong answers are "too inferred" — they sound reasonable but go beyond what the passage supports.' },

  { subject:'Reading', topic:"Author's Tone", difficulty:'Medium',
    q:"How do you identify an author's tone on ACT Reading?",
    a:'Tone is the author\'s attitude toward the subject. Clues: word choice, degree of certainty, formality, and judgment words. Common tones: critical, admiring, nostalgic, objective, ironic, cautionary.',
    example:'"The policy, though well-intentioned, has produced disastrous consequences." → tone: critical/cautionary.',
    whyItMatters:'Tone questions require reading beyond literal meaning — students who ignore word choice miss these.' },

  { subject:'Reading', topic:'Vocabulary in Context', difficulty:'Easy',
    q:'How do you answer "as used in line X, the word Y most nearly means..."?',
    a:'Go to the line, read two surrounding sentences for context, then choose the answer that fits THAT context — not the dictionary definition. The obvious definition is often a trap.',
    example:'"The chef\'s creative plating drew curious looks." → "curious" means "interested," not "strange."',
    whyItMatters:'Vocabulary-in-context tests comprehension, not vocabulary — the common definition is frequently wrong.' },

  { subject:'Reading', topic:'Detail Questions', difficulty:'Easy',
    q:'What is the correct strategy for ACT detail questions?',
    a:'Always return to the relevant section and re-read it — never answer from memory. Paraphrasing can shift meaning, so verify the original words before choosing.',
    whyItMatters:'Even careful readers misremember details under test conditions — always verify in the text.' },

  { subject:'Reading', topic:'Cause and Effect', difficulty:'Medium',
    q:'How do you identify cause and effect in an ACT passage?',
    a:'Look for signal words: because, since, as a result, therefore, consequently, leads to, causes, due to. Identify which event came first (cause) and which followed (effect).',
    whyItMatters:'Cause/effect questions test whether you tracked the logical progression of the passage.' },

  { subject:'Reading', topic:'Eliminating Extreme Answers', difficulty:'Medium',
    q:'What types of answer choices should you eliminate first on ACT Reading?',
    a:'Eliminate answers that: use absolute language (always, never, all, none) unless the text is equally absolute; go further than the text supports; contradict the passage; or are true but irrelevant.',
    whyItMatters:'The single most reliable elimination strategy — two or three choices are usually clearly wrong.' },

  { subject:'Reading', topic:'Paired Passages', difficulty:'Hard',
    q:'What is the best strategy for paired ACT Reading passages?',
    a:'Read Passage A fully, answer A-only questions. Read Passage B, answer B-only questions. Then answer comparison questions. Focus: what each author claims, what evidence they use, where they agree or disagree.',
    whyItMatters:'Mixing up the two authors\' positions is the primary mistake — handle them separately first.' },

  { subject:'Reading', topic:'Summarizing Paragraphs', difficulty:'Medium',
    q:'How do you stay oriented during a long ACT Reading passage?',
    a:'After each paragraph, note its main point in 4-5 words in the margin. This mental map lets you locate answers by paragraph without re-reading the whole passage.',
    whyItMatters:'Students who don\'t annotate spend half their time searching — a paragraph map cuts re-reading significantly.' },

  { subject:'Reading', topic:'Function of a Sentence or Paragraph', difficulty:'Hard',
    q:'How do you answer questions about why an author included a specific sentence or paragraph?',
    a:'Identify what the sentence DOES: Does it introduce? Provide evidence? Counter an argument? Offer an example? Shift tone? Conclude? Match the function — not just the content.',
    whyItMatters:'"Function of" questions require understanding structure, not content — students who only focus on meaning miss these.' },

  { subject:'Reading', topic:'Avoiding Outside Knowledge', difficulty:'Medium',
    q:'Why is it dangerous to use outside knowledge on ACT Reading?',
    a:'The ACT only tests what is stated or clearly implied in the passage. An answer that is factually true in the real world but not supported by the text is wrong.',
    example:'Passage about Edison doesn\'t mention Tesla. Choosing a Tesla answer = wrong even if historically arguable.',
    whyItMatters:'Using prior knowledge instead of the text is the single biggest ACT Reading mistake.' },

  /* ---- SCIENCE: 10 cards ---- */
  { subject:'Science', topic:'Independent Variable', difficulty:'Easy',
    q:'What is an independent variable in an ACT Science experiment?',
    a:'The factor the researcher deliberately changes or controls between groups. The "cause" in a cause-and-effect relationship. Goes on the x-axis.',
    example:'Testing how temperature affects reaction speed: temperature = independent variable.',
    whyItMatters:'Identifying variables is the first step in answering nearly every ACT Science experimental design question.' },

  { subject:'Science', topic:'Dependent Variable', difficulty:'Easy',
    q:'What is a dependent variable?',
    a:'What is measured or observed as an outcome of changing the independent variable. The "effect." Goes on the y-axis.',
    example:'In the temperature experiment, reaction speed (measured) = dependent variable.',
    whyItMatters:'Confusing independent and dependent variables is the most common ACT Science conceptual error.' },

  { subject:'Science', topic:'Control Group', difficulty:'Medium',
    q:'What is a control group and why does it matter?',
    a:'The control group receives no treatment (or the standard baseline condition). It isolates the effect of the independent variable by keeping everything else equal.',
    example:'Testing fertilizer: control group gets no fertilizer. Height difference = fertilizer\'s effect.',
    whyItMatters:'ACT Science asks you to identify the control — it shows you understand what makes an experiment valid.' },

  { subject:'Science', topic:'Positive vs. Negative Correlation', difficulty:'Easy',
    q:'How do you identify positive vs. negative correlation in a graph?',
    a:'Positive: as x increases, y also increases (upward slope). Negative: as x increases, y decreases (downward slope). No correlation: no consistent pattern.',
    example:'Hours studied vs. exam score → positive. Temperature vs. reaction time when cold → negative.',
    whyItMatters:'Recognizing correlation direction is the most fundamental graph-reading skill in ACT Science.' },

  { subject:'Science', topic:'Interpolation vs. Extrapolation', difficulty:'Medium',
    q:'What is the difference between interpolation and extrapolation?',
    a:'Interpolation: estimating a value WITHIN the data range — more reliable. Extrapolation: predicting BEYOND the range — less certain, as the trend may change.',
    example:'Data from 0-100°C: estimating at 50°C = interpolation. Predicting at 150°C = extrapolation.',
    whyItMatters:'The ACT distinguishes these — extrapolation answers often have "cannot be determined" as a correct option.' },

  { subject:'Science', topic:'Hypothesis', difficulty:'Medium',
    q:'What makes a valid scientific hypothesis on the ACT?',
    a:'A hypothesis is a specific, testable, falsifiable prediction based on prior observation. It is NOT a proven fact, law, or vague statement. Often in "if-then" format.',
    example:'"If plants receive more sunlight, they will grow taller" — testable and could be disproven.',
    whyItMatters:'The ACT asks you to identify which statement is a hypothesis — students confuse hypothesis with conclusion.' },

  { subject:'Science', topic:'Constants and Controlled Variables', difficulty:'Medium',
    q:'What are constants (controlled variables) in an experiment?',
    a:'Factors kept the same across every experimental group. They ensure that only the independent variable changes, so any observed difference can be attributed to that variable.',
    example:'Testing fertilizer: all plants get identical soil, water, light, and pot size. Those are constants.',
    whyItMatters:'ACT Science tests your ability to identify what must stay constant to make an experiment fair.' },

  { subject:'Science', topic:'Identifying a Supported Conclusion', difficulty:'Medium',
    q:'How do you identify which conclusion is supported by ACT Science data?',
    a:'A supported conclusion: (1) is proven by the data shown, (2) does not overgeneralize, (3) does not contradict the data, (4) requires no outside knowledge. Beware "too broad" answers.',
    example:'Compound A dissolves faster at 50°C than 30°C. Valid: "Higher temperature increases dissolution of compound A." Invalid: "All compounds dissolve faster when heated."',
    whyItMatters:'"Too broad" is the most common wrong answer type in ACT Science conclusion questions.' },

  { subject:'Science', topic:'Conflicting Viewpoints Passage', difficulty:'Hard',
    q:'How should you approach the ACT Science Conflicting Viewpoints passage?',
    a:'Read each scientist\'s position SEPARATELY: (1) their claim, (2) their evidence, (3) their logic. Answer questions about each viewpoint individually before comparing. Never mix which evidence belongs to whom.',
    whyItMatters:'Students who read both at once get confused — read, summarize each, then answer.' },

  { subject:'Science', topic:'Reading Graph Trends', difficulty:'Easy',
    q:'What is the first thing to do when you see a graph or table in ACT Science?',
    a:'Read the axis labels and units. Identify what is being measured. Note the range and overall trend. Then answer the specific question using the data — never guess from memory.',
    whyItMatters:'Most ACT Science questions are answered by reading the graph correctly — rushing past axis labels causes errors.' },

  /* ---- STRATEGY TIPS: 8 cards ---- */
  { subject:'Strategy Tips', topic:'Pacing — English', difficulty:'Medium',
    q:'How much time do you have per question on ACT English?',
    a:'45 minutes / 75 questions = 36 seconds per question. Do NOT read the passage first — work sentence by sentence. Mark slow questions and return with leftover time.',
    whyItMatters:'Students run out of time on English by overthinking grammar questions that have clear rules.' },

  { subject:'Strategy Tips', topic:'Skip and Return', difficulty:'Easy',
    q:'When should you skip a question and return to it later?',
    a:'Skip any question requiring more than 30-45 seconds of deep thought. Circle it in the booklet, bubble your best guess, keep moving. No guessing penalty on the ACT.',
    whyItMatters:'Sitting on one hard question while leaving easy ones unanswered is the most common timing mistake.' },

  { subject:'Strategy Tips', topic:'Process of Elimination', difficulty:'Easy',
    q:'How does process of elimination work on the ACT?',
    a:'Eliminate choices you know are wrong. Eliminating 2 of 4 doubles your odds from 25% to 50%. On Reading: eliminate what contradicts the text. On Math: eliminate answers that fail a quick check.',
    whyItMatters:'The fastest path to a right answer is often eliminating three wrong ones.' },

  { subject:'Strategy Tips', topic:'Bubbling Strategy', difficulty:'Medium',
    q:'What is the safest bubbling strategy?',
    a:'Circle answers in the booklet first. Bubble in batches of 5-10 rather than one at a time. Before moving to a new section, confirm your bubbles match your circled answers.',
    whyItMatters:'A single misaligned bubble can cascade into many wrong answers — one of the most preventable mistakes.' },

  { subject:'Strategy Tips', topic:'Avoiding Trap Answers', difficulty:'Medium',
    q:'What are the most common ACT trap answer patterns?',
    a:'English: answer with extra comma or slight meaning change. Math: answer to the wrong question (solved for x when they asked for 2x). Reading: true in reality but not in the passage. Science: conclusion broader than data.',
    whyItMatters:'ACT traps are designed to be appealing — recognizing the pattern lets you slow down at the right moment.' },

  { subject:'Strategy Tips', topic:'Timing by Section', difficulty:'Hard',
    q:'What are the time-per-question benchmarks for each ACT section?',
    a:'English: 45 min / 75q = 36 sec. Math: 60 min / 60q = 60 sec. Reading: 35 min / 40q = 52 sec (aim for 8 min/passage). Science: 35 min / 40q = 52 sec (aim for 5 min/passage).',
    whyItMatters:'Knowing your pace benchmark prevents running out of time because early questions took too long.' },

  { subject:'Strategy Tips', topic:'Using Answer Choices on Math', difficulty:'Medium',
    q:'When should you back-solve from answer choices?',
    a:'Back-solve when: (1) the problem asks for a specific value, (2) choices are numbers, (3) algebra would be slow. Start with the middle choice (B or C). Too small → try D; too large → try A.',
    example:'"What value of x satisfies 3x + 7 = 22?" → Try x=5: 15+7=22. Done.',
    whyItMatters:'Back-solving is faster than algebra for many problems — knowing when to switch is a real test strategy.' },

  { subject:'Strategy Tips', topic:'Review Mistakes Between Tests', difficulty:'Hard',
    q:'What is the most effective way to use practice tests?',
    a:'Review EVERY wrong answer. For each: (1) why wrong (knowledge gap, careless error, timing), (2) note the concept, (3) add to a review list. Patterns reveal exactly what to study. The improvement comes from the review, not the test.',
    whyItMatters:'Taking practice tests without detailed review is the #1 wasted study effort.' },
];

/* ============================================================
   FLASHCARD STATE
   ============================================================ */
let currentCardIdx   = 0;
let currentFilter    = { subject: 'All', difficulty: 'All' };
let filteredCards    = [];
let starredIndices   = new Set();
let isFlipped        = false;
let sessionCorrect   = 0;
let sessionWrong     = 0;
let sessionsReviewed = 0;
let missedCards      = [];
let normalCardCount  = 0;

function getFilteredCards() {
  return ALL_FLASHCARDS.filter((c, idx) => {
    if (currentFilter.subject === 'Starred') return starredIndices.has(idx);
    const subjectMatch    = currentFilter.subject === 'All' || c.subject === currentFilter.subject;
    const difficultyMatch = currentFilter.difficulty === 'All' || c.difficulty === currentFilter.difficulty;
    return subjectMatch && difficultyMatch;
  });
}

function renderCard(cardData, idx) {
  if (!cardData) return;
  isFlipped = false;
  const fc = document.getElementById('flashcard');
  if (fc) fc.classList.remove('flipped');

  const globalIdx = ALL_FLASHCARDS.indexOf(cardData);
  const isStarred = starredIndices.has(globalIdx);

  const subjectEl   = document.getElementById('cardSubject');
  const topicEl     = document.getElementById('cardTopic');
  const diffEl      = document.getElementById('cardDifficulty');
  const starBtn     = document.getElementById('fcStarBtn');
  const cardQ       = document.getElementById('cardQuestion');
  const cardA       = document.getElementById('cardAnswer');
  const cardEx      = document.getElementById('cardExample');
  const cardWhy     = document.getElementById('cardWhy');
  const fcCardNum   = document.getElementById('fcCardNum');
  const fcCardTotal = document.getElementById('fcCardTotal');
  const progBar     = document.getElementById('fcProgressBar');
  const resultBtns  = document.getElementById('fcResultBtns');
  const flipHint    = document.getElementById('fcFlipHint');

  if (subjectEl) subjectEl.textContent = cardData.subject;
  if (topicEl)   topicEl.textContent   = cardData.topic;
  if (diffEl)    {
    diffEl.textContent = cardData.difficulty;
    diffEl.className = 'fc-diff-badge fc-diff-' + cardData.difficulty.toLowerCase();
  }
  if (starBtn) { starBtn.textContent = isStarred ? '★ Starred' : '☆ Star'; starBtn.classList.toggle('starred', isStarred); }
  if (cardQ)   cardQ.textContent = cardData.q;
  if (cardA)   cardA.textContent = cardData.a;

  const exampleContainer = cardEx ? cardEx.closest('.fc-back-example') : null;
  if (cardData.example) {
    if (cardEx) cardEx.textContent = cardData.example;
    if (exampleContainer) exampleContainer.style.display = 'block';
  } else {
    if (exampleContainer) exampleContainer.style.display = 'none';
  }

  if (cardWhy) cardWhy.textContent = cardData.whyItMatters || '';

  const total      = filteredCards.length;
  const displayNum = idx + 1;
  if (fcCardNum)   fcCardNum.textContent   = displayNum;
  if (fcCardTotal) fcCardTotal.textContent = total;
  if (progBar)     progBar.style.width     = (displayNum / total * 100) + '%';
  if (resultBtns)  resultBtns.style.display = 'none';
  if (flipHint)    flipHint.style.display   = 'flex';

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
    if (flipHint)   flipHint.style.display   = 'none';
  }
}

function nextCard() {
  normalCardCount++;
  if (normalCardCount % 5 === 0 && missedCards.length > 0) {
    const missedIdx = missedCards.shift();
    const card = ALL_FLASHCARDS[missedIdx];
    if (card) { renderCard(card, currentCardIdx); return; }
  }
  currentCardIdx = (currentCardIdx + 1) % filteredCards.length;
  renderCard(filteredCards[currentCardIdx], currentCardIdx);
}

function prevCard() {
  currentCardIdx = (currentCardIdx - 1 + filteredCards.length) % filteredCards.length;
  renderCard(filteredCards[currentCardIdx], currentCardIdx);
}

function markKnewIt()   { sessionCorrect++; sessionsReviewed++; updateFCStats(); nextCard(); }

function markMissedIt() {
  sessionWrong++; sessionsReviewed++;
  const globalIdx = ALL_FLASHCARDS.indexOf(filteredCards[currentCardIdx]);
  if (globalIdx >= 0) missedCards.push(globalIdx);
  updateFCStats();
  nextCard();
}

function toggleStar() {
  const card = filteredCards[currentCardIdx];
  if (!card) return;
  const globalIdx = ALL_FLASHCARDS.indexOf(card);
  if (starredIndices.has(globalIdx)) starredIndices.delete(globalIdx);
  else starredIndices.add(globalIdx);
  renderCard(card, currentCardIdx);
}

function updateFCStats() {
  const corrEl  = document.getElementById('fcStatCorrect');
  const wrongEl = document.getElementById('fcStatWrong');
  const revEl   = document.getElementById('fcStatReviewed');
  const accEl   = document.getElementById('fcStatAccuracy');
  const starEl  = document.getElementById('fcStatStarred');
  if (corrEl)  corrEl.textContent  = sessionCorrect;
  if (wrongEl) wrongEl.textContent = sessionWrong;
  if (revEl)   revEl.textContent   = sessionsReviewed;
  if (accEl)   accEl.textContent   = sessionsReviewed > 0 ? Math.round((sessionCorrect / sessionsReviewed) * 100) + '%' : '—';
  if (starEl)  starEl.textContent  = starredIndices.size;
}

function setFilter(type, value) {
  currentFilter[type] = value;
  const btnGroup = type === 'subject' ? '.fc-subject-btn' : '.fc-diff-btn';
  document.querySelectorAll(btnGroup).forEach(b => b.classList.toggle('active', b.dataset.value === value));
  filteredCards  = getFilteredCards();
  currentCardIdx = 0;
  if (filteredCards.length > 0) {
    renderCard(filteredCards[0], 0);
  } else {
    const cardQ = document.getElementById('cardQuestion');
    if (cardQ) cardQ.textContent = 'No cards match this filter. Try a different combination.';
  }
  const totalEl = document.getElementById('fcFilterTotal');
  if (totalEl) totalEl.textContent = filteredCards.length + ' cards';
}

/* ============================================================
   PRACTICE QUIZ — 10 Questions (2 English, 3 Math, 3 Reading, 2 Science)
   Uses innerHTML so underlines and formatting render correctly.
   ============================================================ */
const QUIZ_QUESTIONS = [
  {
    section: 'English',
    passage: null,
    question: 'Which of the following is the BEST revision of the underlined portion?<br><br><span class="quiz-sentence">"The researchers, <u>whom conducted the study</u>, published their findings last week."</span>',
    options: ['whom conducted', 'who conducted', 'which conducted', 'that conducted'],
    correct: 1,
    explanation: 'Use "who" when the pronoun is the subject of a verb — here it subjects "conducted." Test: substitute he/she → "they conducted" → who. "Whom" is for objects. "Which/that" refer to non-human subjects.',
  },
  {
    section: 'English',
    passage: null,
    question: 'Which revision BEST corrects the error in the following sentence?<br><br><span class="quiz-sentence">"Maria finished her essay, <u>she submitted it online</u>."</span>',
    options: [
      'she submitted it online',
      'and then submitting it online',
      'and she submitted it online',
      'and submitting it online were both done',
    ],
    correct: 2,
    explanation: 'The original contains a comma splice — two independent clauses joined only by a comma. Adding the coordinating conjunction "and" (choice C) correctly joins them. Choice A leaves the splice. B and D create awkward or grammatically incorrect constructions.',
  },
  {
    section: 'Math',
    passage: null,
    question: 'If 3x + 7 = 22, what is the value of 6x + 5?',
    options: ['29', '33', '35', '37'],
    correct: 2,
    explanation: 'Solve: 3x = 15, so x = 5. Then 6x + 5 = 30 + 5 = 35. Shortcut: 6x + 5 = 2(3x) + 5 = 2(15) + 5 = 35 — no need to find x explicitly.',
  },
  {
    section: 'Math',
    passage: null,
    question: 'A rectangle has a length of 12 and a width of 5. What is the length of its diagonal?',
    options: ['11', '13', '15', '17'],
    correct: 1,
    explanation: 'The diagonal of a rectangle is the hypotenuse of a right triangle with legs 12 and 5. Pythagorean theorem: 12² + 5² = 144 + 25 = 169. √169 = 13. The 5-12-13 is a Pythagorean triple worth memorizing.',
  },
  {
    section: 'Math',
    passage: null,
    question: 'A car travels 240 miles in 4 hours. At the same rate, how many miles will it travel in 7 hours?',
    options: ['360', '400', '420', '480'],
    correct: 2,
    explanation: 'Rate = 240 ÷ 4 = 60 mph. Distance in 7 hours = 60 × 7 = 420 miles. Always find the rate first in distance problems, then multiply by the new time value.',
  },
  {
    section: 'Reading',
    passage: 'The Amazon rainforest produces roughly 20% of the world\'s oxygen and is home to an estimated 10% of all species on Earth. Despite its importance, deforestation continues at an alarming rate, with scientists warning that the forest could reach a "tipping point" within decades if current trends continue.',
    question: 'Based on the passage, which conclusion is best supported?',
    options: [
      'Global oxygen production would increase if deforestation stopped.',
      'The Amazon\'s current trajectory could lead to irreversible ecological changes.',
      'Scientists have already identified the specific year a tipping point will occur.',
      'The Amazon houses the majority of all species on Earth.',
    ],
    correct: 1,
    explanation: 'The passage states scientists warn of a "tipping point" — closest to irreversible change. Choice A is not stated. Choice C is too specific (no year is given). Choice D contradicts "10%" (not a majority).',
  },
  {
    section: 'Reading',
    passage: 'Dr. Elena Vasquez spent fifteen years studying migratory patterns of monarch butterflies. Her research challenged the prevailing belief that monarchs navigated primarily by magnetic field. Instead, her data suggested that solar angle played a far more significant role — a finding that overturned decades of accepted science.',
    question: 'The primary purpose of this passage is to:',
    options: [
      'Criticize researchers who relied on outdated methods.',
      'Describe a scientist whose findings challenged an established theory.',
      'Explain how magnetic fields affect butterfly migration.',
      'Argue that solar navigation is superior to magnetic navigation.',
    ],
    correct: 1,
    explanation: 'The passage describes Dr. Vasquez\'s research and its impact — specifically that her findings challenged a prevailing belief. Choice A is wrong (no criticism of others). Choice C is wrong (the passage says magnetic fields are NOT the primary factor). Choice D is too strong — the passage doesn\'t argue superiority.',
  },
  {
    section: 'Reading',
    passage: 'For centuries, scholars assumed that Homer\'s Iliad and Odyssey were purely fictional. The discovery of Troy\'s ruins in 1868 by Heinrich Schliemann upended that assumption. Schliemann\'s excavations revealed multiple layers of ancient cities at the site now called Hisarlik, Turkey, suggesting that the legendary Troy may have had a real historical counterpart.',
    question: 'According to the passage, what effect did Schliemann\'s discovery have?',
    options: [
      'It proved definitively that all events in Homer\'s epics occurred exactly as written.',
      'It suggested that the legendary city of Troy may have been based on a real place.',
      'It revealed that Homer was a real historical figure who lived in Turkey.',
      'It confirmed that the Trojan War was fought exactly as Homer described.',
    ],
    correct: 1,
    explanation: 'The passage says the ruins suggested Troy "may have had a real historical counterpart" — matching choice B. Choices A, C, and D all go beyond what the passage states. The passage explicitly says "may have," not "definitively proved."',
  },
  {
    section: 'Science',
    passage: 'Researchers measured plant growth under three light conditions over 30 days: full sun (8 hrs/day), partial shade (4 hrs/day), and full shade (0 hrs/day). Average final heights were 42 cm, 28 cm, and 11 cm respectively.',
    question: 'According to the data, which conclusion is best supported?',
    options: [
      'Plants cannot survive without sunlight.',
      'Greater daily sunlight exposure is associated with greater plant height in this experiment.',
      'Partial shade produces the healthiest plants overall.',
      'Full sun plants grew exactly four times taller than full shade plants.',
    ],
    correct: 1,
    explanation: 'The data shows: more sunlight = greater height (42 > 28 > 11 cm). Choice A is wrong — full shade plants grew 11 cm, not zero. Choice C is unsupported. Choice D is wrong: 42/11 ≈ 3.8, not 4.',
  },
  {
    section: 'Science',
    passage: 'A researcher tested whether caffeine affects reaction time. She divided 30 students into three groups: Group 1 received no caffeine, Group 2 received 100 mg, and Group 3 received 200 mg. All students completed the same reaction time task in the same room on the same day. Group 1 averaged 380 ms, Group 2 averaged 310 ms, and Group 3 averaged 270 ms.',
    question: 'Which of the following was the INDEPENDENT variable in this experiment?',
    options: [
      'The students\' reaction times',
      'The amount of caffeine given to each group',
      'The room where the experiment took place',
      'The number of students in each group',
    ],
    correct: 1,
    explanation: 'The independent variable is the factor deliberately changed by the researcher. Here, that is the amount of caffeine (0 mg, 100 mg, 200 mg). Reaction time (A) is the dependent variable — what was measured. The room (C) and group size (D) are constants.',
  },
];

let quizCurrentQ     = 0;
let quizAnswers      = new Array(QUIZ_QUESTIONS.length).fill(null);
let quizCorrectCount = 0;
let quizWrongCount   = 0;

function renderQuizQuestion(idx) {
  const q = QUIZ_QUESTIONS[idx];
  if (!q) return;
  const qContainer = document.getElementById('quizQuestion');
  const resultsEl  = document.getElementById('quizResults');
  if (qContainer) qContainer.style.display = 'block';
  if (resultsEl)  resultsEl.classList.remove('show');

  const qNum      = document.getElementById('qNum');
  const qSection  = document.getElementById('qSection');
  const qProgress = document.getElementById('qProgressText');
  if (qNum)      qNum.textContent      = idx + 1;
  if (qSection)  qSection.textContent  = q.section;
  if (qProgress) qProgress.textContent = `Question ${idx + 1} of ${QUIZ_QUESTIONS.length}`;

  // Use innerHTML so underlines and formatting render correctly
  const passageEl = document.getElementById('qPassage');
  if (passageEl) {
    if (q.passage) {
      passageEl.textContent = q.passage;
      passageEl.style.display = 'block';
    } else {
      passageEl.style.display = 'none';
    }
  }

  const qText = document.getElementById('qText');
  if (qText) qText.innerHTML = q.question; // innerHTML for underlines

  const optList = document.getElementById('qOptions');
  if (optList) {
    optList.innerHTML = '';
    q.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'quiz-option';
      div.innerHTML = `<div class="quiz-option-letter">${String.fromCharCode(65+i)}</div><div class="quiz-option-text">${opt}</div>`;
      div.addEventListener('click', () => selectAnswer(idx, i));
      optList.appendChild(div);
    });
  }

  const explEl = document.getElementById('qExplanation');
  if (explEl) explEl.classList.remove('show');

  const nextBtn = document.getElementById('quizNextBtn');
  if (nextBtn) nextBtn.textContent = idx === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next Question';

  const cEl = document.getElementById('quizCorrectCount');
  const wEl = document.getElementById('quizWrongCount');
  if (cEl) cEl.textContent = quizCorrectCount;
  if (wEl) wEl.textContent = quizWrongCount;

  if (quizAnswers[idx] !== null) showAnswerResult(idx, quizAnswers[idx]);
}

function selectAnswer(qIdx, ansIdx) {
  if (quizAnswers[qIdx] !== null) return;
  quizAnswers[qIdx] = ansIdx;
  if (ansIdx === QUIZ_QUESTIONS[qIdx].correct) quizCorrectCount++;
  else quizWrongCount++;
  showAnswerResult(qIdx, ansIdx);
}

function showAnswerResult(qIdx, selectedIdx) {
  const q       = QUIZ_QUESTIONS[qIdx];
  const optList = document.getElementById('qOptions');
  if (!optList) return;
  optList.querySelectorAll('.quiz-option').forEach((opt, i) => {
    if (i === q.correct) opt.classList.add('correct');
    else if (i === selectedIdx && selectedIdx !== q.correct) opt.classList.add('wrong');
    opt.style.pointerEvents = 'none';
  });
  const explEl   = document.getElementById('qExplanation');
  const explText = document.getElementById('qExplanationText');
  if (explEl)   explEl.classList.add('show');
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
  if (resultsEl)  resultsEl.classList.add('show');

  const pct      = Math.round((quizCorrectCount / QUIZ_QUESTIONS.length) * 100);
  const scoreEl  = document.getElementById('quizFinalScore');
  const msgEl    = document.getElementById('quizFinalMsg');
  const detailEl = document.getElementById('quizFinalDetail');
  if (scoreEl) scoreEl.textContent = pct + '%';

  const messages = [
    [80, 'Excellent work.',    `You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. Strong performance — keep it up.`],
    [60, 'Good progress.',     `You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. Review the explanations and try again.`],
    [0,  'Keep practicing.',   `You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. This is exactly what 1-on-1 sessions are for.`],
  ];
  for (const [threshold, msg, detail] of messages) {
    if (pct >= threshold) {
      if (msgEl)    msgEl.textContent    = msg;
      if (detailEl) detailEl.textContent = detail;
      break;
    }
  }
}

function restartQuiz() {
  quizCurrentQ     = 0;
  quizAnswers      = new Array(QUIZ_QUESTIONS.length).fill(null);
  quizCorrectCount = 0;
  quizWrongCount   = 0;
  renderQuizQuestion(0);
  const resultsEl  = document.getElementById('quizResults');
  const qContainer = document.getElementById('quizQuestion');
  if (resultsEl)  resultsEl.classList.remove('show');
  if (qContainer) qContainer.style.display = 'block';
}

/* ============================================================
   POMODORO TIMER
   ============================================================ */
let pomoInterval  = null;
let pomoRunning   = false;
let pomoTotal     = 1500;
let pomoRemaining = 1500;
let pomoSessions  = 0;
const POMO_CIRCUMFERENCE = 2 * Math.PI * 88;

function setPomoMode(btn, duration, label) {
  document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  pomoTotal = duration; pomoRemaining = duration; pomoRunning = false;
  clearInterval(pomoInterval);
  const startBtn  = document.getElementById('pomoStartBtn');
  const modeLabel = document.getElementById('pomoModeLabel');
  if (startBtn)  startBtn.textContent  = 'Start';
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
        const modeLabel  = document.getElementById('pomoModeLabel');
        const sessionEl  = document.getElementById('pomoSession');
        const isBreak    = modeLabel && modeLabel.textContent.includes('Break');
        if (!isBreak) {
          pomoSessions++;
          if (sessionEl) sessionEl.textContent = `Session ${pomoSessions} complete. Take a break.`;
        } else {
          if (sessionEl) sessionEl.textContent = `Break over. Session ${pomoSessions + 1} of 4.`;
        }
      }
    }, 1000);
  }
}

function resetPomo() {
  clearInterval(pomoInterval);
  pomoRunning = false; pomoRemaining = pomoTotal;
  const btn       = document.getElementById('pomoStartBtn');
  const sessionEl = document.getElementById('pomoSession');
  if (btn)       btn.textContent       = 'Start';
  if (sessionEl) sessionEl.textContent = `Session ${pomoSessions + 1} of 4 — complete 4 to earn a long break`;
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const min       = Math.floor(pomoRemaining / 60).toString().padStart(2, '0');
  const sec       = (pomoRemaining % 60).toString().padStart(2, '0');
  const displayEl = document.getElementById('pomoDisplay');
  const ring      = document.getElementById('pomoRingFill');
  if (displayEl) displayEl.textContent = `${min}:${sec}`;
  if (ring) {
    const progress = pomoRemaining / pomoTotal;
    ring.style.strokeDashoffset = POMO_CIRCUMFERENCE * (1 - progress);
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initToolNav();

  ['estEngInput','estMathInput','estReadInput','estSciInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateEstimator);
  });

  ['eng','math','read','sci'].forEach(s => {
    const el = document.getElementById(s + 'Slider');
    if (el) el.addEventListener('input', updateTracker);
  });
  updateTracker();

  filteredCards = getFilteredCards();
  renderCard(filteredCards[0], 0);

  const fcEl = document.getElementById('flashcard');
  if (fcEl) fcEl.addEventListener('click', flipCard);

  document.querySelectorAll('.fc-subject-btn').forEach(btn =>
    btn.addEventListener('click', () => setFilter('subject', btn.dataset.value)));
  document.querySelectorAll('.fc-diff-btn').forEach(btn =>
    btn.addEventListener('click', () => setFilter('difficulty', btn.dataset.value)));

  const prevBtn = document.getElementById('fcPrev');
  const nextBtn = document.getElementById('fcNext');
  const knewBtn = document.getElementById('fcKnewIt');
  const missBtn = document.getElementById('fcMissedIt');
  const starBtn = document.getElementById('fcStarBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevCard);
  if (nextBtn) nextBtn.addEventListener('click', nextCard);
  if (knewBtn) knewBtn.addEventListener('click', markKnewIt);
  if (missBtn) missBtn.addEventListener('click', markMissedIt);
  if (starBtn) starBtn.addEventListener('click', toggleStar);

  const totalEl = document.getElementById('fcFilterTotal');
  if (totalEl) totalEl.textContent = filteredCards.length + ' cards';

  renderQuizQuestion(0);
  const quizNextBtn = document.getElementById('quizNextBtn');
  const quizRestart = document.getElementById('quizRestart');
  if (quizNextBtn) quizNextBtn.addEventListener('click', nextQuizQuestion);
  if (quizRestart) quizRestart.addEventListener('click', restartQuiz);

  // Init pomodoro display so ring and time are correct on load
  updatePomoDisplay();
});
