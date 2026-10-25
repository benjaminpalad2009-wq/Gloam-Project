'use strict';
/* ---------- constants ---------- */
const TOTAL = 10; /* levels shipped in this build; the generator supports 100 */
const VH = 360, GY = 272;
/* Limbo feel: a slow, weighted walk and a heavy fixed-height jump (~49px up, ~47px forward when running). No variable height, almost no air control. */
const GRAV = 0.5, JUMPV = 7.0, FALLM = 1.25, RUN = 1.15;
const STEP = 6; /* walk straight up ledges this small */
const SPD = RUN / 2.6; /* chasing creatures were tuned against a 2.6 run; scale them with the walk */
const BLACK = '#050505', EYE = '#f2f2f2';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sgn = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
const approach = (v, t, s) => (v < t ? Math.min(v + s, t) : Math.max(v - s, t));
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const circHit = (cx, cy, r, b) => {
  const nx = clamp(cx, b.x, b.x + b.w), ny = clamp(cy, b.y, b.y + b.h);
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r;
};
const shrink = (e, m) => ({ x: e.x + m, y: e.y + m, w: Math.max(1, e.w - 2 * m), h: Math.max(1, e.h - 2 * m) });

/* two-bone inverse kinematics: returns the knee/elbow for a limb from (hx,hy) to (fx,fy); pick(k) scores bend candidates, higher wins */
function ik(hx, hy, fx, fy, l1, l2, pick) {
  let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.02;
  if (d > max) { fx = hx + (dx / d) * max; fy = hy + (dy / d) * max; dx = fx - hx; dy = fy - hy; d = max; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = hx + (dx / d) * a, my = hy + (dy / d) * a, px = -dy / d, py = dx / d;
  const k1 = { x: mx + px * h, y: my + py * h }, k2 = { x: mx - px * h, y: my - py * h };
  return { knee: pick(k1) >= pick(k2) ? k1 : k2, foot: { x: fx, y: fy } };
}

/* ---------- input ---------- */
const keys = {};
const input = { left: false, right: false, jump: false, grab: false, jumpEdge: false, grabEdge: false };
const touch = { on: false, pts: new Map(), sw: 800, sh: 400, safe: { l: 0, r: 0, t: 0, b: 0 } };
let _pj = false, _pg = false;

addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  sfx.init();
  if (e.code === 'Escape') dispatchEvent(new Event('gloam-menu'));
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; touch.pts.clear(); });

/* Limbo-style touch: no buttons.
   left half  = hold and drag left/right of where the finger landed to walk; drag down to grab/interact
   right half = touch to jump (hold for a higher jump) */
function layoutTouch(sw, sh) { touch.sw = sw; touch.sh = sh; }
function touchZone(x) { return x < touch.sw * 0.5 ? 'move' : 'jump'; }
function pollInput() {
  let tl = false, tr = false, tj = false, tg = false;
  for (const p of touch.pts.values()) {
    if (p.zone === 'move') {
      const dx = p.x - p.sx, dy = p.y - p.sy;
      if (dx > 14) tr = true; else if (dx < -14) tl = true;
      if (dy > 26) tg = true;
    } else tj = true;
  }
  let pl = false, pr = false, pj = false, pg = false;
  try {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
      if (ax < -0.35 || b(14)) pl = true;
      if (ax > 0.35 || b(15)) pr = true;
      if (b(0) || b(12)) pj = true;
      if (b(1) || b(2) || b(5) || b(7)) pg = true;
    }
  } catch (e) { /* no gamepad */ }
  input.left = !!(keys.ArrowLeft || keys.KeyA || tl || pl);
  input.right = !!(keys.ArrowRight || keys.KeyD || tr || pr);
  const j = !!(keys.Space || keys.ArrowUp || keys.KeyW || tj || pj);
  const g = !!(keys.KeyE || keys.ShiftLeft || keys.ShiftRight || keys.KeyZ || keys.KeyX || keys.KeyJ || tg || pg);
  input.jumpEdge = j && !_pj; input.grabEdge = g && !_pg;
  _pj = j; _pg = g; input.jump = j; input.grab = g;
}

/* ---------- audio ---------- */
const sfx = (() => {
  let ctx = null, master = null, buf = null;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
      buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      ambient();
    } catch (e) { ctx = null; }
  }
  function ambient() {
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
    const g = ctx.createGain(); g.gain.value = 0.05;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
    const lg = ctx.createGain(); lg.gain.value = 0.03;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    s.connect(f); f.connect(g); g.connect(master); s.start();
    [55, 55.6, 82.5].forEach((fr) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr;
      const og = ctx.createGain(); og.gain.value = 0.018; o.connect(og); og.connect(master); o.start();
    });
  }
  function noise(dur, freq, vol, type) {
    if (!ctx) return;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
    const g = ctx.createGain(), t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 1.4); s.stop(t + dur + 0.05);
  }
  function tone(f0, f1, dur, vol, type) {
    if (!ctx) return;
    const o = ctx.createOscillator(); o.type = type || 'sine';
    const g = ctx.createGain(), t = ctx.currentTime;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  return {
    init,
    step() { noise(0.05, 650 + Math.random() * 200, 0.1); },
    land() { noise(0.1, 420, 0.18); },
    jump() { tone(190, 120, 0.12, 0.07); },
    die() { noise(0.55, 300, 0.55); tone(90, 38, 0.55, 0.25); },
    click() { tone(320, 190, 0.09, 0.1, 'square'); },
    screech() { tone(1500, 650, 0.22, 0.03, 'sawtooth'); },
    thud() { noise(0.18, 220, 0.3); },
    flip() { tone(220, 880, 0.3, 0.06, 'triangle'); },
  };
})();
