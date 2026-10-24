const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const appPath = path.join(__dirname, 'app.js');
let source = fs.readFileSync(appPath, 'utf8');
const insertionPoint = '  const saved=data.active;';
if (!source.includes(insertionPoint)) throw new Error('Cannot attach game smoke tests: app initialization marker missing.');
source = source.replace(insertionPoint, '  window.__aniTest = { GAMES, makeGame, sudokuCount, applySynapse };' + insertionPoint);

const elements = new Map();
function element() {
  return { textContent: '', innerHTML: '', hidden: false, style: {}, value: '',
    classList: { add() {}, remove() {} } };
}
const document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};
const store = new Map();
const window = { addEventListener() {}, scrollTo() {} };
const sandbox = {
  document, window,
  localStorage: { getItem(k) { return store.get(k) || null; }, setItem(k, v) { store.set(k, v); } },
  setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
  console
};

vm.runInNewContext(source, sandbox, { timeout: 10000 });
const test = window.__aniTest;
if (!test || test.GAMES.length !== 12) throw new Error('App startup failed or not all 10 games registered.');
const rendered = elements.get('#game-grid').innerHTML;
if (!rendered || (rendered.match(/class="game-card"/g) || []).length !== 12) {
  throw new Error('Homepage did not render all 12 game buttons.');
}
let instances = 0;
let trickyLevels = 0, synapseLevels = 0;
for (let level = 1; level <= 400; level++) {
  for (const meta of test.GAMES) {
    const g = test.makeGame(meta.id, level);
    if (!g || typeof g !== 'object') throw new Error('Missing ' + meta.id + ' level ' + level);
    if (g.q && g.q.options) {
      if (!Array.isArray(g.q.options) || g.q.options.length !== 4 ||
          new Set(g.q.options.map(String)).size !== 4 ||
          !g.q.options.map(String).includes(String(g.q.answer))) {
        throw new Error('Invalid answer options in ' + meta.id + ' level ' + level);
      }
    }
    if (meta.id === 'word' && g.q.scramble === g.q.answer) {
      throw new Error('Word was not scrambled at level ' + level);
    }
    if (meta.id === 'tricky') {
      if (g.q.type === 'tap' && (!Array.isArray(g.q.objects) || g.q.target < 0 || g.q.target >= g.q.objects.length)) {
        throw new Error('Invalid trick puzzle at level ' + level);
      }
      if (g.q.type === 'choice' && (!g.q.options || !g.q.options.includes(String(g.q.answer)))) {
        throw new Error('Invalid trick answer at level ' + level);
      }
      trickyLevels++;
    }
    if (meta.id === 'synapse') {
      if (g.steps !== 2 + Math.floor((level - 1) / 80) || g.solution.length !== g.steps) throw new Error('Invalid signal puzzle steps at level ' + level);
      const signal = g.solution.reduce((state, op) => test.applySynapse(state, op), Object.assign({}, g.start));
      if (signal.value !== g.target.value || signal.direction !== g.target.direction || signal.color !== g.target.color) throw new Error('Signal solution does not reach target at level ' + level);
      synapseLevels++;
    }
    if (meta.id === 'memory' && (g.targets.length !== g.count || new Set(g.targets).size !== g.count)) {
      throw new Error('Memory target issue at level ' + level);
    }
    if (meta.id === 'mastermind' && new Set(g.code).size !== g.code.length) {
      throw new Error('Duplicate code digits at level ' + level);
    }
    if (meta.id === 'sudoku' && (test.sudokuCount(g.board.slice(), 2) !== 1 || g.selected < 0)) {
      throw new Error('Sudoku must have one solution and at least one empty cell at level ' + level);
    }
    if (meta.id === 'lights' && (g.cells.length !== 25 || g.cells.every(v => !v))) {
      throw new Error('Invalid lights board at level ' + level);
    }
    instances++;
  }
}
console.log('PASS: app started and rendered 12 game buttons.');
console.log('PASS: generated ' + instances + ' game-level instances; answer choices, word scrambling, memory targets, code digits, Sudoku uniqueness, trick puzzles and signal solutions checked.');
console.log('PASS: ' + trickyLevels + ' Otak Usil puzzles and ' + synapseLevels + ' Mesin Sinyal puzzles validated.');
