const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const appPath = path.join(__dirname, 'app.js');
let source = fs.readFileSync(appPath, 'utf8');
const misiPath = path.join(__dirname, 'misi-nalar.js');
source = fs.readFileSync(misiPath, 'utf8') + '\n' + source;
const insertionPoint = '  const saved=data.active;';
if (!source.includes(insertionPoint)) throw new Error('Cannot attach game smoke tests: app initialization marker missing.');
source = source.replace(insertionPoint, '  window.__aniTest = { GAMES, makeGame, sudokuCount, applySynapse, start, click, getGame: () => game, getData: () => data };' + insertionPoint);

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
if (!test || test.GAMES.length !== 13) throw new Error('App startup failed or not all 13 games registered.');
const rendered = elements.get('#game-grid').innerHTML;
if (!rendered || (rendered.match(/class="game-card"/g) || []).length !== 13) {
  throw new Error('Homepage did not render all 13 game buttons.');
}
let instances = 0;
let trickyLevels = 0, synapseLevels = 0;
const misiPrompts = new Set(), misiPuzzles = new Set();
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
    if (meta.id === 'misi-nalar') {
      if (!g.q || !g.q.prompt || !g.q.story || !g.q.puzzleKey) throw new Error('Missing Misi Nalar question or puzzle at level ' + level);
      misiPrompts.add(g.q.prompt); misiPuzzles.add(g.q.puzzleKey);
      if (g.q.mode === 2 && (!Array.isArray(g.q.cards) || g.q.cards.length !== 4 || g.q.order.length !== 4)) throw new Error('Invalid order puzzle at Misi Nalar level ' + level);
      if ([0,7].includes(g.q.mode) && (!Array.isArray(g.q.objects) || g.q.target < 0 || g.q.target >= g.q.objects.length)) throw new Error('Invalid tap puzzle at Misi Nalar level ' + level);
      if (g.q.mode !== 2 && g.q.mode !== 0 && g.q.mode !== 7 && (!Array.isArray(g.q.options) || g.q.options.length !== 4 || !g.q.options.includes(String(g.q.answer)))) throw new Error('Invalid choices at Misi Nalar level ' + level);
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
if(misiPrompts.size!==400||misiPuzzles.size!==400)throw new Error('Misi Nalar must have 400 unique questions and 400 unique puzzles.');
// Simulate delegated button clicks so we test the new games' real completion flow.
test.start('tricky', 1);
let state = test.getGame();
if (state.type !== 'tap' || state.q.target < 0) throw new Error('Otak Usil did not start a tap puzzle.');
test.click({target: {closest: () => ({dataset: {action: 'tricky-pick', index: String(state.q.target)}})}});
if (!test.getData().games.tricky.completed.includes(1) || test.getData().games.tricky.unlocked !== 2) {
  throw new Error('Otak Usil completion did not save progress or unlock level 2.');
}
test.start('synapse', 1);
state = test.getGame();
state.selected = state.solution.slice();
test.click({target: {closest: () => ({dataset: {action: 'synapse-run'}})}});
if (!test.getData().games.synapse.completed.includes(1) || test.getData().games.synapse.unlocked !== 2) {
  throw new Error('Mesin Sinyal completion did not save progress or unlock level 2.');
}
const saved = JSON.parse(store.get('anibran-progress-v1'));
if (!saved.games.tricky.completed.includes(1) || !saved.games.synapse.completed.includes(1)) {
  throw new Error('Progress was not persisted in localStorage.');
}
console.log('PASS: Otak Usil and Mesin Sinyal button interactions complete levels and persist progress.');

test.start('misi-nalar',1);
state=test.getGame();
if(state.q.mode!==0)throw new Error('Misi Nalar did not start with its first detective puzzle.');
test.click({target:{closest:()=>({dataset:{action:'misi-pick',index:String(state.q.target)}})}});
if(!test.getData().games['misi-nalar'].completed.includes(1)||test.getData().games['misi-nalar'].unlocked!==2)throw new Error('Misi Nalar detective puzzle did not unlock level 2.');
test.start('misi-nalar',2);
state=test.getGame();
test.click({target:{closest:()=>({dataset:{action:'misi-answer',index:String(state.q.options.indexOf(state.q.answer))}})}});
if(!test.getData().games['misi-nalar'].completed.includes(2)||test.getData().games['misi-nalar'].unlocked!==3)throw new Error('Misi Nalar route puzzle did not unlock level 3.');
test.start('misi-nalar',3);
state=test.getGame();
for(let nextId=0;nextId<state.q.order.length;nextId++){const cardIndex=state.q.cards.findIndex(c=>c.id===nextId);test.click({target:{closest:()=>({dataset:{action:'misi-order-pick',index:String(cardIndex)}})}});}
if(!test.getData().games['misi-nalar'].completed.includes(3)||test.getData().games['misi-nalar'].unlocked!==4)throw new Error('Misi Nalar ordered puzzle did not unlock level 4.');
const savedMisi=JSON.parse(store.get('anibran-progress-v1'));
if(!savedMisi.games['misi-nalar'].completed.includes(1)||!savedMisi.games['misi-nalar'].completed.includes(2)||!savedMisi.games['misi-nalar'].completed.includes(3))throw new Error('Misi Nalar progress was not persisted.');
console.log('PASS: Misi Nalar detective, route and sequence interactions unlock levels and persist progress.');
console.log('PASS: all 400 Misi Nalar questions and puzzle signatures are unique.');
console.log('PASS: app started and rendered 13 game buttons.');
console.log('PASS: generated ' + instances + ' game-level instances; answer choices, word scrambling, memory targets, code digits, Sudoku uniqueness, trick puzzles and signal solutions checked.');
console.log('PASS: ' + trickyLevels + ' Otak Usil puzzles and ' + synapseLevels + ' Mesin Sinyal puzzles validated.');
