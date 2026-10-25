'use strict';
(function () {
  const KEY = 'ani-bran-audio-v3';
  const previous = readPrefs('ani-bran-audio-v2') || readPrefs('ani-bran-room-sound-v1') || {};
  const current = readPrefs(KEY);
  const prefs = current || previous;
  const $ = id => document.getElementById(id);
  let musicOn = prefs.on !== false;
  let volume = current ? clamp(prefs.volume, 0, 100, 82) : clamp(prefs.volume, 0, 100, 68);
  if (!current && volume > 0 && volume < 78) volume = 82;
  let ctx = null, master = null, musicBus = null, fxBus = null, reverb = null, wetBus = null;
  let beatTimer = null, changeTimer = null, melody = [], step = 0, keyRoot = 52, chordSet = [], scaleSet = [];
  function readPrefs(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }
  function clamp(v, min, max, fallback) { v = Number(v); return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ on: musicOn, volume: volume })); } catch (_) {} }
  function syncUI() {
    if ($('music-toggle')) $('music-toggle').checked = musicOn;
    if ($('music-volume')) { $('music-volume').max = '100'; $('music-volume').value = String(volume); }
    if ($('volume-value')) $('volume-value').textContent = volume + '%';
    if ($('sound-status')) $('sound-status').textContent = musicOn
      ? 'Melodi piano instrumental, lembut dan emosional. Musik berganti otomatis.'
      : 'Musik latar dimatikan. Suara tombol tetap aktif.';
    if ($('sound-float')) $('sound-float').classList.toggle('sound-active', musicOn);
  }
  function createReverb() {
    const length = Math.floor(ctx.sampleRate * 2.6);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8) * 0.52;
    }
    reverb = ctx.createConvolver(); reverb.buffer = impulse;
    wetBus = ctx.createGain(); wetBus.gain.value = 0.24;
    reverb.connect(wetBus); wetBus.connect(master);
  }
  function ensureAudio() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14; compressor.knee.value = 18;
      compressor.ratio.value = 3.2; compressor.attack.value = 0.008; compressor.release.value = 0.24;
      musicBus = ctx.createGain(); fxBus = ctx.createGain();
      musicBus.gain.value = musicOn ? 1 : 0; fxBus.gain.value = 1;
      musicBus.connect(master); fxBus.connect(master); master.connect(compressor); compressor.connect(ctx.destination);
      createReverb();
      musicBus.connect(reverb);
      setVolume();
      return true;
    } catch (_) { ctx = null; return false; }
  }
  function setVolume() {
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime((volume / 100) * 0.96, ctx.currentTime, 0.08);
  }
  function resumeAudio() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {}); }
  function envelope(gain, now, peak, attack, hold, release) {
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), now + attack);
    gain.gain.setTargetAtTime(0.0001, now + attack + hold, Math.max(0.09, release / 4));
  }
  // Soft felt-piano voice: fundamental, muted upper partials, quick strike and natural decay.
  function piano(midi, strength, delay, bus) {
    if (!ctx || !bus) return;
    const at = ctx.currentTime + (delay || 0), freq = 440 * Math.pow(2, (midi - 69) / 12);
    [[1, 0.82, 'triangle'], [2.01, 0.18, 'sine'], [3.98, 0.035, 'sine']].forEach(function (part, i) {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
      osc.type = part[2]; osc.frequency.setValueAtTime(freq * part[0], at);
      filter.type = 'lowpass'; filter.frequency.value = i === 0 ? 4200 : 2900; filter.Q.value = 0.6;
      envelope(gain, at, strength * part[1], i === 0 ? 0.012 : 0.018, 0.08, 1.6 + i * 0.2);
      osc.connect(filter); filter.connect(gain); gain.connect(bus); osc.start(at); osc.stop(at + 2.15);
    });
  }
  function padChord(notes, delay) {
    if (!ctx || !musicBus) return;
    const at = ctx.currentTime + (delay || 0);
    notes.forEach(function (midi, index) {
      const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      osc.type = index === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), at);
      filter.type = 'lowpass'; filter.frequency.value = 1000 + index * 280;
      envelope(gain, at, index === 0 ? 0.075 : 0.045, 0.8, 1.8, 2.7);
      osc.connect(filter); filter.connect(gain); gain.connect(musicBus); osc.start(at); osc.stop(at + 5.1);
    });
  }
  function bassNote(midi, delay) {
    if (!ctx || !musicBus) return;
    const at = ctx.currentTime + (delay || 0), osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    osc.type = 'sine'; osc.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), at);
    filter.type = 'lowpass'; filter.frequency.value = 320;
    envelope(gain, at, 0.105, 0.14, 0.42, 1.1);
    osc.connect(filter); filter.connect(gain); gain.connect(musicBus); osc.start(at); osc.stop(at + 1.8);
  }
  function makeComposition() {
    const arrangements = [
      { scale: [0, 2, 3, 5, 7, 10, 12, 14, 15, 17, 19], chords: [[0, 3, 7, 10], [8, 12, 15, 19], [3, 7, 10, 14], [10, 14, 17, 21]] },
      { scale: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19], chords: [[0, 3, 7, 10], [5, 8, 12, 15], [8, 12, 15, 19], [7, 10, 14, 17]] },
      { scale: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19], chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
      { scale: [0, 2, 4, 7, 9, 12, 14, 16, 19], chords: [[0, 4, 7, 9], [7, 11, 14, 16], [9, 12, 16, 19], [5, 9, 12, 14]] }
    ];
    const arrangement = arrangements[Math.floor(Math.random() * arrangements.length)];
    scaleSet = arrangement.scale; chordSet = arrangement.chords;
    keyRoot = 48 + Math.floor(Math.random() * 8);
    const motifs = [
      [7,5,4,2,4,5,7,9,7,5,4,2,1,2,4,5,7,9,10,9,7,5,4,2,4,5,7,5,4,2,1,0],
      [4,5,7,9,7,5,4,2,4,7,9,10,9,7,5,4,2,4,5,7,5,4,2,1,2,4,5,4,2,1,0,0],
      [7,9,10,9,7,5,4,5,7,5,4,2,4,5,7,9,10,12,10,9,7,5,4,2,4,5,4,2,1,2,1,0]
    ];
    melody = motifs[Math.floor(Math.random() * motifs.length)].map(function (degree, i) {
      return keyRoot + ((i % 16 === 7 || i % 16 === 17) ? 24 : 12) + scaleSet[degree % scaleSet.length];
    });
    step = 0;
  }
  function beginSong() {
    if (!ctx || !musicBus || !musicOn) return;
    clearInterval(beatTimer); clearTimeout(changeTimer);
    makeComposition();
    const now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(Math.max(0.0001, musicBus.gain.value), now);
    musicBus.gain.linearRampToValueAtTime(0.72, now + 0.45);
    function bar() {
      if (!musicOn || !ctx || ctx.state !== 'running') return;
      const pos = step % 32, chordIndex = Math.floor(pos / 8) % chordSet.length;
      const beatInBar = pos % 8, chord = chordSet[chordIndex];
      if (beatInBar === 0) {
        padChord(chord.map(n => keyRoot + n), 0);
        bassNote(keyRoot + chord[0] - 12, 0);
        piano(keyRoot + 12 + chord[1], 0.085, 0.015, musicBus);
      }
      if (beatInBar !== 3 && beatInBar !== 7) piano(melody[pos], beatInBar % 4 === 0 ? 0.19 : 0.135, 0.018, musicBus);
      if (beatInBar === 2 || beatInBar === 6) piano(keyRoot + 12 + chord[(beatInBar / 2) % chord.length], 0.048, 0.04, musicBus);
      step++;
    }
    bar(); beatTimer = setInterval(bar, 525);
    changeTimer = setTimeout(function () {
      if (musicBus && ctx && musicOn) musicBus.gain.setTargetAtTime(0.34, ctx.currentTime, 0.8);
      setTimeout(function () { if (musicOn && ctx && ctx.state === 'running') beginSong(); }, 850);
    }, 33000 + Math.floor(Math.random() * 9000));
  }
  function startMusic() {
    if (!musicOn || !ensureAudio()) return;
    resumeAudio();
    if (ctx.state === 'running' && !beatTimer) beginSong();
    else if (!beatTimer) ctx.resume().then(function () { if (musicOn && !beatTimer) beginSong(); }).catch(function () {});
  }
  function stopMusic() {
    clearInterval(beatTimer); clearTimeout(changeTimer); beatTimer = null; changeTimer = null;
    if (musicBus && ctx) musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }
  function buttonChime() {
    if (!ensureAudio()) return;
    resumeAudio();
    piano(76, 0.14, 0, fxBus); piano(79, 0.105, 0.055, fxBus); piano(83, 0.08, 0.105, fxBus);
  }
  function setupControls() {
    const button = $('sound-float'), panel = $('sound-panel');
    if (button && panel) {
      button.addEventListener('click', function () { panel.hidden = !panel.hidden; button.setAttribute('aria-expanded', String(!panel.hidden)); syncUI(); });
      if ($('close-sound')) $('close-sound').addEventListener('click', function () { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); });
      if ($('music-toggle')) $('music-toggle').addEventListener('change', function () { musicOn = this.checked; save(); syncUI(); if (musicOn) startMusic(); else stopMusic(); });
      if ($('music-volume')) $('music-volume').addEventListener('input', function () { volume = clamp(this.value, 0, 100, 82); save(); syncUI(); setVolume(); });
    }
    syncUI();
  }
  document.addEventListener('pointerdown', function (e) {
    const target = e.target && e.target.closest ? e.target.closest('button, a, [role="button"]') : null;
    if (musicOn) startMusic();
    if (target && !target.disabled) buttonChime();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target && e.target.closest ? e.target.closest('button, a, [role="button"]') : null;
      if (musicOn) startMusic();
      if (target && !target.disabled) buttonChime();
    }
  }, true);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (ctx && ctx.state === 'running') ctx.suspend().catch(function () {}); }
    else if (musicOn && ctx) { resumeAudio(); if (!beatTimer) startMusic(); }
  });
  setupControls(); if (musicOn) startMusic(); save();
})();