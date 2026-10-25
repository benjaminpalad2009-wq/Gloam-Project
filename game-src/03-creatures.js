/* ---------- creatures ---------- */
function physStep(e, w) {
  e.vy = Math.min(e.vy + GRAV, 12);
  e.x += e.vx; e.blocked = false;
  for (const s of w.solids) {
    if (s === e || !s.solid || s.dead || !hit(e, s)) continue;
    const rise = e.y + e.h - s.y;
    if (rise > 0 && rise <= STEP && e.onGround) {
      const oy = e.y; e.y = s.y - e.h;
      let bad = false;
      for (const o of w.solids) if (o !== e && !o.dead && hit(e, o)) { bad = true; break; }
      if (!bad) continue;
      e.y = oy;
    }
    if (e.vx > 0) e.x = s.x - e.w; else if (e.vx < 0) e.x = s.x + s.w;
    e.vx = 0; e.blocked = true;
  }
  e.y += e.vy; e.onGround = false;
  for (const s of w.solids) {
    if (s === e || !s.solid || s.dead || !hit(e, s)) continue;
    if (e.vy > 0) { e.y = s.y - e.h; e.onGround = true; } else e.y = s.y + s.h;
    e.vy = 0;
  }
  if (e.y > VH + 90) e.dead = true;
}
const eyes = (c, x, y, s, gap) => { c.fillStyle = EYE; c.fillRect(x - gap, y, s, s); c.fillRect(x + gap, y, s, s); };
const bodyHit = (e, p, m) => hit(shrink(e, m), shrink(p, 3));

/* spider: sits, hangs on a thread, or leaps after the boy */
K.spider = {
  update(e, w, p) {
    const dx = p.x + 7 - (e.x + e.w / 2);
    e.face = sgn(dx) || e.face || 1;
    e.anim = (e.anim || 0) + Math.abs(e.vx) * 0.25 + 0.02;
    if (e.state === 'hang') {
      if (Math.abs(dx) < e.trig * 0.5) { e.state = 'drop'; sfx.screech(); }
      return;
    }
    if (e.state === 'drop') { e.y += 6; if (e.y + e.h >= GY) { e.y = GY - e.h; e.vy = 0; e.state = 'chase'; } return; }
    if (e.state === 'idle') { if (Math.abs(dx) < e.trig) { e.state = 'chase'; sfx.screech(); } else { e.vx = 0; physStep(e, w); return; } }
    if (Math.abs(dx) > 650) { e.state = 'idle'; e.vx = 0; }
    e.cool = (e.cool || 0) - 1;
    if (e.onGround) {
      e.vx = sgn(dx) * e.speed;
      if (Math.abs(dx) < 90 && e.cool <= 0) { e.burst = 26; e.cool = 110; sfx.screech && 0; }
      if (e.burst > 0) { e.burst--; e.vx = sgn(dx) * e.speed * 1.35; }
    }
    physStep(e, w);
  },
  draw(c, e, w) {
    const f = e.face || 1, a = e.anim || 0, cx = e.x + e.w / 2, gy = e.y + e.h;
    const moving = Math.abs(e.vx) > 0.1, grounded = e.onGround || e.state === 'idle';
    const by = e.y + e.h * 0.42 + (moving ? Math.sin(a * 6) * 0.7 : Math.sin(w.t * 0.05) * 0.4);
    c.fillStyle = c.strokeStyle = BLACK; c.lineCap = c.lineJoin = 'round';
    if (e.state === 'hang' || e.state === 'drop') { c.lineWidth = 1; c.beginPath(); c.moveTo(cx, -10); c.lineTo(cx, by); c.stroke(); }
    for (let j = 0; j < 8; j++) {
      const k = j - 3.5, rx = cx + f * k * 1.5, ph = a * 3 + j * 0.9 + (j % 2) * Math.PI;
      const tx = grounded ? cx + k * 6.6 + (moving ? Math.sin(ph) * 5 : 0) : cx + k * 10 + f * 7, ty = grounded ? gy - (moving ? Math.max(0, Math.cos(ph)) * 5 : 0) : by + 7 + Math.abs(k) * 1.6 + (j % 2) * 3;
      const L = ik(rx, by, tx, ty, 10.5, 12.5, (q) => -q.y);
      c.lineWidth = 2; c.beginPath(); c.moveTo(rx, by); c.lineTo(L.knee.x, L.knee.y); c.stroke();
      c.lineWidth = 1.4; c.beginPath(); c.moveTo(L.knee.x, L.knee.y); c.lineTo(L.foot.x, L.foot.y); c.stroke();
    }
    c.beginPath(); c.ellipse(cx - f * 9, by - 2, 10.5, 8, -0.2 * f, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx + f * 3, by, 6.8, 5.6, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx + f * 9.5, by + 1, 5, 4.4, 0, 0, 7); c.fill();
    /* sheen and markings on the abdomen so it reads as a body, not a blob */
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx - f * 14, by - 7); c.quadraticCurveTo(cx - f * 8, by - 11, cx - f * 3, by - 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.moveTo(cx - f * 11, by - 3); c.lineTo(cx - f * 7, by); c.lineTo(cx - f * 11, by + 3); c.lineTo(cx - f * 15, by); c.fill();
    c.fillStyle = BLACK;
    const bite = e.state === 'chase' ? Math.sin(w.t * 0.5) * 1 : 0;
    c.strokeStyle = BLACK; c.lineWidth = 1.6;
    for (const o of [0, 1.6]) { c.beginPath(); c.moveTo(cx + f * (11.5 + o), by + 3); c.quadraticCurveTo(cx + f * (14 + o + bite), by + 5, cx + f * (12.6 + o), by + 8.5 + bite); c.stroke(); }
    c.fillStyle = EYE;
    for (const [dx, dy, r] of [[10.8, -1.4, 1.2], [8.8, -2.3, 1], [12.2, 0.2, 0.9], [9.6, 0.2, 0.8]]) { c.beginPath(); c.arc(cx + f * dx, by + dy, r, 0, 7); c.fill(); }
  },
  kill: (e, p) => hit({ x: e.x + 9, y: e.y + 10, w: e.w - 18, h: e.h - 10 }, shrink(p, 2)),
};

/* ground runners: crawler, hound (chase after a trigger point) */
function runnerUpdate(e, w, p) {
  if (e.state === 'wait') { if (p.x > e.trig) { e.state = 'chase'; if (e.kind === 'hound') sfx.screech(); } else return; }
  const dx = p.x + 7 - (e.x + e.w / 2);
  /* commit to a direction: only turn once the boy is well behind, so jumping over it is fair */
  if (!e.dirv) e.dirv = sgn(dx) || 1;
  if (sgn(dx) !== e.dirv && Math.abs(dx) > 48) e.dirv = sgn(dx);
  e.vx = e.dirv * e.speed;
  e.anim = (e.anim || 0) + Math.abs(e.vx) * 0.2;
  physStep(e, w);
}
K.crawler = {
  update: runnerUpdate,
  draw(c, e, w) {
    const f = e.dirv || sgn(e.vx) || 1, a = e.anim || 0, gy = e.y + e.h, N = 7;
    const x0 = e.x + e.w / 2 - f * e.w * 0.4, step = (e.w * 0.8) / (N - 1);
    const seg = [];
    for (let i = 0; i < N; i++) seg.push({ x: x0 + f * step * i, y: e.y + e.h * 0.56 + Math.sin(a * 1.6 - i * 0.7) * 1.6 - (i > N - 3 ? 2.2 : 0), r: i === N - 1 ? 7.4 : 6.4 - Math.abs(i - 3) * 0.4 });
    c.fillStyle = c.strokeStyle = BLACK; c.lineCap = c.lineJoin = 'round';
    for (let i = 0; i < N; i++) for (let s2 = 0; s2 < 2; s2++) {
      const q = seg[i], ph = a * 2.4 + i * 0.95 + s2 * Math.PI;
      const L = ik(q.x, q.y + q.r * 0.3, q.x + Math.sin(ph) * 4.5 + (s2 ? -2 : 2), gy - Math.max(0, Math.cos(ph)) * 3.5, 5.5, 6.5, (k) => -k.y);
      c.lineWidth = 1.7; c.beginPath(); c.moveTo(q.x, q.y + q.r * 0.3); c.lineTo(L.knee.x, L.knee.y); c.lineTo(L.foot.x, L.foot.y); c.stroke();
    }
    for (let i = 0; i < N; i++) { const q = seg[i]; c.beginPath(); c.ellipse(q.x, q.y, q.r * 1.12, q.r, 0, 0, 7); c.fill(); }
    for (let i = 0; i < N - 1; i++) { const q = seg[i]; c.beginPath(); c.moveTo(q.x - 2.5, q.y - q.r + 1); c.lineTo(q.x, q.y - q.r - 3.4); c.lineTo(q.x + 2.5, q.y - q.r + 1); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1;
    for (let i = 0; i < N - 1; i++) { const q = seg[i]; c.beginPath(); c.arc(q.x, q.y, q.r * 0.8, f > 0 ? -1.9 : -1.24, f > 0 ? -1.2 : -0.5); c.stroke(); }
    const h = seg[N - 1];
    c.strokeStyle = BLACK; c.lineWidth = 2.2;
    const open = 2 + Math.sin(w.t * 0.3) * 1.4;
    for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(h.x + f * 6, h.y + 2); c.quadraticCurveTo(h.x + f * 12, h.y + 2 + sg * open, h.x + f * 9.5, h.y + 2 + sg * (open + 3.6)); c.stroke(); }
    c.lineWidth = 1.1;
    for (const sg of [0, 1]) { c.beginPath(); c.moveTo(h.x + f * 5, h.y - 4); c.quadraticCurveTo(h.x + f * 12, h.y - 11 + Math.sin(w.t * 0.1 + sg) * 2, h.x + f * (15 + sg * 4), h.y - 8 - sg * 3 + Math.sin(w.t * 0.13 + sg) * 2); c.stroke(); }
    c.fillStyle = EYE;
    c.beginPath(); c.arc(h.x + f * 4.6, h.y - 2.2, 1.5, 0, 7); c.fill(); c.beginPath(); c.arc(h.x + f * 2.2, h.y - 3.6, 1.1, 0, 7); c.fill();
  },
  kill: (e, p) => hit({ x: e.x + 12, y: e.y + 5, w: e.w - 24, h: e.h - 5 }, p),
};
K.hound = {
  update: runnerUpdate,
  draw(c, e) {
    const cx = e.x + e.w / 2, a = e.anim || 0, f = sgn(e.vx || 1);
    c.fillStyle = BLACK; c.strokeStyle = BLACK; c.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const lx = cx + (i < 2 ? -1 : 1) * 12 * f * (i % 2 ? 0.6 : 1), sw = Math.sin(a + i * 1.6) * 8;
      c.beginPath(); c.moveTo(lx, e.y + e.h * 0.6); c.lineTo(lx + sw, e.y + e.h); c.stroke();
    }
    c.beginPath(); c.ellipse(cx, e.y + e.h * 0.5, 20, 9, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx + f * 21, e.y + e.h * 0.35, 8, 6, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(cx + f * 22, e.y + e.h * 0.2); c.lineTo(cx + f * 25, e.y + e.h * 0.02); c.lineTo(cx + f * 18, e.y + e.h * 0.2); c.fill();
    c.beginPath(); c.moveTo(cx - f * 18, e.y + e.h * 0.4); c.lineTo(cx - f * 32, e.y + e.h * 0.3 + Math.sin(a) * 3); c.stroke();
    c.fillStyle = EYE; c.fillRect(cx + f * 22, e.y + e.h * 0.28, 2.5, 2.5);
  },
  kill: (e, p) => bodyHit(e, p, 4),
};

/* bat: hovers, then dives at where the boy is */
K.bat = {
  update(e, w, p) {
    e.flap = (e.flap || 0) + 0.45;
    const dx = p.x + 7 - e.x, dy = p.y + 15 - e.y;
    if (e.state !== 'dive') e.face = sgn(dx) || e.face || 1;
    if (e.state === 'idle') {
      e.x = e.hx + Math.sin(w.t * 0.03 + e.hx) * 8; e.y = e.hy + Math.sin(w.t * 0.07 + e.hx) * 6;
      e.cool = (e.cool || 0) - 1;
      if (Math.abs(dx) < e.trig && e.cool <= 0) {
        const L = Math.hypot(dx, dy) || 1; e.vx = (dx / L) * e.speed; e.vy = (dy / L) * e.speed; e.state = 'dive'; e.timer = 0; sfx.screech();
      }
    } else if (e.state === 'dive') {
      e.x += e.vx; e.y += e.vy; e.timer++;
      if (e.y > GY - 4 || e.timer > 80) e.state = 'rise';
    } else {
      const L = Math.hypot(e.hx - e.x, e.hy - e.y);
      if (L < 4) { e.state = 'idle'; e.cool = 70; } else { e.x += ((e.hx - e.x) / L) * 2.4; e.y += ((e.hy - e.y) / L) * 2.4; }
    }
  },
  draw(c, e) {
    const fl = Math.sin(e.flap || 0), dir = e.state === 'dive' ? sgn(e.vx) || 1 : (e.face || 1);
    c.fillStyle = c.strokeStyle = BLACK; c.lineCap = c.lineJoin = 'round';
    for (const s of [-1, 1]) {
      const X = (v) => e.x + s * v, sh = [X(3), e.y - 2], el = [X(10), e.y - 8 - fl * 5], wr = [X(19), e.y - 6 - fl * 11];
      const t1 = [X(31), e.y - 1 - fl * 12], t2 = [X(28), e.y + 7 - fl * 6], t3 = [X(19), e.y + 11 - fl * 2];
      c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(wr[0], wr[1]); c.lineTo(t1[0], t1[1]);
      c.quadraticCurveTo(X(26), e.y + 1 - fl * 8, t2[0], t2[1]);
      c.quadraticCurveTo(X(22), e.y + 6 - fl * 3, t3[0], t3[1]);
      c.quadraticCurveTo(X(9), e.y + 6, X(3), e.y + 4); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 0.9;
      for (const t of [t1, t2, t3]) { c.beginPath(); c.moveTo(wr[0], wr[1]); c.lineTo(t[0], t[1]); c.stroke(); }
      c.strokeStyle = BLACK;
    }
    c.beginPath(); c.ellipse(e.x, e.y, 5.2, 6.8, 0, 0, 7); c.fill();
    const hx = e.x + dir * 1.2, hy = e.y - 7;
    c.beginPath(); c.arc(hx, hy, 4.1, 0, 7); c.fill();
    c.beginPath(); c.moveTo(hx - 3.6, hy - 1); c.lineTo(hx - 3.2, hy - 8.6); c.lineTo(hx - 0.4, hy - 3); c.fill();
    c.beginPath(); c.moveTo(hx + 3.6, hy - 1); c.lineTo(hx + 3.2, hy - 8.6); c.lineTo(hx + 0.4, hy - 3); c.fill();
    c.beginPath(); c.moveTo(hx + dir * 3, hy + 0.5); c.lineTo(hx + dir * 6.2, hy + 2); c.lineTo(hx + dir * 3, hy + 3.2); c.fill();
    c.fillStyle = EYE; c.fillRect(hx - 2.4, hy - 1.4, 1.6, 1.8); c.fillRect(hx + 0.8, hy - 1.4, 1.6, 1.8);
    c.beginPath(); c.moveTo(hx - 1.2, hy + 3); c.lineTo(hx - 0.7, hy + 5); c.lineTo(hx - 0.2, hy + 3); c.moveTo(hx + 0.4, hy + 3); c.lineTo(hx + 0.9, hy + 5); c.lineTo(hx + 1.4, hy + 3); c.fill();
  },
  kill: (e, p) => circHit(e.x, e.y, 9, shrink(p, 3)),
};

/* worm: tendril bursting out of the ground after a short warning */
K.worm = {
  update(e, w, p) {
    const P = e.per, u = (w.t + e.ph) % P;
    const near = Math.abs(p.x + 7 - e.x) < 260;
    if (!near) { e.len = 0; e.warn = 0; return; }
    const warnT = e.warnT, riseT = 8, holdT = 26, backT = 16;
    if (u < P - warnT - riseT - holdT - backT) { e.len = 0; e.warn = 0; }
    else if (u < P - riseT - holdT - backT) { e.len = 0; e.warn = 1; }
    else if (u < P - holdT - backT) { e.len = lerp(0, e.max, (u - (P - riseT - holdT - backT)) / riseT); e.warn = 0; }
    else if (u < P - backT) { e.len = e.max; }
    else e.len = lerp(e.max, 0, (u - (P - backT)) / backT);
  },
  draw(c, e, w) {
    if (e.warn) {
      c.fillStyle = BLACK;
      for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(e.x + (Math.random() - 0.5) * 24, GY - 1 - Math.random() * 5, 1.2 + Math.random(), 0, 7); c.fill(); }
      c.strokeStyle = BLACK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e.x - 14, GY); c.lineTo(e.x - 6, GY - 3); c.moveTo(e.x + 14, GY); c.lineTo(e.x + 6, GY - 3); c.stroke();
    }
    if (e.len < 2) return;
    const L = e.len, sw = Math.sin(w.t * 0.2 + e.x) * 4;
    const px = (v) => e.x + Math.sin(v * 3.2 + w.t * 0.16 + e.x) * 3.2 * v + sw * v * v;
    c.fillStyle = BLACK; c.beginPath();
    c.moveTo(e.x - 11, GY + 2);
    for (let v = 0; v <= 1.001; v += 0.1) c.lineTo(px(v) - (10.5 - v * 4.5), GY - L * v);
    for (let v = 1; v >= -0.001; v -= 0.1) c.lineTo(px(v) + (10.5 - v * 4.5), GY - L * v);
    c.lineTo(e.x + 11, GY + 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 1;
    for (let v = 0.12; v < 0.95; v += 0.13) { const x = px(v), w2 = 9.5 - v * 4.2; c.beginPath(); c.moveTo(x - w2, GY - L * v); c.quadraticCurveTo(x, GY - L * v + 3, x + w2, GY - L * v); c.stroke(); }
    const tx = px(1), ty = GY - L;
    c.fillStyle = BLACK;
    if (L > 30) {
      const open = Math.min(1, (L - 30) / 40) * (0.6 + 0.4 * Math.sin(w.t * 0.35));
      for (const sg of [-1, 0, 1]) {
        c.beginPath(); c.moveTo(tx + sg * 4, ty + 3); c.quadraticCurveTo(tx + sg * (8 + open * 6), ty - 6, tx + sg * (6 + open * 9), ty - 14 - open * 4); c.quadraticCurveTo(tx + sg * 2, ty - 5, tx + sg * 1, ty + 3); c.fill();
      }
      c.fillStyle = EYE; c.fillRect(tx - 4, ty + 6, 2, 2); c.fillRect(tx + 2, ty + 6, 2, 2);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(tx + sg * 2.5, ty - 2); c.lineTo(tx + sg * 3.2, ty - 6.5 - open * 2); c.lineTo(tx + sg * 4.2, ty - 2); c.fill(); }
    }
  },
  kill: (e, p) => e.len > 6 && hit({ x: e.x - 6, y: GY - e.len, w: 12, h: e.len }, shrink(p, 3)),
};

/* jellyfish bobbing over a gap */
K.jelly = {
  update(e, w) { const a = (w.t / e.per) * 6.283 + e.ph; e.y = e.cy + e.amp * Math.sin(a); e.x = e.cx + Math.sin(a * 0.5) * 6; },
  draw(c, e, w) {
    c.fillStyle = BLACK; c.strokeStyle = BLACK; c.lineWidth = 2;
    c.beginPath(); c.arc(e.x, e.y, 15, Math.PI, 0); c.quadraticCurveTo(e.x, e.y + 8, e.x - 15, e.y); c.fill();
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(e.x + i * 5, e.y + 3);
      c.bezierCurveTo(e.x + i * 5 + Math.sin(w.t * 0.1 + i) * 6, e.y + 14, e.x + i * 5 - Math.sin(w.t * 0.1 + i) * 6, e.y + 24, e.x + i * 5 + Math.sin(w.t * 0.12 + i) * 4, e.y + 34); c.stroke();
    }
    c.fillStyle = EYE; c.fillRect(e.x - 5, e.y - 4, 2, 2); c.fillRect(e.x + 3, e.y - 4, 2, 2);
  },
  kill: (e, p) => circHit(e.x, e.y - 2, 14, shrink(p, 3)) || hit({ x: e.x - 9, y: e.y, w: 18, h: 22 }, shrink(p, 4)),
};

/* crow: flies in from the right at a fixed height; zone spawns them */
K.crowzone = {
  always: true,
  update(e, w, p) {
    if (p.x < e.x0 || p.x > e.x1) return;
    e.cool = (e.cool || 0) - 1;
    if (e.cool <= 0) {
      e.cool = e.gap + Math.random() * 40;
      const low = Math.random() < 0.55;
      w.ents.push({ kind: 'crow', x: w.camX + w.vw + 40, y: low ? GY - 22 : GY - 74, w: 22, h: 10, speed: e.speed, always: true, flap: 0 });
    }
  },
  draw() {},
};
K.crow = {
  update(e, w, p) {
    e.x -= e.speed; e.flap += 0.5;
    if (e.x < w.camX - 80) e.dead = true;
  },
  draw(c, e) {
    const f = Math.sin(e.flap) * 8;
    c.fillStyle = BLACK;
    c.beginPath(); c.ellipse(e.x, e.y, 10, 4.5, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(e.x - 9, e.y); c.lineTo(e.x - 6, e.y - 10 - f); c.lineTo(e.x + 3, e.y - 1); c.fill();
    c.beginPath(); c.moveTo(e.x - 11, e.y); c.lineTo(e.x - 20, e.y + 4); c.lineTo(e.x - 10, e.y + 3); c.fill();
    c.beginPath(); c.moveTo(e.x - 12, e.y - 2); c.lineTo(e.x - 20, e.y - 4); c.lineTo(e.x - 12, e.y + 2); c.fill();
    c.beginPath(); c.moveTo(e.x + 9, e.y - 1); c.lineTo(e.x + 17, e.y + 1); c.lineTo(e.x + 9, e.y + 3); c.fill();
    c.fillStyle = EYE; c.fillRect(e.x + 5, e.y - 2.5, 1.8, 1.8);
  },
  kill: (e, p) => hit({ x: e.x - 11, y: e.y - 5, w: 22, h: 10 }, shrink(p, 3)),
};

/* boulder: rolls after the boy, swallowed by gaps */
K.boulder = {
  update(e, w, p) {
    if (e.state === 'wait') { if (p.x > e.trig) { e.state = 'roll'; e.x = p.x - 400; } else return; }
    e.rot = (e.rot || 0) + e.speed / e.r;
    let ground = null;
    for (const s of w.solids) if (s.solid && !s.dead && e.x > s.x && e.x < s.x + s.w && s.y >= GY - 1) ground = s;
    if (ground) { e.x += e.speed; e.y = GY - e.r; e.vy = 0; }
    else { e.vy = (e.vy || 0) + GRAV; e.y += e.vy; e.x += e.speed * 0.5; if (e.y > VH + 100) e.dead = true; }
  },
  draw(c, e) {
    if (e.state === 'wait') return;
    c.save(); c.translate(e.x, e.y); c.rotate(e.rot || 0);
    c.fillStyle = BLACK; c.beginPath(); c.arc(0, 0, e.r, 0, 7); c.fill();
    c.strokeStyle = '#2e2e2e'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-e.r * 0.6, -e.r * 0.2); c.lineTo(-e.r * 0.1, -e.r * 0.1); c.lineTo(e.r * 0.2, -e.r * 0.6);
    c.moveTo(e.r * 0.1, e.r * 0.2); c.lineTo(e.r * 0.5, e.r * 0.5); c.stroke();
    c.restore();
  },
  kill: (e, p) => e.state !== 'wait' && circHit(e.x, e.y, e.r - 3, shrink(p, 3)),
};

/* stalker: huge spider walking behind, driving the boy forward */
K.stalker = {
  always: true,
  update(e, w, p) {
    if (e.state === 'wait') { if (p.x > e.trig) { e.state = 'chase'; sfx.screech(); } else return; }
    e.x = Math.min(e.x + e.speed, e.limit);
    e.anim = (e.anim || 0) + (e.x < e.limit ? 0.14 : 0.03);
  },
  draw(c, e, w) {
    if (e.state === 'wait' && e.x < w.camX - 120) return;
    const bx = e.x + 40, a = e.anim || 0, by = 92 + Math.sin(a * 2) * 3;
    c.strokeStyle = c.fillStyle = BLACK; c.lineCap = c.lineJoin = 'round';
    for (let j = 0; j < 8; j++) {
      const k = j - 3.5, ph = a + j * 0.95 + (j % 2) * Math.PI;
      const rx = bx + k * 7, ry = by + 10;
      const tx = bx + k * 31 + Math.sin(ph) * 30, ty = GY - Math.max(0, Math.cos(ph)) * 38;
      const L = ik(rx, ry, tx, ty, 108, 124, (q) => -q.y);
      c.lineWidth = 7; c.beginPath(); c.moveTo(rx, ry); c.lineTo(L.knee.x, L.knee.y); c.stroke();
      c.lineWidth = 4.2; c.beginPath(); c.moveTo(L.knee.x, L.knee.y); c.lineTo(L.foot.x, L.foot.y); c.stroke();
      c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.1)';
      for (let q = 0.15; q < 1; q += 0.17) { const x = lerp(rx, L.knee.x, q), y = lerp(ry, L.knee.y, q); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y - 5); c.stroke(); }
      c.strokeStyle = BLACK;
    }
    c.beginPath(); c.ellipse(bx - 38, by - 6, 58, 40, -0.12, 0, 7); c.fill();
    c.beginPath(); c.ellipse(bx + 22, by + 2, 30, 25, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(bx + 50, by + 9, 19, 16, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(bx - 80, by - 26); c.quadraticCurveTo(bx - 40, by - 52, bx + 2, by - 28); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.beginPath(); c.moveTo(bx - 52, by - 12); c.lineTo(bx - 36, by); c.lineTo(bx - 52, by + 12); c.lineTo(bx - 68, by); c.fill();
    c.strokeStyle = BLACK; c.lineWidth = 3.2;
    const bite = Math.sin(a * 3) * 2;
    for (const o of [0, 5]) { c.beginPath(); c.moveTo(bx + 62 + o, by + 18); c.quadraticCurveTo(bx + 72 + o + bite, by + 24, bx + 66 + o, by + 38 + bite); c.stroke(); }
    c.fillStyle = EYE;
    for (const [dx, dy, r] of [[56, 4, 2.6], [61, 11, 1.8], [49, 1, 2], [53, 12, 1.4], [44, 8, 1.2], [63, 2, 1.3]]) { c.beginPath(); c.arc(bx + dx, by + dy, r, 0, 7); c.fill(); }
  },
  kill: (e, p) => e.state === 'chase' && hit({ x: e.x + 20, y: 90, w: 120, h: GY - 90 }, shrink(p, 3)) && p.x < e.x + 140,
};
