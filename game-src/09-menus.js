/* ---------- menus: one look for every screen ---------- */
const pauseBtn = () => ({ x: CW - touch.safe.r - 52, y: touch.safe.t + 12, s: 40 });
const CHAPTERS = ['The Orchard Road', 'The Harvest Yard', 'The Old Road', 'The Hollow', "The Weaver's Cavern", 'The Cage Hall', 'The Lamp Works', 'The Pipe Gallery', 'The Long Way Down', 'The Great Lamp'];

/* text with adjustable letter spacing and weight */
function txtS(s, x, y, size, alpha, align, sp, weight, col) {
  c.font = (weight || 300) + ' ' + size + "px Georgia, 'Times New Roman', serif";
  c.textAlign = align || 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(' + (col || '238,238,233') + ',' + alpha + ')';
  try { c.letterSpacing = (sp || 0) * size + 'px'; } catch (e) { /* older engines */ }
  c.fillText(s, x, y);
  try { c.letterSpacing = '0px'; } catch (e) { /* older engines */ }
}
function rrect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function glowAt(x, y, r, a) {
  const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, 'rgba(255,244,214,' + a + ')'); g.addColorStop(1, 'rgba(255,244,214,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
/* darken the scenery so words always read, with a soft pool of dark behind the menu */
function veil(a, cx, cy) {
  c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.fillRect(0, 0, CW, CH);
  const g = c.createRadialGradient(cx || CW / 2, cy || CH / 2, 10, cx || CW / 2, cy || CH / 2, Math.max(CW, CH) * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, CW, CH);
}

function item(label, x, y, w, h, act, on, opt) { ui.items.push(Object.assign({ label, x, y, w, h, act, on: on !== false }, opt || {})); }
function drawItems(size) {
  const pulse = 0.5 + Math.sin(S.tick * 0.08) * 0.5;
  ui.items.forEach((it, i) => {
    const sel = i === S.sel && it.on;
    if (it.draw) { it.draw(it, sel, pulse); return; }
    if (it.ghost) {
      txtS(it.label, it.x + it.w / 2, it.y + it.h / 2, size, !it.on ? 0.22 : sel ? 1 : 0.6, 'center', 0.12);
      if (sel) { c.fillStyle = 'rgba(238,238,233,0.7)'; c.fillRect(it.x + it.w / 2 - 12, it.y + it.h / 2 + size * 0.85, 24, 1.5); }
      return;
    }
    c.save();
    rrect(it.x, it.y, it.w, it.h, Math.min(it.h * 0.5, 18));
    c.fillStyle = sel ? 'rgba(30,29,26,0.82)' : 'rgba(8,8,8,0.62)';
    if (sel) { c.shadowColor = 'rgba(255,238,200,' + (0.35 + pulse * 0.2) + ')'; c.shadowBlur = 16; }
    c.fill(); c.shadowBlur = 0;
    c.lineWidth = 1; c.strokeStyle = 'rgba(238,238,233,' + (!it.on ? 0.1 : sel ? 0.8 : 0.24) + ')'; c.stroke();
    c.restore();
    if (sel) { c.fillStyle = 'rgba(255,244,214,' + (0.7 + pulse * 0.3) + ')'; c.beginPath(); c.arc(it.x + Math.min(it.h * 0.5, 18) + 2, it.y + it.h / 2, 2.4, 0, 7); c.fill(); }
    txtS(it.label, it.x + it.w / 2 + (it.icon ? 12 : 0), it.y + it.h / 2 + 0.5, size, !it.on ? 0.25 : sel ? 1 : 0.72, 'center', 0.1, sel ? 400 : 300);
    if (it.icon === 'pad') drawPad(it.x + it.w / 2 - size * 3.3, it.y + it.h / 2, size * 1.5, sel ? 1 : 0.72);
  });
}

/* a little game controller */
function drawPad(x, y, s, a) {
  c.save(); c.translate(x, y); c.strokeStyle = c.fillStyle = 'rgba(238,238,233,' + a + ')'; c.lineWidth = Math.max(1.3, s * 0.08); c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-s * 0.32, -s * 0.28); c.lineTo(s * 0.32, -s * 0.28); c.quadraticCurveTo(s * 0.62, -s * 0.28, s * 0.62, s * 0.05); c.quadraticCurveTo(s * 0.62, s * 0.36, s * 0.42, s * 0.34); c.quadraticCurveTo(s * 0.3, s * 0.32, s * 0.2, s * 0.12); c.lineTo(-s * 0.2, s * 0.12); c.quadraticCurveTo(-s * 0.3, s * 0.32, -s * 0.42, s * 0.34); c.quadraticCurveTo(-s * 0.62, s * 0.36, -s * 0.62, s * 0.05); c.quadraticCurveTo(-s * 0.62, -s * 0.28, -s * 0.32, -s * 0.28); c.closePath(); c.stroke();
  c.fillRect(-s * 0.4, -s * 0.07, s * 0.2, s * 0.06); c.fillRect(-s * 0.33, -s * 0.14, s * 0.06, s * 0.2);
  c.beginPath(); c.arc(s * 0.3, -s * 0.1, s * 0.05, 0, 7); c.arc(s * 0.42, 0, s * 0.05, 0, 7); c.fill();
  c.restore();
}
function drawTitle() {
  drawScenery(); veil(0.38, CW / 2, CH * 0.45); drawFilm();
  const a = clamp(S.tick / 120, 0, 1), ts = Math.min(CH * 0.17, 80);
  glowAt(CW / 2, CH * 0.2, Math.min(CW, 520) * 0.5, 0.28 * a);
  txtS('GLOAM', CW / 2, CH * 0.2, ts, a, 'center', 0.22, 300);
  txtS('a story in the dark', CW / 2, CH * 0.2 + ts * 0.62, Math.max(11, ts * 0.2), 0.5 * a, 'center', 0.18);
  ui.items = [];
  const bw = Math.min(290, CW * 0.7), bh = Math.min(38, CH * 0.095), gap = 9, x0 = CW / 2 - bw / 2, y0 = CH * 0.42;
  item(save.unlocked > 1 ? 'Continue' : 'Play', x0, y0, bw, bh, () => startLevel(Math.min(save.unlocked, TOTAL)));
  item('Levels', x0, y0 + bh + gap, bw, bh, () => { S.scene = 'select'; S.sel = Math.min(save.unlocked, TOTAL) - 1; });
  drawItems(Math.min(CH * 0.05, 19));
  if (save.unlocked > 1) txtS('chapter ' + Math.min(save.unlocked, TOTAL) + ' of ' + TOTAL, CW / 2, y0 + (bh + gap) * 2 + 8, 12, 0.35, 'center', 0.15);
}

function drawLock(x, y, s, a) {
  c.save(); c.strokeStyle = c.fillStyle = 'rgba(238,238,233,' + a + ')'; c.lineWidth = Math.max(1.3, s * 0.1);
  c.fillRect(x - s * 0.34, y - s * 0.04, s * 0.68, s * 0.5);
  c.beginPath(); c.arc(x, y - s * 0.08, s * 0.22, Math.PI, 0); c.stroke(); c.restore();
}
function drawSelect() {
  drawScenery(); veil(0.55); drawFilm();
  txtS('CHAPTERS', CW / 2, Math.max(CH * 0.09, 26 + touch.safe.t), Math.min(CH * 0.06, 24), 0.9, 'center', 0.3);
  ui.items = [];
  const cols = 5, rows = 2, gap = Math.min(10, CW * 0.012), avW = CW - 2 * Math.max(16, touch.safe.l + 12, touch.safe.r + 12);
  const cw = Math.min((avW - gap * (cols - 1)) / cols, 130), chh = Math.min((CH * 0.62 - gap) / rows, 120);
  const x0 = (CW - (cw * cols + gap * (cols - 1))) / 2, y0 = CH * 0.5 - (chh * rows + gap) / 2 + CH * 0.02;
  for (let n = 1; n <= TOTAL; n++) {
    const i = n - 1, x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (chh + gap), open = n <= save.unlocked;
    item(String(n), x, y, cw, chh, () => startLevel(n), open, { draw: (it, sel, pulse) => {
      c.save(); rrect(x, y, cw, chh, 12);
      c.fillStyle = sel ? 'rgba(30,29,26,0.85)' : 'rgba(8,8,8,0.6)';
      if (sel) { c.shadowColor = 'rgba(255,238,200,' + (0.35 + pulse * 0.2) + ')'; c.shadowBlur = 18; }
      c.fill(); c.shadowBlur = 0; c.lineWidth = 1; c.strokeStyle = 'rgba(238,238,233,' + (!open ? 0.08 : sel ? 0.8 : 0.22) + ')'; c.stroke(); c.restore();
      if (open) glowAt(x + cw / 2, y + chh * 0.34, chh * 0.5, sel ? 0.22 : 0.1);
      if (open) txtS(String(n), x + cw / 2, y + chh * 0.36, Math.min(chh * 0.38, 40), sel ? 1 : 0.85, 'center', 0, 300);
      else drawLock(x + cw / 2, y + chh * 0.4, Math.min(chh * 0.26, 24), 0.35);
      const nm = CHAPTERS[i], sz = Math.max(9, Math.min(chh * 0.105, 12.5));
      const lines = wrapText(nm, cw - 14, sz);
      lines.slice(0, 2).forEach((ln, k) => txtS(ln, x + cw / 2, y + chh * 0.7 + k * sz * 1.25, sz, open ? (sel ? 0.9 : 0.55) : 0.2, 'center', 0.03));
    } });
  }
  item('Back', 14 + touch.safe.l, CH - 48 - touch.safe.b, 90, 36, () => { S.scene = 'title'; S.sel = 0; });
  drawItems(16);
}

function drawPause() {
  veil(0.66);
  const pw = Math.min(280, CW * 0.7), ph = Math.min(CH * 0.86, 318), px = CW / 2 - pw / 2, py = CH / 2 - ph / 2;
  c.save(); rrect(px, py, pw, ph, 18); c.fillStyle = 'rgba(6,6,6,0.82)'; c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 30; c.fill(); c.shadowBlur = 0;
  c.lineWidth = 1; c.strokeStyle = 'rgba(238,238,233,0.16)'; c.stroke(); c.restore();
  txtS('PAUSED', CW / 2, py + 28, 17, 0.9, 'center', 0.3);
  txtS(W.level + ' · ' + (CHAPTERS[W.level - 1] || ''), CW / 2, py + 50, 12, 0.45, 'center', 0.08);
  ui.items = [];
  const bw = pw - 44, bh = Math.min(36, (ph - 84) / 5 - 8), gap = 8, x0 = CW / 2 - bw / 2, y0 = py + 68;
  item('Resume', x0, y0, bw, bh, () => { S.paused = false; });
  item('Restart', x0, y0 + (bh + gap), bw, bh, () => startLevel(W.level));
  item('Chapters', x0, y0 + (bh + gap) * 2, bw, bh, () => { S.scene = 'select'; S.paused = false; S.sel = W.level - 1; });
  item('Title', x0, y0 + (bh + gap) * 3, bw, bh, () => { S.scene = 'title'; S.paused = false; S.sel = 0; });
  item('Controls', x0, y0 + (bh + gap) * 4, bw, bh, () => openHowto('pause'), true, { icon: 'pad' });
  drawItems(Math.min(CH * 0.048, 17));
}

function drawEnd() {
  c.fillStyle = '#050505'; c.fillRect(0, 0, CW, CH);
  S.endT = (S.endT || 0) + 1;
  const a0 = clamp(S.endT / 120, 0, 1); glowAt(CW / 2, CH * 0.5, Math.max(CW, CH) * 0.5, 0.16 * a0);
  const sz = Math.min(CH * 0.055, 24);
  STORY_END.forEach((ln, i) => txtS(ln, CW / 2, CH * (0.32 + i * 0.11), sz, clamp((S.endT - i * 150) / 90, 0, 1), 'center', 0.04));
  ui.items = [];
  if (S.endT > 420) item('Title', CW / 2 - 70, CH * 0.72, 140, 38, () => { S.scene = 'title'; S.sel = 0; S.tick = 0; });
  drawItems(18);
}
