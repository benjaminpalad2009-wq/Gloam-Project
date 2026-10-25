/* ---------- atmosphere & drawing ---------- */
const ZONES = [
  { top: '#c6c9c8', mid: '#979d9b', bot: '#5a605e', fog: [205, 209, 207] },
  { top: '#8b9091', mid: '#666b6d', bot: '#3e4244', fog: [150, 156, 158] },
  { top: '#b5aea4', mid: '#857e74', bot: '#47433e', fog: [190, 184, 174] },
  { top: '#d6dadb', mid: '#a5acaf', bot: '#6a7175', fog: [215, 220, 222] },
  { top: '#5c6168', mid: '#3d4147', bot: '#1f2226', fog: [110, 116, 124] },
];

function bgItem(zone, r, R, x, sz) {
  if (zone === 1) { const up = r() < 0.55; return { t: up ? 'stalac' : 'stalag', x, w: R(14, 46) * sz, h: R(60, 220) * sz }; }
  if (zone === 2) {
    const q = r();
    if (q < 0.4) return { t: 'pipe', x, w: R(10, 24) * sz, joint: R(80, 250) };
    if (q < 0.7) return { t: 'gear', x, y: R(60, 240), rr: R(30, 80) * sz, sp: (r() < 0.5 ? -1 : 1) * R(0.004, 0.012), teeth: 10 + Math.floor(r() * 8) };
    return { t: 'chain', x, len: R(60, 220) };
  }
  if (zone === 4) return r() < 0.72 ? { t: 'spire', x, w: R(8, 22) * sz, h: R(120, 320) * sz, up: r() < 0.7 } : { t: 'eyes', x, y: R(120, 240), ph: R(0, 6) };
  const br = [], nb = 3 + Math.floor(r() * 3);
  for (let i = 0; i < nb; i++) br.push({ k: R(0.3, 0.95), dx: (r() < 0.5 ? -1 : 1) * R(20, 70), dy: R(-30, 10) });
  return { t: 'tree', x, w: R(8, 20) * sz + 6, h: R(220, 420), lean: R(-14, 14), br };
}

function makeBg(n, zone, width) {
  const r = mulberry32(n * 977 + zone * 31 + 3);
  const R = (a, b) => a + r() * (b - a);
  const layers = [];
  for (const [f, a, sz] of [[0.16, 0.16, 0.55], [0.34, 0.32, 0.75], [0.6, 0.62, 1]]) {
    const items = [], span = width * f + 1600;
    for (let x = -300; x < span; x += R(60, 190) / (0.6 + sz * 0.5)) items.push(bgItem(zone, r, R, x, sz));
    layers.push({ f, a, items });
  }
  const fg = [];
  for (let x = -100; x < width * 1.3 + 1600; x += R(40, 120)) fg.push({ x, h: R(10, 34), w: R(8, 20), top: zone !== 0 && r() < 0.22, lean: R(-8, 8) });
  return { layers, fg, beams: [R(0.1, 0.3), R(0.4, 0.6), R(0.7, 0.9)] };
}

function drawBgItem(c, it, w) {
  const by = GY + 10;
  switch (it.t) {
    case 'tree': {
      const sway = windAt(it.x, w.t) * 9, bx = it.x, tx = bx + it.lean + sway, ty = by - it.h;
      c.beginPath(); c.moveTo(bx - it.w * 0.7, by); c.lineTo(tx - it.w * 0.28, ty); c.lineTo(tx + it.w * 0.28, ty); c.lineTo(bx + it.w * 0.7, by); c.fill();
      c.save(); c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
      for (const o of [-0.25, 0.1]) { c.beginPath(); c.moveTo(bx + o * it.w, by); c.lineTo(tx + o * it.w * 0.4, ty + 10); c.stroke(); }
      c.restore();
      c.lineCap = 'round';
      for (const b of it.br) {
        const px = lerp(bx, tx, b.k), py = by - it.h * b.k;
        c.lineWidth = Math.max(1.5, it.w * 0.22); c.beginPath(); const bs = sway * b.k * 0.9; c.moveTo(px, py); c.lineTo(px + b.dx + bs, py + b.dy + Math.sin(w.t * 0.04 + it.x) * 1.5); c.stroke();
        c.lineWidth = 1.2; c.beginPath(); c.moveTo(px + b.dx * 0.7 + bs * 0.8, py + b.dy * 0.7); c.lineTo(px + b.dx + bs * 1.5 + Math.sign(b.dx) * 10, py + b.dy - 18); c.stroke();
      }
      c.lineCap = 'butt'; break;
    }
    case 'stalac': c.beginPath(); c.moveTo(it.x - it.w / 2, -5); c.lineTo(it.x + it.w / 2, -5); c.lineTo(it.x, it.h); c.fill(); break;
    case 'stalag': c.beginPath(); c.moveTo(it.x - it.w / 2, by); c.lineTo(it.x, by - it.h * 0.6); c.lineTo(it.x + it.w / 2, by); c.fill(); break;
    case 'pipe': c.fillRect(it.x - it.w / 2, -5, it.w, GY + 15); c.fillRect(it.x - it.w * 0.8, it.joint, it.w * 1.6, 8); break;
    case 'chain': for (let y = -5; y < it.len; y += 10) c.fillRect(it.x - 1.5, y, 3, 6); c.beginPath(); c.arc(it.x, it.len + 6, 5, 0, 7); c.fill(); break;
    case 'gear': {
      c.save(); c.translate(it.x, it.y); c.rotate(w.t * it.sp);
      c.beginPath(); c.arc(0, 0, it.rr, 0, 6.283); c.arc(0, 0, it.rr * 0.45, 0, 6.283, true); c.fill('evenodd');
      for (let i = 0; i < it.teeth; i++) { c.rotate(6.283 / it.teeth); c.fillRect(-4, -it.rr - 9, 8, 12); }
      c.restore(); break;
    }
    case 'spire':
      c.beginPath();
      if (it.up) { c.moveTo(it.x - it.w, by); c.lineTo(it.x, by - it.h); c.lineTo(it.x + it.w, by); } else { c.moveTo(it.x - it.w, -5); c.lineTo(it.x, it.h * 0.7); c.lineTo(it.x + it.w, -5); }
      c.fill(); break;
    case 'eyes': {
      const fs = c.fillStyle, a = 0.25 + 0.35 * Math.max(0, Math.sin(w.t * 0.02 + it.ph));
      c.fillStyle = 'rgba(240,240,240,' + a + ')'; c.fillRect(it.x - 5, it.y, 3, 3); c.fillRect(it.x + 3, it.y, 3, 3); c.fillStyle = fs; break;
    }
  }
}

function drawBg(c, w, vw) {
  const z = ZONES[w.zone], bg = w.bg;
  const g = c.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, z.top); g.addColorStop(0.62, z.mid); g.addColorStop(1, z.bot);
  c.fillStyle = g; c.fillRect(0, 0, vw, VH);
  const lg = c.createRadialGradient(vw * 0.7, 70, 10, vw * 0.7, 70, 280);
  lg.addColorStop(0, 'rgba(255,255,255,0.32)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = lg; c.fillRect(0, 0, vw, VH);
  drawFar(c, w, vw);
  const fogA = [0.6, 0.4, 0.2];
  bg.layers.forEach((L, li) => {
    c.save(); c.translate(-w.camX * L.f, 0);
    c.fillStyle = c.strokeStyle = 'rgba(6,6,6,' + L.a + ')';
    const x0 = w.camX * L.f - 120, x1 = x0 + vw + 360;
    for (const it of L.items) if (it.x > x0 && it.x < x1) drawBgItem(c, it, w);
    c.restore();
    const fg = c.createLinearGradient(0, GY - 200, 0, GY + 20), f = z.fog;
    fg.addColorStop(0, 'rgba(' + f + ',0)'); fg.addColorStop(1, 'rgba(' + f + ',' + fogA[li] + ')');
    c.fillStyle = fg; c.fillRect(0, GY - 200, vw, 230);
    if (li === 0 && (w.zone === 0 || w.zone === 3)) {
      c.fillStyle = 'rgba(255,255,255,0.07)';
      for (const b of bg.beams) { const x = b * vw; c.beginPath(); c.moveTo(x - 10, 0); c.lineTo(x + 30, 0); c.lineTo(x + 150, GY); c.lineTo(x + 60, GY); c.fill(); }
    }
  });
  if (w.zone === 1 || w.zone === 4) {
    const cg = c.createLinearGradient(0, 0, 0, 120); cg.addColorStop(0, 'rgba(0,0,0,0.55)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = cg; c.fillRect(0, 0, vw, 120);
  }
}

/* a rolling dark ridge and the stumps, boulders, logs and ruins that stand just behind the path */
function drawNear(c, w, vw) {
  const z = w.zone;
  if (z === 4) return;
  const rf = 0.78;
  c.save(); c.translate(-w.camX * rf, 0);
  const x0 = w.camX * rf - 20, x1 = x0 + vw + 40;
  c.fillStyle = z === 1 ? 'rgba(8,8,8,0.6)' : 'rgba(10,11,10,0.46)'; c.beginPath(); c.moveTo(x0, GY + 20);
  for (let x = Math.floor(x0 / 10) * 10; x <= x1 + 10; x += 10) {
    const y = GY - 20 - (Math.sin(x * 0.0061 + w.level) * 17 + Math.sin(x * 0.017 + 2) * 9 + Math.max(0, Math.sin(x * 0.0023 + w.level * 2)) * 26 + Math.sin(x * 0.05) * 1.6);
    c.lineTo(x, y);
  }
  c.lineTo(x1 + 10, GY + 20); c.fill();
  c.restore();
  const nf = 0.94;
  c.save(); c.translate(-w.camX * nf, 0);
  const n0 = w.camX * nf - 40, n1 = n0 + vw + 80;
  c.fillStyle = c.strokeStyle = 'rgba(6,6,6,0.82)'; c.lineCap = c.lineJoin = 'round';
  for (let i = Math.floor(n0 / 70); i * 70 < n1; i++) {
    const hv = hash(i * 4.7 + w.level * 2.3), hv2 = hash(i * 9.1 + w.level), x = i * 70 + hv * 60, y = GY + 3;
    if (hv < 0.28) continue;
    const kind = Math.floor(hv2 * 5);
    if (z === 0 || z === 3) {
      if (kind === 0) { c.fillRect(x - 6, y - 14, 12, 14); c.beginPath(); c.ellipse(x, y - 14, 6, 2, 0, 0, 7); c.fill(); }
      else if (kind === 1) { c.beginPath(); c.ellipse(x, y - 8, 16 + hv * 10, 8 + hv * 4, 0, Math.PI, 0); c.fill(); }
      else if (kind === 2) { c.fillRect(x - 24, y - 7, 48, 7); c.beginPath(); c.ellipse(x + 24, y - 3.5, 2, 3.5, 0, 0, 7); c.fill(); }
      else if (kind === 3) { c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + k * 13, y); c.lineTo(x + k * 13 + 1, y - 20 + hv * 6); c.stroke(); } c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y - 15); c.lineTo(x + 39, y - 13); c.moveTo(x, y - 8); c.lineTo(x + 39, y - 6); c.stroke(); }
      else { c.fillRect(x - 3, y - 26, 6, 26); c.beginPath(); c.moveTo(x - 3, y - 20); c.lineTo(x - 14, y - 30); c.lineTo(x - 11, y - 31); c.lineTo(x, y - 22); c.moveTo(x + 3, y - 16); c.lineTo(x + 13, y - 24); c.lineTo(x + 10, y - 25); c.lineTo(x, y - 18); c.fill(); }
    } else if (z === 1) {
      if (kind < 3) { c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 7, y - 11 - hv * 10); c.lineTo(x - 1, y - 6); c.lineTo(x + 6, y - 17 - hv * 8); c.lineTo(x + 15, y); c.fill(); }
      else { c.beginPath(); c.ellipse(x, y - 6, 13, 7, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(x + 15, y - 4, 8, 5, 0, Math.PI, 0); c.fill(); }
    } else {
      if (kind < 2) { c.fillRect(x - 12, y - 9, 24, 9); c.fillRect(x - 5, y - 17, 10, 8); }
      else if (kind === 2) { c.fillRect(x - 2, y - 28, 4, 28); c.fillRect(x - 11, y - 26, 22, 3); }
      else { c.beginPath(); c.ellipse(x, y, 13, 13, 0, Math.PI, 0); c.arc(x, y - 6, 4, 0, 7, true); c.fill('evenodd'); }
    }
  }
  c.restore();
}

function drawForeground(c, w, vw) {
  c.save(); c.translate(-w.camX * 1.3, 0); c.fillStyle = '#030303';
  const x0 = w.camX * 1.3 - 40, x1 = x0 + vw + 80;
  for (const f of w.bg.fg) {
    if (f.x < x0 || f.x > x1) continue;
    c.beginPath();
    if (f.top) { c.moveTo(f.x - 2, -5); c.lineTo(f.x + f.lean * 0.3, f.h * 3.2); c.lineTo(f.x + 2, -5); }
    else { c.moveTo(f.x - f.w / 2, VH + 4); c.lineTo(f.x + f.lean, VH - f.h - 6); c.lineTo(f.x + f.w / 2, VH + 4); }
    c.fill();
  }
  c.restore();
}

/* ---------- the boy: a jointed figure. Legs and arms are two-bone limbs solved with IK. ---------- */
function boyJoints(p, t) {
  const f = p.face || 1, cx = p.x + p.w / 2, top = p.y;
  const grounded = (p.air || 0) < 4 || !!p.climb, spd = Math.abs(p.vx);
  const ph = p.anim * 2, cr = (p.crouch || 0) / 10;
  const moving = grounded && spd > 0.25;
  const bob = moving ? Math.abs(Math.sin(ph)) * 0.9 : Math.sin(t * 0.045) * 0.28;
  const pull = !p.rag && (t - (p.pullAt === undefined ? -9 : p.pullAt)) < 3 && grounded, hold = p.hold || p.pushing, reach = (p.reach || 0) > 0;
  const lean = clamp(p.vx, -2.4, 2.4) * 0.8 * (grounded ? 1 : 0.5) + (hold ? f * 2.2 : 0) + (reach ? f * 1.2 : 0);
  const fy = top + p.h - 0.8;
  const pelvis = { x: cx + lean * 0.3, y: top + 16 + bob * 0.5 + cr * 3.8 };
  const chest = { x: cx + lean, y: top + 9.4 + bob * 0.5 + cr * 2.4 };
  const neck = { x: chest.x + f * 0.5 + lean * 0.1, y: chest.y - 2 };
  const head = { x: neck.x + f * 0.9, y: neck.y - 3.8 + (p.vy > 3 && !grounded ? -0.4 : 0) };
  const k = [], ft = [], e = [], h = [], cl = p.climb, cu = cl ? cl.t / cl.dur : 0;
  for (let i = 0; i < 2; i++) {
    const s = Math.sin(ph + i * Math.PI), co = Math.cos(ph + i * Math.PI);
    let fx, fyy;
    if (cl) {
      const kick = Math.sin(cl.t * 0.7 + i * 2.4) * 2.6;
      if (cu < 0.7) { fx = pelvis.x + f * 3.4; fyy = pelvis.y + 8.6 + kick; }
      else { fx = pelvis.x + f * (i ? -1 : 3); fyy = fy - (i ? 0 : 3.5 * (1 - (cu - 0.7) / 0.3)); }
    } else if (!grounded) {
      const rising = p.vy < 0;
      if (i === 0) { fx = pelvis.x + f * (rising ? 4.2 : 2.6); fyy = pelvis.y + (rising ? 8.4 : 11.4); }
      else { fx = pelvis.x - f * (rising ? 3.6 : 2); fyy = pelvis.y + (rising ? 10.2 : 11.8); }
    } else if (moving) {
      const stride = clamp(spd * 5.2, 0, 6.2);
      fx = pelvis.x + f * s * stride; fyy = fy - Math.max(0, co) * (1.4 + spd * 1.2);
    } else { fx = pelvis.x + (i ? -2.2 : 2.2) * f; fyy = fy; }
    const L = ik(pelvis.x, pelvis.y, fx, fyy, 6.9, 7, (q) => q.x * f);
    k.push(L.knee); ft.push(L.foot);
    let hx, hy;
    if (pull) { hx = chest.x + f * (3 + i), hy = chest.y - 8 + Math.sin(t * 0.3 + i * 3) * 4; }
    else if (cl) {
      if (cu < 0.72) { hx = cl.hx + f * (-0.5 - i * 1.6); hy = cl.hy - 0.6; }
      else { hx = chest.x + f * (5 - i * 2); hy = chest.y + 7; }
    } else if (reach) { hx = chest.x + f * (8.5 - i), hy = chest.y + 4 + i * 1.4; }
    else if (hold) { hx = chest.x + f * (9.6 - i * 1.2); hy = chest.y + 3.6 + i * 1.6; }
    else if (!grounded) { hx = chest.x + f * (i ? -2.6 : 7); hy = chest.y + (i ? 1 : -4.2); }
    else if (moving) { hx = chest.x + f * Math.sin(ph + (i + 1) * Math.PI) * clamp(spd * 3.2, 0, 4.2); hy = chest.y + 9.3 - Math.max(0, Math.cos(ph + (i + 1) * Math.PI)) * 1.1; }
    else { hx = chest.x + (i ? -1.2 : 1) * f * 0.8; hy = chest.y + 9.6 + Math.sin(t * 0.045 + i) * 0.25; }
    const A = ik(chest.x, chest.y + 0.8, hx, hy, 5.4, 5.4, (q) => -q.x * f);
    e.push(A.knee); h.push(A.foot);
  }
  return { f, head, neck, chest, pelvis, k, ft, e, h, air: !grounded };
}

function drawJoints(c, J, dead) {
  const f = J.f;
  c.fillStyle = c.strokeStyle = '#020202'; c.lineCap = c.lineJoin = 'round';
  const limb = (a, m, b, w1, w2) => {
    c.lineWidth = w1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(m.x, m.y); c.stroke();
    c.lineWidth = w2; c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(b.x, b.y); c.stroke();
  };
  const shoe = (q) => { c.lineWidth = 2.3; c.beginPath(); c.moveTo(q.x - f * 0.6, q.y + 0.2); c.lineTo(q.x + f * (J.air ? 2.2 : 3.4), q.y + (J.air ? 1.4 : 0.4)); c.stroke(); };
  /* far limbs, then body, then near limbs */
  limb(J.pelvis, J.k[1], J.ft[1], 2.8, 2.2); shoe(J.ft[1]);
  limb(J.chest, J.e[1], J.h[1], 2.2, 1.8);
  c.lineWidth = 4.4; c.beginPath(); c.moveTo(J.chest.x, J.chest.y); c.lineTo(J.pelvis.x, J.pelvis.y); c.stroke();
  c.lineWidth = 2; c.beginPath(); c.moveTo(J.neck.x, J.neck.y + 1); c.lineTo(J.head.x, J.head.y + 1.5); c.stroke();
  c.beginPath(); c.arc(J.head.x, J.head.y, 3.8, 0, 7); c.fill();
  c.beginPath(); c.moveTo(J.head.x + f * 3.3, J.head.y - 0.5); c.lineTo(J.head.x + f * 4.8, J.head.y + 0.9); c.lineTo(J.head.x + f * 3.1, J.head.y + 1.6); c.fill();
  c.beginPath(); c.moveTo(J.head.x - f * 2.6, J.head.y - 2.6); c.lineTo(J.head.x - f * 3.2, J.head.y - 4.4); c.lineTo(J.head.x - f * 0.8, J.head.y - 3.5); c.fill();
  limb(J.pelvis, J.k[0], J.ft[0], 3, 2.4); shoe(J.ft[0]);
  limb(J.chest, J.e[0], J.h[0], 2.4, 2);
  for (const hd of J.h) { c.beginPath(); c.arc(hd.x, hd.y, 1.3, 0, 7); c.fill(); }
  if (!dead) {
    c.shadowColor = '#fff'; c.shadowBlur = 3; c.fillStyle = EYE;
    c.fillRect(J.head.x + f * 1.3 - 0.7, J.head.y - 1, 1.5, 1.8); c.fillRect(J.head.x + f * 3.1 - 0.7, J.head.y - 1, 1.5, 1.8);
    c.shadowBlur = 0;
  }
}

const BOY_SCALE = 1.22; /* drawn a little larger than his hitbox so the figure reads clearly */
function drawBoy(c, p, t) {
  c.save();
  if (p.g < 0) { c.translate(0, 2 * p.y + p.h); c.scale(1, -1); }
  const px = p.rag ? p.rag.pts[3].x : p.x + p.w / 2, py = p.rag ? p.rag.pts[3].y : p.y + p.h;
  c.translate(px, py); c.scale(BOY_SCALE, BOY_SCALE); c.translate(-px, -py);
  drawJoints(c, p.rag ? ragJoints(p.rag) : boyJoints(p, t || 0), !!p.rag);
  c.restore();
}

/* ---------- ragdoll: on death the joints become verlet points joined by rods ---------- */
const RAG = ['head', 'neck', 'chest', 'pelvis', 'e0', 'e1', 'h0', 'h1', 'k0', 'k1', 'f0', 'f1'];
const RAG_LINKS = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 6], [2, 5], [5, 7], [3, 8], [8, 10], [3, 9], [9, 11], [0, 2], [1, 3], [0, 3], [2, 8], [2, 9]];
function makeRagdoll(J, vx, vy) {
  const pts = [J.head, J.neck, J.chest, J.pelvis, J.e[0], J.e[1], J.h[0], J.h[1], J.k[0], J.k[1], J.ft[0], J.ft[1]].map((q, i) => {
    const jx = (hash(i * 3.3 + J.head.x) - 0.5) * 1.6, jy = (hash(i * 5.1 + J.head.y) - 0.5) * 1.2;
    return { x: q.x, y: q.y, px: q.x - vx - jx, py: q.y - vy + 1.2 - jy };
  });
  const links = RAG_LINKS.map(([a, b]) => ({ a, b, d: Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y) }));
  /* the two arms and legs keep their shape; the cross-braces (last two) let the hips fold */
  return { pts, links, f: J.f, t: 0 };
}
function stepRagdoll(r, solids) {
  r.t++;
  for (const q of r.pts) {
    const vx = (q.x - q.px) * 0.992, vy = (q.y - q.py) * 0.992;
    q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + GRAV * 0.95;
  }
  for (let it = 0; it < 7; it++) {
    for (const l of r.links) {
      const A = r.pts[l.a], B = r.pts[l.b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.001;
      const k = (d - l.d) / d * (l.d < 3 ? 0.5 : 0.5), ox = dx * k * 0.5, oy = dy * k * 0.5;
      A.x += ox; A.y += oy; B.x -= ox; B.y -= oy;
    }
    for (const q of r.pts) for (const s of solids) {
      if (q.x < s.x - 2 || q.x > s.x + s.w + 2 || q.y < s.y - 2 || q.y > s.y + s.h + 2) continue;
      const l = q.x - s.x, rr = s.x + s.w - q.x, tp = q.y - s.y, bt = s.y + s.h - q.y, m = Math.min(l, rr, tp, bt);
      if (m < -2) continue;
      if (m === tp) { q.y = s.y - 0.5; q.py = q.y; q.px = q.x - (q.x - q.px) * 0.55; }
      else if (m === bt) { q.y = s.y + s.h + 0.5; q.py = q.y; }
      else if (m === l) { q.x = s.x - 0.5; q.px = q.x; }
      else { q.x = s.x + s.w + 0.5; q.px = q.x; }
    }
  }
}
function ragJoints(r) {
  const P = r.pts;
  return { f: r.f, head: P[0], neck: P[1], chest: P[2], pelvis: P[3], e: [P[4], P[5]], h: [P[6], P[7]], k: [P[8], P[9]], ft: [P[10], P[11]], air: true };
}

/* ---------- atmosphere extras ---------- */
function drawFar(c, w, vw) {
  const z = w.zone;
  if (z === 1 || z === 4) return;
  c.save(); c.translate(-w.camX * 0.07, 0);
  const x0 = w.camX * 0.07 - 20, x1 = x0 + vw + 40;
  if (z === 2) {
    c.fillStyle = 'rgba(40,38,34,0.20)';
    for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) {
      const hv = hash(x * 0.071 + 4); c.fillRect(x, GY - 70 - hv * 90, 38, 200);
      if (hv > 0.6) { c.fillRect(x + 8, GY - 120 - hv * 90, 8, 60); }
    }
  } else {
    for (const [f, a, base, amp] of [[0.03, 0.14, 150, 1.25], [0.07, 0.22, 110, 1]]) {
      c.restore(); c.save(); c.translate(-w.camX * f, 0);
      const q0 = w.camX * f - 20, q1 = q0 + vw + 40;
      c.fillStyle = 'rgba(52,58,58,' + a + ')'; c.beginPath(); c.moveTo(q0, GY + 20);
      for (let x = q0; x <= q1 + 12; x += 12) {
        const y = GY - base - amp * (Math.sin(x * 0.0042 + f * 90) * 40 + Math.sin(x * 0.011 + 1.3) * 22 + Math.sin(x * 0.027) * 8 + Math.abs(Math.sin(x * 0.0019 + f * 40)) * 40);
        c.lineTo(x, y);
      }
      c.lineTo(q1 + 12, GY + 20); c.fill();
    }
  }
  c.restore();
}
let _dust = null;
function drawDust(c, w, vw) {
  if (!_dust) { _dust = []; for (let i = 0; i < 46; i++) _dust.push({ x: hash(i * 3.1) * 900, y: hash(i * 7.7) * VH, s: 0.3 + hash(i * 1.3) * 0.7, r: 0.6 + hash(i * 2.9) * 1.1 }); }
  const col = w.zone === 4 ? '170,180,195' : w.zone === 2 ? '230,215,190' : '235,238,236';
  for (const d of _dust) {
    const x = (((d.x - w.camX * d.s * 0.5 + Math.sin(w.t * 0.01 + d.y) * 14) % (vw + 40)) + vw + 40) % (vw + 40) - 20;
    const y = (d.y + w.t * 0.12 * d.s) % VH;
    c.fillStyle = 'rgba(' + col + ',' + (0.1 + 0.22 * Math.abs(Math.sin(w.t * 0.02 * d.s + d.x))) + ')';
    c.beginPath(); c.arc(x, y, d.r, 0, 7); c.fill();
  }
}
function drawLeaves(c, w, vw) {
  if (w.zone === 1 || w.zone === 4) return;
  c.fillStyle = 'rgba(4,4,4,0.75)';
  for (let i = 0; i < 16; i++) {
    const sp = 0.6 + hash(i * 2.1) * 1.1, wx = windAt(w.camX + i * 60, w.t);
    const x = (((hash(i * 9.3) * (vw + 80) + w.t * sp * (0.4 + wx * 3) - w.camX * 0.9) % (vw + 80)) + vw + 80) % (vw + 80) - 40;
    const y = (hash(i * 5.7) * VH * 0.8 + 20 + Math.sin(w.t * 0.05 * sp + i) * 14 + w.t * 0.1 * sp * 0.4) % (GY - 6);
    const r = w.t * 0.08 * sp + i;
    c.save(); c.translate(x, y); c.rotate(r); c.beginPath(); c.ellipse(0, 0, 2.4, 1.1, 0, 0, 7); c.fill(); c.restore();
  }
}
function drawForeTrunks(c, w, vw) {
  if (w.zone !== 0 && w.zone !== 3) return;
  const f = 1.7;
  c.save(); c.translate(-w.camX * f, 0); c.fillStyle = 'rgba(2,2,2,0.62)';
  const x0 = w.camX * f - 60, x1 = x0 + vw + 120;
  for (let i = Math.floor(x0 / 900); i * 900 < x1; i++) {
    const x = i * 900 + 300 + hash(i * 2.3 + w.level) * 400, tw = 14 + hash(i * 4.1) * 12;
    if (x < x0 || x > x1) continue;
    c.beginPath(); c.moveTo(x - tw, VH + 4); c.lineTo(x - tw * 0.55, -5); c.lineTo(x + tw * 0.55, -5); c.lineTo(x + tw, VH + 4); c.fill();
  }
  c.restore();
}

let _grain = null;
function grainPattern(c) {
  if (_grain) return _grain;
  const g = document.createElement('canvas'); g.width = g.height = 128;
  const x = g.getContext('2d'), im = x.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0);
  return (_grain = c.createPattern(g, 'repeat'));
}
