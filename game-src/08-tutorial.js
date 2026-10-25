/* ---------- the opening, and how to play ----------
   First launch: a few lines of story, then a controls page, then level 1 (where small prompts show each move the first time it matters). */
const INTRO_PAGES = [
  'A valley, kept alive by a single lamp.',
  'Tonight, the lamp went out.',
  'Wren, small and stubborn, took the family lantern and walked into the dark.',
  'Her brother went after her.',
];

/* plain text (the title font spaces its letters wide; paragraphs read better tight) */
function txt2(s, x, y, size, alpha, align, weight) {
  c.font = (weight || 300) + ' ' + size + "px Georgia, 'Times New Roman', serif";
  c.textAlign = align || 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(240,240,236,' + alpha + ')';
  c.fillText(s, x, y);
}
function wrapText(s, maxW, size) {
  c.font = '300 ' + size + "px Georgia, serif";
  const out = ['']; for (const wd of s.split(' ')) { const t = (out[out.length - 1] + ' ' + wd).trim(); if (c.measureText(t).width > maxW && out[out.length - 1]) out.push(wd); else out[out.length - 1] = t; }
  return out;
}

function startIntro() { S.scene = 'intro'; S.intro = { page: 0, t: 0 }; S.sel = 0; }
function introNext() {
  if (!S.intro) return;
  if (++S.intro.page >= INTRO_PAGES.length) { save.seenIntro = true; persist(); S.scene = 'howto'; S.howFrom = 'intro'; S.sel = 0; }
  else S.intro.t = 0;
}
function openHowto(from) { S.scene = 'howto'; S.howFrom = from || 'title'; S.sel = 0; }
function howBack() {
  if (S.howFrom === 'intro') startLevel(1);
  else if (S.howFrom === 'pause') { S.scene = 'play'; S.paused = true; S.sel = 4; }
  else { S.scene = 'title'; S.sel = 0; }
}
/* the very first time the game opens, it opens on the story, then the controls, then level 1 */
if (!save.seenIntro) startIntro();

/* the pictures behind the words: the lamp dies, Wren walks into the dark, her brother follows */
function introArt(it) {
  const k = clamp(it.t / 400, 0, 1), tk = S.tick;
  c.save(); c.translate(0, OY); c.scale(SC, SC);
  const gx = VW * 0.5, gy = GY;
  const glow = (x, y, r, a) => { const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, 'rgba(255,246,220,' + a + ')'); g.addColorStop(1, 'rgba(255,246,220,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  if (it.page <= 1) {
    /* the village lamp: bright, then gone */
    const a = it.page === 0 ? 0.85 + Math.sin(tk * 0.2) * 0.06 : Math.max(0, 0.85 * (1 - it.t / 200) + Math.sin(tk * 0.9) * 0.05 * (1 - k));
    glow(gx, gy - 118, 200, a);
    c.fillStyle = '#030303'; c.fillRect(gx - 2.5, gy - 110, 5, 110); c.fillRect(gx - 12, gy - 4, 24, 4);
    c.beginPath(); c.moveTo(gx - 11, gy - 124); c.lineTo(gx + 11, gy - 124); c.lineTo(gx + 8, gy - 110); c.lineTo(gx - 8, gy - 110); c.fill();
    c.beginPath(); c.moveTo(gx - 13, gy - 124); c.lineTo(gx, gy - 134); c.lineTo(gx + 13, gy - 124); c.fill();
    c.fillStyle = 'rgba(255,250,235,' + clamp(a * 1.1, 0, 1) + ')'; c.fillRect(gx - 5, gy - 122, 10, 10);
  } else {
    /* Wren with the lantern, walking away; on the last page her brother follows */
    const wx = VW * 0.3 + (it.page === 2 ? it.t : 420 + it.t) * 0.35, y = GY;
    const lx = wx + 8, ly = y - 13;
    glow(lx, ly, 120, 0.7);
    c.fillStyle = c.strokeStyle = '#030303'; c.lineCap = 'round'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(wx - 4, y - 14); c.lineTo(wx + 4, y - 14); c.lineTo(wx + 6.5, y - 6); c.lineTo(wx - 6.5, y - 6); c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(wx + s * 1.6, y - 6); c.lineTo(wx + s * 1.6 + Math.sin(tk * 0.2 + s * 1.57) * 4, y); c.stroke(); }
    c.beginPath(); c.arc(wx + 0.6, y - 18.5, 3.3, 0, 7); c.fill();
    c.beginPath(); c.moveTo(wx + 2.5, y - 13); c.lineTo(lx, ly - 2); c.stroke(); c.fillRect(lx - 2.2, ly - 2, 4.4, 5);
    c.fillStyle = 'rgba(255,250,235,0.95)'; c.fillRect(lx - 1, ly - 0.6, 2, 3);
    if (it.page === 3) {
      const bp = newPlayer(wx - 130 + it.t * 0.1); bp.vx = 1.15; bp.air = 0; bp.onGround = true; bp.anim = tk * 0.083 * RUN; bp.y = GY - 30;
      drawBoy(c, bp, tk);
    }
  }
  c.restore();
}

function drawIntro() {
  drawScenery(); c.fillStyle = 'rgba(0,0,0,0.82)'; c.fillRect(0, 0, CW, CH);
  const it = S.intro; it.t++;
  introArt(it); drawFilm();
  const a = clamp(Math.min(it.t / 70, (420 - it.t) / 50), 0, 1);
  const size = Math.min(CH * 0.06, 26), lines = wrapText(INTRO_PAGES[it.page], CW * 0.78, size);
  lines.forEach((ln, i) => txt2(ln, CW / 2, CH * 0.2 + (i - (lines.length - 1) / 2) * size * 1.7, size, a));
  if (it.t > 110) txt2('tap to continue', CW / 2, CH * 0.82, Math.min(CH * 0.035, 14), 0.35 + Math.sin(S.tick * 0.06) * 0.1);
  for (let i = 0; i < INTRO_PAGES.length; i++) { c.fillStyle = 'rgba(240,240,236,' + (i === it.page ? 0.8 : 0.25) + ')'; c.beginPath(); c.arc(CW / 2 + (i - 1.5) * 14, CH * 0.9, 2.2, 0, 7); c.fill(); }
  ui.items = [];
  item('Skip', CW - 100 - touch.safe.r, 12 + touch.safe.t, 88, 34, () => { it.page = INTRO_PAGES.length - 1; introNext(); }, true, { ghost: true });
  drawItems(Math.min(CH * 0.04, 16));
  if (it.t > 420) introNext();
}

/* small hand-drawn glyphs for the controls page */
function glyph(kind, x, y, s) {
  c.save(); c.translate(x, y); c.strokeStyle = 'rgba(240,240,236,0.85)'; c.fillStyle = 'rgba(240,240,236,0.85)'; c.lineWidth = Math.max(1.5, s * 0.07); c.lineCap = c.lineJoin = 'round';
  const k = (Math.sin(S.tick * 0.07) + 1) / 2, base = c.globalAlpha;
  if (kind === 'walk') {
    const o = (k - 0.5) * s * 0.7;
    c.beginPath(); c.moveTo(-s * 0.55, s * 0.28); c.lineTo(s * 0.55, s * 0.28); c.moveTo(-s * 0.55, s * 0.28); c.lineTo(-s * 0.4, s * 0.15); c.moveTo(-s * 0.55, s * 0.28); c.lineTo(-s * 0.4, s * 0.41); c.moveTo(s * 0.55, s * 0.28); c.lineTo(s * 0.4, s * 0.15); c.moveTo(s * 0.55, s * 0.28); c.lineTo(s * 0.4, s * 0.41); c.stroke();
    c.beginPath(); c.arc(o, -s * 0.12, s * 0.2, 0, 7); c.fill();
  } else if (kind === 'jump') {
    c.beginPath(); c.arc(0, 0, s * 0.2, 0, 7); c.fill();
    c.globalAlpha = base * (1 - k); c.beginPath(); c.arc(0, 0, s * (0.25 + k * 0.4), 0, 7); c.stroke(); c.globalAlpha = base;
  } else if (kind === 'grab') {
    const o = k * s * 0.5;
    c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(0, s * 0.45); c.moveTo(-s * 0.2, s * 0.25); c.lineTo(0, s * 0.45); c.lineTo(s * 0.2, s * 0.25); c.stroke();
    c.beginPath(); c.arc(0, -s * 0.4 + o, s * 0.17, 0, 7); c.fill();
  } else if (kind === 'pause') {
    c.fillRect(-s * 0.22, -s * 0.3, s * 0.15, s * 0.6); c.fillRect(s * 0.07, -s * 0.3, s * 0.15, s * 0.6);
  }
  c.restore();
}
const HOWTO = [
  ['walk', 'Walk', 'Touch the left side and drag left or right', 'A D or arrow keys'],
  ['jump', 'Jump', 'Tap the right side', 'Space or W'],
  ['grab', 'Grab', 'Swipe down on the left and hold: pull levers, ropes, crates', 'Hold E or Shift'],
  ['pause', 'Pause', 'The icon at the top right', 'Esc'],
];
function drawHowto() {
  drawScenery(); veil(0.74); drawFilm();
  txtS('HOW TO PLAY', CW / 2, CH * 0.1, Math.min(CH * 0.065, 26), 0.95, 'center', 0.3);
  const rowH = Math.min(CH * 0.135, 62), y0 = CH * 0.2, size = Math.min(CH * 0.042, 17), gs = Math.min(rowH * 0.8, 44);
  const left = Math.max(CW * 0.06, 16 + touch.safe.l), right = CW - Math.max(CW * 0.06, 16 + touch.safe.r), wide = CW > 640;
  c.strokeStyle = 'rgba(240,240,236,0.12)'; c.lineWidth = 1;
  HOWTO.forEach((r, i) => {
    const y = y0 + i * rowH + rowH / 2;
    if (i) { c.beginPath(); c.moveTo(left, y - rowH / 2); c.lineTo(right, y - rowH / 2); c.stroke(); }
    glyph(r[0], left + gs * 0.5, y, gs);
    const tx = left + gs + 16, tw = (wide ? (right - tx) * 0.62 : right - tx);
    txt2(r[1], tx, y - size * 0.95, size * 1.1, 0.95, 'left', 400);
    const ls = wrapText(r[2], tw, size * 0.85);
    ls.forEach((ln, j) => txt2(ln, tx, y + size * 0.3 + j * size * 1.05, size * 0.85, 0.6, 'left'));
    if (wide) txt2(r[3], right, y, size * 0.85, 0.5, 'right');
    else if (ls.length === 1) txt2(r[3], tx, y + size * 1.4, size * 0.75, 0.38, 'left');
  });
  txt2('No hints. If something blocks the way, look around.', CW / 2, y0 + HOWTO.length * rowH + 16, size * 0.85, 0.5);
  ui.items = [];
  const first = S.howFrom === 'intro';
  item(first ? 'Begin' : 'Back', CW / 2 - 80, CH - 48 - touch.safe.b, 160, 38, howBack);
  drawItems(Math.min(CH * 0.055, 22));
}

/* ---------- first-time prompts in the world ---------- */
const TIPS = {
  walk: { touch: ['Drag left or right', 'left'], key: 'Hold  A D  or the arrow keys', g: 'walk' },
  jump: { touch: ['Tap here to jump', 'right'], key: 'Press  Space  to jump', g: 'jump' },
  grab: { touch: ['Swipe down and hold to grab', 'left'], key: 'Hold  E  to grab', g: 'grab' },
  pull: { touch: ['Swipe down and hold to pull the rope', 'left'], key: 'Hold  E  to pull the rope', g: 'grab' },
  lever: { touch: ['Swipe down to pull the lever', 'left'], key: 'Press  E  at the lever', g: 'grab' },
};
K.tip = {
  update(e, w, p) {
    if (e.done || p.dead) return;
    const dx = p.x - e.x;
    let on = dx > -10 && dx < (e.span || 150);
    if (e.t === 'walk') { on = true; if (dx > 90) e.done = true; }
    else if (e.t === 'jump') { if (on && input.jumpEdge) e.done = true; if (dx > (e.span || 150)) e.done = true; }
    else if (e.t === 'grab') { on = dx > -10 && dx < 180; if (p.hold) e.done = true; if (dx > 180) e.done = true; }
    else if (e.t === 'pull') { on = dx > -10 && dx < 120; if (e.ref && e.ref.gate.pull > 0.12) e.done = true; if (dx > 120) e.done = true; }
    else if (e.t === 'lever') { on = dx > -10 && dx < 120; if (e.ref && e.ref.br.on) e.done = true; if (dx > 120) e.done = true; }
    if (e.done) { (save.tips = save.tips || {})[e.t + w.level] = 1; persist(); return; }
    if (on) { const o = S.tip; S.tip = { t: e.t, at: S.tick, from: o && o.t === e.t && S.tick - o.at <= 3 ? o.from : S.tick }; }
  },
};
function drawTip(c) {
  if (!S.tip || S.tick - S.tip.at > 2 || S.scene !== 'play' || S.paused) return;
  const tp = TIPS[S.tip.t]; if (!tp) return;
  const a = clamp((S.tick - S.tip.from) / 30, 0, 1) * 0.9;
  const size = Math.min(CH * 0.042, 17);
  if (touch.on) {
    const cx = tp.touch[1] === 'right' ? CW * 0.75 : CW * 0.25, cy = CH * 0.5;
    c.save(); c.globalAlpha = a; glyph(tp.g, cx, cy, Math.min(CH * 0.14, 56)); c.restore();
    txt2(tp.touch[0], cx, cy + Math.min(CH * 0.14, 56) * 0.75, size, a);
  } else txt2(tp.key, CW / 2, CH * 0.8, size, a);
}
/* the prompts stop showing once the move has been done, and never come back */
function tipPopulate(w, L) {
  const done = (k) => save.tips && save.tips[k + w.level];
  const add = (t, x, extra, span) => { if (!done(t)) w.ents.push(Object.assign({ kind: 'tip', t, x, w: 0, always: true, span }, extra || {})); };
  const gr = w.ents.filter((e) => e.kind === 'ground').sort((a, b) => a.x - b.x);
  if (w.level === 1) {
    add('walk', 60);
    for (let i = 0; i + 1 < gr.length; i++) if (gr[i + 1].x > gr[i].x + gr[i].w + 4) { add('jump', gr[i].x + gr[i].w - 120, null, 150); break; }
  }
  if (w.level === 2) { const cr = w.ents.find((e) => e.kind === 'crate'); if (cr) add('grab', cr.x - 120); }
  if (w.level === 3) { const wn = w.ents.find((e) => e.kind === 'winch'); if (wn) add('pull', wn.x - 90, { ref: wn }); }
  if (w.level === 5) { const lv = w.ents.find((e) => e.kind === 'lever'); if (lv) add('lever', lv.x - 90, { ref: lv }); }
}
