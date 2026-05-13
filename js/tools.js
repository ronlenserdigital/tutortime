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
  // URL param support: ?tool=flashcards
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tool');
  if (t) {
    const btn = document.querySelector(`.tool-nav-btn[data-tool="${t}"]`);
    if (btn) btn.click();
  }
}

/* ============================================================
   SCORE ESTIMATOR
   Updated counts: English=50, Math=45, Reading=36, Science=40
   ============================================================ */
const ACT_TIERS = [
  { min: 35, label: '🏆 Elite — Ivy League & Top 10',      color: '#7C5CFC' },
  { min: 33, label: '⭐ Excellent — Top 25 Universities',  color: '#38B6FF' },
  { min: 30, label: '✅ Strong — Most State Flagships',    color: '#00C48C' },
  { min: 27, label: '📈 Above Average — Good Options',    color: '#FFB347' },
  { min: 24, label: '📊 Average — Still Competitive',     color: '#FF7F50' },
  { min:  0, label: '📚 Room to Grow — Let\'s fix this',  color: '#FF5E7E' },
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
    const raw = input.value;
    const scaled = rawToScaled(raw, max);
    const rawInt = parseInt(raw);
    if (scaled !== null && !isNaN(rawInt)) {
      const pct = Math.min((rawInt / max) * 100, 100);
      if (bar) bar.style.width = pct + '%';
      if (valEl) { valEl.textContent = scaled; valEl.style.color = 'var(--c-purple)'; }
      if (bdVal) bdVal.textContent = scaled;
      scores.push(scaled);
    } else {
      if (bar) bar.style.width = '0%';
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
      tierEl.style.background = tier.color + '18';
    }
    if (hintEl) hintEl.textContent = composite >= 30
      ? 'Strong score — let\'s push it even higher with a session.'
      : `${30 - composite} point${30 - composite === 1 ? '' : 's'} away from 30. Book a session.`;
  } else {
    if (compEl) compEl.textContent = '—';
    if (tierEl) { tierEl.textContent = 'Enter all 4 sections above'; tierEl.style.color = ''; tierEl.style.borderColor = ''; tierEl.style.background = ''; }
    if (hintEl) hintEl.textContent = 'This is an approximation — not an official ACT score report.';
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
   FLASHCARD DATA — 80 Real ACT Study Cards
   ============================================================ */
const ALL_FLASHCARDS = [

  /* ---- ENGLISH: 25 cards ---- */

  { subject:'English', topic:'Subject-Verb Agreement', difficulty:'Easy',
    q:'A singular subject requires what form of the verb?',
    a:'A singular subject requires a singular verb. The verb must agree in number with its subject, not with nearby nouns or phrases.',
    example:'"The box of chocolates IS on the table." (Subject = box, not chocolates)',
    whyItMatters:'Subject-verb agreement errors are among the highest-frequency mistakes on ACT English.' },

  { subject:'English', topic:'Comma Splice', difficulty:'Medium',
    q:'What is a comma splice and how do you fix one?',
    a:'A comma splice is two independent clauses joined only by a comma. Fix it with: (1) a period, (2) a semicolon, (3) a comma + coordinating conjunction (FANBOYS: for, and, nor, but, or, yet, so).',
    example:'"She studied hard, she passed." → Fix: "She studied hard; she passed." or "She studied hard, so she passed."',
    whyItMatters:'Comma splices are one of the most commonly tested punctuation errors on ACT English.' },

  { subject:'English', topic:'Semicolon Rule', difficulty:'Medium',
    q:'When is it correct to use a semicolon?',
    a:'Use a semicolon to join two complete, independent clauses without a coordinating conjunction. Never use a semicolon before a dependent clause or a list item.',
    example:'"He finished the exam; he felt confident." Both sides are complete sentences.',
    whyItMatters:'The ACT offers semicolons as traps — if one side is incomplete, the semicolon is wrong.' },

  { subject:'English', topic:'Independent vs. Dependent Clause', difficulty:'Easy',
    q:'What distinguishes an independent clause from a dependent clause?',
    a:'An independent clause is a complete sentence — it has a subject and verb and stands alone. A dependent clause begins with a subordinating conjunction (because, although, since, when, if) and cannot stand alone.',
    example:'"Because she practiced daily" is dependent. "She improved" is independent.',
    whyItMatters:'Clause identification is the foundation of almost every punctuation question on ACT English.' },

  { subject:'English', topic:'Apostrophe — Possessives', difficulty:'Easy',
    q:'How do you form the possessive of a singular noun?',
    a:"Add 's to a singular noun to show possession — even if the word ends in s. Apostrophes do NOT create plurals.",
    example:'"The student\'s essay was excellent." / "James\'s book was missing."',
    whyItMatters:"Students constantly confuse possessives with plurals — this mistake appears on every ACT English section." },

  { subject:'English', topic:'Its vs. It\'s', difficulty:'Easy',
    q:'When do you use "its" versus "it\'s"?',
    a:'"It\'s" is ALWAYS a contraction of "it is" or "it has." "Its" is the possessive pronoun showing ownership. Pronouns do not use apostrophes for possession.',
    example:'"It\'s raining today." (= It is raining) / "The dog wagged its tail." (possession)',
    whyItMatters:'This is one of the most common ACT traps — the apostrophe does NOT mark possession in pronouns.' },

  { subject:'English', topic:'Who vs. Whom', difficulty:'Medium',
    q:'When do you use "who" versus "whom"?',
    a:'Use "who" when it is the subject of a verb. Use "whom" when it is the object. Quick test: substitute "he/she" → use who; substitute "him/her" → use whom.',
    example:'"Who called?" (He called → who) / "To whom did you send it?" (You sent it to him → whom)',
    whyItMatters:'Who/whom questions appear directly on the ACT — the substitution trick solves them instantly.' },

  { subject:'English', topic:'Affect vs. Effect', difficulty:'Easy',
    q:'What is the difference between "affect" and "effect"?',
    a:'"Affect" is almost always a verb meaning to influence or have an impact on. "Effect" is almost always a noun meaning a result or outcome.',
    example:'"The cold weather affected her score." (verb) / "The effect of practice was dramatic." (noun)',
    whyItMatters:'Affect/effect is a classic ACT vocabulary-in-grammar trap tested in context.' },

  { subject:'English', topic:'There / Their / They\'re', difficulty:'Easy',
    q:'When do you use "there," "their," and "they\'re"?',
    a:'"There" indicates a place or introduces a clause. "Their" is the possessive form of "they." "They\'re" is a contraction of "they are." When in doubt, expand the contraction and see if the sentence still works.',
    example:'"They\'re going to their favorite restaurant over there."',
    whyItMatters:'These are easy points if you know the rules — but careless students lose them every time.' },

  { subject:'English', topic:'Misplaced Modifier', difficulty:'Medium',
    q:'What is a misplaced modifier and what does the ACT require?',
    a:'A misplaced modifier is a descriptive phrase placed too far from the word it actually modifies, creating confusion or absurdity. The ACT requires modifying phrases to immediately precede the noun they describe.',
    example:'Incorrect: "Running down the street, the bus nearly hit Marcus." (Was the bus running?) / Correct: "Running down the street, Marcus nearly got hit by the bus."',
    whyItMatters:'Misplaced modifiers are a high-frequency ACT error tested in full-sentence revision questions.' },

  { subject:'English', topic:'Parallel Structure', difficulty:'Medium',
    q:'What is parallel structure and when does the ACT test it?',
    a:'Parallel structure means all items in a list, comparison, or paired construction must use the same grammatical form — all nouns, all infinitives, all gerunds, etc.',
    example:'Incorrect: "She likes swimming, to run, and hiking." / Correct: "She likes swimming, running, and hiking."',
    whyItMatters:'Parallel structure errors appear in almost every ACT English section, especially with lists and comparisons.' },

  { subject:'English', topic:'Redundancy and Concision', difficulty:'Easy',
    q:'What does "redundancy" mean on the ACT, and how do you spot it?',
    a:'Redundancy means saying the same thing twice using different words. The ACT rewards the most concise answer that fully preserves the meaning. When two answer choices are grammatically correct, pick the shorter one.',
    example:'"The reason why he failed was because he didn\'t study." → "He failed because he didn\'t study."',
    whyItMatters:'The ACT is obsessed with concision — redundant phrasing is always wrong even if grammatically harmless.' },

  { subject:'English', topic:'Transition Words', difficulty:'Medium',
    q:'How do you choose the correct transition word on ACT English?',
    a:'Identify the logical relationship between the two ideas: contrast (however, although, but), addition (furthermore, also), cause/effect (therefore, thus, as a result), or example (for instance, specifically). The grammar is usually fine — the meaning is what matters.',
    example:'"She was exhausted. ______, she kept studying." → "Nevertheless" (contrast/concession)',
    whyItMatters:'Transition questions test logical reasoning, not grammar — pick the word that matches the actual relationship.' },

  { subject:'English', topic:'Nonessential Clause Punctuation', difficulty:'Medium',
    q:'How do you correctly punctuate a nonessential (nonrestrictive) clause?',
    a:'Enclose a nonessential clause in matching punctuation on both sides: two commas, two dashes, or two parentheses. A nonessential clause adds extra information but can be removed without changing the core meaning.',
    example:'"Mr. Davis, who has taught here for ten years, is retiring." Remove the clause: "Mr. Davis is retiring" — still complete.',
    whyItMatters:'Comma pairs around nonessential clauses are tested repeatedly — missing one comma is always wrong.' },

  { subject:'English', topic:'Colon Rules', difficulty:'Medium',
    q:'When is it correct to use a colon?',
    a:'Use a colon after a complete independent clause to introduce a list, an explanation, a quotation, or an elaboration. Never place a colon directly after a verb or preposition.',
    example:'Correct: "She needed three things: a pencil, a calculator, and patience." / Incorrect: "She needed: a pencil and a calculator."',
    whyItMatters:'The ACT tests colon misuse — the rule is simple but students who don\'t know it guess wrong every time.' },

  { subject:'English', topic:'Dash Rules', difficulty:'Medium',
    q:'How is an em dash (—) used correctly?',
    a:'A single dash introduces a summary, contrast, or elaboration after an independent clause. A pair of dashes sets off nonessential information for emphasis, exactly like commas. If you open with a dash, you must close with one.',
    example:'"The answer — surprisingly — was much simpler than expected." / "He finally admitted it — he had known all along."',
    whyItMatters:'Dash questions appear regularly; knowing dash = emphasis/pause prevents confusion with commas.' },

  { subject:'English', topic:'Verb Tense Consistency', difficulty:'Medium',
    q:'What is verb tense consistency and why does the ACT test it?',
    a:'All verbs in a passage should maintain the same time frame (past, present, future) unless there is a specific logical reason to shift. Unnecessary tense shifts are errors.',
    example:'Incorrect: "She walked into the room and sits down." / Correct: "She walked into the room and sat down."',
    whyItMatters:'Tense shift errors appear in paragraph-level editing questions and are easy to miss when reading quickly.' },

  { subject:'English', topic:'Active vs. Passive Voice', difficulty:'Medium',
    q:'What is the difference between active and passive voice, and which does the ACT prefer?',
    a:'Active voice: subject performs the action. Passive voice: subject receives the action. The ACT prefers active voice because it is more direct and concise. When answer choices include both, active is almost always correct.',
    example:'Active: "The coach explained the drill." / Passive: "The drill was explained by the coach."',
    whyItMatters:'Passive voice is a common wrong answer in concision questions — active is direct and preferred.' },

  { subject:'English', topic:'Vague Pronoun Reference', difficulty:'Medium',
    q:'What is a vague pronoun reference and how do you fix it?',
    a:'A vague pronoun has no clear antecedent — the reader cannot tell which noun it refers to. Fix it by replacing the pronoun with the specific noun or restructuring the sentence.',
    example:'Vague: "When Maya called her sister, she was nervous." (Who was nervous?) / Clear: "When Maya called her sister, Maya was nervous."',
    whyItMatters:'Clarity is a core ACT English priority — vague pronoun references appear frequently in revision questions.' },

  { subject:'English', topic:'Comparison Errors', difficulty:'Medium',
    q:'What is a comparison error in ACT English?',
    a:'A comparison error occurs when two things being compared are not logically equivalent. You must compare nouns to nouns of the same type. Use "those of" or "that of" to make comparisons parallel.',
    example:'Incorrect: "Her essay was better than the other students." (comparing essay to students) / Correct: "Her essay was better than those of the other students."',
    whyItMatters:'Illogical comparisons are a consistent ACT trap that many students miss because the sentence "sounds fine."' },

  { subject:'English', topic:'Pronoun Case', difficulty:'Medium',
    q:'What is the rule for subject vs. object pronoun forms?',
    a:'Use subject pronouns (I, he, she, we, they) as subjects of verbs. Use object pronouns (me, him, her, us, them) as objects of verbs or prepositions. When in doubt, remove the other person and read the sentence alone.',
    example:'"Between you and I" is wrong → "Between you and me" (object of preposition "between"). / "Him and I went" is wrong → "He and I went."',
    whyItMatters:'Pronoun case errors — especially "between you and I" — are among the most tested grammar mistakes on the ACT.' },

  { subject:'English', topic:'Comma Rules — Lists', difficulty:'Easy',
    q:'What is the rule for commas in a list of three or more items?',
    a:'Use a comma between every item in a series, including a comma before the final conjunction (the Oxford comma). Every item needs a separator — the last comma before "and" or "or" is required on the ACT.',
    example:'"She studied English, math, and science." All three commas (including before "and") are correct.',
    whyItMatters:'List comma rules are tested consistently and are easy points once you internalize the pattern.' },

  { subject:'English', topic:'Rhetorical Purpose — Add/Delete', difficulty:'Hard',
    q:'How do you decide whether to add, keep, or delete a sentence on ACT English?',
    a:'Always identify the paragraph\'s main purpose first. A sentence should stay only if it directly supports that purpose. Delete it if it is off-topic, a digression, or redundant. The question often tells you the goal — match your answer to it.',
    example:'A paragraph about study habits: a sentence about the cafeteria menu → delete it (irrelevant).',
    whyItMatters:'Add/delete questions test big-picture reading comprehension — they\'re often worth more than grammar questions.' },

  { subject:'English', topic:'Sentence Placement', difficulty:'Hard',
    q:'How do you determine where a sentence belongs in a paragraph?',
    a:'Read the sentences around each proposed position. Look for: (1) pronoun references (which noun does "it" or "they" refer to?), (2) transition words (does the sentence contrast or add?), (3) logical progression of ideas. The sentence should flow naturally into and out of its location.',
    whyItMatters:'Sentence order questions require reading the paragraph as a whole — rushing causes errors on these.' },

  { subject:'English', topic:'Tone and Style Consistency', difficulty:'Hard',
    q:'How does tone affect correct answer choices on ACT English?',
    a:'The ACT requires consistent tone within a passage. If the passage is formal, choose formal phrasing. If casual, keep it casual. Answer choices that change the register (formality level) are almost always wrong, even if grammatically correct.',
    example:'In a formal scientific passage, "The results were super weird" is wrong even though it\'s grammatical — "anomalous" fits the tone.',
    whyItMatters:'Tone questions test stylistic judgment alongside grammar — students who only check grammar miss these.' },

  /* ---- MATH: 30 cards ---- */

  { subject:'Math', topic:'Slope Formula', difficulty:'Easy',
    q:'What is the slope formula?',
    a:'m = (y₂ − y₁) / (x₂ − x₁) — "rise over run." It measures how much y changes for every one unit change in x. Positive slope goes up left-to-right; negative slope goes down.',
    example:'Points (2, 3) and (6, 11): m = (11−3)/(6−2) = 8/4 = 2',
    whyItMatters:'Slope appears in linear equations, parallel/perpendicular lines, and rate-of-change word problems.' },

  { subject:'Math', topic:'Slope-Intercept Form', difficulty:'Easy',
    q:'What is slope-intercept form and what do m and b represent?',
    a:'y = mx + b. m is the slope (steepness and direction). b is the y-intercept (where the line crosses the y-axis, when x = 0).',
    example:'y = 3x + 7 → slope = 3, y-intercept = 7 → the line crosses (0, 7) and rises 3 units for every 1 right.',
    whyItMatters:'Slope-intercept is the single most-used linear equation form on ACT Math.' },

  { subject:'Math', topic:'Point-Slope Form', difficulty:'Medium',
    q:'What is point-slope form and when do you use it?',
    a:'y − y₁ = m(x − x₁). Use it when you know the slope and one point on the line. Then convert to slope-intercept if needed.',
    example:'Slope = 4, passes through (2, 5): y − 5 = 4(x − 2) → y = 4x − 3',
    whyItMatters:'Point-slope form is the fastest setup when the ACT gives you a slope and a point.' },

  { subject:'Math', topic:'Systems of Equations — Substitution', difficulty:'Medium',
    q:'How do you solve a system of equations using substitution?',
    a:'Solve one equation for one variable, substitute that expression into the other equation, solve for the remaining variable, then back-substitute to find both values.',
    example:'x + y = 10 and x − y = 4 → x = 10 − y → (10−y) − y = 4 → y = 3, x = 7',
    whyItMatters:'Systems of equations appear multiple times per ACT — substitution and elimination are both needed.' },

  { subject:'Math', topic:'Factoring Quadratics', difficulty:'Medium',
    q:'How do you factor a quadratic of the form x² + bx + c?',
    a:'Find two numbers that multiply to c AND add to b. Write the factored form as (x + p)(x + q). If the leading coefficient is not 1, factor out or use the AC method.',
    example:'x² + 5x + 6 → Find: 2 × 3 = 6, 2 + 3 = 5 → (x + 2)(x + 3)',
    whyItMatters:'Factoring is used to solve quadratics, find zeros of functions, and simplify rational expressions.' },

  { subject:'Math', topic:'FOIL — Multiplying Binomials', difficulty:'Easy',
    q:'What does FOIL stand for, and how do you use it?',
    a:'FOIL = First, Outer, Inner, Last. Multiply each pair of terms in order and combine like terms.',
    example:'(x + 3)(x + 4) = x·x + x·4 + 3·x + 3·4 = x² + 4x + 3x + 12 = x² + 7x + 12',
    whyItMatters:'FOIL is used to expand expressions and in reverse for factoring — tested throughout ACT Math.' },

  { subject:'Math', topic:'Exponent Rules', difficulty:'Medium',
    q:'What are the five key exponent rules?',
    a:'1. aᵐ × aⁿ = aᵐ⁺ⁿ (same base, multiply → add exponents)\n2. aᵐ ÷ aⁿ = aᵐ⁻ⁿ (same base, divide → subtract)\n3. (aᵐ)ⁿ = aᵐⁿ (power to power → multiply)\n4. a⁰ = 1\n5. a⁻ⁿ = 1/aⁿ (negative exponent → flip to denominator)',
    example:'x³ × x⁵ = x⁸ / x⁶ ÷ x² = x⁴ / (x²)³ = x⁶ / 5⁰ = 1 / x⁻² = 1/x²',
    whyItMatters:'Exponent rules are tested directly and in algebraic simplification — all five rules appear on the ACT.' },

  { subject:'Math', topic:'Quadratic Formula', difficulty:'Medium',
    q:'What is the quadratic formula and when do you use it?',
    a:'x = (−b ± √(b² − 4ac)) / 2a. Use it to solve ax² + bx + c = 0 when the quadratic does not factor easily. The expression under the radical (b² − 4ac) is called the discriminant.',
    example:'x² + 2x − 8 = 0 → a=1, b=2, c=−8 → x = (−2 ± √(4+32))/2 = (−2 ± 6)/2 → x=2 or x=−4',
    whyItMatters:'When factoring fails, the quadratic formula always works — it\'s a guaranteed backup method.' },

  { subject:'Math', topic:'Percentages', difficulty:'Easy',
    q:'How do you find X% of a number? How do you find what percent A is of B?',
    a:'X% of N = (X/100) × N. What percent is A of B? = (A ÷ B) × 100. Percent increase/decrease = (change ÷ original) × 100.',
    example:'35% of 80 = 0.35 × 80 = 28. / What % is 15 of 60? = (15/60) × 100 = 25%.',
    whyItMatters:'Percentage problems appear in word problems, statistics, and data interpretation on every ACT.' },

  { subject:'Math', topic:'Ratios and Proportions', difficulty:'Easy',
    q:'How do you set up and solve a proportion?',
    a:'Set two equal ratios: a/b = c/d → cross-multiply: ad = bc. Make sure units are consistent on each side.',
    example:'If 3 books cost $12, how much do 7 cost? 3/12 = 7/x → 3x = 84 → x = $28',
    whyItMatters:'Proportions solve real-world ratio and scaling problems that appear consistently in ACT word problems.' },

  { subject:'Math', topic:'Mean (Average)', difficulty:'Easy',
    q:'What is the formula for mean, and what is the most useful rearrangement?',
    a:'Mean = Sum ÷ Count. Rearranged: Sum = Mean × Count. This rearrangement is far more useful on the ACT — use it to find a missing value when the average is given.',
    example:'Average of 5 tests = 82. Sum = 82 × 5 = 410. If four scores total 328, the fifth = 82.',
    whyItMatters:'ACT problems give the average and ask for a missing score — the sum formula is the key shortcut.' },

  { subject:'Math', topic:'Probability', difficulty:'Medium',
    q:'What is the basic probability formula?',
    a:'P(event) = (favorable outcomes) / (total possible outcomes). For independent events: P(A and B) = P(A) × P(B). For mutually exclusive: P(A or B) = P(A) + P(B).',
    example:'Bag: 3 red, 7 blue. P(red) = 3/10. Two draws with replacement: P(red, red) = (3/10)²= 9/100.',
    whyItMatters:'Probability appears in data and word problem sections — the ACT tests both single and compound events.' },

  { subject:'Math', topic:'Median and Mode', difficulty:'Easy',
    q:'What are median and mode, and how do you find each?',
    a:'Median: arrange all values in order; the median is the middle value (or average of two middle values for even-count sets). Mode: the value that appears most frequently — a set can have one mode, multiple modes, or none.',
    example:'Set: {2, 4, 4, 7, 9} → Median = 4 (middle), Mode = 4 (appears twice).',
    whyItMatters:'Mean/median/mode questions appear in statistics problems — confusing them is an easy mistake to make.' },

  { subject:'Math', topic:'Area Formulas', difficulty:'Easy',
    q:'What are the area formulas for the five common shapes?',
    a:'Rectangle: A = lw / Triangle: A = ½bh / Circle: A = πr² / Trapezoid: A = ½(b₁+b₂)h / Parallelogram: A = bh. None of these are given to you on the ACT — memorize them all.',
    example:'Triangle with base 10 and height 6: A = ½ × 10 × 6 = 30 square units.',
    whyItMatters:'Area formulas are used directly and embedded in multi-step geometry word problems.' },

  { subject:'Math', topic:'Volume Formulas', difficulty:'Medium',
    q:'What are the volume formulas for common 3D shapes?',
    a:'Rectangular prism: V = lwh / Cylinder: V = πr²h / Sphere: V = (4/3)πr³ / Cone: V = (1/3)πr²h / Pyramid: V = (1/3)Bh (B = base area).',
    example:'Cylinder r=3, h=10: V = π(9)(10) = 90π ≈ 282.7 cubic units.',
    whyItMatters:'Volume appears in geometry word problems — these formulas are not provided on the ACT.' },

  { subject:'Math', topic:'Pythagorean Theorem', difficulty:'Easy',
    q:'What is the Pythagorean theorem, and how do you identify when to use it?',
    a:'a² + b² = c², where c is the hypotenuse (side opposite the right angle). Use it any time you have a right triangle and need to find a missing side.',
    example:'Legs 6 and 8: c² = 36 + 64 = 100 → c = 10. (A 3-4-5 scaled by 2.)',
    whyItMatters:'The Pythagorean theorem appears in geometry, distance, and trigonometry problems throughout ACT Math.' },

  { subject:'Math', topic:'Special Right Triangles', difficulty:'Medium',
    q:'What are the two special right triangles and their side ratios?',
    a:'45-45-90: sides in ratio 1 : 1 : √2 (legs equal, hypotenuse = leg × √2) / 30-60-90: sides in ratio 1 : √3 : 2 (shortest : medium : hypotenuse).',
    example:'30-60-90, shortest leg = 5 → sides: 5, 5√3, 10. / 45-45-90, leg = 7 → hypotenuse = 7√2.',
    whyItMatters:'Recognizing special triangles saves significant time — no quadratic formula or calculator needed.' },

  { subject:'Math', topic:'Distance Formula', difficulty:'Medium',
    q:'What is the distance formula between two coordinate points?',
    a:'d = √[(x₂ − x₁)² + (y₂ − y₁)²]. This is just the Pythagorean theorem applied to a coordinate plane.',
    example:'Points (1, 2) and (4, 6): d = √[(3)² + (4)²] = √[9+16] = √25 = 5',
    whyItMatters:'Distance formula connects coordinate geometry to the Pythagorean theorem — a cross-topic ACT favorite.' },

  { subject:'Math', topic:'Midpoint Formula', difficulty:'Easy',
    q:'What is the midpoint formula?',
    a:'Midpoint = ((x₁+x₂)/2 , (y₁+y₂)/2). Average the x-coordinates, average the y-coordinates.',
    example:'Midpoint of (2, 4) and (8, 10) = ((2+8)/2, (4+10)/2) = (5, 7).',
    whyItMatters:'Midpoint questions appear directly and as setups for longer coordinate geometry problems.' },

  { subject:'Math', topic:'Circle Equation', difficulty:'Hard',
    q:'What is the standard equation of a circle?',
    a:'(x − h)² + (y − k)² = r², where (h, k) is the center and r is the radius. If you see (x + 3)², the center is x = −3 (not +3) because h is subtracted.',
    example:'Center (3, −2), radius 5: (x−3)² + (y+2)² = 25.',
    whyItMatters:'Circle equation questions appear in coordinate geometry — the sign flip for h and k is the most common error.' },

  { subject:'Math', topic:'Circumference and Area of Circle', difficulty:'Easy',
    q:'What are the circumference and area formulas for a circle?',
    a:'Circumference: C = 2πr = πd / Area: A = πr². Both use radius. If given diameter, divide by 2 first.',
    example:'Radius = 7: C = 14π ≈ 43.98, A = 49π ≈ 153.94.',
    whyItMatters:'These formulas are not given on the ACT — they appear in arc length, sector area, and rate problems.' },

  { subject:'Math', topic:'Trigonometric Ratios — SOH-CAH-TOA', difficulty:'Medium',
    q:'What do SOH-CAH-TOA stand for?',
    a:'Sin = Opposite/Hypotenuse. Cos = Adjacent/Hypotenuse. Tan = Opposite/Adjacent. These are ratios for right triangle sides relative to a specific angle.',
    example:'Right triangle: opposite=3, adjacent=4, hypotenuse=5 → sin=3/5, cos=4/5, tan=3/4.',
    whyItMatters:'Trig ratios are tested directly on ACT Math — expect 4-6 trig questions per test.' },

  { subject:'Math', topic:'Functions and Notation', difficulty:'Medium',
    q:'What does f(x) mean, and how do you evaluate a function?',
    a:'f(x) is a rule that assigns one output to each input x. To evaluate f(a): replace every x with the value a and simplify. f(a+b) does NOT equal f(a)+f(b) — substitute a+b as one unit.',
    example:'f(x) = 2x² − 3x + 1 → f(4) = 2(16) − 12 + 1 = 21.',
    whyItMatters:'Function notation is tested frequently — misreading f(a+b) as f(a)+f(b) is a classic ACT error.' },

  { subject:'Math', topic:'Absolute Value Equations', difficulty:'Medium',
    q:'How do you solve an absolute value equation like |x − 3| = 7?',
    a:'Split into two equations: the expression inside equals the positive value AND the negative value. Solve both to get two solutions.',
    example:'|x − 3| = 7 → x−3 = 7 (x=10) OR x−3 = −7 (x=−4). Both are solutions.',
    whyItMatters:'Forgetting the negative case gives half-credit — absolute value always creates two possibilities.' },

  { subject:'Math', topic:'Inequalities', difficulty:'Medium',
    q:'What is the most important rule when solving inequalities?',
    a:'Solve like an equation, BUT flip the inequality sign whenever you multiply or divide both sides by a negative number. On a number line: open circle for < or >, filled circle for ≤ or ≥.',
    example:'−2x + 4 > 10 → −2x > 6 → x < −3 (sign flips because ÷ by −2).',
    whyItMatters:'Forgetting to flip the inequality sign is the #1 inequality error on ACT Math.' },

  { subject:'Math', topic:'Radicals — Simplification', difficulty:'Medium',
    q:'How do you simplify a radical like √72?',
    a:'Find the largest perfect square factor of the number under the radical. Break into √(perfect square) × √(remaining), then simplify. The answer should have no perfect square factors remaining under the radical.',
    example:'√72 = √(36 × 2) = 6√2. / √48 = √(16 × 3) = 4√3.',
    whyItMatters:'Unsimplified radicals never appear as ACT answer choices — you must simplify to match.' },

  { subject:'Math', topic:'Similar Triangles', difficulty:'Medium',
    q:'What are similar triangles, and how do you use proportions with them?',
    a:'Similar triangles have identical angle measures and proportional corresponding sides. Set up a proportion using matching sides: side₁/side₂ = corresponding side₁/corresponding side₂.',
    example:'Triangle A sides: 3, 4, 5. Triangle B is similar with shortest side 9. Scale factor = 3 → B sides: 9, 12, 15.',
    whyItMatters:'Similar triangles appear in geometry diagrams and real-world scaling problems on ACT Math.' },

  { subject:'Math', topic:'Domain and Range', difficulty:'Hard',
    q:'What are domain and range of a function?',
    a:'Domain = all valid input values (x values). Range = all resulting output values (y values). Key restrictions: denominators cannot equal zero; square roots of negatives are undefined (in real numbers).',
    example:'f(x) = 1/(x−3) → domain: all reals except x=3. / f(x) = √(x+2) → domain: x ≥ −2.',
    whyItMatters:'Domain and range appear in both algebra and function questions — students who skip them leave easy points on the table.' },

  { subject:'Math', topic:'Unit Conversions', difficulty:'Easy',
    q:'How do you set up a unit conversion to avoid errors?',
    a:'Use dimensional analysis: multiply by a fraction equal to 1 (conversion factor) arranged so the unwanted units cancel. Write out units explicitly until the math is clear.',
    example:'Convert 180 minutes to hours: 180 min × (1 hr / 60 min) = 3 hrs. (Minutes cancel.)',
    whyItMatters:'Unit errors — computing in minutes when the answer needs hours — are common ACT word problem mistakes.' },

  { subject:'Math', topic:'Word Problem Setup', difficulty:'Medium',
    q:'What is the strategy for setting up an ACT word problem correctly?',
    a:'(1) Identify what you\'re solving for and assign it a variable. (2) Translate: "is" → equals; "of" → multiply; "more than" → add; "less than" → subtract. (3) Write the equation before calculating. (4) Check your answer in the original problem.',
    example:'"A number increased by 12 is three times the number." → x + 12 = 3x → x = 6.',
    whyItMatters:'Setting up the equation incorrectly is the most common word problem error — writing it out prevents rushing mistakes.' },

  { subject:'Math', topic:'Percent Increase/Decrease', difficulty:'Medium',
    q:'How do you calculate percent increase or decrease?',
    a:'Percent change = (New − Original) / Original × 100. If positive: increase. If negative: decrease. For a repeated percent change, do NOT add/subtract percents — apply each one individually.',
    example:'Price goes from $80 to $100: change = 20/80 × 100 = 25% increase. / Then drops 25%: 100 × 0.75 = $75 (not back to $80).',
    whyItMatters:'Compound percent change is a classic ACT trap — students who add/subtract percents get the wrong answer.' },

  /* ---- READING: 12 cards ---- */

  { subject:'Reading', topic:'Main Idea', difficulty:'Easy',
    q:'How do you identify the main idea of an ACT Reading passage?',
    a:'The main idea is the central claim or topic developed throughout the entire passage. It is not a detail mentioned once, not an extreme claim, and not a summary of just one paragraph. Ask: "What is almost every paragraph contributing to?"',
    example:'A passage about the history and economic impact of salt → main idea: "salt\'s cultural and economic significance" — not "salt is a mineral."',
    whyItMatters:'Main idea questions anchor all other reading questions — getting it wrong affects your answer to everything else.' },

  { subject:'Reading', topic:'Author\'s Purpose', difficulty:'Medium',
    q:'How do you determine an author\'s purpose on ACT Reading?',
    a:'Ask: why did the author write this piece? Common purposes: to inform/explain, to argue/persuade, to narrate/tell a story, to analyze, to describe. Look at the overall structure, the use of evidence, and the opening and closing paragraphs.',
    whyItMatters:'Purpose questions test your ability to read the passage as a whole — not just individual sentences or facts.' },

  { subject:'Reading', topic:'Inference vs. Direct Evidence', difficulty:'Medium',
    q:'What is the difference between inference and direct evidence on ACT Reading?',
    a:'Direct evidence: the answer is stated explicitly in the text. Inference: the answer is implied — you draw a logical conclusion from what IS stated, without going beyond the text. ACT inferences stay very close to the text. If it requires outside knowledge, it\'s wrong.',
    whyItMatters:'Many wrong answers on ACT Reading are "too inferred" — they sound reasonable but go beyond what the passage supports.' },

  { subject:'Reading', topic:'Author\'s Tone', difficulty:'Medium',
    q:'How do you identify an author\'s tone on ACT Reading?',
    a:'Tone is the author\'s attitude toward the subject. Clues: word choice (positive/negative/neutral), degree of certainty, formality, and judgment words. Common tones: critical, admiring, nostalgic, objective, ironic, cautionary, skeptical.',
    example:'"The policy, though well-intentioned, has produced disastrous consequences." → tone: critical/cautionary.',
    whyItMatters:'Tone questions require reading beyond literal meaning — students who ignore word choice miss these consistently.' },

  { subject:'Reading', topic:'Vocabulary in Context', difficulty:'Easy',
    q:'How do you answer "as used in line X, the word Y most nearly means..."?',
    a:'Go to the specific line, read at least two sentences surrounding it for context, then choose the answer that fits THAT context — not the word\'s most common or "dictionary" definition. The obvious definition is often a trap.',
    example:'"The chef\'s creative plating drew curious looks." → "curious" here means "interested," not "strange."',
    whyItMatters:'Vocabulary-in-context tests reading comprehension, not vocabulary — the common definition is frequently wrong.' },

  { subject:'Reading', topic:'Detail Questions', difficulty:'Easy',
    q:'What is the correct strategy for ACT detail questions?',
    a:'Detail questions ask about something specifically stated in the passage. Always go back to the relevant section and re-read it — never answer from memory. Paraphrasing can shift meaning, so read the original words before choosing.',
    whyItMatters:'Even careful readers misremember details under test conditions — always verify in the text.' },

  { subject:'Reading', topic:'Cause and Effect', difficulty:'Medium',
    q:'How do you identify cause and effect relationships in an ACT passage?',
    a:'Look for signal words indicating causation: because, since, as a result, therefore, consequently, leads to, causes, due to, thus. Identify which event came first (cause) and which followed (effect) — they are not interchangeable.',
    whyItMatters:'Cause/effect questions test whether you tracked the logical progression of the passage, not just individual facts.' },

  { subject:'Reading', topic:'Eliminating Extreme Answers', difficulty:'Medium',
    q:'What types of answer choices should you eliminate first on ACT Reading?',
    a:'Eliminate answers that: (1) use absolute language (always, never, all, none) unless the text is equally absolute, (2) are partially true but go further than the text supports, (3) directly contradict the passage, (4) are factually interesting but irrelevant to the question.',
    whyItMatters:'The single most reliable elimination strategy — two or three choices are usually clearly wrong on close reading.' },

  { subject:'Reading', topic:'Paired Passages', difficulty:'Hard',
    q:'What is the best strategy for paired ACT Reading passages (Passage A and Passage B)?',
    a:'Read Passage A fully → answer all Passage A-only questions. Read Passage B fully → answer all Passage B-only questions. Then answer the comparison questions. Focus on: what each author claims, what evidence they use, and where they agree or disagree.',
    whyItMatters:'Mixing up the two authors\' positions is the primary mistake in paired passage questions — handle them separately first.' },

  { subject:'Reading', topic:'Summarizing Paragraphs', difficulty:'Medium',
    q:'How do you stay oriented during a long ACT Reading passage?',
    a:'After reading each paragraph, note its main point in 4-5 words in the margin (e.g., "describes migration patterns," "author challenges the theory"). This mental map lets you locate answers by paragraph without re-reading the whole passage.',
    whyItMatters:'Students who don\'t annotate spend half their time searching — a paragraph map cuts re-reading time significantly.' },

  { subject:'Reading', topic:'Function of a Sentence or Paragraph', difficulty:'Hard',
    q:'How do you answer questions asking why an author included a specific sentence or paragraph?',
    a:'Identify what the sentence or paragraph DOES in context: Does it introduce? Provide evidence? Counter an argument? Offer an example? Shift tone? Conclude? Match that function to the answer choices — not just what it says.',
    whyItMatters:'"Function of" questions require understanding structure, not content — students who only focus on meaning miss these.' },

  { subject:'Reading', topic:'Avoiding Outside Knowledge', difficulty:'Medium',
    q:'Why is it dangerous to use outside knowledge on ACT Reading?',
    a:'The ACT only tests what is stated or clearly implied in the passage. An answer that is factually true in the real world but not supported by the text is wrong. Every answer must be justified by specific words in the passage.',
    example:'A passage about Edison doesn\'t mention Tesla. Choosing a Tesla answer because you know history = wrong.',
    whyItMatters:'Using prior knowledge instead of the text is the single biggest ACT Reading mistake — the passage is the only authority.' },

  /* ---- SCIENCE: 10 cards ---- */

  { subject:'Science', topic:'Independent Variable', difficulty:'Easy',
    q:'What is an independent variable in an ACT Science experiment?',
    a:'The independent variable is the factor the researcher deliberately changes or controls between experimental groups. It is the "cause" in a cause-and-effect relationship. It goes on the x-axis of a graph.',
    example:'Experiment: testing how temperature affects reaction speed. Temperature = independent variable.',
    whyItMatters:'Identifying variables is the first step in answering nearly every ACT Science question about experimental design.' },

  { subject:'Science', topic:'Dependent Variable', difficulty:'Easy',
    q:'What is a dependent variable?',
    a:'The dependent variable is what is measured or observed as an outcome of changing the independent variable. It is the "effect." It goes on the y-axis of a graph. Its value depends on the independent variable.',
    example:'In the temperature experiment, reaction speed (measured) = dependent variable.',
    whyItMatters:'Confusing independent and dependent variables is the most common ACT Science conceptual error.' },

  { subject:'Science', topic:'Control Group', difficulty:'Medium',
    q:'What is a control group and why does it matter?',
    a:'The control group receives no treatment (or the standard baseline condition) and is used for comparison. It allows researchers to isolate the effect of the independent variable by keeping everything else equal.',
    example:'Testing a fertilizer: the control group gets no fertilizer. Any plant height difference between groups = effect of fertilizer.',
    whyItMatters:'ACT Science asks you to identify the control — it shows you understand what makes an experiment valid.' },

  { subject:'Science', topic:'Positive vs. Negative Correlation', difficulty:'Easy',
    q:'How do you identify positive vs. negative correlation in an ACT Science graph?',
    a:'Positive correlation: as x increases, y also increases (upward-sloping line or trend). Negative correlation: as x increases, y decreases (downward-sloping). No correlation: values show no consistent pattern.',
    example:'Hours studied vs. exam score → positive correlation. Temperature vs. reaction time (slower when cold) → negative correlation.',
    whyItMatters:'Recognizing correlation direction is the most fundamental graph-reading skill in ACT Science.' },

  { subject:'Science', topic:'Interpolation vs. Extrapolation', difficulty:'Medium',
    q:'What is the difference between interpolation and extrapolation?',
    a:'Interpolation: estimating a value WITHIN the range of data shown — more reliable. Extrapolation: predicting a value BEYOND the range of data — less reliable, as the trend may change. The ACT tests both; be cautious with extrapolation answers.',
    example:'Graph shows data from 0–100°C. Estimating at 50°C = interpolation. Predicting at 150°C = extrapolation.',
    whyItMatters:'The ACT distinguishes between these — extrapolation questions often have "cannot be determined" as a correct option.' },

  { subject:'Science', topic:'Hypothesis', difficulty:'Medium',
    q:'What makes a valid scientific hypothesis on the ACT?',
    a:'A hypothesis is a specific, testable prediction based on prior observation. It must be falsifiable (possible to prove wrong). It is NOT a guaranteed fact, a proven law, or a vague statement. Often in "if-then" format.',
    example:'"If plants receive more sunlight, then they will grow taller" is a proper hypothesis — it\'s testable and could be disproven.',
    whyItMatters:'The ACT asks you to identify which statement is a hypothesis — students confuse hypothesis with conclusion.' },

  { subject:'Science', topic:'Constants and Controlled Variables', difficulty:'Medium',
    q:'What are constants (controlled variables) in an experiment?',
    a:'Constants are all the factors kept the same across every experimental group. They ensure that only the independent variable changes, so any observed difference can be attributed to that variable alone.',
    example:'Testing fertilizer: all plants get identical soil, water amount, light exposure, and pot size. Those are the constants.',
    whyItMatters:'ACT Science tests your ability to identify what must be held constant to make an experiment fair and valid.' },

  { subject:'Science', topic:'Identifying a Supported Conclusion', difficulty:'Medium',
    q:'How do you identify which conclusion is supported by ACT Science data?',
    a:'A supported conclusion: (1) is directly proven by the data shown, (2) does not overgeneralize beyond the scope of the experiment, (3) does not contradict the data, (4) requires no outside knowledge. Beware of "too broad" answers.',
    example:'Data: compound A dissolves faster at 50°C than 30°C. Valid: "Raising temperature increases dissolution rate for compound A." Invalid: "All compounds dissolve faster when heated."',
    whyItMatters:'"Too broad" is the most common wrong answer type in ACT Science conclusion questions.' },

  { subject:'Science', topic:'Conflicting Viewpoints Passage', difficulty:'Hard',
    q:'How should you approach the ACT Science Conflicting Viewpoints passage?',
    a:'Read each scientist\'s or student\'s position SEPARATELY and identify: (1) their claim, (2) the evidence they cite, (3) their reasoning logic. Answer questions about each viewpoint individually before comparing. Never mix up which evidence belongs to which viewpoint.',
    whyItMatters:'Students who read both viewpoints at once get confused — read, summarize each, then answer.' },

  { subject:'Science', topic:'Reading Graph Trends', difficulty:'Easy',
    q:'What is the first thing you should do when you see a graph or table in ACT Science?',
    a:'Read the axis labels and units. Identify what is being measured (x and y). Note the range of values. Look for the overall trend (increasing, decreasing, constant, peaks). Then answer the specific question with the data — do not guess from memory.',
    whyItMatters:'Most ACT Science questions are answered by reading the graph correctly — rushing past axis labels causes avoidable errors.' },

  /* ---- STRATEGY TIPS: 8 cards ---- */

  { subject:'Strategy Tips', topic:'Pacing — English', difficulty:'Medium',
    q:'How much time do you have per question on ACT English, and what is the best pacing strategy?',
    a:'45 minutes / 75 questions = 36 seconds per question. Do NOT read the passage first — work sentence by sentence as you go. If a question takes more than 45 seconds, mark it and return. Moving efficiently through easy questions protects your time for harder ones.',
    whyItMatters:'Students run out of time on English by overthinking grammar questions that have clear rules.' },

  { subject:'Strategy Tips', topic:'Skip and Return', difficulty:'Easy',
    q:'When should you skip a question and return to it later on the ACT?',
    a:'Skip any question requiring more than 30–45 seconds of deep thought. Circle it in the booklet, bubble your best guess, and keep moving. Return with leftover time. There is NO guessing penalty on the ACT — a blank is always 0 points, a guess is 25% likely to be right.',
    whyItMatters:'Sitting on one hard question while leaving easy ones unanswered is the most common timing mistake on the ACT.' },

  { subject:'Strategy Tips', topic:'Process of Elimination', difficulty:'Easy',
    q:'How does process of elimination work, and why is it powerful on the ACT?',
    a:'Eliminate answer choices you know are wrong. Eliminating even 2 of 4 choices doubles your odds from 25% to 50%. On Reading and Science: eliminate answers that contradict the text. On English: eliminate choices with grammar errors. On Math: eliminate answers that fail a quick check.',
    whyItMatters:'The fastest path to a right answer is often eliminating three wrong ones — active elimination beats passive guessing.' },

  { subject:'Strategy Tips', topic:'Bubbling Strategy', difficulty:'Medium',
    q:'What is the safest bubbling strategy to avoid misalignment errors?',
    a:'Circle your answer in the test booklet first. Bubble in batches of 5–10 questions rather than one at a time. This reduces the risk of bubbling in the wrong row. Before moving to a new section, confirm your bubbles match your booklet answers.',
    whyItMatters:'A single misaligned bubble can cascade into many wrong answers — this is one of the most preventable score killers.' },

  { subject:'Strategy Tips', topic:'Avoiding Trap Answers', difficulty:'Medium',
    q:'What are the most common ACT trap answer patterns?',
    a:'English: answer with an extra unnecessary comma; answer that changes meaning slightly. Math: answer to the wrong question (found x when they asked for 2x). Reading: answer that is true in the real world but not in the passage. Science: conclusion that overgeneralizes beyond the data.',
    whyItMatters:'ACT traps are carefully designed to be appealing — recognizing the pattern lets you slow down at the right moment.' },

  { subject:'Strategy Tips', topic:'Timing by Section', difficulty:'Hard',
    q:'What are the time-per-question benchmarks for each ACT section?',
    a:'English: 45 min / 75 q = 36 sec each. Math: 60 min / 60 q = 60 sec each. Reading: 35 min / 40 q = 52 sec each (aim for ~8 min/passage). Science: 35 min / 40 q = 52 sec each (aim for ~5 min/passage). These are maximums — use less where you can.',
    whyItMatters:'Knowing your pace benchmark prevents the #1 ACT failure mode: running out of time because early questions took too long.' },

  { subject:'Strategy Tips', topic:'Using Answer Choices on Math', difficulty:'Medium',
    q:'When should you back-solve from answer choices on ACT Math?',
    a:'Back-solve when: (1) the problem asks for a specific value, (2) the answer choices are numbers (not expressions), (3) the algebra would be slow or complex. Start with the middle answer choice (B or C). If it\'s too small, try D; if too large, try A.',
    example:'"What value of x satisfies 3x + 7 = 22?" → Try C (x=5): 3(5)+7=22 ✓. Done.',
    whyItMatters:'Back-solving is faster than algebra for many ACT Math problems — knowing when to switch is a real strategy.' },

  { subject:'Strategy Tips', topic:'Review Mistakes Between Tests', difficulty:'Hard',
    q:'What is the most effective way to use ACT practice tests to actually improve?',
    a:'Score the test, then review EVERY wrong answer. For each mistake: (1) identify WHY you got it wrong (knowledge gap, careless error, or timing). (2) Note the concept. (3) Add it to a review list. Patterns in your errors reveal exactly what to study next. The improvement comes from the review, not the practice test itself.',
    whyItMatters:'Taking practice tests without detailed review is the #1 wasted study effort — you need to diagnose, not just score.' },

];

/* ============================================================
   FLASHCARD STATE
   ============================================================ */
let currentCardIdx   = 0;
let currentFilter    = { subject: 'All', difficulty: 'All' };
let filteredCards    = [];
let starredIndices   = new Set();   // indices into ALL_FLASHCARDS
let isFlipped        = false;
let sessionCorrect   = 0;
let sessionWrong     = 0;
let sessionsReviewed = 0;
let missedCards      = [];          // indices of missed cards to re-show
let normalCardCount  = 0;           // how many normal cards since last missed-card injection

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

  // Global index for starring
  const globalIdx = ALL_FLASHCARDS.indexOf(cardData);
  const isStarred = starredIndices.has(globalIdx);

  // Badges
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
  if (starBtn) starBtn.textContent = isStarred ? '★ Starred' : '☆ Star';
  if (starBtn) starBtn.classList.toggle('starred', isStarred);
  if (cardQ)   cardQ.textContent   = cardData.q;
  if (cardA)   cardA.textContent   = cardData.a;
  if (cardEx)  {
    if (cardData.example) {
      cardEx.textContent = cardData.example;
      cardEx.closest('.fc-back-example')?.style && (cardEx.closest('.fc-back-example').style.display = 'block');
    } else {
      const container = cardEx.closest('.fc-back-example');
      if (container) container.style.display = 'none';
    }
  }
  if (cardWhy) cardWhy.textContent = cardData.whyItMatters || '';

  const total = filteredCards.length;
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
  // Every 5 normal cards, inject a missed card if any exist
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

function markKnewIt() {
  sessionCorrect++;
  sessionsReviewed++;
  updateFCStats();
  nextCard();
}

function markMissedIt() {
  sessionWrong++;
  sessionsReviewed++;
  // Queue this card to come back
  const globalIdx = ALL_FLASHCARDS.indexOf(filteredCards[currentCardIdx]);
  if (globalIdx >= 0) missedCards.push(globalIdx);
  updateFCStats();
  nextCard();
}

function toggleStar() {
  const card = filteredCards[currentCardIdx];
  if (!card) return;
  const globalIdx = ALL_FLASHCARDS.indexOf(card);
  if (starredIndices.has(globalIdx)) {
    starredIndices.delete(globalIdx);
  } else {
    starredIndices.add(globalIdx);
  }
  renderCard(card, currentCardIdx);
}

function updateFCStats() {
  const corrEl   = document.getElementById('fcStatCorrect');
  const wrongEl  = document.getElementById('fcStatWrong');
  const revEl    = document.getElementById('fcStatReviewed');
  const accEl    = document.getElementById('fcStatAccuracy');
  const starEl   = document.getElementById('fcStatStarred');
  if (corrEl)  corrEl.textContent  = sessionCorrect;
  if (wrongEl) wrongEl.textContent = sessionWrong;
  if (revEl)   revEl.textContent   = sessionsReviewed;
  if (accEl)   {
    const acc = sessionsReviewed > 0 ? Math.round((sessionCorrect / sessionsReviewed) * 100) : 0;
    accEl.textContent = acc + '%';
  }
  if (starEl)  starEl.textContent  = starredIndices.size;
}

function setFilter(type, value) {
  currentFilter[type] = value;
  // Update button states
  const btnGroup = type === 'subject' ? '.fc-subject-btn' : '.fc-diff-btn';
  document.querySelectorAll(btnGroup).forEach(b => {
    b.classList.toggle('active', b.dataset.value === value);
  });
  filteredCards = getFilteredCards();
  currentCardIdx = 0;
  if (filteredCards.length > 0) {
    renderCard(filteredCards[0], 0);
  } else {
    const cardQ = document.getElementById('cardQuestion');
    if (cardQ) cardQ.textContent = 'No cards match this filter. Try a different combination.';
  }
  // Update card count in filter buttons
  const totalEl = document.getElementById('fcFilterTotal');
  if (totalEl) totalEl.textContent = filteredCards.length + ' cards';
}

/* ============================================================
   SECTION TRACKER (no changes)
   ============================================================ */

/* ============================================================
   PRACTICE QUIZ
   ============================================================ */
const QUIZ_QUESTIONS = [
  {
    section:'English',
    passage:null,
    question:'Which of the following is the BEST revision of the underlined portion?\n\n"The researchers, whom conducted the study, published their findings last week."',
    options:['whom conducted','who conducted','which conducted','that conducted'],
    correct:1,
    explanation:'Use "who" when the pronoun is the subject of a verb — here it is the subject of "conducted." Substitute "they conducted" → they = who. "Whom" is for objects; "which/that" are for non-human subjects.',
  },
  {
    section:'Math',
    passage:null,
    question:'If 3x + 7 = 22, what is the value of 6x + 5?',
    options:['29','33','35','37'],
    correct:2,
    explanation:'Solve: 3x = 15, so x = 5. Then 6x + 5 = 30 + 5 = 35. Shortcut: 6x + 5 = 2(3x) + 5 = 2(15) + 5 = 35 — no need to solve for x explicitly.',
  },
  {
    section:'Reading',
    passage:'The Amazon rainforest produces roughly 20% of the world\'s oxygen and is home to an estimated 10% of all species on Earth. Despite its importance, deforestation continues at an alarming rate, with scientists warning that the forest could reach a "tipping point" within decades if current trends continue.',
    question:'Based on the passage, which conclusion is best supported?',
    options:['Global oxygen production would increase if deforestation stopped.','The Amazon\'s current trajectory could lead to irreversible ecological changes.','Scientists have already identified the specific year a tipping point will occur.','The Amazon houses the majority of all species on Earth.'],
    correct:1,
    explanation:'The passage states scientists warn of a "tipping point" if trends continue — closest to irreversible change. Choice A is not stated. Choice C is too specific (no year is given). Choice D contradicts "10%" (not a majority).',
  },
  {
    section:'Science',
    passage:'Researchers measured plant growth under three light conditions over 30 days: full sun (8 hrs/day), partial shade (4 hrs/day), and full shade (0 hrs/day). Average final heights were 42 cm, 28 cm, and 11 cm respectively.',
    question:'According to the data, which conclusion is best supported?',
    options:['Plants cannot survive without sunlight.','Greater daily sunlight exposure is associated with greater plant height in this experiment.','Partial shade produces the healthiest plants overall.','Full sun plants grew exactly four times taller than full shade plants.'],
    correct:1,
    explanation:'The data shows a clear trend: more sunlight = greater height (42 > 28 > 11 cm). Choice A is wrong — full shade plants grew 11 cm, not zero. Choice C is unsupported. Choice D is wrong: 42/11 ≈ 3.8, not 4.',
  },
  {
    section:'Math',
    passage:null,
    question:'A car travels 240 miles in 4 hours. At the same rate, how many miles will it travel in 7 hours?',
    options:['360','400','420','480'],
    correct:2,
    explanation:'Rate = 240 ÷ 4 = 60 mph. Distance in 7 hours = 60 × 7 = 420 miles. Always identify rate first in ACT distance problems, then multiply by the new time.',
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
  if (qNum)      qNum.textContent     = idx + 1;
  if (qSection)  qSection.textContent = q.section;
  if (qProgress) qProgress.textContent = `Question ${idx + 1} of ${QUIZ_QUESTIONS.length}`;

  const passageEl = document.getElementById('qPassage');
  if (passageEl) {
    passageEl.textContent = q.passage || '';
    passageEl.style.display = q.passage ? 'block' : 'none';
  }

  const qText = document.getElementById('qText');
  if (qText) qText.textContent = q.question;

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
  if (nextBtn) nextBtn.textContent = idx === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next Question →';

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
  const q = QUIZ_QUESTIONS[qIdx];
  const optList = document.getElementById('qOptions');
  if (!optList) return;
  const options = optList.querySelectorAll('.quiz-option');
  options.forEach((opt, i) => {
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
    [80,'🎉 Excellent work!',`You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. Strong performance — keep it up!`],
    [60,'📈 Good progress!',`You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. Review the explanations and try again.`],
    [0,'📚 Keep practicing.',`You got ${quizCorrectCount} of ${QUIZ_QUESTIONS.length} correct. This is exactly what 1-on-1 sessions are for — let\'s work on these together.`],
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
  pomoTotal     = duration;
  pomoRemaining = duration;
  pomoRunning   = false;
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
        const isBreak = modeLabel && modeLabel.textContent.includes('Break');
        if (!isBreak) {
          pomoSessions++;
          const sessionEl = document.getElementById('pomoSession');
          if (sessionEl) sessionEl.textContent = `Session ${pomoSessions} complete! Take a break.`;
        } else {
          const sessionEl = document.getElementById('pomoSession');
          if (sessionEl) sessionEl.textContent = `Break over. Session ${pomoSessions + 1} of 4 — stay focused!`;
        }
      }
    }, 1000);
  }
}

function resetPomo() {
  clearInterval(pomoInterval);
  pomoRunning   = false;
  pomoRemaining = pomoTotal;
  const btn = document.getElementById('pomoStartBtn');
  if (btn) btn.textContent = 'Start';
  const sessionEl = document.getElementById('pomoSession');
  if (sessionEl) sessionEl.textContent = `Session ${pomoSessions + 1} of 4 — complete 4 to earn a long break`;
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const min = Math.floor(pomoRemaining / 60).toString().padStart(2,'0');
  const sec = (pomoRemaining % 60).toString().padStart(2,'0');
  const displayEl = document.getElementById('pomoDisplay');
  if (displayEl) displayEl.textContent = `${min}:${sec}`;
  const ring = document.getElementById('pomoRingFill');
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

  /* Score estimator */
  ['estEngInput','estMathInput','estReadInput','estSciInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateEstimator);
  });

  /* Section tracker */
  ['eng','math','read','sci'].forEach(s => {
    const el = document.getElementById(s + 'Slider');
    if (el) el.addEventListener('input', updateTracker);
  });
  updateTracker();

  /* Flashcards — init */
  filteredCards = getFilteredCards();
  renderCard(filteredCards[0], 0);

  const fcEl = document.getElementById('flashcard');
  if (fcEl) fcEl.addEventListener('click', flipCard);

  document.querySelectorAll('.fc-subject-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter('subject', btn.dataset.value));
  });
  document.querySelectorAll('.fc-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter('difficulty', btn.dataset.value));
  });

  const prevBtn  = document.getElementById('fcPrev');
  const nextBtn  = document.getElementById('fcNext');
  const knewBtn  = document.getElementById('fcKnewIt');
  const missBtn  = document.getElementById('fcMissedIt');
  const starBtn  = document.getElementById('fcStarBtn');
  if (prevBtn)  prevBtn.addEventListener('click',  prevCard);
  if (nextBtn)  nextBtn.addEventListener('click',  nextCard);
  if (knewBtn)  knewBtn.addEventListener('click',  markKnewIt);
  if (missBtn)  missBtn.addEventListener('click',  markMissedIt);
  if (starBtn)  starBtn.addEventListener('click',  toggleStar);

  // Update initial filter total
  const totalEl = document.getElementById('fcFilterTotal');
  if (totalEl) totalEl.textContent = filteredCards.length + ' cards';

  /* Quiz */
  renderQuizQuestion(0);
  const quizNextBtn  = document.getElementById('quizNextBtn');
  const quizRestart  = document.getElementById('quizRestart');
  if (quizNextBtn)  quizNextBtn.addEventListener('click',  nextQuizQuestion);
  if (quizRestart)  quizRestart.addEventListener('click',  restartQuiz);
});
