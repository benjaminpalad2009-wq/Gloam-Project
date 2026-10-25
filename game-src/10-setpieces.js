/* ---------- signature set pieces: a rolling boulder, and the giant centipede asleep on its nest ---------- */

/* the boulder: held on the summit until the rope is hauled, then it rolls down the slope on its own */
K.rock = {
  update(e, w, p) {
    if (e.state === 'held') {
      if (e.pull >= 1) { e.state = 'roll'; e.vx = 0.7; sfx.thud(); S.shake = Math.max(S.shake, 2); }
      return;
    }
    if (e.state !== 'roll') return;
    const g0 = groundTop(w, e.x - 4), g1 = groundTop(w, e.x + 4), slope = (g1 - g0) / 8;
    e.vx = clamp(e.vx + slope * 0.24 - 0.002, 0.95, 3.4);
    e.x += e.vx; e.rot += e.vx / e.r; e.y = groundTop(w, e.x) - e.r;
    const ct = e.cent;
    if (ct && !ct.dead && circHit(e.x, e.y, e.r, ct)) {
      ct.dead = true; ct.deadT = 0; e.state = 'stop'; e.vx = 0; e.y = ct.y + ct.h - e.r + 2;
      S.shake = 10; sfx.thud(); sfx.die && 0;
    }
    if (e.x > w.width + 200) e.dead = true;
  },
  draw(c, e, w) {
    if (e.state === 'held' && e.winch) {
      /* the rope that holds it back, tied off at the winch post */
      c.strokeStyle = BLACK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(e.winch.x + 10, e.winch.y - 56); c.lineTo(e.x - e.r * 0.7, e.y - e.r * 0.4); c.stroke();
      c.fillRect(e.x + e.r - 2, e.y + e.r - 8, 6, 8);
    }
    c.save(); c.translate(e.x, e.y); c.rotate(e.rot || 0);
    c.fillStyle = BLACK; c.beginPath(); c.arc(0, 0, e.r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(120,124,118,0.28)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-e.r * 0.7, -e.r * 0.2); c.lineTo(-e.r * 0.2, -e.r * 0.1); c.lineTo(e.r * 0.1, -e.r * 0.65); c.moveTo(e.r * 0.15, e.r * 0.2); c.lineTo(e.r * 0.55, e.r * 0.55); c.moveTo(-e.r * 0.3, e.r * 0.5); c.lineTo(0, e.r * 0.15); c.stroke();
    c.restore();
  },
  kill: (e, p) => e.state === 'roll' && circHit(e.x, e.y, e.r - 3, shrink(p, 3)),
};

/* the giant centipede, curled asleep on a nest of sticks and bones. Come too close and it wakes; come closer and it strikes. */
K.centipede = {
  update(e, w, p) {
    e.t = (e.t || 0) + 1;
    if (e.dead) { e.deadT = (e.deadT || 0) + 1; e.awake = false; return; }
    const d = Math.abs(p.x + 7 - (e.x + e.w / 2)) - e.w / 2;
    const was = e.awake;
    e.awake = !p.dead && d < 100 && p.y + p.h > e.y - 50;
    if (e.awake && !was) sfx.screech();
    e.rise = approach(e.rise || 0, e.awake ? 1 : 0, 0.05);
  },
  draw(c, e, w) {
    const x0 = e.x, y0 = e.y + e.h, wd = e.w, N = 11, t = e.t || 0, dead = e.dead;
    const flat = dead ? Math.min(1, (e.deadT || 0) / 40) : 0, rise = e.rise || 0;
    const fade = dead ? Math.max(0.55, 1 - (e.deadT || 0) / 300) : 1;
    c.save(); c.globalAlpha = fade; c.fillStyle = c.strokeStyle = BLACK; c.lineCap = c.lineJoin = 'round';
    /* the nest: a ring of sticks and a few bones */
    c.lineWidth = 2; c.beginPath();
    for (let i = 0; i < 26; i++) {
      const hv = hash(i * 3.7 + e.x), px = x0 - 16 + hv * (wd + 32), ln = 10 + hash(i * 1.9) * 22, an = -0.6 + hash(i * 5.3) * 1.2 + (px < x0 + wd / 2 ? -0.5 : 0.5);
      c.moveTo(px, y0 + 1); c.lineTo(px + Math.sin(an) * ln, y0 - Math.cos(an) * ln * 0.6 - 2);
    }
    c.stroke();
    c.fillRect(x0 - 20, y0 - 4, wd + 40, 6);
    c.strokeStyle = 'rgba(200,200,195,0.4)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 + wd + 4, y0 - 7); c.lineTo(x0 + wd + 16, y0 - 12); c.moveTo(x0 + wd + 10, y0 - 9); c.lineTo(x0 + wd + 14, y0 - 3); c.stroke();
    c.strokeStyle = BLACK;
    /* the body: segments along a low arch, head at the left */
    const seg = [];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), bx = x0 + 18 + u * (wd - 34);
      let arch = Math.sin(u * Math.PI) * (e.h - 12) * (1 - flat * 0.85) + Math.sin(t * 0.04 + i * 0.5) * (dead ? 0 : 0.9 + rise * 1.2);
      const lift = i < 3 ? (3 - i) / 3 * rise * 26 * (1 - flat) : 0;
      seg.push({ x: bx, y: y0 - 7 - arch - lift, r: 7.6 - Math.abs(u - 0.45) * 5 + (i === 0 ? 2 : 0) });
    }
    for (let i = 0; i < N; i++) for (const s2 of [-1, 1]) {
      const q = seg[i], sw = dead ? 0 : Math.sin(t * (rise > 0.5 ? 0.35 : 0.05) + i * 0.8 + s2) * (2 + rise * 2.5);
      c.lineWidth = 1.5; c.beginPath(); c.moveTo(q.x, q.y + q.r * 0.4); c.lineTo(q.x + s2 * 5 + sw, y0 - 2 - (dead ? 0 : 3)); c.stroke();
    }
    for (let i = N - 1; i >= 0; i--) { const q = seg[i]; c.beginPath(); c.ellipse(q.x, q.y, q.r * 0.95, q.r, 0, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(150,154,148,0.22)'; c.lineWidth = 1;
    for (let i = 1; i < N - 1; i++) { const q = seg[i]; c.beginPath(); c.arc(q.x, q.y, q.r * 0.75, -2.2, -0.9); c.stroke(); }
    const h = seg[0];
    c.strokeStyle = BLACK; c.lineWidth = 2.4;
    const open = dead ? 0 : 1.2 + rise * 5 + (rise > 0.5 ? Math.sin(t * 0.5) * 1.5 : 0);
    for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(h.x - 7, h.y + 3); c.quadraticCurveTo(h.x - 15, h.y + 4 + sg * open, h.x - 12, h.y + 4 + sg * (open + 4.5)); c.stroke(); }
    c.lineWidth = 1.2;
    for (const sg of [0, 1]) { c.beginPath(); c.moveTo(h.x - 3, h.y - 6); c.quadraticCurveTo(h.x - 12, h.y - 14 + Math.sin(t * 0.07 + sg) * 2, h.x - 18 - sg * 5, h.y - 10 + sg * 3); c.stroke(); }
    if (!dead) { c.fillStyle = rise > 0.4 ? 'rgba(255,245,230,' + (0.7 + rise * 0.3) + ')' : 'rgba(220,220,215,0.35)'; c.fillRect(h.x - 8, h.y - (rise > 0.4 ? 2 : 0.5), 3.4, rise > 0.4 ? 2.6 : 1); c.fillRect(h.x - 3, h.y - (rise > 0.4 ? 3 : 1), 3, rise > 0.4 ? 2.4 : 1); }
    c.restore();
  },
  kill: (e, p) => !e.dead && (hit({ x: e.x + 4, y: e.y + 2, w: e.w - 8, h: e.h - 2 }, shrink(p, 2)) || (e.awake && hit({ x: e.x - 38, y: e.y - 10, w: e.w + 76, h: e.h + 10 }, shrink(p, 2)))),
};

/* conveyor: a belt laid across the path that drags you back the way you came */
K.conveyor = {
  update(e, w) { e.dx = e.dir * e.spd; e.dy = 0; e.off = ((e.off || 0) + e.dir * e.spd) % 12; },
  draw(c, e, w) {
    c.fillStyle = BLACK; c.beginPath(); c.roundRect(e.x, e.y, e.w, e.h, 5); c.fill();
    c.strokeStyle = 'rgba(150,152,146,0.35)'; c.lineWidth = 1.3;
    c.save(); c.beginPath(); c.rect(e.x + 6, e.y, e.w - 12, e.h); c.clip();
    for (let tx = e.x - 12 + (e.off || 0); tx < e.x + e.w + 12; tx += 12) { c.beginPath(); c.moveTo(tx, e.y + 1); c.lineTo(tx - 3 * e.dir, e.y + 5); c.stroke(); }
    c.restore();
    c.fillStyle = '#2d2d2d'; c.fillRect(e.x + 6, e.y + 1, e.w - 12, 1.4);
    for (const rx of [e.x + 6, e.x + e.w - 6]) {
      c.fillStyle = BLACK; c.beginPath(); c.arc(rx, e.y + 6, 8, 0, 7); c.fill();
      c.strokeStyle = 'rgba(160,162,156,0.4)'; c.lineWidth = 1.2; c.beginPath(); const a = (e.off || 0) * 0.5; c.moveTo(rx + Math.cos(a) * 5, e.y + 6 + Math.sin(a) * 5); c.lineTo(rx - Math.cos(a) * 5, e.y + 6 - Math.sin(a) * 5); c.stroke();
    }
    c.fillStyle = BLACK; c.fillRect(e.x + 20, e.y + e.h, 6, 40); c.fillRect(e.x + e.w - 26, e.y + e.h, 6, 40);
  },
};

/* falling bricks, hung from a frayed rope that is about to give out */
K.bricks = {
  update(e, w, p) {
    e.t = (e.t || 0) + 1;
    if (e.state === 0 && Math.abs(p.x + 7 - (e.x + e.w / 2)) < e.trig) { e.state = 1; e.timer = e.delay; sfx.click && sfx.click(); }
    else if (e.state === 1 && --e.timer <= 0) { e.state = 2; e.vy = 0; sfx.thud(); }
    else if (e.state === 2) { e.vy += 0.5; e.y += e.vy; if (e.y + e.h >= GY) { e.y = GY - e.h; e.state = 3; e.rs = 0; sfx.thud(); S.shake = Math.max(S.shake, 3); } }
    else if (e.state === 3) e.rs = (e.rs || 0) + 1;
  },
  draw(c, e, w) {
    const cx = e.x + e.w / 2, t = e.t || 0;
    const bricks = (yb, spread) => {
      for (let i = 0; i < 3; i++) {
        const by = yb + e.h - 9 - i * 9.5, bx = e.x + (i === 1 ? 3 : 0) + (spread ? (hash(i * 3.1 + e.x) - 0.5) * spread : 0), bw = e.w - (i === 1 ? 3 : 0);
        c.fillStyle = BLACK; c.fillRect(bx, by, bw, 8.4);
        c.fillStyle = 'rgba(150,150,145,0.22)'; c.fillRect(bx + 1, by + 1, bw - 2, 1); c.fillRect(bx + bw * 0.45, by + 2, 1, 5);
      }
    };
    c.strokeStyle = BLACK; c.lineCap = 'round';
    if (e.state < 3) {
      const j = e.state === 1 ? Math.sin(t * 1.3) * (1 + (1 - e.timer / e.delay) * 2) : 0, by = e.state === 2 ? e.y : e.y;
      /* the rope: thick above, fraying to a few last strands where it is tied round the stack */
      const top = -10, frayY = e.state < 2 ? by - 38 : by - 38;
      if (e.state < 2) {
        c.lineWidth = 3; c.beginPath(); c.moveTo(cx, top); c.lineTo(cx + j * 0.4, frayY); c.stroke();
        c.lineWidth = 1.3;
        const left = e.state === 1 ? Math.max(0, e.timer / e.delay) : 1, n = Math.max(1, Math.round(left * 3));
        for (let s = 0; s < n; s++) { c.beginPath(); c.moveTo(cx + j * 0.4 + (s - 1) * 1.6, frayY); c.lineTo(cx + j + (s - 1) * 1.3, by + 4); c.stroke(); }
        c.lineWidth = 1; for (let s = 0; s < 4; s++) { c.beginPath(); c.moveTo(cx + j * 0.4, frayY - 2); c.lineTo(cx + j * 0.4 + (s - 1.5) * 3 + Math.sin(t * 0.06 + s) * 1.2, frayY + 5 + s); c.stroke(); }
        c.lineWidth = 2; c.beginPath(); c.moveTo(e.x - 2 + j, by + e.h - 12); c.lineTo(e.x + e.w + 2 + j, by + e.h - 12); c.moveTo(e.x - 2 + j, by + e.h - 22); c.lineTo(e.x + e.w + 2 + j, by + e.h - 22); c.stroke();
      } else {
        const fall = Math.max(0, e.y - (GY - e.h));
        const swing = Math.sin(t * 0.18) * 3;
        c.lineWidth = 3; c.beginPath(); c.moveTo(cx, top); c.lineTo(cx + swing * 0.3, 52 + Math.min(40, (e.vy || 0) * 3)); c.stroke();
        c.lineWidth = 1; c.beginPath(); c.moveTo(cx + swing * 0.3, 52 + Math.min(40, (e.vy || 0) * 3)); c.lineTo(cx + swing * 1.4, 60 + Math.min(48, (e.vy || 0) * 3)); c.stroke(); void fall;
      }
      c.save(); c.translate(j, 0); bricks(by, 0); c.restore();
    } else {
      /* rubble, and the slack rope hanging off into the dark */
      c.lineWidth = 3; c.beginPath(); c.moveTo(cx, -10); c.lineTo(cx + 1, 54); c.stroke(); c.lineWidth = 1; c.beginPath(); c.moveTo(cx + 1, 54); c.lineTo(cx + 4 + Math.sin(t * 0.03) * 3, 66); c.stroke();
      c.fillStyle = BLACK;
      for (let i = 0; i < 4; i++) { const bx = e.x - 6 + i * 11 + (hash(i + e.x) - 0.5) * 6; c.save(); c.translate(bx + 6, GY - 3); c.rotate((hash(i * 7 + e.x) - 0.5) * 1.1); c.fillRect(-6, -3, 12, 6); c.restore(); }
    }
  },
  kill: (e, p) => e.state === 2 && hit({ x: e.x + 1, y: e.y, w: e.w - 2, h: e.h }, shrink(p, 1)),
};
