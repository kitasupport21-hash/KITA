'use strict';
(function () {
  const $ = id => document.getElementById(id);
  let ctx = null, fxBus = null;
  function syncUI() {
    if ($('music-toggle')) { $('music-toggle').checked = false; $('music-toggle').disabled = true; }
    if ($('music-volume')) { $('music-volume').value = '0'; $('music-volume').disabled = true; }
    if ($('volume-value')) $('volume-value').textContent = '—';
    if ($('sound-status')) $('sound-status').textContent = 'Musik latar lama telah dihapus. Suara tombol tetap aktif.';
    if ($('sound-float')) $('sound-float').classList.remove('sound-active');
  }
  function chime() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!ctx) { ctx = new AC(); fxBus = ctx.createGain(); fxBus.gain.value = 0.85; fxBus.connect(ctx.destination); }
      if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      [76,81,84].forEach(function (midi, i) {
        const now = ctx.currentTime + i * 0.055, osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
        gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.07, now + 0.018); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
        osc.connect(gain); gain.connect(fxBus); osc.start(now); osc.stop(now + 0.7);
      });
    } catch (_) {}
  }
  function setup() {
    const button = $('sound-float'), panel = $('sound-panel');
    if (button && panel) button.addEventListener('click', function () { panel.hidden = !panel.hidden; button.setAttribute('aria-expanded', String(!panel.hidden)); syncUI(); });
    if ($('close-sound')) $('close-sound').addEventListener('click', function () { if (panel) panel.hidden = true; if (button) button.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('pointerdown', function (e) { const t = e.target && e.target.closest ? e.target.closest('button, a, [role="button"]') : null; if (t && !t.disabled) chime(); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { const t = e.target && e.target.closest ? e.target.closest('button, a, [role="button"]') : null; if (t && !t.disabled) chime(); } }, true);
    syncUI();
  }
  setup();
})();