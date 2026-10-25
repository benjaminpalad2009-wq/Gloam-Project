/* ---------- level generation: 100 levels, deterministic per number ---------- */
const SOLID = { col: 1, ground: 1, block: 1, ceil: 1, crate: 1, gate: 1, bridge: 1, mplat: 1, conveyor: 1, trap: 1, lift: 1, collapse: 1 };
const ZONE_NAMES = ['forest', 'cave', 'works', 'mirror', 'abyss'];
const SHORT = TOTAL < 100;
/* 10-level campaign: how far into the 100-level pool each level reaches, what it introduces, and its setting */
const EFF = [1, 3, 5, 6, 8, 12, 16, 23, 25, 25];
const INTRO = [[], ['trap'], ['crate'], ['climb', 'crawler'], ['bridge'], ['spider'], ['saw', 'mplat'], ['bat', 'stal'], ['worm', 'collapse'], []];
const LZONE = [0, 0, 0, 1, 1, 1, 2, 2, 2, 4];
const zoneOf = (n) => (SHORT ? (LZONE[n - 1] ?? 4) : Math.min(4, Math.floor((n - 1) / 20)));

K.cspikes = {
  draw(c, e) {
    c.fillStyle = BLACK; c.beginPath();
    for (let x = e.x; x < e.x + e.w - 2; x += 8) { c.moveTo(x, e.y); c.lineTo(x + 4, e.y + e.h + 2); c.lineTo(x + 8, e.y); }
    c.fill();
  },
  kill: (e, p) => hit(shrink({ x: e.x, y: e.y, w: e.w, h: e.h - 2 }, 3), p),
};

/* [beat, first level it can appear, weight] */
const POOL = [
  ['pit', 1, 4], ['spikes', 1, 4], ['trap', 3, 2], ['crate', 5, 3], ['climb', 5, 3], ['crawler', 6, 3], ['bridge', 8, 2],
  ['spider', 12, 2], ['saw', 14, 3], ['mplat', 16, 3], ['collapse', 18, 3],
  ['stal', 21, 3], ['bat', 23, 3], ['worm', 25, 3], ['hound', 28, 3], ['lift', 33, 3], ['jelly', 36, 3],
  ['pend', 41, 3], ['piston', 44, 4], ['boulder', 48, 3], ['crows', 52, 3], ['flip', 61, 6],
];

function buildLevel(n) {
  const rnd = mulberry32(n * 7919 + 31);
  const R = (a, b) => a + rnd() * (b - a);
  const RI = (a, b) => Math.floor(R(a, b + 1));
  const eff = SHORT ? (EFF[n - 1] ?? n) : n;
  const d = SHORT ? 0.04 + 0.5 * ((n - 1) / Math.max(1, TOTAL - 1)) : Math.min(1, ((n - 1) / 99) * 1.08);
  const zone = zoneOf(n);
  const boss = n >= 10 && n % 10 === 0;
  const ents = [], cps = [], cpBeat = [];
  let x = 0, gx = -700, beat = 0;

  const add = (kind, o) => { const e = Object.assign({ kind, beat }, o); if (SOLID[kind]) e.solid = true; ents.push(e); return e; };
  const run = (len) => { x += len; };
  const gap = (w) => { if (x > gx) add('ground', { x: gx, y: GY, w: x - gx, h: VH - GY + 40 }); x += w; gx = x; };
  const endBeat = (pad) => { if (SHORT && zone !== 4 && pad >= 90 && rnd() < 0.8) ripple(pad); else run(pad); cps.push(x - pad * 0.5); cpBeat.push(beat); beat++; };

  /* ---- normal beats: each begins and ends on flat ground ---- */
  const B = {};
  B.pit = (dd) => { run(R(120, 170)); gap(R(24, 32) + dd * 8); };
  B.spikes = (dd) => {
    run(R(120, 170)); const k = dd > 0.5 && rnd() < 0.6 ? 2 : 1;
    for (let i = 0; i < k; i++) { const w = R(16, 20) + dd * 3; add('spikes', { x, y: GY - 14, w, h: 14 }); run(w); if (i < k - 1) run(R(72, 92)); }
  };
  B.trap = (dd) => {
    run(R(120, 160)); const k = 1 + (dd > 0.4 ? 1 : 0) + (dd > 0.8 ? 1 : 0);
    for (let i = 0; i < k; i++) { add('trap', { x, y: GY - 10, w: 30, h: 10 }); run(30); if (i < k - 1) run(R(60, 100)); }
  };
  B.crate = (dd) => {
    run(70); const k = dd > 0.55 ? 2 : 1;
    for (let i = 0; i < k; i++) {
      add('crate', { x: x + 30, y: GY - 28, w: 28, h: 28, vy: 0, dx: 0, dy: 0 });
      const plateX = x + 58 + R(110, 190) + dd * 70;
      const plate = add('plate', { x: plateX, y: GY - 4, w: 44, h: 4 });
      add('block', { x: plateX + 44, y: GY - 22, w: 14, h: 22 });
      if (dd > 0.6) add('saw', { cx: plateX - 70, cy: GY - 12, ax: 36, ay: 0, r: 13, per: 170, ph: R(0, 6), x: plateX - 70, y: GY - 12 });
      const gateX = plateX + 58 + R(60, 100);
      add('gate', { x: gateX, y: GY - 150, w: 16, h: 150, plate, open: 0, dy: 0 });
      x = gateX + 16 + 90;
    }
  };
  /* big boxes: too tall to jump onto, so he hauls himself up (and sometimes up again) */
  B.climb = (dd) => {
    run(R(100, 130));
    if (dd > 0.3 && rnd() < 0.6) { const w = R(16, 20) + dd * 3; add('spikes', { x, y: GY - 14, w, h: 14 }); run(w + 46); }
    const h1 = R(46, 56), w1 = R(48, 64);
    add('block', { x, y: GY - h1, w: w1, h: h1 + 40 }); const bx = x; run(w1);
    if (dd > 0.25 && rnd() < 0.75) { const h2 = h1 + R(44, 54), w2 = R(48, 64); add('block', { x, y: GY - h2, w: w2, h: h2 + 40 }); run(w2); }
    run(R(20, 40)); void bx;
  };
  /* a wall across the path, hauled up with a winch rope. v: 'beast' = something waits behind it, 'spikes' = the winch sits past a spike patch */
  B.wall = (dd, v) => {
    run(R(90, 110));
    if (v === 'spikes') { const sw = R(16, 20); add('spikes', { x, y: GY - 14, w: sw, h: 14 }); run(sw + 80); }
    const wn = add('winch', { x, y: GY, w: 20, h: 0, pull: 0, work: 0 }); run(R(120, 150));
    const gate = add('gate', { x, y: GY - 150, w: 20, h: 150, winch: wn, open: 0, dy: 0 }); wn.gate = gate; gate.pull = 0;
    run(20);
    if (v === 'beast') { add('crawler', { x: x + 90, y: GY - 18, w: 36, h: 18, vx: 0, vy: 0, state: 'wait', trig: wn.x, speed: (0.8 + dd * 0.6) * SPD, anim: 0 }); run(160); }
    else run(40);
  };
  /* the great hill: four rocky ledges you jump up, then a long walk down the far side */
  B.greathill = () => {
    run(60);
    const x0 = x, hs = [], rise = 3, tread = 14, steps = 4;
    let h = 0;
    for (let k = 0; k < steps; k++) {
      const up = Math.round(R(24, 29)), h0 = h; h += up;
      for (let i = 1; i <= rise; i++) hs.push(lerp(h0, h, smooth(i / rise)));
      for (let i = 0; i < tread; i++) hs.push(h + Math.sin(i * 0.5 + k) * 0.6);
    }
    for (let i = 0; i < 10; i++) hs.push(h);
    const down = 64; for (let i = 1; i <= down; i++) hs.push(h * (1 - smooth(i / down)));
    hs.push(0);
    for (let i = 0; i < hs.length; i++) hs[i] = Math.max(0, hs[i]);
    add('hill', { x: x0, y: GY, w: (hs.length - 1) * 4, h: 0, hs });
    for (let i = 0; i < hs.length - 1; i++) { const top = Math.max(hs[i], hs[i + 1]); if (top > 0.6) add('col', { x: x0 + i * 4, y: GY - top, w: 4, h: top + 6 }); }
    add('deco', { t: 'summit', x: x0 + (steps * (rise + tread) + 4) * 4, y: GY - h, w: 0 });
    run((hs.length - 1) * 4 + 60);
  };
  /* the nest: a giant centipede sleeps across the path. A boulder waits on the ridge above, held by a rope. */
  B.nest = () => {
    run(R(70, 90));
    const x0 = x, H = 64, up = 28, flat = 44, down = 42, hs = [];
    for (let i = 0; i <= up; i++) hs.push(H * smooth(i / up));
    for (let i = 1; i <= flat; i++) hs.push(H);
    for (let i = 1; i <= down; i++) hs.push(H * (1 - smooth(i / down)));
    hs.push(0);
    add('hill', { x: x0, y: GY, w: (hs.length - 1) * 4, h: 0, hs });
    for (let i = 0; i < hs.length - 1; i++) { const top = Math.max(hs[i], hs[i + 1]); if (top > 0.6) add('col', { x: x0 + i * 4, y: GY - top, w: 4, h: top + 6 }); }
    const px0 = x0 + up * 4, px1 = px0 + flat * 4;
    const rock = add('rock', { x: px1 - 40, y: GY - H - 24, r: 24, state: 'held', pull: 0, vx: 0, rot: 0 });
    const wn = add('winch', { x: px0 + 40, y: GY - H, w: 20, h: 0, gate: rock, work: 0 }); rock.winch = wn;
    const ex = x0 + (hs.length - 1) * 4 + 70;
    const ct = add('centipede', { x: ex, y: GY - 34, w: 170, h: 34, awake: false, t: 0 }); rock.cent = ct;
    add('deco', { t: 'nesthint', x: ex - 30, w: 0 });
    run((hs.length - 1) * 4 + 70 + 170 + 70);
  };
  B.bridge = (dd) => {
    run(60); const lever = add('lever', { x, y: GY, w: 20, h: 12, ang: -1 }); run(20);
    const D = R(160, 230) + dd * 240; run(D);
    const G = R(130, 175) + dd * 95;
    const dur = Math.round(((D + 20 + G) / RUN) * (1.75 - dd * 0.55) + 50);
    lever.br = add('bridge', { x, y: GY, w: 0, len: G, h: 12, on: false, timer: 0, dur, solid: false });
    gap(G); run(0);
  };
  /* a conveyor belt laid over the gap that drags you back; run it, then jump off the far end */
  B.mplat = (dd) => {
    run(R(110, 140)); const L = Math.round(R(190, 230) + dd * 40), spd = 0.55 + dd * 0.3;
    gap(R(22, 26)); add('conveyor', { x, y: GY, w: L, h: 12, dir: -1, spd, dx: 0, dy: 0, off: 0 }); gap(L); gap(R(22, 26)); run(40);
  };
  /* bricks tied up on a rope that is about to snap */
  B.bricks = (dd) => {
    run(R(150, 190)); const k = RI(2, 3) + (dd > 0.5 ? 1 : 0);
    for (let i = 0; i < k; i++) { add('bricks', { x: x + 30, y: 98, w: 22, h: 34, state: 0, timer: 0, delay: Math.round(42 - dd * 12), trig: R(64, 90) - dd * 14, vy: 0 }); run(R(120, 170)); }
  };
  B.lift = (dd) => {
    run(R(100, 140)); const hgt = R(135, 150) + dd * 25, lx = x, pw = R(150, 210);
    add('lift', { x: lx, y: GY, w: 54, h: 12, hgt, per: Math.round(R(310, 380) - dd * 100), dx: 0, dy: 0 });
    const px = lx + 54 + 8;
    add('block', { x: px, y: GY - hgt, w: pw, h: hgt + 40 });
    if (dd > 0.2 || rnd() < 0.4) { const sw = R(34, 54) + dd * 20; add('spikes', { x: px + R(40, 70), y: GY - hgt - 14, w: sw, h: 14 }); }
    run(54 + 8 + pw);
  };
  /* a rotten rope bridge over a drop: planks fall away under you, some are already gone */
  B.collapse = (dd) => {
    run(R(110, 140)); const N = RI(9, 11) + (dd > 0.5 ? 2 : 0), pw = 20, pitch = 20, delay = Math.round(34 - dd * 16);
    gap(0); const x0 = x, pl = []; let prev = null, missing = 0;
    for (let i = 0; i < N; i++) {
      if (i > 1 && i < N - 2 && missing < 2 && !(pl.length && pl[pl.length - 1].miss) && rnd() < 0.22 + dd * 0.2) { missing++; pl.push({ miss: 1, x: x0 + i * pitch, state: 2, w: pw, y: GY }); prev = null; continue; }
      const e = add('collapse', { x: x0 + i * pitch, y: GY, w: pw, h: 8, state: 0, delay, timer: 0, vy: 0, rot: 0, vr: 0, prev });
      pl.push(e); prev = e;
    }
    const real = pl.filter((q) => !q.miss);
    add('ropes', { x: x0 - 2, y: 0, w: N * pitch + 2, planks: pl.map((q) => (q.miss ? { x: q.x, w: q.w, y: GY, state: 2 } : q)), h: 0 });
    void real; x = x0; gap(N * pitch);
  };
  B.saw = (dd) => {
    run(R(120, 150)); const k = 1 + (dd > 0.5 ? 1 : 0) + (dd > 0.85 ? 1 : 0);
    for (let i = 0; i < k; i++) {
      const ty = rnd(), ax = R(40, 90), per = Math.round(R(160, 230) - dd * 70), cx = x + ax + 20;
      if (ty < 0.5) add('saw', { cx, cy: GY - 12, ax, ay: 0, r: 13, per, ph: R(0, 6.28), x: cx, y: GY - 12 });
      else if (ty < 0.78) add('saw', { cx, cy: GY - 58, ax, ay: 0, r: 14, per, ph: R(0, 6.28), x: cx, y: GY - 58 });
      else add('saw', { cx, cy: GY - 56, ax: 0, ay: 42, r: 13, per, ph: R(0, 6.28), x: cx, y: GY - 56 });
      run(ax * 2 + 70); if (i < k - 1) run(R(40, 70));
    }
  };
  B.pend = (dd) => {
    run(R(130, 170)); const k = 1 + (dd > 0.35 ? 1 : 0) + (dd > 0.7 ? 1 : 0);
    for (let i = 0; i < k; i++) {
      const px = x + 60;
      add('pend', { px, py: -10, len: 250, r: 12, amp: R(0.7, 0.95), per: Math.round(R(220, 280) - dd * 90), ph: R(0, 6.28), bx: px, by: 240 });
      run(R(200, 250));
    }
  };
  B.worm = (dd) => {
    run(R(110, 150)); const k = RI(2, 3) + (dd > 0.5 ? 1 : 0) + (dd > 0.8 ? 1 : 0);
    for (let i = 0; i < k; i++) { add('worm', { x: x + 30, len: 0, warn: 0, max: R(70, 115), per: Math.round(R(150, 210) - dd * 50), ph: RI(0, 200), warnT: Math.round(36 - dd * 14) }); run(R(110, 150)); }
  };
  B.bat = (dd) => {
    run(R(150, 190)); const k = 1 + (dd > 0.4 ? 1 : 0) + (dd > 0.75 ? 1 : 0);
    for (let i = 0; i < k; i++) { const hx = x + 60, hy = GY - 130 + R(-20, 20); add('bat', { x: hx, y: hy, hx, hy, w: 0, h: 0, state: 'idle', speed: 2.9 + dd * 1.4, trig: 150, cool: 0, vx: 0, vy: 0 }); run(R(190, 240)); }
  };
  B.stal = (dd) => {
    run(R(140, 180)); const k = RI(2, 4) + (dd > 0.5 ? 1 : 0);
    for (let i = 0; i < k; i++) { add('stal', { x: x + 30, y: 30, w: 18, h: Math.round(R(130, 170)), state: 0, timer: 0, delay: Math.round(40 - dd * 14), trig: R(60, 100) - dd * 20, vy: 0 }); run(R(110, 170)); }
  };
  B.crawler = (dd) => {
    run(R(120, 150)); const tr = x + 80;
    add('crawler', { x: x + 280, y: GY - 18, w: 36, h: 18, vx: 0, vy: 0, state: 'wait', trig: tr, speed: (0.9 + dd * 0.9) * SPD, anim: 0 });
    run(R(380, 440));
  };
  B.spider = (dd) => {
    run(R(150, 190));
    if (dd > 0.3 && rnd() < 0.5) add('spider', { x: x + 200, y: 70, w: 30, h: 26, vx: 0, vy: 0, state: 'hang', trig: 160, speed: (1.4 + dd * 0.7) * SPD, cool: 0, anim: 0 });
    else add('spider', { x: x + 220, y: GY - 26, w: 30, h: 26, vx: 0, vy: 0, state: 'idle', trig: 150, speed: (1.4 + dd * 0.7) * SPD, cool: 0, anim: 0 });
    run(300); gap(R(26, 34)); run(R(90, 120));
  };
  B.hound = (dd) => {
    run(R(100, 140)); const tr = x + 40;
    add('hound', { x: x - 540, y: GY - 22, w: 34, h: 22, vx: 0, vy: 0, state: 'wait', trig: tr, speed: (2.05 + dd * 0.5) * SPD, anim: 0 });
    run(90); const w1 = R(20, 24) + dd * 2; add('spikes', { x, y: GY - 14, w: w1, h: 14 }); run(w1 + 90);
    gap(R(62, 78)); run(120);
  };
  B.jelly = (dd) => {
    run(R(110, 140)); const G = R(66, 78) + dd * 8;
    add('jelly', { cx: x + G / 2, cy: GY - 58, amp: 20, per: Math.round(R(115, 145) - dd * 25), ph: R(0, 6.28), x: x + G / 2, y: GY - 58 });
    gap(G);
  };
  B.boulder = (dd) => {
    const bx0 = x; run(R(330, 360)); const tr = x + 80;
    add('boulder', { x: bx0 - 90, y: GY - 30, r: 30, state: 'wait', trig: tr, speed: (2.0 + dd * 0.5) * SPD, rot: 0, vy: 0 });
    run(110); const w1 = R(20, 24) + dd * 2; add('spikes', { x, y: GY - 14, w: w1, h: 14 }); run(w1 + 100);
    gap(R(28, 36)); run(100);
  };
  B.crows = (dd) => {
    run(R(100, 140)); const L = R(420, 520);
    add('crowzone', { x0: x, x1: x + L, gap: Math.round(110 - dd * 40), speed: 3.0 + dd * 1.6, cool: 0 });
    run(L);
  };
  B.piston = (dd) => {
    run(R(110, 140)); const k = RI(2, 3) + (dd > 0.5 ? 1 : 0) + (dd > 0.85 ? 1 : 0);
    for (let i = 0; i < k; i++) { add('piston', { x: x + 20, w: 28, len: 34, warn: 0, ph: RI(0, 200), per: Math.round(R(190, 240) - dd * 60) }); run(R(110, 150) - dd * 20); }
  };
  B.flip = (dd) => {
    run(R(90, 110)); const room0 = x, segs = RI(2, 3) + (dd > 0.6 ? 1 : 0) + (dd > 0.9 ? 1 : 0), CH = 130, openings = [];
    const zone = (to) => { add('flip', { x, y: GY - CH, w: 18, h: CH, to }); run(18 + R(105, 125)); };
    run(40);
    for (let i = 0; i < segs; i++) {
      zone(-1);
      if (rnd() < 0.5) { const w = R(70, 120) + dd * 25; add('spikes', { x, y: GY - 14, w, h: 14 }); run(w); }
      else { gap(R(70, 100)); }
      run(R(60, 90));
      zone(1);
      if (rnd() < 0.5) { const w = R(70, 120) + dd * 25; add('cspikes', { x, y: GY - CH, w, h: 14 }); run(w); }
      else { const w = R(70, 100); openings.push([x, x + w]); run(w); }
      run(R(60, 90));
    }
    run(40);
    let cx0 = room0;
    const seg = (a, b) => { if (b > a) add('ceil', { x: a, y: -60, w: b - a, h: GY - CH + 60 }); };
    for (const [a, b] of openings) { seg(cx0, a); cx0 = b; }
    seg(cx0, x);
  };

  /* ---- set pieces that dress the world (the story's places) ---- */
  const deco = (t, len, off) => { run(60); add('deco', { t, x: x + (off || 0), w: 0 }); run(len); };
  B.house = () => deco('house', 130);
  B.standing = () => deco('standing', 170);
  B.webs = () => { run(60); add('deco', { t: 'webs', x: x + 40, w: 0 }); run(360); };
  B.cages = () => { run(60); add('deco', { t: 'cages', x: x + 20, w: 0 }); run(420); };

  /* ---- terrain: slopes you walk up and over, and low cave tunnels. Each is its own stretch with nothing else on it. ---- */
  const smooth = (u) => u * u * (3 - 2 * u);
  const plateau = (t, flat) => { const rise = (1 - flat) / 2; return t < rise ? smooth(t / rise) : t > 1 - rise ? smooth((1 - t) / rise) : 1; };
  const addHill = (A, L, flat, rough) => {
    run(50);
    const x0 = x, n = Math.round(L / 4), hs = [];
    for (let i = 0; i <= n; i++) {
      let h = A * plateau(i / n, flat);
      if (rough && i > 1 && i < n - 1) h += (hash(i * 5.3 + beat * 11 + n) - 0.5) * rough;
      hs.push(Math.max(0, h));
    }
    add('hill', { x: x0, y: GY, w: n * 4, h: 0, hs });
    for (let i = 0; i < n; i++) { const top = Math.max(hs[i], hs[i + 1]); if (top > 0.6) add('col', { x: x0 + i * 4, y: GY - top, w: 4, h: top + 6 }); }
    run(n * 4 + 50);
  };
  const addTunnel = () => {
    run(50);
    const x0 = x, n = Math.round(R(300, 420) / 4), cs = [], lowY = GY - 98, highY = GY - 190;
    for (let i = 0; i <= n; i++) cs.push(lerp(highY, lowY, plateau(i / n, 0.55)) + (hash(i * 2.9 + n + beat) - 0.5) * 3);
    add('cavity', { x: x0, y: 0, w: n * 4, h: 0, cs });
    for (let i = 0; i < n; i++) { const cy = Math.max(cs[i], cs[i + 1]); add('col', { x: x0 + i * 4, y: -80, w: 4, h: cy + 80 }); }
    run(n * 4 + 50);
  };
  /* a gentle roll in the ground between puzzles so nothing is ever dead flat */
  const ripple = (pad) => {
    const x0 = x + 12, n = Math.round((pad - 24) / 4), A = R(10, 20), hs = [];
    for (let i = 0; i <= n; i++) hs.push(A * plateau(i / n, 0.15));
    add('hill', { x: x0, y: GY, w: n * 4, h: 0, hs });
    for (let i = 0; i < n; i++) { const top = Math.max(hs[i], hs[i + 1]); if (top > 0.6) add('col', { x: x0 + i * 4, y: GY - top, w: 4, h: top + 6 }); }
    x = x0 + n * 4 + 12;
  };
  const terrain = () => {
    if (!SHORT || zone === 4) return;
    const r = rnd();
    if (zone === 0 || zone === 3) { if (r < 0.55 || n < 2) addHill(R(34, 64), R(200, 280), 0, 0); else addHill(R(75, 105), R(460, 560), 0.3, 0); }
    else if (zone === 1) { if (r < 0.5) addTunnel(); else addHill(R(30, 60), R(200, 300), 0.1, 2); }
    else if (r < 0.6) addHill(R(24, 46), R(180, 260), 0.2, 2.2); else addTunnel();
  };

  /* ---- chase beats for boss levels: no waiting, no puzzles ---- */
  const C = {};
  C.pit = (dd) => { run(R(70, 110)); gap(R(24, 32) + dd * 8); };
  C.spikes = (dd) => { run(R(70, 110)); const w = R(16, 20); add('spikes', { x, y: GY - 14, w, h: 14 }); run(w); };
  C.trap = () => { run(R(70, 110)); add('trap', { x, y: GY - 10, w: 30, h: 10 }); run(30); };
  C.hop = () => { run(R(80, 120)); const h = R(18, 32), w = R(24, 36); add('block', { x, y: GY - h, w, h: h + 40 }); run(w); };
  C.tiles = (dd) => {
    run(R(70, 100)); gap(0); const gp = R(22, 28);
    for (let i = 0; i < 3; i++) { run(gp); add('collapse', { x, y: GY, w: 44, h: 12, state: 0, delay: 30, timer: 0, vy: 0 }); run(44); }
    run(gp); gx = x;
  };
  C.saw = () => { run(R(80, 110)); add('saw', { cx: x + 20, cy: GY - 3, ax: 0, ay: 0, r: 8, per: 100, ph: 0, x: x + 20, y: GY - 3 }); run(40); };

  /* ---- assemble ---- */
  run(240);
  let chosen = [];
  if (boss) {
    const nb = 8 + Math.floor(n / 10);
    const names = n < 30 ? ['pit', 'spikes', 'hop', 'trap'] : n < 60 ? ['pit', 'spikes', 'hop', 'trap', 'tiles'] : ['pit', 'spikes', 'hop', 'trap', 'tiles', 'saw'];
    if (SHORT) for (const nm of CHASE_SCRIPT) chosen.push(nm);
    else for (let i = 0; i < nb; i++) chosen.push(names[RI(0, names.length - 1)]);
    for (const nm of chosen) { C[nm](d); endBeat(R(60, 90)); }
    const st = add('stalker', { x: -300, y: 0, w: 0, h: 0, state: 'wait', trig: 160, speed: (1.9 + d * 0.58) * SPD, limit: 1e9, anim: 0, global: true });
    var stalker = st;
  } else {
    if (SHORT && LEVEL_SCRIPT[n - 1]) {
      /* an authored level: every piece is chosen, in order, to tell this chapter */
      for (const it of LEVEL_SCRIPT[n - 1]) {
        const at = x;
        if (it.b === 'hill') addHill(it.A, it.L, 0.1, 0);
        else if (it.b === 'mound') addHill(R(78, 100), R(470, 540), 0.3, 0);
        else if (it.b === 'tunnel') addTunnel();
        else B[it.b](it.d || 0, it.v);
        chosen.push(it.b);
        if (it.say) add('whisper', { x: at + 30, text: it.say, w: 0, always: true });
        endBeat(Math.round(R(100, 140)));
      }
    } else {
    const nb = SHORT ? 3 + Math.floor((n - 1) / 2) : n <= 2 ? 3 : Math.min(14, 3 + Math.floor(n / 8));
    const avail = POOL.filter((e) => e[1] <= eff);
    const intros = SHORT ? INTRO[n - 1] : [(POOL.find((e) => e[1] === n) || [])[0]].filter(Boolean);
    for (let i = 0; i < nb; i++) {
      let pick;
      const isIntro = i < intros.length;
      if (isIntro) pick = intros[i];
      else {
        let tot = 0; const ws = avail.map((e) => { let w = e[2] * (eff - e[1] < 6 ? 2.2 : 1); if (e[0] === 'flip' && eff >= 61) w = 9; if (chosen.length >= 2 && chosen[chosen.length - 1] === e[0] && chosen[chosen.length - 2] === e[0]) w = 0; tot += w; return w; });
        let r = rnd() * tot; pick = avail[0][0];
        for (let k = 0; k < avail.length; k++) { r -= ws[k]; if (r <= 0) { pick = avail[k][0]; break; } }
      }
      chosen.push(pick);
      const dd = isIntro ? Math.min(d, 0.1) : Math.min(1, d + R(-0.08, 0.08));
      B[pick](Math.max(0, dd));
      if (i > 0 && rnd() < 0.85) terrain();
      endBeat(Math.round(R(100, 150) - d * 40));
    }
    }
  }
  run(160);
  const exitX = x;
  run(560); gap(0);
  if (typeof stalker !== 'undefined') stalker.limit = exitX - 160;
  return { n, ents, cps, cpBeat, exitX, width: x, zone, boss, spawnX: 70 };
}
