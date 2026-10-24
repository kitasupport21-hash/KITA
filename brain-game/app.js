'use strict';

(function () {
  const GAMES = [
    { id: 'sequence', title: 'Sequence Lab', icon: '⌁', category: 'Logic', difficulty: 'WARM UP', color: '#eae7ff', ink: '#5c4bdb', desc: 'Spot the hidden rule and predict what comes next.' },
    { id: 'memory', title: 'Memory Matrix', icon: '▦', category: 'Memory', difficulty: 'FOCUS', color: '#dcf8ed', ink: '#168a65', desc: 'Memorise glowing squares, then recreate the pattern.' },
    { id: 'logic', title: 'Deduction Room', icon: '◈', category: 'Logic', difficulty: 'THINKER', color: '#fff0d6', ink: '#a66a19', desc: 'Use clues and careful reasoning to find the answer.' },
    { id: 'math', title: 'Mental Sprint', icon: '＋', category: 'Numbers', difficulty: 'TIMED', color: '#ffe6ef', ink: '#bd4671', desc: 'Solve as many mental-math questions as you can in 30 seconds.' },
    { id: 'pattern', title: 'Pattern Vision', icon: '▧', category: 'Patterns', difficulty: 'THINKER', color: '#e0f1ff', ink: '#2771ad', desc: 'Read visual patterns and find the missing piece.' },
    { id: 'word', title: 'Word Twist', icon: 'Aa', category: 'Words', difficulty: 'WARM UP', color: '#f2e4ff', ink: '#9252bf', desc: 'Unscramble the letters before your mind gets tangled.' },
    { id: 'lights', title: 'Lights Out', icon: '✦', category: 'Planning', difficulty: 'STRATEGY', color: '#fff4d4', ink: '#9b741e', desc: 'Switch every light off. Each move changes neighbours too.' },
    { id: 'mastermind', title: 'Code Breaker', icon: '⌘', category: 'Deduction', difficulty: 'STRATEGY', color: '#e1e8ff', ink: '#4d5fb4', desc: 'Crack the hidden four-digit code using feedback after each guess.' },
    { id: 'sudoku', title: 'Mini Sudoku', icon: '▦', category: 'Numbers', difficulty: 'LOGIC', color: '#dcf7f7', ink: '#147e83', desc: 'Fill the 4×4 grid without repeating numbers in rows, columns or boxes.' },
    { id: 'river', title: 'River Crossing', icon: '↔', category: 'Planning', difficulty: 'CHALLENGE', color: '#e6f4e0', ink: '#4c7d3c', desc: 'Get everyone across safely. Never leave the wrong pair alone.' }
  ];
  const $ = function (s) { return document.querySelector(s); };
  const homeScreen = $('#home-screen'), gameScreen = $('#game-screen'), gamePanel = $('#game-panel');
  const STORE_KEY = 'brainforge-progress-v1';
  let progress = loadProgress(), activeId = null, game = null, timerId = null, revealId = null, installPrompt = null;
  const toastEl = $('#toast');

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return { points: Number(saved.points) || 0, wins: Number(saved.wins) || 0, bests: saved.bests && typeof saved.bests === 'object' ? saved.bests : {} };
    } catch (_) { return { points: 0, wins: 0, bests: {} }; }
  }
  function saveProgress() { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (_) {} }
  function clearTimers() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (revealId) { clearTimeout(revealId); revealId = null; }
  }
  function showToast(message) {
    toastEl.textContent = message; toastEl.classList.add('show');
    clearTimeout(showToast.hideId);
    showToast.hideId = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  function iconStyle(g) { return 'style="--icon-bg:' + g.color + ';--icon-color:' + g.ink + '"'; }
  function renderHome() {
    clearTimers(); activeId = null; game = null; gameScreen.hidden = true; homeScreen.hidden = false;
    $('#stat-points').textContent = progress.points.toLocaleString();
    $('#stat-wins').textContent = progress.wins.toLocaleString();
    const bestValues = Object.keys(progress.bests).map(function (k) { return Number(progress.bests[k]) || 0; });
    $('#stat-best').textContent = bestValues.length ? Math.max.apply(null, bestValues).toLocaleString() : '—';
    $('#game-grid').innerHTML = GAMES.map(function (g) {
      const best = progress.bests[g.id] ? 'BEST ' + progress.bests[g.id] : 'NEW';
      return '<button class="game-card" type="button" data-action="open" data-id="' + g.id + '" aria-label="Play ' + g.title + '">' +
        '<div class="game-card-top"><span class="game-icon" ' + iconStyle(g) + '>' + g.icon + '</span><span class="game-difficulty">' + g.difficulty + '</span></div>' +
        '<h3>' + g.title + '</h3><p>' + g.desc + '</p><div class="game-card-bottom"><span>Play challenge <span aria-hidden="true">↗</span></span><span class="best-score">' + best + '</span></div></button>';
    }).join('');
  }
  function startGame(id) {
    const meta = GAMES.find(function (g) { return g.id === id; });
    if (!meta) return;
    clearTimers(); activeId = id; gameScreen.hidden = false; homeScreen.hidden = true;
    $('#game-title').textContent = meta.title; $('#game-subtitle').textContent = meta.desc;
    $('#game-icon').textContent = meta.icon; $('#game-icon').style.background = meta.color; $('#game-icon').style.color = meta.ink;
    $('#game-category').textContent = meta.category.toUpperCase();
    game = initGame(id); renderActive();
    if (id === 'math') {
      timerId = setInterval(function () {
        if (!game || activeId !== 'math' || game.result) return;
        game.time -= 1;
        if (game.time <= 0) finishGame(game.score > 0, 'Time is up. You solved ' + game.asked + ' questions and scored ' + game.score + ' points.', game.score);
        else renderActive();
      }, 1000);
    }
    if (id === 'memory') {
      revealId = setTimeout(function () {
        if (!game || activeId !== 'memory' || game.result) return;
        game.phase = 'guess'; renderActive();
      }, 1700);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function initGame(id) {
    if (id === 'sequence') return { q: pick(SEQUENCES), result: null };
    if (id === 'logic') return { q: pick(LOGIC_QUESTIONS), result: null };
    if (id === 'pattern') return { q: pick(PATTERNS), result: null };
    if (id === 'word') return { q: pick(WORDS), result: null };
    if (id === 'memory') {
      const count = 4 + Math.floor(Math.random() * 3), cells = [];
      while (cells.length < count) { const n = Math.floor(Math.random() * 25); if (cells.indexOf(n) < 0) cells.push(n); }
      return { targets: cells, selected: [], phase: 'show', result: null, count: count };
    }
    if (id === 'math') return { score: 0, time: 30, q: mathQuestion(), result: null, asked: 0 };
    if (id === 'lights') {
      const cells = Array(25).fill(false);
      for (let i = 0; i < 7; i++) flipLight(cells, Math.floor(Math.random() * 25));
      if (cells.every(function (v) { return !v; })) flipLight(cells, 12);
      return { cells: cells, moves: 0, result: null };
    }
    if (id === 'mastermind') {
      const nums = [1, 2, 3, 4, 5, 6].sort(function () { return Math.random() - .5; }).slice(0, 4);
      return { code: nums, history: [], attempts: 0, result: null };
    }
    if (id === 'sudoku') {
      const puzzle = [1,0,0,4, 0,4,1,0, 2,0,0,3, 0,3,2,0];
      return { board: puzzle.slice(), givens: puzzle.map(function (n) { return n !== 0; }), solution: [1,2,3,4, 3,4,1,2, 2,1,4,3, 4,3,2,1], selected: 1, result: null };
    }
    if (id === 'river') return { sides: { farmer: 0, wolf: 0, goat: 0, cabbage: 0 }, passenger: 'goat', moves: 0, result: null };
    return { result: null };
  }
  function pick(items) { return items[Math.floor(Math.random() * items.length)]; }
  function renderActive() {
    if (!game || !activeId) return;
    if (game.result) {
      const r = game.result;
      gamePanel.innerHTML = '<div class="result-box"><div class="result-symbol ' + (r.won ? '' : 'fail') + '">' + (r.won ? '✓' : '↻') + '</div><h2>' + (r.won ? 'Challenge cleared!' : 'Keep thinking') + '</h2><p>' + r.message + '</p><div class="result-score">+' + r.points + ' pts</div><div class="action-row"><button class="primary-button" type="button" data-action="restart">Play again ↗</button><button class="secondary-button" type="button" data-action="home">All games</button></div></div>';
      return;
    }
    const renderers = { sequence: renderSequence, logic: renderLogic, pattern: renderPattern, word: renderWord, memory: renderMemory, math: renderMath, lights: renderLights, mastermind: renderMastermind, sudoku: renderSudoku, river: renderRiver };
    gamePanel.innerHTML = renderers[activeId]();
  }
  function finishGame(won, message, points) {
    if (!game || game.result) return;
    clearTimers(); points = Math.max(0, Math.floor(Number(points) || 0));
    game.result = { won: !!won, message: message, points: points };
    if (won) {
      progress.points += points; progress.wins += 1;
      progress.bests[activeId] = Math.max(Number(progress.bests[activeId]) || 0, points);
      saveProgress();
    }
    renderActive();
  }
  function renderChoiceGame(label) {
    const q = game.q;
    return '<div class="panel-top"><span class="micro-label">' + label + '</span><span class="question-count">Choose one answer</span></div>' +
      '<div class="question-title">' + q.prompt + '</div>' + (q.visual || '') +
      '<p class="question-help">' + (q.help || 'Take a moment to reason it out before choosing.') + '</p>' +
      '<div class="choice-list">' + q.options.map(function (opt, i) { return '<button class="choice-button" type="button" data-action="answer" data-index="' + i + '">' + opt + '</button>'; }).join('') + '</div>';
  }
  function answerChoice(index) {
    if (!game || game.result || !game.q) return;
    const q = game.q, correct = String(q.options[index]) === String(q.answer);
    if (correct) finishGame(true, (q.explain || 'Nice reasoning. You spotted the right answer.') + ' You earned points for a correct solution.', 100);
    else finishGame(false, 'Not quite. ' + (q.explain || 'Review the clues, then try again.'), 0);
  }
  function renderSequence() {
    const q = game.q;
    return '<div class="panel-top"><span class="micro-label">FIND THE RULE</span><span class="question-count">1 puzzle</span></div><p class="question-help">Look at how the numbers change. What belongs in the blank?</p>' +
      '<div class="number-strip">' + q.series.map(function (n) { return '<span class="number-chip">' + n + '</span>'; }).join('') + '<span class="number-chip missing">?</span></div>' +
      '<div class="choice-list">' + q.options.map(function (opt, i) { return '<button class="choice-button" type="button" data-action="answer" data-index="' + i + '">' + opt + '</button>'; }).join('') + '</div>' +
      '<p class="answer-note">Tip: check the difference, multiplier, or alternating rule.</p>';
  }
  function renderLogic() { return renderChoiceGame('DEDUCE FROM THE CLUES'); }
  function renderPattern() {
    const q = game.q;
    return '<div class="panel-top"><span class="micro-label">VISUAL REASONING</span><span class="question-count">Missing tile</span></div><p class="question-help">Study the order in the grid. Pick the symbol that completes the pattern.</p>' +
      q.visual + '<div class="choice-list">' + q.options.map(function (opt, i) { return '<button class="choice-button" type="button" data-action="answer" data-index="' + i + '">' + opt + '</button>'; }).join('') + '</div>';
  }
  function renderWord() {
    const q = game.q;
    return '<div class="panel-top"><span class="micro-label">LETTER LOGIC</span><span class="question-count">Unscramble it</span></div><p class="question-help">Rearrange the letters to make a meaningful word.</p><div class="word-card"><div class="word-scramble">' + q.scramble + '</div></div>' +
      '<div class="choice-list">' + q.options.map(function (opt, i) { return '<button class="choice-button" type="button" data-action="answer" data-index="' + i + '">' + opt + '</button>'; }).join('') + '</div>';
  }
  function renderMemory() {
    const locked = game.phase === 'show';
    return '<div class="panel-top"><span class="micro-label">MEMORISE THE CELLS</span><span class="question-count">' + (locked ? 'Memorise now' : game.selected.length + ' / ' + game.count + ' selected') + '</span></div>' +
      '<p class="question-help">' + (locked ? 'Remember every glowing square. The board will hide them in a moment.' : 'Tap exactly the squares that glowed, then check your answer.') + '</p>' +
      '<div class="memory-grid">' + Array.from({ length: 25 }, function (_, i) {
        const lit = locked && game.targets.indexOf(i) >= 0, selected = !locked && game.selected.indexOf(i) >= 0;
        return '<button type="button" class="memory-cell ' + (lit ? 'lit' : '') + ' ' + (selected ? 'selected' : '') + '" data-action="memory-cell" data-index="' + i + '" aria-label="Grid cell ' + (i + 1) + '" ' + (locked ? 'disabled' : '') + '>' + (selected ? '✓' : '') + '</button>';
      }).join('') + '</div>' +
      (locked ? '<p class="answer-note">Focus on position, not just the overall shape.</p>' :
        '<div class="action-row"><button type="button" class="primary-button" data-action="memory-check" ' + (game.selected.length !== game.count ? 'disabled style="opacity:.5;cursor:not-allowed"' : '') + '>Check memory ↗</button><button type="button" class="secondary-button" data-action="memory-clear">Clear picks</button></div>');
  }
  function mathQuestion() {
    const op = Math.floor(Math.random() * 4); let a, b, answer, expression;
    if (op === 0) { a = 2 + Math.floor(Math.random() * 39); b = 2 + Math.floor(Math.random() * 29); answer = a + b; expression = a + ' + ' + b; }
    else if (op === 1) { a = 12 + Math.floor(Math.random() * 58); b = 2 + Math.floor(Math.random() * Math.min(28, a - 1)); answer = a - b; expression = a + ' − ' + b; }
    else if (op === 2) { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 9); answer = a * b; expression = a + ' × ' + b; }
    else { b = 2 + Math.floor(Math.random() * 9); answer = 2 + Math.floor(Math.random() * 12); a = b * answer; expression = a + ' ÷ ' + b; }
    const options = [answer, answer + 2 + Math.floor(Math.random() * 5), Math.max(0, answer - 1 - Math.floor(Math.random() * 5)), answer + 7].map(String);
    const unique = Array.from(new Set(options));
    while (unique.length < 4) unique.push(String(answer + 10 + unique.length));
    unique.sort(function () { return Math.random() - .5; });
    return { prompt: expression, answer: String(answer), options: unique };
  }
  function renderMath() {
    const q = game.q;
    return '<div class="panel-top"><span class="micro-label">MENTAL MATH</span><span class="question-count">Score ' + game.score + '</span></div>' +
      '<div class="timer-number">' + game.time + '<span style="font-size:13px;color:#9393a8;font-weight:700"> sec</span></div><div class="timer-track"><div class="timer-fill" style="width:' + (game.time / 30 * 100) + '%"></div></div>' +
      '<div class="math-question">' + q.prompt + ' = ?</div><p class="question-help">Answer quickly. A wrong answer costs 2 seconds.</p>' +
      '<div class="choice-list">' + q.options.map(function (opt, i) { return '<button class="choice-button" type="button" data-action="math-answer" data-index="' + i + '">' + opt + '</button>'; }).join('') + '</div>';
  }
  function handleMath(index) {
    if (!game || game.result) return;
    if (String(game.q.options[index]) === game.q.answer) { game.score += 10; showToast('+10 points'); }
    else { game.time = Math.max(0, game.time - 2); showToast('Try to stay sharp — 2 seconds off'); }
    game.asked += 1;
    if (game.time <= 0) finishGame(game.score > 0, 'Time is up. You solved ' + game.asked + ' questions and scored ' + game.score + ' points.', game.score);
    else { game.q = mathQuestion(); renderActive(); }
  }
  function flipLight(cells, n) {
    const row = Math.floor(n / 5), col = n % 5;
    [n, row > 0 ? n - 5 : -1, row < 4 ? n + 5 : -1, col > 0 ? n - 1 : -1, col < 4 ? n + 1 : -1].forEach(function (i) {
      if (i >= 0 && i < 25) cells[i] = !cells[i];
    });
  }
  function renderLights() {
    return '<div class="panel-top"><span class="micro-label">PLAN EACH MOVE</span><span class="question-count">Moves: ' + game.moves + '</span></div>' +
      '<p class="question-help">Goal: turn every light off. Tapping a square toggles it and its up, down, left and right neighbours.</p><div class="light-grid">' +
      game.cells.map(function (on, i) { return '<button type="button" class="light-cell ' + (on ? 'on' : '') + '" data-action="light-toggle" data-index="' + i + '" aria-label="Light ' + (i + 1) + ', ' + (on ? 'on' : 'off') + '"></button>'; }).join('') +
      '</div><div class="action-row"><button type="button" class="secondary-button" data-action="lights-reset">Reset puzzle</button></div>';
  }
  function renderMastermind() {
    const history = game.history.length ? '<ul class="mm-history">' + game.history.map(function (h, i) {
      return '<li class="mm-row"><span class="micro-label">TRY ' + (i + 1) + '</span><span class="mm-code">' + h.guess.join(' ') + '</span><span class="mm-feedback">' + h.exact + ' exact · ' + h.misplaced + ' misplaced</span></li>';
    }).join('') + '</ul>' : '<p class="answer-note">No guesses yet. Your first clue starts after your first try.</p>';
    const selects = [0,1,2,3].map(function (i) {
      return '<select class="mm-select" data-mm-pos="' + i + '" aria-label="Digit ' + (i + 1) + '">' + [1,2,3,4,5,6].map(function (n) { return '<option value="' + n + '" ' + (n === i + 1 ? 'selected' : '') + '>' + n + '</option>'; }).join('') + '</select>';
    }).join('');
    return '<div class="panel-top"><span class="micro-label">CRACK THE CODE</span><span class="question-count">' + game.attempts + ' / 8 tries</span></div>' +
      '<p class="question-help">Find the secret code of four different digits (1–6). Exact = right digit, right place. Misplaced = right digit, wrong place.</p>' +
      history + '<div class="mm-inputs">' + selects + '</div><div class="action-row"><button class="primary-button" type="button" data-action="mm-guess">Submit guess ↗</button></div>';
  }
  function renderSudoku() {
    return '<div class="panel-top"><span class="micro-label">4 × 4 SUDOKU</span><span class="question-count">Numbers 1–4</span></div>' +
      '<p class="question-help">Each row, column and 2×2 box must contain 1, 2, 3 and 4 once each. Tap an empty cell, then choose a digit.</p>' +
      '<div class="sudoku-grid">' + game.board.map(function (v, i) {
        return '<button type="button" class="sudoku-cell ' + (game.givens[i] ? 'given' : '') + ' ' + (game.selected === i ? 'selected' : '') + '" data-action="sudoku-cell" data-index="' + i + '" aria-label="Cell ' + (i + 1) + (game.givens[i] ? ', fixed ' + v : ', ' + (v || 'empty')) + '">' + (v || '') + '</button>';
      }).join('') + '</div><div class="digit-pad">' + [1,2,3,4].map(function (n) { return '<button type="button" class="digit-button" data-action="sudoku-value" data-value="' + n + '">' + n + '</button>'; }).join('') +
      '<button type="button" class="digit-button erase" data-action="sudoku-value" data-value="0">Erase</button></div><div class="action-row"><button type="button" class="primary-button" data-action="sudoku-check">Check grid ↗</button><button type="button" class="secondary-button" data-action="sudoku-reset">Reset</button></div>';
  }
  function renderRiver() {
    const names = { farmer: '🧑‍🌾 Farmer', wolf: '🐺 Wolf', goat: '🐐 Goat', cabbage: '🥬 Cabbage' };
    const left = Object.keys(game.sides).filter(function (k) { return game.sides[k] === 0; }), right = Object.keys(game.sides).filter(function (k) { return game.sides[k] === 1; });
    return '<div class="panel-top"><span class="micro-label">SAFE CROSSING</span><span class="question-count">' + game.moves + ' crossings</span></div>' +
      '<p class="question-help">The farmer can take only one passenger at a time. The wolf cannot be left alone with the goat, and the goat cannot be left alone with the cabbage.</p>' +
      '<div class="river-banks"><div class="river-bank"><h3>LEFT BANK</h3><div class="river-people">' + left.map(function (k) { return '<span class="river-person">' + names[k] + '</span>'; }).join('') + '</div></div><div class="river-boat" aria-hidden="true">⛵<small style="display:block;font-size:9px;color:#85839e">RIVER</small></div><div class="river-bank"><h3>RIGHT BANK</h3><div class="river-people">' + right.map(function (k) { return '<span class="river-person">' + names[k] + '</span>'; }).join('') + '</div></div></div>' +
      '<p class="answer-note">Choose what the farmer takes across:</p><div class="river-select">' + [{k:'alone',t:'Alone'},{k:'wolf',t:'Wolf'},{k:'goat',t:'Goat'},{k:'cabbage',t:'Cabbage'}].map(function (o) {
        return '<button type="button" class="river-choice ' + (game.passenger === o.k ? 'active' : '') + '" data-action="river-passenger" data-value="' + o.k + '">' + o.t + '</button>';
      }).join('') + '</div><div class="action-row"><button type="button" class="primary-button" data-action="river-cross">Cross river ↗</button><button type="button" class="secondary-button" data-action="river-reset">Restart</button></div>';
  }
  function handleRiverCross() {
    const passenger = game.passenger;
    if (passenger !== 'alone' && game.sides[passenger] !== game.sides.farmer) { showToast('That passenger is on the other bank.'); return; }
    const next = game.sides.farmer === 0 ? 1 : 0;
    game.sides.farmer = next; if (passenger !== 'alone') game.sides[passenger] = next;
    game.moves += 1;
    const s = game.sides, wolfGoat = s.wolf === s.goat && s.farmer !== s.wolf, goatCabbage = s.goat === s.cabbage && s.farmer !== s.goat;
    if (wolfGoat || goatCabbage) {
      finishGame(false, wolfGoat ? 'The wolf and goat were left alone together. Think about which passenger must never be left behind.' : 'The goat and cabbage were left alone together. Plan the return trips more carefully.', 0); return;
    }
    if (s.farmer === 1 && s.wolf === 1 && s.goat === 1 && s.cabbage === 1) {
      finishGame(true, 'Everyone made it across safely in ' + game.moves + ' crossings. Great planning!', Math.max(100, 220 - game.moves * 10)); return;
    }
    renderActive();
  }

  const SEQUENCES = [
    { series: ['2','4','8','16'], options: ['18','24','30','32'], answer: '32', explain: 'Each number doubles: 2, 4, 8, 16, 32.' },
    { series: ['1','4','9','16'], options: ['20','24','25','36'], answer: '25', explain: 'These are square numbers: 1², 2², 3², 4², so the next is 5² = 25.' },
    { series: ['3','6','11','18'], options: ['25','27','28','29'], answer: '27', explain: 'The differences are +3, +5, +7; next is +9, giving 27.' },
    { series: ['2','3','5','8','12'], options: ['15','16','17','18'], answer: '17', explain: 'Add 1, then 2, then 3, then 4; next add 5 to get 17.' },
    { series: ['81','27','9','3'], options: ['0','1','2','6'], answer: '1', explain: 'Divide by 3 each time. 3 ÷ 3 = 1.' },
    { series: ['1','1','2','3','5'], options: ['6','7','8','10'], answer: '8', explain: 'Each term is the sum of the two previous terms: 3 + 5 = 8.' }
  ];
  const LOGIC_QUESTIONS = [
    { prompt: 'A bat and a ball cost ₹110 together. The bat costs ₹100 more than the ball. What does the ball cost?', options: ['₹5','₹10','₹15','₹20'], answer: '₹5', explain: 'If the ball costs ₹5, the bat costs ₹105: together that is ₹110.' },
    { prompt: 'You overtake the runner in second place during a race. Which place are you in now?', options: ['First','Second','Third','Cannot tell'], answer: 'Second', explain: 'You take the position of the person you overtook: second place.' },
    { prompt: 'All Zips are Zaps. Some Zaps are Zops. Which statement must be true?', options: ['All Zips are Zops','Some Zips are Zops','All Zips are Zaps','No Zaps are Zips'], answer: 'All Zips are Zaps', explain: 'That is the only statement guaranteed by the first clue. The overlap with Zops is not guaranteed.' },
    { prompt: 'A drawer has red and blue socks. In complete darkness, what is the minimum number to take to guarantee a matching pair?', options: ['2','3','4','5'], answer: '3', explain: 'With two colours, three socks guarantee that at least two share a colour.' },
    { prompt: 'Five machines make five items in five minutes. How long would 100 identical machines take to make 100 items?', options: ['5 minutes','20 minutes','100 minutes','500 minutes'], answer: '5 minutes', explain: 'Each machine makes one item in five minutes, so 100 machines make 100 items in five minutes.' },
    { prompt: 'A clock takes 5 seconds to strike 6 times. At the same speed, how long to strike 12 times?', options: ['10 seconds','11 seconds','12 seconds','15 seconds'], answer: '11 seconds', explain: 'Six strikes have five gaps. Twelve strikes have eleven gaps, each one second long.' }
  ];
  const PATTERNS = [
    { visual: '<div class="matrix"><span class="matrix-cell">●</span><span class="matrix-cell">○</span><span class="matrix-cell">●</span><span class="matrix-cell">○</span><span class="matrix-cell">●</span><span class="matrix-cell">○</span><span class="matrix-cell">●</span><span class="matrix-cell">○</span><span class="matrix-cell">?</span></div>', options: ['●','○','■','▲'], answer: '●', explain: 'The symbols alternate filled, empty, filled across every row and column.' },
    { visual: '<div class="matrix"><span class="matrix-cell">▲</span><span class="matrix-cell">▲▲</span><span class="matrix-cell">▲▲▲</span><span class="matrix-cell">●</span><span class="matrix-cell">●●</span><span class="matrix-cell">●●●</span><span class="matrix-cell">■</span><span class="matrix-cell">■■</span><span class="matrix-cell">?</span></div>', options: ['■','■■','■■■','●●●'], answer: '■■■', explain: 'Each row keeps one shape and increases its count from one to three.' },
    { visual: '<div class="matrix"><span class="matrix-cell">↑</span><span class="matrix-cell">→</span><span class="matrix-cell">↓</span><span class="matrix-cell">→</span><span class="matrix-cell">↓</span><span class="matrix-cell">←</span><span class="matrix-cell">↓</span><span class="matrix-cell">←</span><span class="matrix-cell">?</span></div>', options: ['↑','→','↓','←'], answer: '↑', explain: 'Each row rotates the arrow one step clockwise from the previous row.' },
    { visual: '<div class="matrix"><span class="matrix-cell">1</span><span class="matrix-cell">2</span><span class="matrix-cell">3</span><span class="matrix-cell">2</span><span class="matrix-cell">3</span><span class="matrix-cell">4</span><span class="matrix-cell">3</span><span class="matrix-cell">4</span><span class="matrix-cell">?</span></div>', options: ['4','5','6','7'], answer: '5', explain: 'Every row increases by one from left to right and from top to bottom.' }
  ];
  const WORDS = [
    { scramble: 'NIBRA', options: ['BRAIN','BRING','TRAIN','BRINE'], answer: 'BRAIN', explain: 'BRAIN uses the letters B, R, A, I and N exactly once.' },
    { scramble: 'CILOG', options: ['CLOUD','LOGIC','GLOCK','LOCAL'], answer: 'LOGIC', explain: 'LOGIC is made from L, O, G, I and C.' },
    { scramble: 'YROMTEEG', options: ['MEMORY','GEOMETRY','MOMENT','ENORMOUS'], answer: 'GEOMETRY', explain: 'GEOMETRY matches all eight letters.' },
    { scramble: 'CUSFO', options: ['SCOUF','FOCUS','SCOUT','CLOUS'], answer: 'FOCUS', explain: 'FOCUS is spelled F, O, C, U, S.' },
    { scramble: 'NATRPET', options: ['PARENT','PATTERN','PAINTER','PANTHER'], answer: 'PATTERN', explain: 'PATTERN uses the letters P, A, T, T, E, R, N.' },
    { scramble: 'ZLUZEP', options: ['PUZZLE','PUZZEL','PIZZLE','PUFFLE'], answer: 'PUZZLE', explain: 'PUZZLE is a challenge that needs reasoning.' }
  ];

  function onClick(e) {
    const btn = e.target.closest('button, a[data-action]'); if (!btn) return;
    const action = btn.dataset.action; if (!action) return;
    if (action === 'home') { e.preventDefault(); renderHome(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (action === 'open') { startGame(btn.dataset.id); return; }
    if (action === 'play-first') { startGame('sequence'); return; }
    if (action === 'restart') { startGame(activeId); return; }
    if (action === 'answer') { answerChoice(Number(btn.dataset.index)); return; }
    if (action === 'memory-cell') {
      if (!game || game.phase !== 'guess' || game.result) return;
      const n = Number(btn.dataset.index), i = game.selected.indexOf(n);
      if (i >= 0) game.selected.splice(i, 1);
      else if (game.selected.length < game.count) game.selected.push(n);
      renderActive(); return;
    }
    if (action === 'memory-clear') { game.selected = []; renderActive(); return; }
    if (action === 'memory-check') {
      const ok = game.selected.length === game.targets.length && game.targets.every(function (n) { return game.selected.indexOf(n) >= 0; });
      finishGame(ok, ok ? 'Perfect recall. You matched every glowing square.' : 'The positions did not match this time. Focus on the shape and spacing next round.', ok ? 120 + game.count * 10 : 0); return;
    }
    if (action === 'math-answer') { handleMath(Number(btn.dataset.index)); return; }
    if (action === 'light-toggle') {
      const n = Number(btn.dataset.index); flipLight(game.cells, n); game.moves += 1;
      if (game.cells.every(function (v) { return !v; })) finishGame(true, 'Every light is off in ' + game.moves + ' moves. Strong planning!', Math.max(50, 180 - game.moves * 5));
      else renderActive();
      return;
    }
    if (action === 'lights-reset') { startGame('lights'); return; }
    if (action === 'mm-guess') {
      const guess = Array.from(document.querySelectorAll('[data-mm-pos]')).map(function (s) { return Number(s.value); });
      let exact = 0, targetRemainder = [], guessRemainder = [];
      for (let i = 0; i < 4; i++) { if (guess[i] === game.code[i]) exact += 1; else { targetRemainder.push(game.code[i]); guessRemainder.push(guess[i]); } }
      let misplaced = 0;
      guessRemainder.forEach(function (n) { const i = targetRemainder.indexOf(n); if (i >= 0) { misplaced += 1; targetRemainder.splice(i, 1); } });
      game.history.push({ guess: guess, exact: exact, misplaced: misplaced }); game.attempts += 1;
      if (exact === 4) { finishGame(true, 'You cracked the code in ' + game.attempts + ' tries. Excellent deduction!', Math.max(100, 240 - game.attempts * 15)); return; }
      if (game.attempts >= 8) { finishGame(false, 'The secret code was ' + game.code.join(' ') + '. Use exact and misplaced feedback to narrow it down next time.', 0); return; }
      renderActive(); return;
    }
    if (action === 'sudoku-cell') { if (!game.givens[Number(btn.dataset.index)]) game.selected = Number(btn.dataset.index); renderActive(); return; }
    if (action === 'sudoku-value') {
      if (game.givens[game.selected]) { showToast('Choose an empty cell first.'); return; }
      game.board[game.selected] = Number(btn.dataset.value); renderActive(); return;
    }
    if (action === 'sudoku-check') {
      if (game.board.every(function (n, i) { return n === game.solution[i]; })) finishGame(true, 'Every row, column and box is correct. Neat solving!', 180);
      else showToast('Not solved yet. Check every row, column and box.');
      return;
    }
    if (action === 'sudoku-reset') { startGame('sudoku'); return; }
    if (action === 'river-passenger') { game.passenger = btn.dataset.value; renderActive(); return; }
    if (action === 'river-cross') { handleRiverCross(); return; }
    if (action === 'river-reset') { startGame('river'); return; }
    if (action === 'install') {
      if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice.then(function (choice) { if (choice && choice.outcome === 'accepted') showToast('BrainForge is being installed.'); installPrompt = null; }).catch(function () { installPrompt = null; });
      } else showToast('Use your browser menu and choose “Install app” or “Add to Home screen”.');
    }
  }
  document.addEventListener('click', onClick);
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installPrompt = e; });
  window.addEventListener('appinstalled', function () { showToast('BrainForge installed successfully.'); installPrompt = null; });
  renderHome();
})();