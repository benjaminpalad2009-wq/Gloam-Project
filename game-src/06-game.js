/* ---------- game: player, world, scenes, loop ---------- */
const cv = document.getElementById('game');
const c = cv.getContext('2d');
let CW = 0, CH = 0, DPR = 1, SC = 1, OY = 0, VW = 640;

function readSafe() {
  try {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(d);
    const s = getComputedStyle(d);
    touch.safe = { t: parseFloat(s.paddingTop) || 0, r: parseFloat(s.paddingRight) || 0, b: parseFloat(s.paddingBottom) || 0, l: parseFloat(s.paddingLeft) || 0 };
    d.remove();
  } catch (e) { /* keep defaults */ }
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  CW = window.innerWidth; CH = window.innerHeight;
  cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR);
  SC = Math.min(CH / VH, CW / 480);
  VW = CW / SC; OY = (CH - VH * SC) / 2;
  readSafe(); layoutTouch(CW, CH);
}

/* ---------- save ---------- */
let save = { unlocked: 1, deaths: 0 };
(function loadSave() {
  const take = (s) => { if (s && s.unlocked) { save.unlocked = Math.max(save.unlocked, clamp(s.unlocked | 0, 1, TOTAL)); save.deaths = Math.max(save.deaths, s.deaths | 0); if (s.seenIntro) save.seenIntro = true; if (s.tips && typeof s.tips === 'object') save.tips = Object.assign(save.tips || {}, s.tips); } };
  try { take(window.__GLOAM_SAVE__); } catch (e) { /* none */ }
  try { take(JSON.parse(localStorage.getItem('gloam-save') || 'null')); } catch (e) { /* none */ }
})();
function persist() {
  try { localStorage.setItem('gloam-save', JSON.stringify(save)); } catch (e) { /* private mode */ }
  try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'save', data: save })); } catch (e) { /* not in app */ }
}

/* ---------- state ---------- */
let W = null, P = null;
const S = { scene: 'title', paused: false, fade: 1, fadeTo: 0, fin: false, shake: 0, sel: 0, tick: 0 };
const ui = { items: [] };

function newPlayer(x) {
  return { x, y: GY - 30, w: 14, h: 30, vx: 0, vy: 0, g: 1, face: 1, onGround: true, air: 0, standing: null, coyote: 0, jbuf: 0, jumped: false, fall: 0, crouch: 0, reach: 0, dead: false, deadT: 0, anim: 0, hold: null, hs: 1, pushing: false, lastStep: 0, rag: null, climb: null, wallT: 0, climbCool: 0 };
}
function makeWorld(n) {
  const L = buildLevel(n);
  const w = { level: n, zone: L.zone, boss: L.boss, ents: L.ents, cps: L.cps, exitX: L.exitX, width: L.width, spawnX: L.spawnX, t: 0, camX: 0, vw: VW, solids: [], cp: -1, bg: makeBg(n, L.zone, L.width) };
  storyPopulate(w, L);
  tipPopulate(w, L);
  w.solids = w.ents.filter((e) => e.solid && e.w > 0);
  return w;
}
function snapCam(w, p) { w.camX = clamp(p.x - VW * 0.36, 0, Math.max(0, w.width - VW)); }
function startLevel(n) {
  W = makeWorld(n); P = newPlayer(W.spawnX);
  S.scene = 'play'; S.paused = false; S.fin = false; S.fade = 1; S.fadeTo = 0; S.sel = 0;
  S.card = { t: 420, text: STORY[n - 1] || '' };
  snapCam(W, P);
}
function respawn() {
  const cp = W.cp, nw = makeWorld(W.level); nw.cp = cp;
  const sx = cp >= 0 ? nw.cps[cp] : nw.spawnX;
  W = nw; P = newPlayer(sx);
  let top = GY;
  for (const q of W.solids) if (q.y > -10 && q.y < top && q.x < sx + 14 && q.x + q.w > sx) top = q.y;
  P.y = top - P.h;
  const st = W.ents.find((e) => e.kind === 'stalker');
  if (st && cp >= 0) { st.x = Math.max(-300, sx - 420); st.state = 'chase'; }
  snapCam(W, P); S.fadeTo = 0;
}
function die() {
  if (P.dead || S.fin) return;
  P.rag = makeRagdoll(boyJoints(P, S.tick), P.vx * 1.1, Math.min(P.vy, 2) - 1.6);
  P.dead = true; P.deadT = 0; P.hold = null; sfx.die(); save.deaths++; S.shake = 9;
}

/* ---------- player physics ---------- */
const anyHit = (w, p, skip) => { for (const o of w.solids) if (o !== skip && hit(p, o)) return o; return null; };
function moveX(w, p, dx) {
  if (!dx) return;
  p.x += dx;
  for (const s of w.solids) {
    if (!hit(p, s)) continue;
    if ((s.kind === 'crate' || s.kind === 'trap') && !p.dead) {
      s.x += dx;
      let blocked = false;
      for (const o of w.solids) if (o !== s && hit(s, o)) { blocked = true; break; }
      if (!blocked) { p.pushing = true; continue; }
      s.x -= dx;
    }
    /* walk straight up small ledges and slope columns */
    const rise = p.y + p.h - s.y;
    if (p.g > 0 && !p.dead && rise > 0 && rise <= STEP && p.vy >= -0.5 && p.air < 4) {
      const oy = p.y; p.y = s.y - p.h;
      if (!anyHit(w, p)) { p.standing = s; p.onGround = true; continue; }
      p.y = oy;
    }
    p.x = dx > 0 ? s.x - p.w : s.x + s.w; p.vx = 0;
  }
}
function moveY(w, p, dy) {
  p.y += dy; p.onGround = false;
  for (const s of w.solids) {
    if (!hit(p, s)) continue;
    if (dy * p.g > 0) { p.y = p.g > 0 ? s.y - p.h : s.y + s.h; p.onGround = true; p.standing = s; }
    else p.y = p.g > 0 ? s.y + s.h : s.y - p.h;
    p.vy = 0;
  }
}
/* walking downhill: stay glued to the ground instead of hopping off every step */
function floorSnap(w, p) {
  for (let d = 1; d <= STEP + 1; d++) {
    const o = anyHit(w, { x: p.x, y: p.y + d, w: p.w, h: p.h });
    if (o) { p.y += d - 1; p.onGround = true; p.standing = o; p.vy = 0; return; }
  }
}
function unstick(w, p) {
  for (const s of w.solids) {
    if (!hit(p, s)) continue;
    const a1 = p.x + p.w - s.x, a2 = s.x + s.w - p.x, b1 = p.y + p.h - s.y, b2 = s.y + s.h - p.y;
    if (Math.min(a1, a2) < Math.min(b1, b2)) p.x += a1 < a2 ? -a1 : a2;
    else if (b1 < b2) { p.y -= b1; if (p.g > 0) { p.onGround = true; p.standing = s; } p.vy = Math.min(p.vy, 0); }
    else { p.y += b2; p.vy = Math.max(p.vy, 0); }
  }
}

/* a ledge he can haul himself onto: a tall block (34..62px above his feet) with room on top */
function findLedge(w, p, dir) {
  if (p.g < 0 || !dir) return null;
  const px = dir > 0 ? p.x + p.w + 2 : p.x - 2, feet = p.y + p.h;
  for (const s of w.solids) {
    if (s.kind !== 'block' || px < s.x || px > s.x + s.w || s.w < p.w + 4) continue;
    const rise = feet - s.y;
    if (rise < 34 || rise > 62 || s.y + s.h < feet - 4) continue;
    const tx = dir > 0 ? s.x + 2 : s.x + s.w - p.w - 2;
    if (anyHit(w, { x: tx, y: s.y - p.h - 1, w: p.w, h: p.h })) continue;
    return { s, dir, tx, ty: s.y - p.h, hx: dir > 0 ? s.x : s.x + s.w, hy: s.y, x0: dir > 0 ? s.x - p.w : s.x + s.w, y0: p.y, t: 0, dur: 36 };
  }
  return null;
}
const smoothU = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

function updatePlayer(w, p) {
  if (p.dead) {
    if (p.rag) {
      stepRagdoll(p.rag, w.solids.filter((s) => s.x < p.x + 220 && s.x + s.w > p.x - 220));
      const pv = p.rag.pts[3]; p.x = pv.x - 7; p.y = pv.y - 17; p.vx = 0;
    }
    return;
  }
  const ctl = !S.fin;
  if (p.climb) {
    const cl = p.climb; cl.t++;
    const u = cl.t / cl.dur, hang = cl.y0 + (cl.s.y - 5 - cl.y0) * 0 ;
    const hy = cl.hy - 5;
    p.y = u < 0.3 ? lerp(cl.y0, hy, smoothU(u / 0.3)) : lerp(hy, cl.ty, smoothU((u - 0.3) / 0.45));
    p.x = lerp(cl.x0, cl.tx, smoothU((u - 0.55) / 0.45));
    p.vx = p.vy = 0; p.fall = 0; p.air = 0; p.onGround = false; p.face = cl.dir;
    if (cl.t === 12) sfx.step();
    if (cl.t >= cl.dur) { p.climb = null; p.x = cl.tx; p.y = cl.ty; p.onGround = true; p.standing = cl.s; p.climbCool = 12; sfx.land(); }
    return;
  }
  const st = p.standing;
  if (st && !st.dead && st.kind !== 'crate' && st.kind !== 'trap') { p.x += st.dx || 0; p.y += st.dy || 0; }
  p.standing = null; p.pushing = false;
  if (p.crouch > 0) p.crouch--;
  if (p.reach > 0) p.reach--;

  if (ctl && input.grab && p.onGround) {
    if (!p.hold) for (const s of w.solids) {
      if (s.kind !== 'crate' || s.y + s.h < p.y + 10 || s.y > p.y + p.h) continue;
      const gR = s.x - (p.x + p.w), gL = p.x - (s.x + s.w);
      if (gR > -4 && gR < 6) { p.hold = s; p.hs = 1; break; }
      if (gL > -4 && gL < 6) { p.hold = s; p.hs = -1; break; }
    }
  } else p.hold = null;
  if (p.hold) {
    const s = p.hold, g = p.hs > 0 ? s.x - (p.x + p.w) : p.x - (s.x + s.w);
    if (s.dead || g < -6 || g > 10) p.hold = null;
  }
  if (ctl && input.grabEdge) p.reach = 16;

  /* momentum: a few steps to get going, a short slide to stop, and in the air he can barely steer */
  let dir = ctl ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : 1;
  const pulling = S.tick - (p.pullAt === undefined ? -9 : p.pullAt) < 2;
  if (pulling) { dir = 0; p.vx = approach(p.vx, 0, 0.5); }
  if (dir) p.face = p.hold ? p.hs : dir;
  if (p.onGround) {
    const topV = RUN * (p.hold ? 0.5 : 1) * (p.crouch > 4 ? 0.5 : 1);
    p.vx = approach(p.vx, dir * topV, dir ? (p.vx === 0 || sgn(p.vx) === dir ? 0.085 : 0.2) : 0.14);
  } else {
    p.vx = approach(p.vx, dir * Math.max(RUN * 1.4, Math.abs(p.vx)), dir ? 0.03 : 0.004);
  }

  /* climbing: push into a tall box, or reach one in the air, and he hauls himself up */
  if (p.climbCool > 0) p.climbCool--;
  if (ctl && dir && !p.hold && p.climbCool <= 0) {
    const lg = findLedge(w, p, dir);
    if (lg && (p.onGround ? ++p.wallT >= 6 : p.vy > -2.5)) { p.climb = lg; p.wallT = 0; p.hold = null; return; }
    if (!lg) p.wallT = 0;
  } else p.wallT = 0;

  p.coyote = p.onGround ? 5 : p.coyote - 1;
  if (ctl && input.jumpEdge) p.jbuf = 6; else p.jbuf--;
  if (p.jbuf > 0 && p.coyote > 0 && p.crouch < 7) {
    /* the jump is always the same height; running carries you forward, standing still goes straight up */
    if (Math.abs(p.vx) > 0.2) p.vx = sgn(p.vx) * Math.min(Math.abs(p.vx) * 1.55, RUN * 1.7);
    p.vy = -JUMPV * p.g; p.jbuf = 0; p.coyote = 0; p.onGround = false; p.jumped = true; sfx.jump();
  }
  p.vy += GRAV * p.g * (p.vy * p.g > 0 ? FALLM : 1);
  if (p.vy * p.g > 11) p.vy = 11 * p.g;

  const wasGround = p.onGround, fallV = p.vy * p.g, ox = p.x;
  moveX(w, p, p.vx);
  if (p.hold && p.onGround) {
    const mv = p.x - ox;
    if (mv && mv * p.hs < 0) {
      const s = p.hold; s.x += mv;
      for (const o of w.solids) if (o !== s && hit(s, o)) { s.x -= mv; p.hold = null; break; }
    }
  }
  const stepped = p.onGround; /* moveX may have walked up a step */
  moveY(w, p, p.vy);
  if (stepped && !p.onGround) p.onGround = true;
  if (!p.onGround && wasGround && !p.jumped && p.vy >= 0 && p.g > 0) floorSnap(w, p);
  unstick(w, p);

  p.air = p.onGround ? 0 : p.air + 1;
  if (p.vy * p.g > 0 && !p.onGround) p.fall += p.vy * p.g;
  if (p.onGround) {
    if (!wasGround && fallV > 4) sfx.land();
    if (!wasGround && fallV > 8.6) { p.crouch = 10; S.shake = Math.max(S.shake, 1.5); sfx.thud(); }
    else if (!wasGround && fallV > 5) p.crouch = Math.max(p.crouch, 4);
    if (p.fall > 210) { p.fall = 0; die(); return; }
    p.fall = 0; p.jumped = false;
  }

  for (const s of w.solids) if (s.kind === 'gate' && s.dy > 0.2 && hit(shrink(p, 2), s)) die();

  if (p.onGround && Math.abs(p.vx) > 0.3) {
    p.anim += Math.abs(p.vx) * 0.083;
    const k = Math.floor(p.anim / (Math.PI / 2));
    if (k !== p.lastStep) { p.lastStep = k; sfx.step(); }
  } else if (p.onGround) p.anim = lerp(p.anim, Math.round(p.anim / Math.PI) * Math.PI, 0.2);
  if (p.x < 4) { p.x = 4; p.vx = Math.max(0, p.vx); }
  if (p.g > 0 ? p.y > VH + 30 : p.y < -80) die();
}

/* ---------- world step ---------- */
function ex(e) { return e.x !== undefined ? e.x : e.cx !== undefined ? e.cx : e.px !== undefined ? e.px : e.hx || 0; }
function near(e, w) {
  if (e.always || e.global) return true;
  const x = ex(e);
  return x > w.camX - 700 && x < w.camX + w.vw + 500;
}

function step() {
  S.tick++;
  S.fade = approach(S.fade, S.fadeTo, 0.035);
  S.shake *= 0.9;
  if (S.scene !== 'play' || S.paused) return;
  const w = W, p = P;
  w.t++; w.vw = VW;
  for (let i = 0; i < w.ents.length; i++) {
    const e = w.ents[i];
    if (e.dead) continue;
    const k = K[e.kind];
    if (k && k.update && near(e, w)) k.update(e, w, p);
  }
  if (w.t % 90 === 0) w.ents = w.ents.filter((e) => !e.dead);
  w.solids = w.ents.filter((e) => e.solid && !e.dead && e.w > 0);
  /* things that brush the grass */
  w.movers = [];
  if (!p.dead) w.movers.push({ x: p.x + p.w / 2, fy: p.y + p.h, vx: p.vx });
  else if (p.rag) for (const q of p.rag.pts) w.movers.push({ x: q.x, fy: q.y + 2, vx: q.x - q.px });
  for (const e of w.ents) {
    if (e.dead || !near(e, w)) continue;
    if (e.kind === 'crawler') for (const f of [0.2, 0.5, 0.8]) w.movers.push({ x: e.x + e.w * f, fy: e.y + e.h, vx: e.vx || 0 });
    else if (e.kind === 'spider' || e.kind === 'hound' || e.kind === 'crate') w.movers.push({ x: e.x + e.w / 2, fy: e.y + e.h, vx: e.vx || 0 });
    else if (e.kind === 'stalker') for (let k = 0; k < 8; k++) w.movers.push({ x: e.x + 40 + (k - 3.5) * 30, fy: GY, vx: 1 });
  }
  updatePlayer(w, p);

  if (!p.dead && !S.fin) {
    for (const e of w.ents) {
      if (e.dead || e.kind === 'col') continue;
      const k = K[e.kind];
      if (k && k.kill && near(e, w) && k.kill(e, p)) { die(); break; }
    }
    for (let i = w.cps.length - 1; i >= 0; i--) if (p.x > w.cps[i]) { if (i > w.cp) w.cp = i; break; }
    if (p.x > w.exitX) { S.fin = true; S.fadeTo = 1; }
  }
  if (p.dead) {
    p.deadT++;
    if (p.deadT === 40) S.fadeTo = 1;
    if (p.deadT > 70 && S.fade >= 0.99) { persist(); respawn(); }
  }
  if (S.fin && S.fade >= 0.99) {
    save.unlocked = Math.max(save.unlocked, Math.min(TOTAL, w.level + 1)); persist();
    if (w.level >= TOTAL) { S.scene = 'end'; S.endT = 0; S.fadeTo = 0; S.sel = 0; S.fin = false; }
    else startLevel(w.level + 1);
  }
  const tx = clamp(p.x - w.vw * 0.36, 0, Math.max(0, w.width - w.vw));
  w.camX = lerp(w.camX, tx, 0.1);
}

/* ---------- drawing ---------- */
function visible(e, w) {
  const x0 = ex(e), x1 = x0 + (e.w || 0);
  return e.always || e.global || (x1 > w.camX - 260 && x0 < w.camX + w.vw + 260);
}
function drawPlay() {
  const w = W;
  c.save();
  c.translate(0, OY); c.scale(SC, SC);
  c.beginPath(); c.rect(0, 0, VW, VH); c.clip();
  if (S.shake > 0.3) c.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
  w.vw = VW;
  drawBg(c, w, VW);
  drawNear(c, w, VW);
  c.save(); c.translate(-Math.round(w.camX * SC) / SC, 0);
  for (const e of w.ents) {
    if (e.dead || !visible(e, w)) continue;
    const k = K[e.kind];
    if (k && k.draw) k.draw(c, e, w);
  }
  drawBoy(c, P, S.tick);
  c.restore();
  drawDust(c, w, VW);
  drawLeaves(c, w, VW);
  drawForeground(c, w, VW);
  drawForeTrunks(c, w, VW);
  /* light at the way out */
  const gx = w.exitX - w.camX;
  if (gx > -200 && gx < VW + 400) {
    const lg = c.createRadialGradient(gx + 160, GY - 60, 10, gx + 160, GY - 60, 260);
    lg.addColorStop(0, 'rgba(255,255,255,0.5)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = lg; c.fillRect(0, 0, VW, VH);
  }
  c.restore();
}
function drawFilm() {
  const vg = c.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.3, CW / 2, CH / 2, Math.max(CW, CH) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.72)');
  c.fillStyle = vg; c.fillRect(0, 0, CW, CH);
  c.save(); c.globalAlpha = 0.075; c.globalCompositeOperation = 'overlay';
  c.translate(-Math.random() * 128, -Math.random() * 128);
  c.fillStyle = grainPattern(c); c.fillRect(0, 0, CW + 128, CH + 128);
  c.restore();
}
function txt(s, x, y, size, alpha, align) {
  c.font = '300 ' + size + "px Georgia, 'Times New Roman', serif";
  c.textAlign = align || 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(236,236,232,' + alpha + ')';
  try { c.letterSpacing = size * 0.2 + 'px'; } catch (e) { /* older engines */ }
  c.fillText(s, x, y);
  try { c.letterSpacing = '0px'; } catch (e) { /* older engines */ }
}
let TW = null;
function drawScenery() {
  if (!TW) TW = { level: 1, zone: 0, bg: makeBg(1, 0, 8000), camX: 0, vw: VW, t: 0 };
  TW.camX = S.tick * 0.25; TW.vw = VW; TW.t = S.tick;
  c.save(); c.translate(0, OY); c.scale(SC, SC); c.beginPath(); c.rect(0, 0, VW, VH); c.clip();
  drawBg(c, TW, VW);
  drawNear(c, TW, VW);
  c.save(); c.translate(-TW.camX, 0);
  K.ground.draw(c, { kind: 'ground', x: TW.camX - 60, y: GY, w: VW + 120, h: VH }, TW);
  const bp = newPlayer(TW.camX + VW * 0.28); bp.anim = S.tick * 0.083 * RUN; bp.vx = RUN; bp.air = 0; bp.onGround = true;
  drawBoy(c, bp, S.tick);
  c.restore(); drawDust(c, TW, VW); drawLeaves(c, TW, VW); drawForeground(c, TW, VW); drawForeTrunks(c, TW, VW); c.restore();
}
function drawPauseIcon() {
  const b = pauseBtn();
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.fillRect(b.x + 12, b.y + 10, 5, 20); c.fillRect(b.x + 23, b.y + 10, 5, 20);
}

function render() {
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.fillStyle = '#050505'; c.fillRect(0, 0, CW, CH);
  if (S.scene === 'play') {
    drawPlay(); drawFilm();
    if (!S.paused) {
      drawCard(c); drawTip(c);
      drawPauseIcon();
    } else drawPause();
  } else if (S.scene === 'title') drawTitle();
  else if (S.scene === 'select') drawSelect();
  else if (S.scene === 'intro') drawIntro();
  else if (S.scene === 'howto') drawHowto();
  else if (S.scene === 'end') drawEnd();
  if (S.fade > 0.001) { c.fillStyle = 'rgba(0,0,0,' + S.fade + ')'; c.fillRect(0, 0, CW, CH); }
}

/* ---------- input: pointers and menu keys ---------- */
function uiTap(x, y) {
  for (let i = 0; i < ui.items.length; i++) {
    const it = ui.items[i];
    if (it.on && x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) { S.sel = i; sfx.click(); it.act(); return true; }
  }
  return false;
}
cv.addEventListener('pointerdown', (e) => {
  sfx.init(); e.preventDefault();
  if (e.pointerType === 'touch') touch.on = true;
  if (S.scene === 'play' && !S.paused) {
    const b = pauseBtn();
    if (e.clientX >= b.x && e.clientX <= b.x + b.s + 8 && e.clientY >= b.y && e.clientY <= b.y + b.s + 8) { S.paused = true; S.sel = 0; return; }
    touch.pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, zone: touchZone(e.clientX) });
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  } else if (S.scene === 'title' && S.tick < 20) { /* let the title settle */ }
  else if (S.scene === 'intro') { if (!uiTap(e.clientX, e.clientY)) introNext(); }
  else uiTap(e.clientX, e.clientY);
});
cv.addEventListener('pointermove', (e) => {
  const q = touch.pts.get(e.pointerId);
  if (!q) return;
  q.x = e.clientX; q.y = e.clientY;
  /* the walking anchor trails the finger so reversing direction is instant */
  if (q.zone === 'move') {
    if (q.x - q.sx > 44) q.sx = q.x - 44; else if (q.sx - q.x > 44) q.sx = q.x + 44;
    if (q.y - q.sy > 44) q.sy = q.y - 44; else if (q.sy - q.y > 44) q.sy = q.y + 44;
  }
});
for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(t, (e) => touch.pts.delete(e.pointerId));
cv.addEventListener('contextmenu', (e) => e.preventDefault());

addEventListener('keydown', (e) => {
  if (S.scene === 'intro' && !e.repeat && ['Enter', 'Space', 'ArrowRight'].includes(e.code)) { introNext(); return; }
  if (e.repeat || !ui.items.length || (S.scene === 'play' && !S.paused)) return;
  const n = ui.items.length, cols = S.scene === 'select' ? 5 : 1;
  const go = (d) => { let i = S.sel; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (ui.items[i].on) { S.sel = i; return; } } };
  if (e.code === 'ArrowLeft') go(-1);
  else if (e.code === 'ArrowRight') go(1);
  else if (e.code === 'ArrowUp' || e.code === 'KeyW') go(-cols);
  else if (e.code === 'ArrowDown' || e.code === 'KeyS') go(cols);
  else if (e.code === 'Enter' || e.code === 'Space') { const it = ui.items[S.sel]; if (it && it.on) { sfx.click(); it.act(); } }
});
addEventListener('gloam-menu', () => {
  if (S.scene === 'play') { S.paused = !S.paused; S.sel = 0; }
  else if (S.scene === 'howto') howBack();
  else if (S.scene === 'select' || S.scene === 'end') { S.scene = 'title'; S.sel = 0; }
  else if (S.scene === 'intro') { introNext(); }
});
addEventListener('gloam-pause', () => { if (S.scene === 'play' && !S.paused && P && !P.dead) S.paused = true; });
document.addEventListener('visibilitychange', () => { if (document.hidden && S.scene === 'play' && !S.paused && !P.dead) S.paused = true; });
addEventListener('resize', resize);

/* ---------- loop ---------- */
let last = 0, acc = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (!last) last = ts;
  acc += Math.min(100, ts - last); last = ts;
  let n = 0;
  while (acc >= 16.667 && n < 4) { pollInput(); step(); acc -= 16.667; n++; }
  if (n === 4) acc = 0;
  render();
}
resize();
requestAnimationFrame(frame);
window.__gloam = { S, startLevel, get W() { return W; }, get P() { return P; }, save };
