/* ---------- entity registry: terrain, props, traps ---------- */
const K = {};

/* ---------- living grass ---------- */
/* Every blade is a small spring. Walkers push blades aside, wind sways them, and they ease back. Blade state is stored per world. */
const GRASS_DENSITY = [1, 0.55, 0.35, 1, 0.5];
/* wind: a steady lean, ripples, and gust fronts that roll across the level. Returns roughly -0.1..0.7 */
function windAt(x, t) {
  const g = Math.max(0, Math.sin(t * 0.0065 - x * 0.0032)), g2 = g * g;
  const g3 = Math.max(0, Math.sin(t * 0.0113 - x * 0.0051 + 2)); 
  return 0.1 + g2 * 0.42 + g3 * g3 * 0.18 + Math.sin(t * 0.045 + x * 0.06) * 0.07 + Math.sin(t * 0.017 + x * 0.015) * 0.05;
}
function drawGrass(c, w, x0, x1, yAt, seed, dir, tall) {
  const dens = GRASS_DENSITY[w.zone] ?? 1;
  const gb = w.gb || (w.gb = new Map()), mv = w.movers || [];
  const a = Math.max(x0, w.camX - 24), z = Math.min(x1, w.camX + w.vw + 24);
  /* keep the grass off spikes and traps so their silhouettes read */
  if (w.clrT !== w.t) { w.clrT = w.t; w.clr = []; for (const e of (w.ents || [])) if ((e.kind === 'spikes' || e.kind === 'trap') && !e.dead) w.clr.push(e.x - 6, e.x + e.w + 6); }
  const clr = w.clr;
  c.beginPath();
  for (let x = Math.ceil(a / 3) * 3; x < z; x += 3) {
    const i = x / 3, hv = hash(i * 1.7 + seed * 3.1);
    if (hv > dens) continue;
    if (dir > 0) { let skip = false; for (let k = 0; k < clr.length; k += 2) if (x > clr[k] && x < clr[k + 1]) { skip = true; break; } if (skip) continue; }
    const y = yAt(x), hh = (5 + hash(i * 0.93 + seed) * 10 + (hash(i * 0.31) > 0.8 ? 9 : 0)) * (tall || 1);
    const key = i * 16 + seed;
    let bl = gb.get(key);
    if (!bl) { bl = { a: 0, v: 0, t: -1 }; gb.set(key, bl); }
    if (bl.t !== w.t) {
      bl.t = w.t;
      let target = windAt(x, w.t) * (0.7 + hh * 0.03);
      if (dir < 0) for (const m of mv) {
        const dx = x - m.x, ad = Math.abs(dx);
        if (ad < 20 && Math.abs(m.fy - y) < 16) { const q = 1 - ad / 20; target += sgn(dx || 1) * q * 0.9 + clamp(m.vx * 0.2, -0.5, 0.5) * q; }
      }
      bl.v += (target - bl.a) * 0.16; bl.v *= 0.82; bl.a = clamp(bl.a + bl.v, -1.3, 1.3);
    }
    const sa = Math.sin(bl.a), ca = Math.cos(bl.a);
    const tx = x + sa * hh, ty = y + dir * ca * hh * (1 - Math.abs(sa) * 0.2);
    c.moveTo(x - 1.6, y - dir * 1.2);
    c.quadraticCurveTo(x - 0.6 + sa * hh * 0.2, y + dir * hh * 0.55, tx, ty);
    c.quadraticCurveTo(x + 0.6 + sa * hh * 0.2, y + dir * hh * 0.5, x + 1.6, y - dir * 1.2);
  }
  c.fill();
}

/* faint cracks and strata so the black earth is not a flat fill */
function rockTexture(c, e, w, flip) {
  const edge = flip ? e.y + e.h : e.y, dir = flip ? -1 : 1;
  const a = Math.max(e.x, w.camX - 12), b = Math.min(e.x + e.w, w.camX + w.vw + 12);
  c.strokeStyle = 'rgba(95,98,94,0.20)'; c.lineWidth = 1; c.beginPath();
  for (let i = Math.floor(a / 46); i * 46 < b; i++) {
    const hv = hash(i * 3.17 + w.level * 1.3);
    if (hv < 0.3) continue;
    let x = i * 46 + hv * 30, y = edge + dir * 7;
    if (x < e.x || x > e.x + e.w) continue;
    c.moveTo(x, y);
    const n = 3 + Math.floor(hash(i * 1.7) * 3);
    for (let k = 0; k < n; k++) {
      x += (hash(i * 9.1 + k) - 0.5) * 16; y += dir * (7 + hash(i * 4.3 + k) * 11);
      if (Math.abs(y - edge) > e.h - 4) break;
      c.lineTo(x, y);
    }
  }
  c.stroke();
  c.strokeStyle = 'rgba(95,98,94,0.12)'; c.beginPath();
  for (let k = 1; k < 4; k++) {
    const yy = edge + dir * (16 * k + hash(k + w.level) * 5);
    if (Math.abs(yy - edge) > e.h - 3) break;
    c.moveTo(a, yy);
    for (let x = Math.ceil(a / 24) * 24; x < b; x += 24) c.lineTo(x, yy + (hash(x * 0.13 + k) - 0.5) * 5);
  }
  c.stroke();
  c.fillStyle = 'rgba(130,134,128,0.13)';
  for (let i = Math.floor(a / 11); i * 11 < b; i++) {
    const hv = hash(i * 1.9 + w.level * 0.7), hv2 = hash(i * 6.1 + 3);
    const x = i * 11 + hv * 8, y = edge + dir * (4 + hv2 * Math.min(e.h - 8, 90));
    if (x < e.x || x > e.x + e.w || Math.abs(y - edge) > e.h - 3) continue;
    c.fillRect(x, y, 1 + (hv > 0.8 ? 1 : 0), 1);
  }
  /* pebbles and root knots resting on the surface */
  c.fillStyle = 'rgba(70,72,68,0.5)';
  if (!flip) for (let i = Math.floor(a / 37); i * 37 < b; i++) {
    const hv = hash(i * 7.7 + 2);
    if (hv < 0.55) continue;
    const x = i * 37 + hv * 20;
    if (x < e.x + 4 || x > e.x + e.w - 4) continue;
    c.beginPath(); c.ellipse(x, edge + 3, 2 + hv * 3, 1.2 + hv, 0, 0, 7); c.fill();
  }
}

function slab(c, e, w, flip) {
  const edge = flip ? e.y + e.h : e.y;
  const a = Math.max(e.x, w.camX - 24), b = Math.min(e.x + e.w, w.camX + w.vw + 24);
  if (b <= a) return;
  const gr = c.createLinearGradient(0, e.y, 0, e.y + e.h);
  gr.addColorStop(0, flip ? '#000' : '#0c0c0b'); gr.addColorStop(1, flip ? '#0c0c0b' : '#000');
  c.fillStyle = gr; c.fillRect(e.x, e.y, e.w, e.h);
  rockTexture(c, e, w, flip);
  c.fillStyle = BLACK;
  /* lumpy turf along the top and jagged, crumbling cliff faces so the earth is never a ruler-straight slab */
  c.beginPath();
  for (let x = Math.floor(a / 9) * 9; x < b; x += 9) {
    const hv = hash(x * 0.37 + e.y), bh = 1 + hv * 3.4, wd = 5 + hv * 6;
    c.moveTo(x, edge + (flip ? 1 : 1)); c.quadraticCurveTo(x + wd * 0.5, edge - (flip ? -bh : bh) * 1.6, x + wd, edge + 1);
  }
  c.fill();
  if (e.kind === 'ground' || e.kind === 'block') {
    for (const sd of [0, 1]) {
      const fx = sd ? e.x + e.w : e.x;
      if (fx < w.camX - 30 || fx > w.camX + w.vw + 30) continue;
      c.beginPath(); c.moveTo(fx, e.y);
      const n = Math.min(14, Math.floor(e.h / 11));
      for (let i = 1; i <= n; i++) c.lineTo(fx + (sd ? 1 : -1) * (2 + hash(i * 3.7 + fx * 0.11) * 6), e.y + i * 11);
      c.lineTo(fx, e.y + n * 11 + 4); c.fill();
    }
  }
  if (!flip) { c.fillStyle = 'rgba(150,156,150,0.08)'; c.fillRect(a, edge - 0.6, b - a, 1.2); }
  c.fillStyle = BLACK;
  if (flip) drawGrass(c, w, e.x, e.x + e.w, () => edge, 5, 1, 1.6);
  else drawGrass(c, w, e.x, e.x + e.w, () => edge, e.kind === 'ground' ? 1 : 2 + ((e.x | 0) & 7), -1, 1);
}
K.ground = { draw: (c, e, w) => slab(c, e, w, false) };
K.block = { draw: (c, e, w) => slab(c, e, w, false) };
K.ceil = { draw: (c, e, w) => slab(c, e, w, true) };

/* ---------- walkable slopes: a smooth drawn hill over thin invisible columns ---------- */
K.col = {};
const hsAt = (hs, x0, x) => { const f = clamp((x - x0) / 4, 0, hs.length - 1), i = Math.floor(f), j = Math.min(hs.length - 1, i + 1); return lerp(hs[i], hs[j], f - i); };
K.hill = {
  draw(c, e, w) {
    const xs = Math.max(0, Math.floor((w.camX - 28 - e.x) / 4)), xe = Math.min(e.hs.length - 1, Math.ceil((w.camX + w.vw + 28 - e.x) / 4));
    if (xe <= xs) return;
    c.fillStyle = BLACK; c.beginPath(); c.moveTo(e.x + xs * 4, GY + 6);
    for (let i = xs; i <= xe; i++) c.lineTo(e.x + i * 4, GY - e.hs[i]);
    c.lineTo(e.x + xe * 4, GY + 6); c.fill();
    c.strokeStyle = 'rgba(95,98,94,0.15)'; c.lineWidth = 1;
    for (const off of [14, 30, 48]) {
      c.beginPath();
      for (let i = xs; i <= xe; i++) { const y = GY - e.hs[i] + off + Math.sin(i * 0.4 + off) * 2; if (y > GY + 4) { if (i > xs) c.stroke(); c.beginPath(); continue; } if (i === xs) c.moveTo(e.x + i * 4, y); else c.lineTo(e.x + i * 4, y); }
      c.stroke();
    }
    c.fillStyle = 'rgba(150,156,150,0.08)'; c.beginPath();
    for (let i = xs; i <= xe; i++) c.lineTo(e.x + i * 4, GY - e.hs[i] - 0.4);
    for (let i = xe; i >= xs; i--) c.lineTo(e.x + i * 4, GY - e.hs[i] + 1.2);
    c.fill();
    c.fillStyle = BLACK;
    drawGrass(c, w, e.x + xs * 4, e.x + xe * 4, (x) => GY - hsAt(e.hs, e.x, x), 3, -1, 1);
  },
};

/* ---------- cave tunnel: drawn ceiling that comes down low, over invisible ceiling columns ---------- */
K.cavity = {
  draw(c, e, w) {
    const xs = Math.max(0, Math.floor((w.camX - 28 - e.x) / 4)), xe = Math.min(e.cs.length - 1, Math.ceil((w.camX + w.vw + 28 - e.x) / 4));
    if (e.x - 160 > w.camX + w.vw || e.x + e.w + 160 < w.camX) return;
    const dk = c.createLinearGradient(e.x, 0, e.x + e.w, 0);
    dk.addColorStop(0, 'rgba(0,0,0,0)'); dk.addColorStop(0.18, 'rgba(0,0,0,0.42)'); dk.addColorStop(0.82, 'rgba(0,0,0,0.42)'); dk.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = dk; c.fillRect(e.x, 0, e.w, GY);
    /* the tunnel sits inside a rock mass: the ceiling rises into the sky well beyond both mouths */
    const ramp = 150, sm = (u) => u * u * (3 - 2 * u), last = e.cs.length - 1;
    c.fillStyle = BLACK; c.beginPath(); c.moveTo(e.x - ramp, -30);
    for (let k = 0; k <= ramp / 4; k++) c.lineTo(e.x - ramp + k * 4, lerp(-30, e.cs[0], sm(k / (ramp / 4))));
    for (let i = 0; i <= last; i++) c.lineTo(e.x + i * 4, e.cs[i]);
    for (let k = 0; k <= ramp / 4; k++) c.lineTo(e.x + last * 4 + k * 4, lerp(e.cs[last], -30, sm(k / (ramp / 4))));
    c.lineTo(e.x + last * 4 + ramp, -30); c.fill();
    c.strokeStyle = 'rgba(95,98,94,0.16)'; c.lineWidth = 1;
    for (const off of [-14, -30]) { c.beginPath(); for (let i = xs; i <= xe; i++) { const y = e.cs[i] + off + Math.sin(i * 0.35 + off) * 3; if (i === xs) c.moveTo(e.x + i * 4, y); else c.lineTo(e.x + i * 4, y); } c.stroke(); }
    c.fillStyle = BLACK; c.beginPath();
    for (let i = xs; i <= xe; i++) {
      const hv = hash(i * 2.3 + e.x * 0.01);
      if (hv < 0.72) continue;
      const x = e.x + i * 4, y = e.cs[i], len = 8 + hv * 22;
      c.moveTo(x - 4, y - 1); c.lineTo(x + 0.5, y + len); c.lineTo(x + 4, y - 1);
    }
    c.fill();
    drawGrass(c, w, e.x + xs * 4, e.x + xe * 4, (x) => e.cs[clamp(Math.round((x - e.x) / 4), 0, e.cs.length - 1)], 6, 1, 1.4);
    /* water dripping from the stalactites */
    c.fillStyle = 'rgba(235,240,240,0.55)';
    for (let k = 0; k < 6; k++) {
      const i = xs + Math.floor(hash(k * 5.1 + e.x) * (xe - xs)); if (i < 0 || i > xe) continue;
      const x = e.x + i * 4, y0 = e.cs[i] + 10, ph = (w.t * 1.6 + k * 53) % 150;
      if (y0 + ph < GY - 2) c.fillRect(x - 0.7, y0 + ph, 1.4, 3.5);
    }
  },
};

K.spikes = {
  draw(c, e) {
    const x0 = e.x, x1 = e.x + e.w, base = e.y + e.h;
    c.fillStyle = c.strokeStyle = BLACK; c.lineJoin = 'round';
    c.fillRect(x0 - 2, base - 3, x1 - x0 + 4, 4);
    const n = Math.max(2, Math.round((x1 - x0) / 7.5)), sp = (x1 - x0) / n;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const sx = x0 + i * sp, hv = hash(i * 4.7 + e.x * 0.13), ht = (e.h - 1) - hv * 2.5, lean = (hv - 0.5) * 2.2;
      c.moveTo(sx, base - 2); c.lineTo(sx + sp / 2 + lean, base - 3 - ht); c.lineTo(sx + sp * 0.92, base - 2);
    }
    c.fill();
    /* the same faint grey rim the creatures have */
    c.strokeStyle = 'rgba(150,154,148,0.28)'; c.lineWidth = 0.9; c.beginPath();
    for (let i = 0; i < n; i++) {
      const sx = x0 + i * sp, hv = hash(i * 4.7 + e.x * 0.13), ht = (e.h - 1) - hv * 2.5, lean = (hv - 0.5) * 2.2;
      c.moveTo(sx + sp * 0.12, base - 3 - ht * 0.45); c.lineTo(sx + sp / 2 + lean, base - 3 - ht);
    }
    c.stroke();
  },
  kill: (e, p) => hit({ x: e.x + 5, y: e.y + 6, w: e.w - 10, h: e.h - 6 }, p),
};

/* the bear trap: heavy iron you can grab and drag. Step or land on it and it snaps shut. */
K.trap = {
  update(e, w, p) {
    e.dx = 0; e.dy = 0;
    e.vy = Math.min((e.vy || 0) + GRAV, 12); e.y += e.vy; e.dy = e.vy;
    for (const s of w.solids) { if (s === e || !s.solid || s.dead || !hit(e, s)) continue; e.y = s.y - e.h; e.vy = 0; }
    if (e.y > VH + 100) e.dead = true;
    e.arm = p.standing === e && !p.dead ? (e.arm || 0) + 1 : 0;
    const near = Math.abs(p.x + 7 - (e.x + e.w / 2)) < 26 && p.y + p.h > e.y - 12;
    e.shut = e.arm >= 3 ? 1 : near ? Math.min(0.35, (e.shut || 0) + 0.04) : Math.max(0, (e.shut || 0) - 0.05);
    if (e.arm === 3) sfx.thud();
  },
  draw(c, e) {
    const sh = e.shut || 0, by = e.y + e.h, cx = e.x + e.w / 2;
    const closed = (e.arm || 0) >= 3 ? 1 : 0, ph = ((e.snap = approach(e.snap || 0, closed, 0.34)) * 1.9) + sh * 0.35 * (1 - (e.snap || 0));
    const L = 16;
    c.fillStyle = c.strokeStyle = BLACK; c.lineCap = 'round'; c.lineJoin = 'round';
    /* chain to a stake */
    c.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(cx + 12 + i * 4.2, by - 2.5 + (i % 2) * 0.8, 2.2, 1.3, 0, 0, 7); c.stroke(); }
    c.fillRect(cx + 30, by - 6, 2.4, 6); c.beginPath(); c.arc(cx + 31, by - 6.5, 2, 0, 7); c.fill();
    /* the jaws, flat when open and swung up and interlocked when shut */
    for (const s of [-1, 1]) {
      c.save(); c.translate(cx + s * 5, by - 4); c.scale(s, 1); c.rotate(-ph);
      c.fillRect(0, -2.6, L, 3.4);
      c.beginPath();
      for (let i = 0; i < 5; i++) { const tx = 1.2 + i * 3.1 + (s > 0 ? 0 : 1.5); c.moveTo(tx, -2.6); c.lineTo(tx + 1.5, -7.2); c.lineTo(tx + 3, -2.6); }
      c.fill();
      c.restore();
    }
    /* plate and trigger pan */
    c.fillRect(cx - 11, by - 4, 22, 4.2);
    c.beginPath(); c.ellipse(cx, by - 4, 5, 2, 0, Math.PI, 0); c.fill();
    c.strokeStyle = 'rgba(150,154,148,0.28)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx - 10, by - 3.7); c.lineTo(cx + 10, by - 3.7); c.stroke();
  },
  kill: (e, p) => (e.arm || 0) >= 3 && p.standing === e,
};

K.crate = {
  update(e, w) {
    e.dx = 0; e.dy = 0;
    e.vy = Math.min((e.vy || 0) + GRAV, 12);
    e.y += e.vy; e.dy = e.vy;
    for (const s of w.solids) {
      if (s === e || !s.solid || s.dead || !hit(e, s)) continue;
      e.y = s.y - e.h; e.vy = 0;
    }
    if (e.y > VH + 100) e.dead = true;
  },
  draw(c, e) {
    c.fillStyle = '#0a0a0a'; c.fillRect(e.x, e.y, e.w, e.h);
    c.strokeStyle = '#2b2b2b'; c.lineWidth = 2;
    c.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
    c.beginPath(); c.moveTo(e.x + 2, e.y + 2); c.lineTo(e.x + e.w - 2, e.y + e.h - 2);
    c.moveTo(e.x + e.w - 2, e.y + 2); c.lineTo(e.x + 2, e.y + e.h - 2); c.stroke();
  },
};

K.plate = {
  update(e, w, p) {
    const z = { x: e.x, y: e.y - 8, w: e.w, h: 14 };
    let on = hit(z, p);
    if (!on) for (const s of w.solids) if ((s.kind === 'crate' || s.kind === 'trap') && !s.dead && hit(z, s)) { on = true; break; }
    if (on && !e.pressed) sfx.click();
    e.pressed = on;
  },
  draw(c, e) {
    const d = e.pressed ? 3 : 0;
    c.fillStyle = BLACK; c.fillRect(e.x, e.y + d, e.w, e.h + 6);
    c.fillStyle = '#3a3a3a'; c.fillRect(e.x + 2, e.y + d, e.w - 4, 1.5);
  },
};

K.gate = {
  update(e, w) {
    e.open = e.winch ? e.pull : approach(e.open, e.plate.pressed ? 1 : 0, 1 / 45);
    e.dy = (GY - 150 - e.open * 150) - e.y; e.y += e.dy;
  },
  draw(c, e, w) {
    if (e.winch) {
      /* a wall of stone hauled up on a rope: the rope runs over a beam to the winch post */
      const wx = e.winch.x + 10, top = e.y;
      c.fillStyle = BLACK; c.fillRect(e.x, e.y, e.w, e.h);
      c.strokeStyle = 'rgba(120,124,118,0.22)'; c.lineWidth = 1; c.beginPath();
      for (let y = e.y + 14; y < e.y + e.h; y += 14) { c.moveTo(e.x, y); c.lineTo(e.x + e.w, y); }
      for (let y = e.y; y < e.y + e.h; y += 28) { c.moveTo(e.x + 6, y); c.lineTo(e.x + 6, y + 14); c.moveTo(e.x + 12, y + 14); c.lineTo(e.x + 12, y + 28); }
      c.stroke();
      c.fillStyle = BLACK; c.beginPath();
      { const n = Math.max(2, Math.round(e.w / 6)), sp = e.w / n; for (let i = 0; i < n; i++) { const x = e.x + i * sp; c.moveTo(x, e.y + e.h); c.lineTo(x + sp / 2, e.y + e.h + 8); c.lineTo(x + sp, e.y + e.h); } }
      c.fill();
      /* the hoist: two guide posts, a cross-beam, a pulley block over the wall and another at the winch end */
      const cx = e.x + e.w / 2, by = 40, wy = e.winch.y - 62, spin = (e.pull || 0) * 46;
      c.fillStyle = BLACK;
      c.fillRect(e.x - 7, by, 5, GY - by); c.fillRect(e.x + e.w + 2, by, 5, GY - by);
      c.fillRect(e.x - 9, by - 3, e.w + 18, 5);
      /* beam running out to the winch post, braced underneath */
      c.fillRect(Math.min(wx, e.x) - 3, by - 3, Math.abs(wx - e.x) + 12, 5);
      c.strokeStyle = BLACK; c.lineWidth = 2.4; c.lineCap = 'round';
      const bx = wx < e.x ? e.x - 7 : e.x + e.w + 7, bd = wx < e.x ? -1 : 1;
      c.beginPath(); c.moveTo(bx, by + 26); c.lineTo(bx - bd * 14, by + 2); c.stroke();
      c.fillRect(wx - 2.5, by - 3, 5, 10);
      /* wheels */
      const wheel = (x, y, r) => {
        c.fillStyle = BLACK; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        c.strokeStyle = 'rgba(150,154,148,0.38)'; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, r - 1.6, 0, 7);
        for (let k = 0; k < 3; k++) { const an = spin * 0.06 + k * Math.PI / 3; c.moveTo(x + Math.cos(an) * (r - 1.6), y + Math.sin(an) * (r - 1.6)); c.lineTo(x - Math.cos(an) * (r - 1.6), y - Math.sin(an) * (r - 1.6)); }
        c.stroke(); c.fillStyle = 'rgba(150,154,148,0.5)'; c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill();
      };
      c.strokeStyle = BLACK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(cx, by + 1); c.lineTo(cx, by + 9); c.moveTo(wx, by + 3); c.lineTo(wx, by + 9); c.stroke();
      wheel(cx, by + 15, 6.5); wheel(wx, by + 15, 5.5);
      /* the rope: winch end up to the far wheel, along under the beam, over the wall wheel, then down to the iron ring on the wall */
      const rope = (pts, w1) => {
        c.strokeStyle = BLACK; c.lineWidth = w1; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
        c.strokeStyle = 'rgba(150,154,148,0.32)'; c.lineWidth = 0.8; c.setLineDash([2, 3]); c.lineDashOffset = -spin * 0.5; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.setLineDash([]);
      };
      rope([[wx + (wx < cx ? -5.5 : 5.5), wy], [wx + (wx < cx ? -5.5 : 5.5), by + 15], [wx, by + 9.5], [cx, by + 8.5], [cx + (wx < cx ? 6.5 : -6.5), by + 15], [cx + (wx < cx ? 6.5 : -6.5), top - 6]], 2.2);
      /* bridle: two lines from the block to rings set in the top of the wall, with a knotted ring */
      rope([[cx + (wx < cx ? 6.5 : -6.5), top - 6], [e.x + 3, top - 1]], 1.5); rope([[cx + (wx < cx ? 6.5 : -6.5), top - 6], [e.x + e.w - 3, top - 1]], 1.5);
      c.fillStyle = BLACK; c.beginPath(); c.arc(cx + (wx < cx ? 6.5 : -6.5), top - 6, 2.4, 0, 7); c.fill();
      c.strokeStyle = 'rgba(150,154,148,0.45)'; c.lineWidth = 0.9; for (const rx of [e.x + 3, e.x + e.w - 3]) { c.beginPath(); c.arc(rx, top - 1, 2, 0, 7); c.stroke(); }
      return;
    }
    c.fillStyle = BLACK; c.fillRect(e.x, e.y, e.w, e.h);
    c.fillStyle = '#262626';
    for (let y = e.y + 12; y < e.y + e.h; y += 22) c.fillRect(e.x + 3, y, e.w - 6, 2);
    c.fillStyle = BLACK; c.beginPath();
    { const n = Math.max(2, Math.round(e.w / 5)), sp = e.w / n; for (let i = 0; i < n; i++) { const x = e.x + i * sp; c.moveTo(x, e.y + e.h); c.lineTo(x + sp / 2, e.y + e.h + 7); c.lineTo(x + sp, e.y + e.h); } }
    c.fill();
  },
};

/* a winch post with a rope: hold grab (swipe down and keep your finger there) to haul the wall up. It slips back slowly if you let go. */
K.winch = {
  update(e, w, p) {
    const g = e.gate, near = !p.dead && Math.abs(p.x + p.w / 2 - (e.x + 10)) < 26 && Math.abs(p.y + p.h - e.y) < 8 && p.onGround;
    e.held = near && input.grab && g.pull < 1;
    if (e.held) { g.pull = Math.min(1, g.pull + 1 / 80); p.pullAt = S.tick; e.work = (e.work || 0) + 1; if (e.work % 14 === 0) sfx.click(); }
    else if (g.pull < 1) g.pull = Math.max(0, g.pull - 1 / 1000);
    e.pullv = approach(e.pullv || 0, e.held ? 1 : 0, 0.15);
  },
  draw(c, e, w) {
    const x = e.x + 10, y = e.y, g = e.gate, sw = e.held ? Math.sin(e.work * 0.45) * 2.2 : windAt(x, w.t) * 1.5;
    c.fillStyle = c.strokeStyle = BLACK; c.lineCap = 'round';
    c.fillRect(x - 2.5, y - 56, 5, 56); c.fillRect(x - 9, y - 3, 18, 3);
    c.beginPath(); c.arc(x, y - 56, 6, 0, 7); c.fill();
    c.strokeStyle = 'rgba(200,200,195,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y - 56, 3.4, 0, 6.28); c.stroke();
    c.strokeStyle = BLACK; c.lineWidth = 1.8;
    const ry = y - 70 + (1 - g.pull) * 8 + e.pullv * 6, rx = x + 12 + sw;
    c.beginPath(); c.moveTo(x + 4, y - 58); c.quadraticCurveTo(x + 14, y - 62, rx, ry); c.stroke();
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + sw * 0.6, y - 28 + g.pull * 6); c.stroke();
    c.beginPath(); c.arc(rx + sw * 0.6, y - 27 + g.pull * 6, 3.2, 0, 7); c.fill();
    c.lineCap = 'butt';
  },
};

K.lever = {
  update(e, w, p) {
    const near = Math.abs(p.x + p.w / 2 - (e.x + e.w / 2)) < 30 && Math.abs(p.y + p.h - GY) < 6;
    if (near && input.grabEdge) { e.br.on = true; e.br.timer = e.br.dur; sfx.click(); }
    e.ang = approach(e.ang || 0, e.br.on ? 1 : -1, 0.12);
  },
  draw(c, e) {
    c.fillStyle = BLACK; c.fillRect(e.x, e.y - 8, e.w, 8);
    c.fillRect(e.x + 6, e.y - 14, 8, 8);
    c.strokeStyle = BLACK; c.lineWidth = 3; c.lineCap = 'round';
    const a = (e.ang || 0) * 0.9 - 0.15;
    c.beginPath(); c.moveTo(e.x + 10, e.y - 12); c.lineTo(e.x + 10 + Math.sin(a) * 22, e.y - 12 - Math.cos(a) * 22); c.stroke();
    c.beginPath(); c.arc(e.x + 10 + Math.sin(a) * 22, e.y - 12 - Math.cos(a) * 22, 3.5, 0, 7); c.fill();
    c.lineCap = 'butt';
  },
};

K.bridge = {
  update(e) {
    if (e.on) { e.timer--; e.w = Math.min(e.len, e.w + 3.4); if (e.timer <= 0) e.on = false; }
    else e.w = Math.max(0, e.w - 4);
  },
  draw(c, e) {
    if (e.w < 1) return;
    c.fillStyle = BLACK; c.fillRect(e.x, e.y, e.w, e.h);
    c.fillStyle = '#2a2a2a';
    for (let x = e.x + 10; x < e.x + e.w - 2; x += 14) c.fillRect(x, e.y + 2, 1.5, e.h - 4);
  },
};

function slabPlat(c, e) {
  c.fillStyle = BLACK; c.beginPath(); c.roundRect(e.x, e.y, e.w, e.h, 4); c.fill();
  c.fillStyle = '#2d2d2d'; c.fillRect(e.x + 4, e.y + 1, e.w - 8, 1.5);
}
K.mplat = {
  update(e, w) {
    const a = (w.t / e.per) * Math.PI * 2 + e.ph;
    const nx = e.ox + e.range * (0.5 - 0.5 * Math.cos(a));
    const ny = GY - e.vert * Math.sin(2 * a);
    e.dx = nx - e.x; e.dy = ny - e.y; e.x = nx; e.y = ny;
  },
  draw: slabPlat,
};
K.lift = {
  update(e, w) {
    const a = (w.t / e.per) * Math.PI * 2;
    const ny = GY - e.hgt * (0.5 - 0.5 * Math.cos(a));
    e.dx = 0; e.dy = ny - e.y; e.y = ny;
  },
  draw(c, e) {
    c.strokeStyle = '#161616'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(e.x + 8, e.y); c.lineTo(e.x + 8, -10); c.moveTo(e.x + e.w - 8, e.y); c.lineTo(e.x + e.w - 8, -10); c.stroke();
    slabPlat(c, e);
  },
};

/* a rotten rope bridge: planks give way under your feet, and the one behind it follows */
K.collapse = {
  update(e, w, p) {
    if (e.state === 0 && p.standing === e) { e.state = 1; e.timer = e.delay; if (e.prev && e.prev.state === 0) { e.prev.state = 1; e.prev.timer = e.delay + 14; } }
    else if (e.state === 1 && --e.timer <= 0) { e.state = 2; e.vy = 0; e.vr = (hash(e.x) - 0.5) * 0.16; e.rot = 0; e.solid = false; sfx.thud(); }
    else if (e.state === 2) { e.vy += 0.5; e.y += e.vy; e.rot += e.vr; if (e.y > VH + 80) e.dead = true; }
  },
  draw(c, e, w) {
    const j = e.state === 1 ? Math.sin(w.t * 2.2 + e.x) * 1.2 : 0;
    c.save(); c.translate(e.x + e.w / 2 + j, e.y + e.h / 2); c.rotate(e.rot || 0);
    c.fillStyle = BLACK; c.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
    c.fillStyle = 'rgba(160,162,156,0.26)'; c.fillRect(-e.w / 2 + 2, -e.h / 2 + 0.5, e.w - 4, 1.2);
    c.strokeStyle = 'rgba(160,162,156,0.2)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-e.w / 2 + 3, 1); c.lineTo(e.w / 2 - 5, 1.5); c.moveTo(-e.w / 2 + 6, 3); c.lineTo(e.w / 2 - 3, 2.5); c.stroke();
    if (e.state === 1) { c.strokeStyle = 'rgba(200,200,195,0.35)'; c.beginPath(); c.moveTo(-1, -e.h / 2); c.lineTo(2, e.h / 2); c.stroke(); }
    c.restore();
  },
};
/* the rope rails along the bridge: they sag, and hang loose where the planks have gone */
K.ropes = {
  draw(c, e, w) {
    c.strokeStyle = BLACK; c.lineCap = 'round';
    const hy = GY - 34;
    c.lineWidth = 1.8;
    const pl = e.planks;
    /* posts at both ends */
    c.fillRect(e.x - 3, GY - 46, 5, 46); c.fillRect(e.x + e.w - 2, GY - 46, 5, 46);
    c.beginPath(); c.moveTo(e.x, GY - 42); c.lineTo(pl[0].x + pl[0].w / 2, hy + 2);
    for (let i = 0; i < pl.length; i++) {
      const a = pl[i], x1 = a.x + a.w / 2, sag = 3 + Math.sin(i * 1.7) * 1.2;
      if (a.state < 2) {
        const nxt = pl[i + 1], x2 = nxt ? nxt.x + nxt.w / 2 : e.x + e.w, alive2 = nxt ? nxt.state < 2 : true;
        c.moveTo(x1, hy + 2);
        if (alive2 || !nxt) c.quadraticCurveTo((x1 + x2) / 2, hy + 2 + sag, x2, nxt ? hy + 2 : GY - 42);
        else c.quadraticCurveTo(x1 + 6, hy + 2 + 14, x1 + 4 + Math.sin(w.t * 0.05 + i) * 2, hy + 24);
        c.moveTo(x1, hy + 2); c.lineTo(x1, a.y);
      }
    }
    c.stroke();
    c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < pl.length; i++) { const a = pl[i]; if (a.state < 2 && i > 0 && pl[i - 1].state >= 2) { c.moveTo(a.x + a.w / 2, hy + 2); c.quadraticCurveTo(a.x - 8, hy + 14, a.x - 6 + Math.sin(w.t * 0.05 + i) * 2, hy + 26); } }
    c.stroke();
  },
};

K.saw = {
  update(e, w) {
    const a = (w.t / e.per) * Math.PI * 2 + e.ph;
    e.x = e.cx + e.ax * Math.sin(a); e.y = e.cy + e.ay * Math.sin(a); e.rot = (e.rot || 0) + 0.28;
  },
  draw(c, e) {
    c.strokeStyle = '#1b1b1b'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(e.cx - e.ax, e.cy - e.ay); c.lineTo(e.cx + e.ax, e.cy + e.ay); c.stroke();
    c.save(); c.translate(e.x, e.y); c.rotate(e.rot || 0);
    c.fillStyle = BLACK; c.beginPath();
    for (let i = 0; i < 14; i++) {
      const a0 = (i / 14) * Math.PI * 2, a1 = a0 + 0.22, a2 = a0 + 0.45;
      c.lineTo(Math.cos(a0) * e.r, Math.sin(a0) * e.r);
      c.lineTo(Math.cos(a1) * (e.r + 5), Math.sin(a1) * (e.r + 5));
      c.lineTo(Math.cos(a2) * e.r, Math.sin(a2) * e.r);
    }
    c.fill();
    c.fillStyle = '#3a3a3a'; c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill();
    c.restore();
  },
  kill: (e, p) => circHit(e.x, e.y, e.r + 1, shrink(p, 3)),
};

K.pend = {
  update(e, w) {
    const th = e.amp * Math.sin((w.t / e.per) * Math.PI * 2 + e.ph);
    e.bx = e.px + e.len * Math.sin(th); e.by = e.py + e.len * Math.cos(th);
  },
  draw(c, e) {
    c.strokeStyle = '#141414'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(e.px, e.py); c.lineTo(e.bx, e.by); c.stroke();
    c.fillStyle = BLACK; c.beginPath(); c.arc(e.bx, e.by, e.r, 0, 7); c.fill();
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; c.moveTo(e.bx + Math.cos(a - 0.2) * e.r, e.by + Math.sin(a - 0.2) * e.r); c.lineTo(e.bx + Math.cos(a) * (e.r + 7), e.by + Math.sin(a) * (e.r + 7)); c.lineTo(e.bx + Math.cos(a + 0.2) * e.r, e.by + Math.sin(a + 0.2) * e.r); }
    c.fill();
  },
  kill: (e, p) => circHit(e.bx, e.by, e.r + 1, shrink(p, 3)),
};

K.stal = {
  update(e, w, p) {
    if (e.state === 0 && Math.abs(p.x + 7 - (e.x + e.w / 2)) < e.trig) { e.state = 1; e.timer = e.delay; }
    else if (e.state === 1 && --e.timer <= 0) { e.state = 2; e.vy = 0; }
    else if (e.state === 2) { e.vy += 0.5; e.y += e.vy; if (e.y + e.h >= GY) { e.y = GY - e.h; e.state = 3; sfx.thud(); } }
  },
  draw(c, e, w) {
    const j = e.state === 1 ? Math.sin(w.t * 2.5) * 1.6 : 0;
    c.fillStyle = BLACK; c.beginPath();
    c.moveTo(e.x + j, e.y - 30); c.lineTo(e.x + e.w + j, e.y - 30); c.lineTo(e.x + e.w / 2 + j, e.y + e.h); c.fill();
    c.fillRect(e.x - 2 + j, e.y - 34, e.w + 4, 8);
  },
  kill: (e, p) => e.state === 2 && hit({ x: e.x + 4, y: e.y, w: e.w - 8, h: e.h }, p),
};

K.flip = {
  update(e, w, p) {
    if (p.g !== e.to && hit(e, p) && !p.dead) { p.g = e.to; p.vy = 0; sfx.flip(); }
  },
  draw(c, e, w) {
    for (let i = 0; i < 5; i++) {
      const x = e.x + 3 + i * 5 + Math.sin(w.t * 0.05 + i) * 2;
      const y0 = e.y + ((w.t * 1.1 * (e.to > 0 ? 1 : -1) + i * 40) % e.h + e.h) % e.h;
      c.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.2 * Math.sin(w.t * 0.1 + i)) + ')';
      c.fillRect(x, e.y, 1.5, e.h);
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x - 1, y0, 3, 3);
    }
  },
};

K.piston = {
  update(e, w) {
    const u = ((w.t + e.ph) % e.per) / e.per, full = GY - 4, up = 34;
    if (u < 0.5) { e.len = up; e.warn = 0; }
    else if (u < 0.66) { e.len = up + 6 * Math.sin(w.t); e.warn = 1; }
    else if (u < 0.72) e.len = lerp(up, full, (u - 0.66) / 0.06);
    else if (u < 0.88) { if (e.len < full) { e.len = full; sfx.thud(); } }
    else e.len = lerp(full, up, (u - 0.88) / 0.12);
  },
  draw(c, e) {
    c.fillStyle = BLACK; c.fillRect(e.x, -10, e.w, e.len + 10);
    c.fillRect(e.x - 4, -10, e.w + 8, 12);
    c.beginPath();
    for (let x = e.x; x < e.x + e.w - 1; x += 6.5) { c.moveTo(x, e.len); c.lineTo(x + 3.2, e.len + 12); c.lineTo(x + 6.5, e.len); }
    c.fill();
  },
  kill: (e, p) => hit({ x: e.x + 2, y: 0, w: e.w - 4, h: e.len + 10 }, shrink(p, 2)),
};
