'use strict';
(function () {
  const KEY = 'ani-bran-audio-v4';
  const $ = id => document.getElementById(id);
  const tracks = [
    'https://soundimage.org/wp-content/uploads/2014/05/Space-for-Thought.mp3',
    'https://soundimage.org/wp-content/uploads/2015/07/Quiet-Contemplation.mp3',
    'https://soundimage.org/wp-content/uploads/2014/05/Another-Goodbye.mp3'
  ];
  let prefs = readPrefs(KEY) || readPrefs('ani-bran-audio-v3') || {};
  let musicOn = prefs.on !== false;
  let volume = clamp(prefs.volume, 0, 100, 92);
  if (volume < 85) volume = 92;
  let player = null, trackIndex = Math.floor(Math.random() * tracks.length), audioReady = false;
  let ctx = null, fxBus = null;

  function readPrefs(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }
  function clamp(v, min, max, fallback) { v = Number(v); return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ on: musicOn, volume: volume })); } catch (_) {} }

  function syncUI() {
    if ($('music-toggle')) $('music-toggle').checked = musicOn;
    if ($('music-volume')) { $('music-volume').max = '100'; $('music-volume').value = String(volume); }
    if ($('volume-value')) $('volume-value').textContent = volume + '%';
    if ($('sound-status')) $('sound-status').textContent = musicOn
      ? 'Musik instrumental deep, santai dan emosional. Musik berganti otomatis.'
      : 'Musik latar dimatikan. Suara tombol tetap aktif.';
    if ($('sound-float')) $('sound-float').classList.toggle('sound-active', musicOn);
  }

  function ensurePlayer() {
    if (player) return true;
    player = document.createElement('audio');
    player.id = 'ani-bran-background-audio';
    player.preload = 'auto';
    player.loop = false;
    player.setAttribute('aria-hidden', 'true');
    player.style.display = 'none';
    player.volume = volume / 100;
    document.body.appendChild(player);
    player.addEventListener('ended', function () {
      if (!musicOn) return;
      trackIndex = (trackIndex + 1) % tracks.length;
      playTrack(true);
    });
    player.addEventListener('error', function () {
      // If an external host is unavailable, leave the existing UI usable without throwing errors.
      audioReady = false;
    });
    audioReady = true;
    return true;
  }

  function playTrack(forceNew) {
    if (!musicOn || !ensurePlayer()) return;
    if (forceNew) trackIndex = (trackIndex + (Math.random() > 0.55 ? 1 : 0)) % tracks.length;
    const url = tracks[trackIndex];
    if (player.src !== url) player.src = url;
    player.volume = volume / 100;
    const p = player.play();
    if (p && p.catch) p.catch(function () { /* Browser audio policy: next user tap will retry. */ });
  }

  function stopMusic() {
    if (!player) return;
    player.pause();
    player.currentTime = 0;
  }

  function ensureFx() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      fxBus = ctx.createGain();
      fxBus.gain.value = Math.min(1, Math.max(0.7, volume / 100));
      fxBus.connect(ctx.destination);
      return true;
    } catch (_) { ctx = null; return false; }
  }

  function chimeNote(midi, delay, gainAmount) {
    if (!ctx || !fxBus) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainAmount, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
    osc.connect(gain); gain.connect(fxBus);
    osc.start(now); osc.stop(now + 0.7);
  }

  function buttonChime() {
    if (!ensureFx()) return;
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    chimeNote(76, 0, 0.10);
    chimeNote(81, 0.055, 0.075);
    chimeNote(84, 0.11, 0.055);
  }

  function startMusic() {
    if (!musicOn) return;
    playTrack(false);
  }

  function setupControls() {
    const button = $('sound-float'), panel = $('sound-panel');
    if (button && panel) {
      button.addEventListener('click', function () {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        syncUI();
      });
      if ($('close-sound')) $('close-sound').addEventListener('click', function () {
        panel.hidden = true;
        button.setAttribute('aria-expanded', 'false');
      });
      if ($('music-toggle')) $('music-toggle').addEventListener('change', function () {
        musicOn = this.checked;
        save(); syncUI();
        if (musicOn) startMusic(); else stopMusic();
      });
      if ($('music-volume')) $('music-volume').addEventListener('input', function () {
        volume = clamp(this.value, 0, 100, 92);
        if (player) player.volume = volume / 100;
        if (fxBus) fxBus.gain.value = Math.min(1, Math.max(0.7, volume / 100));
        save(); syncUI();
      });
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
    if (document.hidden) { if (player) player.pause(); }
    else if (musicOn) startMusic();
  });

  setupControls();
  save();
  // The browser may block autoplay; the first tap anywhere retries the music.
  if (musicOn) startMusic();
})();