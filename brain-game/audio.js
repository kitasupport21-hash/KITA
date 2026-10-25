'use strict';
(function () {
  const MUSIC_URL = 'https://gen.daydream.live/v1/songs/sng_t28XEfrsNfG4i2bJ7DTs1Q/2.mp3';
  const PREF_KEY = 'ani-bran-audio-v5';
  const POSITION_KEY = 'ani-bran-song-position-v1';
  const $ = id => document.getElementById(id);
  let prefs = readPrefs(PREF_KEY);
  if (!prefs) {
    const previous = readPrefs('ani-bran-audio-v4') || readPrefs('ani-bran-audio-v3') || {};
    prefs = { volume: previous.volume };
  }
  let musicOn = prefs.on !== false;
  let volume = clamp(prefs.volume, 0, 100, 92);
  let player = null, lastPositionSave = 0, resumePosition = readPosition(), resumeApplied = false;

  function readPrefs(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function clamp(value, min, max, fallback) {
    value = Number(value);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  }
  function readPosition() {
    try {
      const value = Number(sessionStorage.getItem(POSITION_KEY) || 0);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch (_) { return 0; }
  }
  function savePosition() {
    if (!player || !Number.isFinite(player.currentTime) || player.currentTime <= 0) return;
    const now = Date.now();
    if (now - lastPositionSave < 1800 && !document.hidden) return;
    lastPositionSave = now;
    try { sessionStorage.setItem(POSITION_KEY, String(player.currentTime)); } catch (_) {}
  }
  function applyResumePosition() {
    if (!player || resumeApplied || !Number.isFinite(player.duration) || player.duration <= 0) return;
    resumeApplied = true;
    if (resumePosition > 0) {
      try { player.currentTime = resumePosition % player.duration; } catch (_) {}
    }
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
    player = new Audio();
    player.id = 'ani-bran-background-audio';
    player.preload = 'auto';
    player.loop = true;
    player.volume = volume / 100;
    player.setAttribute('aria-hidden', 'true');
    player.addEventListener('loadedmetadata', applyResumePosition);
    player.addEventListener('durationchange', applyResumePosition);
    player.addEventListener('timeupdate', savePosition);
    player.addEventListener('pause', savePosition);
    player.addEventListener('playing', function () {
      setStatus('Musik sedang diputar dan akan berulang otomatis.');
      if ($('sound-float')) $('sound-float').classList.toggle('sound-active', musicOn);
    });
    player.addEventListener('error', function () {
      setStatus('Musik tidak dapat dimuat. Periksa koneksi internet lalu coba lagi.');
    });
    player.src = MUSIC_URL;
    return player;
  }
  function startMusic() {
    if (!musicOn || document.hidden) return;
    const audio = ensurePlayer();
    audio.loop = true;
    audio.volume = volume / 100;
    if (audio.readyState >= 1) applyResumePosition();
    if (!audio.paused) return;
    try {
      const result = audio.play();
      if (result && result.catch) result.catch(function () {
        setStatus('Jika pemutaran otomatis diblokir browser, ketuk layar sekali untuk mengizinkannya.');
      });
    } catch (_) {
      setStatus('Jika pemutaran otomatis diblokir browser, ketuk layar sekali untuk mengizinkannya.');
    }
  }
  function stopMusic() {
    savePosition();
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
    if (!musicOn) setStatus('Musik dimatikan.');
    else if (player && !player.paused) setStatus('Musik sedang diputar dan akan berulang otomatis.');
    else setStatus('Musik akan dilanjutkan otomatis saat halaman dibuka.');
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
    document.addEventListener('pointerdown', function () {
      if (musicOn) startMusic();
    }, true);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        if (musicOn) startMusic();
      }
    }, true);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopMusic();
      else if (musicOn) startMusic();
    });
    window.addEventListener('pagehide', stopMusic);
    window.addEventListener('pageshow', function () {
      if (!document.hidden && musicOn) startMusic();
    });
    window.addEventListener('beforeunload', stopMusic);
    window.__aniBranPauseMusic = stopMusic;
    window.__aniBranResumeMusic = function () {
      if (!document.hidden && musicOn) startMusic();
    };
    syncUI();
    if (musicOn && !document.hidden) startMusic();
  }
  setup();
})();