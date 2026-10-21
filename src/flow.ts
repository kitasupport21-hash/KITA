const RIPPLE_CLASS = 'flow-ripple';

function addRipple(button: HTMLButtonElement, event: PointerEvent) {
  if (button.disabled) return;

  button.querySelectorAll(`.${RIPPLE_CLASS}`).forEach((node) => node.remove());

  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.35;
  const ripple = document.createElement('span');
  ripple.className = RIPPLE_CLASS;
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  button.appendChild(ripple);

  window.setTimeout(() => ripple.remove(), 520);
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Element | null;
  const button = target?.closest('button') as HTMLButtonElement | null;
  if (!button) return;
  addRipple(button, event);
}

function markFlowReady() {
  document.documentElement.classList.add('flow-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', markFlowReady, { once: true });
} else {
  markFlowReady();
}

document.addEventListener('pointerdown', onPointerDown, { passive: true });

// Respect Android/browser accessibility preferences while keeping normal motion fluid.
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const syncMotionPreference = () => {
  document.documentElement.classList.toggle('reduce-motion', motionQuery.matches);
};
syncMotionPreference();
motionQuery.addEventListener?.('change', syncMotionPreference);
