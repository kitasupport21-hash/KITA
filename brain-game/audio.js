'use strict';
(function () {
  const MUSIC_URL = 'https://gen.daydream.live/v1/songs/sng_t28XEfrsNfG4i2bJ7DTs1Q/2.mp3';
  const PREF_KEY = 'ani-bran-audio-v4';
  const $ = id => document.getElementById(id);
  let prefs = readPrefs(PREF_KEY) || readPrefs('ani-bran-audio-v3') || {};
  let musicOn = prefs.on !== false;
  let volume = clamp(prefs.volume, 0, 100, 92);
  let player = null, ctx = null, fxBus = null;

  function readPrefs(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function clamp(value, min, max, fallback) {
    value = Number(value);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  }
  function save() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ on: musicOn, volume: volume })); } catch (_) {}
  }
  function setStatus(message) {
    const el = $('sound-status');
    if (el) el.textContent = message;
  }
  function ensurePlayer() {
    if (player) return player;
    player = new Audio(MUSIC_URL);
    player.id = 'ani-bran-background-audio';
    player.preload = 'auto';
    player.loop = true;
    player.volume = volume / 100;
    player.setAttribute('aria-hidden', 'true');
    player.addEventListener('playing', function () {
      setStatus('Musik sedang diputar dan akan berulang otomatis.');
      if ($('sound-float')) $('sound-float').classList.toggle('sound-active', musicOn);
    });
    player.addEventListener('error', function () {
      setStatus('Musik tidak dapat dimuat. Periksa koneksi internet lalu coba lagi.');
    });
    return player;
  }
  function startMusic() {
    if (!musicOn) return;
    const audio = ensurePlayer();
    audio.loop = true;
    audio.volume = volume / 100;
    if (!audio.paused) return;
    try {
      const result = audio.play();
      if (result && result.catch) result.catch(function () {
        setStatus('Ketuk layar sekali lagi agar musik mulai diputar.');
      });
    } catch (_) {
      setStatus('Ketuk layar sekali lagi agar musik mulai diputar.');
    }
  }
  function stopMusic() {
    if (player) player.pause();
  }
  function syncUI() {
    if ($('music-toggle')) {
      $('music-toggle').checked = musicOn;
      $('music-toggle').disabled = false;
    }
    if ($('music-volume')) {
      $('music-volume').max = '100';
      $('music-volume').value = String(volume);
      $('music-volume').disabled = false;
    }
    if ($('volume-value')) $('volume-value').textContent = volume + '%';
    if ($('sound-float')) $('sound-float').classList.toggle('sound-active', musicOn);
    if (!musicOn) setStatus('Musik dimatikan. Suara tombol tetap aktif.');
    else if (player && !player.paused) setStatus('Musik sedang diputar dan akan berulang otomatis.');
    else setStatus('Musik siap. Ketuk layar sekali untuk mulai; lagu yang sama akan berulang.');
  }
  function chime() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!ctx) {
        ctx = new AC();
        fxBus = ctx.createGain();
        fxBus.gain.value = 0.85;
        fxBus.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      [76, 81, 84].forEach(function (midi, i) {
        const now = ctx.currentTime + i * 0.055;
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.07, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
        osc.connect(gain); gain.connect(fxBus);
        osc.start(now); osc.stop(now + 0.7);
      });
    } catch (_) {}
  }
  function setup() {
    const button = $('sound-float'), panel = $('sound-panel');
    if (button && panel) {
      button.addEventListener('click', function () {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        syncUI();
      });
    }
    if ($('close-sound')) $('close-sound').addEventListener('click', function () {
      if (panel) panel.hidden = true;
      if (button) button.setAttribute('aria-expanded', 'false');
    });
    if ($('music-toggle')) $('music-toggle').addEventListener('change', function () {
      musicOn = this.checked;
      save();
      syncUI();
      if (musicOn) startMusic(); else stopMusic();
    });
    if ($('music-volume')) $('music-volume').addEventListener('input', function () {
      volume = clamp(this.value, 0, 100, 92);
      if (player) player.volume = volume / 100;
      save();
      syncUI();
    });
    document.addEventListener('pointerdown', function (event) {
      if (musicOn) startMusic();
      const target = event.target && event.target.closest ? event.target.closest('button, a, [role="button"]') : null;
      if (target && !target.disabled) chime();
    }, true);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        if (musicOn) startMusic();
        const target = event.target && event.target.closest ? event.target.closest('button, a, [role="button"]') : null;
        if (target && !target.disabled) chime();
      }
    }, true);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopMusic();
      else if (musicOn) startMusic();
    });
    syncUI();
  }
  setup();
})();
