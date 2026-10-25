/* ---------- the story, told the way Limbo tells it: a few words, and things left lying in the dark ----------
   A boy goes after his little sister, Wren, who walked into the gloam carrying the family lamp.
   Each level opens with one line. Her lantern shows far ahead and she runs from it. Her things lie along the way. */
const STORY = [
  'Wren took the lamp, and the dark walked in after her.',
  'Her shoe. She came this way.',
  'The old road climbs. She never liked climbing alone.',
  'Something lives in the quiet places.',
  'Threads, everywhere. Something has been spinning.',
  'A hall of cages. Lamps hung up like trophies. All dark.',
  'The works kept the whole valley lit. Nobody tends them now.',
  'The pipes breathe. Do not stop moving.',
  'Her lantern. Still warm.',
  'Run. Do not look back.',
];
const STORY_END = ['Wren lit the great lamp, and the whole valley woke.', 'The dark went out like a breath.', 'Somewhere, someone is still humming.'];

/* The tale, one chapter per level. Nothing is picked at random: each level is its own journey, with one thing it teaches,
   one thing it is remembered for (a set piece), and a few whispers that carry the story. d = how hard that piece is. */
const LEVEL_SCRIPT = [
  /* 1  the orchard road: THE GREAT HILL */
  [{ b: 'pit', d: 0, say: 'The village lamp went out at dusk. Wren said she could light it again.' },
   { b: 'house', say: 'Home. The door stands open. It never does.' },
   { b: 'spikes', d: 0.05 },
   { b: 'greathill', say: 'The old watchers\' hill. From its top you can see every lamp that ever failed.' },
   { b: 'pit', d: 0.2 }],
  /* 2  the harvest yard: THE CRATE AND THE GATE */
  [{ b: 'trap', d: 0.05, say: 'She hummed when she was afraid. She is humming now.' },
   { b: 'hill', A: 30, L: 220 }, { b: 'crate', d: 0.1, say: 'The last harvest. Nothing has grown since the lamp failed.' },
   { b: 'spikes', d: 0.15 }, { b: 'trap', d: 0.25 }],
  /* 3  the old road: THE ROPE WALL */
  [{ b: 'pit', d: 0.15 }, { b: 'standing', say: 'She left a mark. A small hand, in the soot.' },
   { b: 'wall', d: 0.1, say: 'Father said the dark only grows where light is forgotten.' },
   { b: 'hill', A: 28, L: 220 }],
  /* 4  the hollow: THE SLEEPING CENTIPEDE */
  [{ b: 'tunnel', say: 'It watches the lamp, not the girl.' },
   { b: 'trap', d: 0.3, say: 'Others walked these tunnels once. Only their lamps are left.' },
   { b: 'nest', say: 'Something vast sleeps on its nest below. Do not wake it. Let the mountain fall on it.' },
   { b: 'hill', A: 26, L: 220 }, { b: 'spikes', d: 0.3 }],
  /* 5  the weaver's cavern: THE RAISED BRIDGE */
  [{ b: 'webs', say: 'It spins at the edges of the light.' },
   { b: 'hill', A: 28, L: 220 },
   { b: 'bridge', d: 0.3, say: 'She crossed, and raised the bridge behind her so nothing could follow.' },
   { b: 'spider', d: 0.2 }, { b: 'tunnel' }],
  /* 6  the cage hall: THE COLLAPSING FLOOR */
  [{ b: 'cages', say: 'Each cage held a lamp. Each lamp, a name.' },
   { b: 'hill', A: 34, L: 220 },
   { b: 'collapse', d: 0.5, say: 'Her name is not here. Not yet.' },
   { b: 'collapse', d: 0.7 }],
  /* 7  the lamp works: THE SAW GAUNTLET */
  [{ b: 'trap', d: 0.3, say: 'The great lamp is ahead. She means to light it.' },
   { b: 'hill', A: 30, L: 220 },
   { b: 'saw', d: 0.3, say: 'It takes a flame that is carried, not made.' },
   { b: 'mplat', d: 0.35 }, { b: 'bricks', d: 0.3, say: 'The rope was cut halfway. Someone wanted the lamp works to fall on whoever followed.' }],
  /* 8  the pipe gallery: HANGING TEETH */
  [{ b: 'bat', d: 0.25, say: 'The dark is not hunting her. It is hunting what she carries.' },
   { b: 'tunnel' }, { b: 'stal', d: 0.5, say: 'The pipes are cold where her lantern passed.' },
   { b: 'worm', d: 0.3 }, { b: 'spikes', d: 0.4 }],
  /* 9  the long way down: THE BOULDER RUN */
  [{ b: 'worm', d: 0.4, say: 'He understands now. She is not carrying the light.' },
   { b: 'hill', A: 36, L: 240, say: 'The light is carrying her.' },
   { b: 'boulder', d: 0.6 }],
];
/* the last level is a chase: a short list of obstacles in rising order */
const CHASE_SCRIPT = ['pit', 'hop', 'spikes', 'trap', 'hop', 'tiles', 'spikes', 'pit', 'hop', 'saw'];

K.whisper = {
  update(e, w, p) {
    if (e.done || p.dead) return;
    if (p.x > e.x) { e.done = true; S.card = { t: 380, text: e.text }; }
  },
};

/* set pieces that dress the world: they carry the story but never block the way */
K.deco = {
  draw(c, e, w) {
    if (e.gy === undefined) e.gy = groundTop(w, e.x);
    const x = e.x, y = e.gy, t = w.t;
    c.fillStyle = c.strokeStyle = 'rgba(4,4,4,0.9)'; c.lineCap = c.lineJoin = 'round';
    switch (e.t) {
      case 'house': {
        c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 6, y - 70); c.lineTo(x + 40, y - 104); c.lineTo(x + 96, y - 72); c.lineTo(x + 96, y); c.lineTo(x + 52, y); c.lineTo(x + 52, y - 40); c.lineTo(x + 26, y - 40); c.lineTo(x + 26, y); c.fill();
        c.fillStyle = 'rgba(255,240,200,' + (0.1 + Math.sin(t * 0.04) * 0.03) + ')'; c.fillRect(x + 54, y - 38, 14, 38);
        c.fillStyle = 'rgba(255,240,200,0.18)'; c.fillRect(x + 66, y - 70, 14, 16);
        c.strokeStyle = 'rgba(4,4,4,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 74, y - 34); c.lineTo(x + 92, y - 32); c.stroke();
        c.fillRect(x + 20, y - 124, 10, 30); break;
      }
      case 'standing': {
        for (let i = 0; i < 5; i++) { const hh = 34 + hash(i * 3.1) * 40, xx = x + i * 26; c.beginPath(); c.moveTo(xx - 6, y); c.lineTo(xx - 4, y - hh); c.lineTo(xx + 5, y - hh + 4); c.lineTo(xx + 7, y); c.fill(); }
        c.strokeStyle = 'rgba(200,200,195,0.35)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x + 54, y - 28, 5, 0, 7); c.moveTo(x + 54, y - 23); c.lineTo(x + 54, y - 14); c.stroke(); break;
      }
      case 'webs': {
        c.lineWidth = 0.9; c.strokeStyle = 'rgba(8,8,8,0.7)';
        for (let k = 0; k < 4; k++) {
          const cx = x + k * 96, sway = Math.sin(t * 0.03 + k) * 2 + windAt(cx, t) * 3;
          c.beginPath(); for (let r = 1; r <= 4; r++) { for (let a = 0; a <= 6; a++) { const ang = Math.PI * 0.12 + a * Math.PI * 0.13, px = cx + Math.cos(ang) * r * 14 + sway, py = r * 9 + Math.sin(ang) * r * 14; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); } }
          for (let a = 0; a <= 6; a++) { const ang = Math.PI * 0.12 + a * Math.PI * 0.13; c.moveTo(cx, 0); c.lineTo(cx + Math.cos(ang) * 56 + sway, 36 + Math.sin(ang) * 56); }
          c.stroke();
        }
        break;
      }
      case 'cages': {
        for (let k = 0; k < 6; k++) {
          const cx = x + k * 70, len = 70 + hash(k * 4.4) * 70, sw = Math.sin(t * 0.02 + k * 1.7) * 4;
          c.lineWidth = 1; c.beginPath(); c.moveTo(cx, -5); c.lineTo(cx + sw, len); c.stroke();
          c.save(); c.translate(cx + sw, len); c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 12, 8, 12, 0, 0, 7); c.stroke();
          for (const q of [-4, 0, 4]) { c.beginPath(); c.moveTo(q * 0.5, 0); c.lineTo(q, 24); c.stroke(); }
          c.fillRect(-2, 18, 4, 5); c.restore();
        }
        break;
      }
      case 'greatlamp': {
        const g = c.createRadialGradient(x, y - 190, 10, x, y - 190, 300);
        g.addColorStop(0, 'rgba(255,248,225,0.8)'); g.addColorStop(1, 'rgba(255,248,225,0)');
        c.fillStyle = g; c.fillRect(x - 300, y - 490, 600, 600);
        c.fillStyle = 'rgba(2,2,2,0.95)'; c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x - 7, y - 170); c.lineTo(x + 7, y - 170); c.lineTo(x + 20, y); c.fill();
        c.fillRect(x - 24, y - 200, 48, 32); c.beginPath(); c.moveTo(x - 28, y - 200); c.lineTo(x, y - 228); c.lineTo(x + 28, y - 200); c.fill();
        c.fillStyle = 'rgba(255,252,240,0.95)'; c.fillRect(x - 15, y - 195, 30, 22); break;
      }
    }
  },
};

/* ground height under x, from the solid ground, hills and boxes */
function groundTop(w, x) {
  let top = GY;
  for (const s of w.solids) if ((s.kind === 'col' || s.kind === 'ground' || s.kind === 'block') && s.y > -10 && s.y < top && x >= s.x && x <= s.x + s.w) top = s.y;
  return top;
}

/* a lamp at each checkpoint: it lights when he passes */
K.lamp = {
  draw(c, e, w) {
    if (e.gy === undefined) e.gy = groundTop(w, e.x);
    const lit = w.cp >= e.i, y = e.gy, fl = lit ? 0.8 + Math.sin(w.t * 0.13 + e.i) * 0.1 + Math.sin(w.t * 0.37 + e.i * 2) * 0.05 : 0;
    c.fillStyle = BLACK; c.strokeStyle = BLACK;
    c.fillRect(e.x - 1, y - 38, 2, 38);
    c.fillRect(e.x - 5, y - 2, 10, 2);
    c.beginPath(); c.moveTo(e.x - 5, y - 44); c.lineTo(e.x + 5, y - 44); c.lineTo(e.x + 3.5, y - 38); c.lineTo(e.x - 3.5, y - 38); c.fill();
    c.beginPath(); c.moveTo(e.x - 6, y - 44); c.lineTo(e.x, y - 49); c.lineTo(e.x + 6, y - 44); c.fill();
    if (lit) {
      const g = c.createRadialGradient(e.x, y - 41, 1, e.x, y - 41, 62);
      g.addColorStop(0, 'rgba(255,248,225,' + 0.55 * fl + ')'); g.addColorStop(1, 'rgba(255,248,225,0)');
      c.fillStyle = g; c.fillRect(e.x - 62, y - 103, 124, 124);
      c.fillStyle = 'rgba(255,250,235,' + fl + ')'; c.fillRect(e.x - 2.2, y - 43, 4.4, 4.4);
    } else { c.fillStyle = 'rgba(120,120,115,0.5)'; c.fillRect(e.x - 1.5, y - 42, 3, 3); }
  },
};

/* things Wren left behind, or that were left behind by others */
const RELICS = ['shoe', 'boat', 'swing', 'toy', 'sign', 'cage', 'cairn'];
/* her things, laid out by chapter (one per checkpoint, in order; null = nothing) */
const RELIC_PLAN = [['swing', null, 'toy'], ['shoe', null, 'sign'], [null, 'cairn', null, 'boat'], ['sign', null, 'toy'], [null, 'cage', null], ['cage', null, 'toy'], [null, 'sign', null, 'shoe'], ['boat', null, 'cairn'], ['shoe', null, 'toy', 'sign'], []];
K.relic = {
  draw(c, e, w) {
    if (e.gy === undefined) e.gy = groundTop(w, e.x);
    const x = e.x, y = e.gy;
    c.fillStyle = c.strokeStyle = BLACK; c.lineCap = c.lineJoin = 'round';
    switch (e.t) {
      case 'shoe':
        c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x - 4, y - 5); c.quadraticCurveTo(x, y - 6, x + 1, y - 3.5); c.quadraticCurveTo(x + 5, y - 3, x + 6, y); c.fill();
        c.fillRect(x + 9, y - 3, 6, 3); break;
      case 'boat':
        c.beginPath(); c.moveTo(x - 9, y - 4); c.lineTo(x + 9, y - 4); c.lineTo(x + 5, y); c.lineTo(x - 5, y); c.fill();
        c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x, y - 14); c.lineTo(x + 6, y - 5); c.fill(); break;
      case 'swing':
        c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x - 12, y - 46); c.lineTo(x + 12, y - 46); c.lineTo(x + 22, y); c.stroke();
        { const a = Math.sin(w.t * 0.02 + x) * 0.12 + windAt(x, w.t) * 0.25, sx = x + Math.sin(a) * 30;
          c.lineWidth = 1; c.beginPath(); c.moveTo(x - 3, y - 46); c.lineTo(sx - 3, y - 46 + Math.cos(a) * 30); c.moveTo(x + 3, y - 46); c.lineTo(sx + 3, y - 46 + Math.cos(a) * 30); c.stroke();
          c.fillRect(sx - 5, y - 46 + Math.cos(a) * 30, 10, 2); }
        break;
      case 'toy':
        c.lineWidth = 1.6; c.beginPath(); c.ellipse(x, y - 8, 7, 3.6, 0, 0, 7); c.fill();
        c.beginPath(); c.moveTo(x + 5, y - 9); c.lineTo(x + 9, y - 15); c.lineTo(x + 12, y - 11); c.lineTo(x + 7, y - 8); c.fill();
        for (const l of [-5, -2, 3, 6]) { c.beginPath(); c.moveTo(x + l, y - 6); c.lineTo(x + l + (l > 0 ? 1 : -1), y); c.stroke(); }
        break;
      case 'sign':
        c.fillRect(x - 1, y - 30, 2.4, 30);
        c.save(); c.translate(x, y - 27); c.rotate(-0.12 + Math.sin(w.t * 0.03 + x) * 0.01); c.fillRect(-12, -5, 24, 9); c.restore();
        c.strokeStyle = 'rgba(190,190,185,0.45)'; c.lineWidth = 0.8; c.beginPath();
        for (let i = 0; i < 5; i++) { c.moveTo(x - 9 + i * 3.4, y - 31); c.lineTo(x - 8.6 + i * 3.4, y - 24); }
        c.moveTo(x - 10, y - 29); c.lineTo(x + 8, y - 26); c.stroke(); break;
      case 'cage':
        c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y - 14, 8, 12, 0, 0, 7); c.stroke();
        for (const k of [-4, 0, 4]) { c.beginPath(); c.moveTo(x + k * 0.5, y - 26); c.lineTo(x + k, y - 2); c.stroke(); }
        c.fillRect(x - 9, y - 2, 18, 2); c.beginPath(); c.arc(x, y - 27, 3, Math.PI, 0); c.stroke();
        c.beginPath(); c.moveTo(x - 12, y - 9); c.lineTo(x - 7, y - 11); c.stroke(); break;
      case 'cairn':
        c.beginPath(); c.ellipse(x, y - 3, 10, 3.5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 1, y - 8, 7, 3, 0, 0, 7); c.fill();
        c.beginPath(); c.ellipse(x - 1, y - 12.5, 4.4, 2.5, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x, y - 16.5, 2.2, 0, 7); c.fill(); break;
    }
  },
};

/* Wren: a small figure with a lantern, far ahead. She runs from him into the light. */
K.wren = {
  always: true,
  update(e, w, p) {
    if (e.stay) return;
    if (!e.run && p.x > e.x - 250) e.run = true;
    if (e.run) { e.x += 1.5; e.anim = (e.anim || 0) + 0.2; if (e.x > e.ex + 360) e.dead = true; }
  },
  draw(c, e, w) {
    const x = e.x, y = groundTop(w, x), a = e.anim || 0, run = e.run && !e.stay;
    const fade = e.stay ? 1 : clamp((e.ex + 360 - x) / 120, 0, 1);
    const lx = x + 8, ly = y - 13 + Math.sin(a * 2) * (run ? 1.6 : 0.3);
    const g = c.createRadialGradient(lx, ly, 1, lx, ly, 110);
    g.addColorStop(0, 'rgba(255,246,220,' + 0.75 * fade + ')'); g.addColorStop(1, 'rgba(255,246,220,0)');
    c.fillStyle = g; c.fillRect(lx - 110, ly - 110, 220, 220);
    c.globalAlpha = fade; c.fillStyle = c.strokeStyle = '#030303'; c.lineCap = c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - 4, y - 14); c.lineTo(x + 4, y - 14); c.lineTo(x + 6.5, y - 6); c.lineTo(x - 6.5, y - 6); c.fill();
    c.lineWidth = 1.8;
    for (const s of [-1, 1]) { const sw = run ? Math.sin(a + s * 1.57) * 4 : s * 1.2; c.beginPath(); c.moveTo(x + s * 1.6, y - 6); c.lineTo(x + s * 1.6 + sw, y); c.stroke(); }
    c.beginPath(); c.arc(x + 0.6, y - 18.5, 3.3, 0, 7); c.fill();
    c.beginPath(); c.moveTo(x - 2, y - 20.5); c.quadraticCurveTo(x - 7, y - 17, x - 5 + Math.sin(a) * 1.5, y - 11); c.lineTo(x - 3, y - 17); c.fill();
    c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 2.5, y - 13); c.lineTo(lx, ly - 2); c.stroke();
    c.fillRect(lx - 2.2, ly - 2, 4.4, 5);
    c.fillStyle = 'rgba(255,250,235,' + fade + ')'; c.fillRect(lx - 1, ly - 0.6, 2, 3);
    c.globalAlpha = 1;
  },
};

/* place the story's pieces in a freshly built world */
function storyPopulate(w, L) {
  L.cps.forEach((cx, i) => {
    w.ents.push({ kind: 'lamp', x: cx, i, w: 0, always: false });
    const rt = (RELIC_PLAN[w.level - 1] || [])[i];
    if (rt) w.ents.push({ kind: 'relic', x: cx + 38 + hash(i + w.level) * 16, t: rt, w: 0 });
  });
  const last = w.level >= TOTAL;
  if (last) w.ents.push({ kind: 'deco', t: 'greatlamp', x: L.exitX + 150, w: 0 });
  w.ents.push({ kind: 'wren', x: last ? L.exitX + 60 : L.exitX - 40, ex: L.exitX, stay: last, w: 0 });
}

/* the line that opens each level */
function drawCard(c) {
  if (!S.card || S.scene !== 'play' || S.card.t <= 0) return;
  S.card.t--;
  const t = S.card.t, a = clamp(Math.min((420 - t) / 70, t / 90), 0, 1);
  if (a <= 0) return;
  c.save();
  const sz = Math.min(CH * 0.045, 20);
  const words = S.card.text.split(' '), lines = [''];
  c.font = '300 ' + sz + "px Georgia, serif";
  const maxW = CW * 0.8;
  for (const wd of words) { const tst = (lines[lines.length - 1] + ' ' + wd).trim(); if (c.measureText(tst).width * 1.35 > maxW && lines[lines.length - 1]) lines.push(wd); else lines[lines.length - 1] = tst; }
  const bg = c.createLinearGradient(0, CH * 0.08, 0, CH * 0.4); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.5, 'rgba(0,0,0,' + 0.5 * a + ')'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = bg; c.fillRect(0, CH * 0.08, CW, CH * 0.32);
  lines.forEach((ln, i) => txt(ln, CW / 2, CH * 0.22 + i * sz * 1.6, sz, a * 0.9));
  c.restore();
}
