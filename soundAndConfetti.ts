let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  delaySec = 0,
  volume = 0.08
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function playStartBeep() {
  playTone(660, 0.11, 'triangle', 0, 0.08);
  playTone(880, 0.14, 'triangle', 0.08, 0.09);
}

export function playStopBeep() {
  playTone(587.33, 0.12, 'sine', 0, 0.07);
}

export function playCorrectChime() {
  playTone(523.25, 0.14, 'triangle', 0, 0.08);
  playTone(659.25, 0.14, 'triangle', 0.09, 0.08);
  playTone(783.99, 0.24, 'triangle', 0.18, 0.1);
}

export function playErrorBuzz() {
  playTone(220, 0.16, 'sawtooth', 0, 0.05);
  playTone(185, 0.22, 'sawtooth', 0.12, 0.05);
}

export function playVictoryFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, idx) => {
    playTone(n, idx === notes.length - 1 ? 0.45 : 0.15, 'triangle', idx * 0.11, 0.1);
  });
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
}

export function launchConfetti(intensity: 'round' | 'grand' = 'round') {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = [
    '#F97316', // orange Razmik
    '#EC4899', // pink Gayane
    '#FACC15', // gold yellow
    '#0EA5E9', // sky blue
    '#10B981', // emerald
    '#FB7185', // coral
  ];

  const count = intensity === 'grand' ? 160 : 80;
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    const fromLeft = i % 2 === 0;
    const originX =
      intensity === 'grand'
        ? Math.random() * canvas.width
        : fromLeft
        ? canvas.width * 0.25
        : canvas.width * 0.75;
    const originY = intensity === 'grand' ? -20 - Math.random() * 140 : canvas.height * 0.45;
    pieces.push({
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * (intensity === 'grand' ? 10 : 13),
      vy: intensity === 'grand' ? 2 + Math.random() * 5 : -10 - Math.random() * 8,
      size: 7 + Math.random() * 7,
      color: colors[i % colors.length],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.22,
      opacity: 1,
    });
  }

  let frameId = 0;
  const startTime = performance.now();
  const maxDuration = intensity === 'grand' ? 3800 : 2200;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravity
      p.vx *= 0.99;
      p.rotation += p.vRot;
      if (elapsed > maxDuration - 600) {
        p.opacity = Math.max(0, 1 - (elapsed - (maxDuration - 600)) / 600);
      }

      if (p.y < canvas.height + 40 && p.opacity > 0.02) {
        alive = true;
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
      ctx.restore();
    }

    if (alive && elapsed < maxDuration) {
      frameId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frameId);
      canvas.remove();
    }
  };

  frameId = requestAnimationFrame(tick);
}
