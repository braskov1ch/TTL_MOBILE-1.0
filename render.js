'use strict';
/* =====================================================================
   RENDER: мир, освещение, сигилы реликвий, герои, пикапы, эффекты
   ===================================================================== */

// ---------- ОБЩИЕ ХЕЛПЕРЫ ----------
function shadowEllipse(x, y, rx, ry, a = 0.4) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function ball(x, y, r, c0, c1, c2, stroke, lw = 2) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, Math.max(1, r * 0.1), x, y, r);
  g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function glow(x, y, r, color, a = 0.5) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function outlinedText(txt, x, y, color, size = 12, align = 'center', font = FONT_SANS) {
  txt = tr(txt);
  ctx.save();
  ctx.font = `bold ${size}px ${font}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y);
  ctx.fillStyle = color; ctx.fillText(txt, x, y);
  ctx.restore();
}

// ---------- СИГИЛЫ РЕЛИКВИЙ: уникальная руна на медальоне ----------
const sigilCache = {};
function sigilPoints(id) {
  // точки решётки 3x3 (+центр), руна — цепочка из 4-6 отрезков, выбранная по хэшу id
  const pts = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, -1.4], [0, 1.4], [-1.4, 0], [1.4, 0]];
  let h = hashStr(id);
  const rr = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const n = 4 + Math.floor(rr() * 3);
  const path = [];
  let cur = Math.floor(rr() * pts.length);
  path.push(cur);
  for (let i = 0; i < n; i++) {
    let nx = Math.floor(rr() * pts.length), g = 0;
    while ((nx === cur || path.slice(-2).includes(nx)) && g++ < 10) nx = Math.floor(rr() * pts.length);
    path.push(nx); cur = nx;
  }
  const dots = [Math.floor(rr() * pts.length), Math.floor(rr() * pts.length)];
  return { pts, path, dots, mirror: rr() < 0.5 };
}
function getSigil(it) {
  if (sigilCache[it.id]) return sigilCache[it.id];
  const S = 64;
  const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
  const g = cv.getContext('2d');
  const c = S / 2, col = it.color;
  // тёмный диск с металлической каймой
  const bg = g.createRadialGradient(c - 8, c - 10, 4, c, c, c);
  bg.addColorStop(0, '#2a2733'); bg.addColorStop(1, '#0c0a12');
  g.fillStyle = bg; g.beginPath(); g.arc(c, c, c - 3, 0, 7); g.fill();
  g.strokeStyle = col; g.lineWidth = 3; g.globalAlpha = 0.9; g.beginPath(); g.arc(c, c, c - 3, 0, 7); g.stroke();
  if (it.curse) { // проклятая реликвия: кровавая кайма с зубцами
    g.globalAlpha = 1; g.strokeStyle = '#be123c'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(c, c, c - 1.5, 0, 7); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#be123c';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * (c - 1), c + Math.sin(a) * (c - 1)); g.lineTo(c + Math.cos(a + 0.12) * (c - 7), c + Math.sin(a + 0.12) * (c - 7)); g.lineTo(c + Math.cos(a - 0.12) * (c - 7), c + Math.sin(a - 0.12) * (c - 7)); g.closePath(); g.fill(); }
    g.globalAlpha = 0.9;
  }
  g.globalAlpha = 0.35; g.lineWidth = 1; g.beginPath(); g.arc(c, c, c - 8, 0, 7); g.stroke(); g.globalAlpha = 1;
  // деления по кайме
  g.strokeStyle = col; g.globalAlpha = 0.5; g.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * (c - 5), c + Math.sin(a) * (c - 5)); g.lineTo(c + Math.cos(a) * (c - 8), c + Math.sin(a) * (c - 8)); g.stroke(); }
  g.globalAlpha = 1;
  // руна
  const sg = sigilPoints(it.id), u = 11;
  const draw = (sx) => {
    g.beginPath();
    sg.path.forEach((pi, i) => { const [px, py] = sg.pts[pi]; const X = c + px * u * sx, Y = c + py * u; if (i === 0) g.moveTo(X, Y); else g.lineTo(X, Y); });
    g.stroke();
  };
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = col; g.shadowBlur = 8;
  g.strokeStyle = col; g.lineWidth = 3; draw(1); if (sg.mirror) draw(-1);
  g.shadowBlur = 0;
  g.strokeStyle = '#fff'; g.globalAlpha = 0.55; g.lineWidth = 1; draw(1); if (sg.mirror) draw(-1);
  g.globalAlpha = 1;
  g.fillStyle = col;
  for (const di of sg.dots) { const [px, py] = sg.pts[di]; g.beginPath(); g.arc(c + px * u, c + py * u, 2.2, 0, 7); g.fill(); }
  if (it.active) { g.strokeStyle = '#fde68a'; g.lineWidth = 2; g.beginPath(); g.moveTo(c - 6, 5); g.lineTo(c, 1); g.lineTo(c + 6, 5); g.stroke(); }
  return (sigilCache[it.id] = cv);
}
function drawSigil(it, x, y, r, bob = 0) {
  ctx.drawImage(getSigil(it), x - r, y + bob - r, r * 2, r * 2);
}

// ---------- КЭШ ФОНА ----------
const bgCache = {};
function getBg(F) { return bgCache[F.id || F.theme] || (bgCache[F.id || F.theme] = buildBg(F)); }

function buildBg(F) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = F.wall; g.fillRect(0, 0, W, H);
  // кладка стен
  g.save();
  g.beginPath(); g.rect(0, HUD_H, W, H - HUD_H); g.rect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  g.clip('evenodd');
  for (let y = HUD_H, row = 0; y < H; y += 19, row++) {
    for (let x = row % 2 ? -18 : 0; x < W; x += 36) {
      g.fillStyle = Math.random() < 0.5 ? F.wall2 : F.wall;
      g.globalAlpha = 0.3 + Math.random() * 0.4;
      g.fillRect(x + 1, y + 1, 34, 17);
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(x + 1, y + 1, 34, 2);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 1, y + 16, 34, 2);
    }
  }
  g.restore();
  // пол
  const fg = g.createRadialGradient(CX, CY, 40, CX, CY, PLAY.w * 0.62);
  fg.addColorStop(0, F.floor[0]); fg.addColorStop(0.7, F.floor[1]); fg.addColorStop(1, F.floor[2]);
  g.fillStyle = fg; g.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = PLAY.x + c * TILE, y = PLAY.y + r * TILE;
      if ((c + r) % 2) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, TILE, TILE); }
      g.strokeStyle = 'rgba(0,0,0,0.42)'; g.lineWidth = 2; g.strokeRect(x, y, TILE, TILE);
      g.strokeStyle = 'rgba(255,255,255,0.03)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + 1.5, y + TILE - 1.5); g.lineTo(x + 1.5, y + 1.5); g.lineTo(x + TILE - 1.5, y + 1.5); g.stroke();
    }
  }
  // пятна, трещины, тематический декор
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.09})`;
    g.beginPath(); g.ellipse(PLAY.x + Math.random() * PLAY.w, PLAY.y + Math.random() * PLAY.h, 6 + Math.random() * 24, 4 + Math.random() * 14, Math.random() * 3, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = 'rgba(0,0,0,0.34)'; g.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    let x = PLAY.x + Math.random() * PLAY.w, y = PLAY.y + Math.random() * PLAY.h;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.5) * 30; g.lineTo(x, y); }
    g.stroke();
  }
  decorFloor(g, F);
  // внутренняя тень стен
  const sh = 30;
  let lg = g.createLinearGradient(0, PLAY.y, 0, PLAY.y + sh); lg.addColorStop(0, 'rgba(0,0,0,0.7)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lg; g.fillRect(PLAY.x, PLAY.y, PLAY.w, sh);
  lg = g.createLinearGradient(0, PLAY.y + PLAY.h, 0, PLAY.y + PLAY.h - sh); lg.addColorStop(0, 'rgba(0,0,0,0.7)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lg; g.fillRect(PLAY.x, PLAY.y + PLAY.h - sh, PLAY.w, sh);
  lg = g.createLinearGradient(PLAY.x, 0, PLAY.x + sh, 0); lg.addColorStop(0, 'rgba(0,0,0,0.7)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lg; g.fillRect(PLAY.x, PLAY.y, sh, PLAY.h);
  lg = g.createLinearGradient(PLAY.x + PLAY.w, 0, PLAY.x + PLAY.w - sh, 0); lg.addColorStop(0, 'rgba(0,0,0,0.7)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lg; g.fillRect(PLAY.x + PLAY.w - sh, PLAY.y, sh, PLAY.h);
  g.strokeStyle = 'rgba(0,0,0,0.85)'; g.lineWidth = 4; g.strokeRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1.5; g.strokeRect(PLAY.x + 2, PLAY.y + 2, PLAY.w - 4, PLAY.h - 4);
  return cv;
}

// Декор пола по теме глубины
function decorFloor(g, F) {
  const rx = () => PLAY.x + 30 + Math.random() * (PLAY.w - 60), ry = () => PLAY.y + 30 + Math.random() * (PLAY.h - 60);
  g.save();
  switch (F.theme) {
    case 'chapel': // мозаика и восковые подтёки
      g.strokeStyle = 'rgba(252,211,77,0.07)'; g.lineWidth = 2;
      for (const r of [70, 120]) { g.beginPath(); g.arc(CX, CY, r, 0, 7); g.stroke(); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.moveTo(CX + Math.cos(a) * 70, CY + Math.sin(a) * 70); g.lineTo(CX + Math.cos(a) * 120, CY + Math.sin(a) * 120); g.stroke(); }
      g.fillStyle = 'rgba(245,235,200,0.07)';
      for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(rx(), ry(), 5 + Math.random() * 6, 3 + Math.random() * 3, Math.random() * 3, 0, 7); g.fill(); }
      break;
    case 'plague': // зелёные лужи и пузыри
      for (let i = 0; i < 10; i++) { const x = rx(), y = ry(); const gr = g.createRadialGradient(x, y, 2, x, y, 36); gr.addColorStop(0, 'rgba(163,230,53,0.2)'); gr.addColorStop(1, 'rgba(163,230,53,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 40, 20, 0, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(190,242,100,0.18)'; g.lineWidth = 1.4;
      for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(rx(), ry(), 2 + Math.random() * 4, 0, 7); g.stroke(); }
      break;
    case 'foundry': // трещины с жаром
      g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { let x = rx(), y = ry(); g.strokeStyle = 'rgba(251,146,60,0.22)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(251,146,60,0.1)'; g.fillRect(rx(), ry(), 3, 3); }
      break;
    case 'scriptorium': // разбросанные страницы
      for (let i = 0; i < 16; i++) { const x = rx(), y = ry(), a = Math.random() * 3; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = 'rgba(230,220,255,0.07)'; g.fillRect(-8, -10, 16, 20); g.strokeStyle = 'rgba(196,181,253,0.12)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-5, -5 + k * 5); g.lineTo(5, -5 + k * 5); g.stroke(); } g.restore(); }
      break;
    case 'grotto': // светящиеся кристальные пятна
      for (let i = 0; i < 12; i++) { const x = rx(), y = ry(); const gr = g.createRadialGradient(x, y, 1, x, y, 30); gr.addColorStop(0, 'rgba(103,232,249,0.2)'); gr.addColorStop(1, 'rgba(103,232,249,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(200,245,255,0.14)'; g.lineWidth = 1;
      for (let i = 0; i < 20; i++) { const x = rx(), y = ry(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7); g.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); g.stroke(); } }
      break;
    case 'crypt': // могильные плиты-надписи, паутина
      for (let i = 0; i < 6; i++) { const x = rx(), y = ry(); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1; g.strokeRect(x - 14, y - 9, 28, 18); g.beginPath(); g.moveTo(x - 6, y - 3); g.lineTo(x + 6, y - 3); g.moveTo(x - 6, y + 2); g.lineTo(x + 3, y + 2); g.stroke(); }
      break;
    case 'temple': // лужи воды
      for (let i = 0; i < 9; i++) { const x = rx(), y = ry(); const gr = g.createRadialGradient(x, y, 2, x, y, 40); gr.addColorStop(0, 'rgba(94,234,212,0.16)'); gr.addColorStop(1, 'rgba(94,234,212,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 46, 22, 0, 0, 7); g.fill(); }
      break;
    case 'ossuary': // кости на полу
      g.strokeStyle = 'rgba(230,220,190,0.14)'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 22; i++) { const x = rx(), y = ry(), a = Math.random() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11); g.stroke(); }
      break;
    case 'garden': // корни и лужи крови
      g.strokeStyle = 'rgba(190,30,60,0.2)'; g.lineWidth = 2.5;
      for (let i = 0; i < 12; i++) { let x = rx(), y = ry(); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 36; y += (Math.random() - 0.5) * 36; g.lineTo(x, y); } g.stroke(); }
      break;
    case 'necropolis': // иней по краям
      for (let i = 0; i < 18; i++) { const x = rx(), y = ry(); g.strokeStyle = 'rgba(200,230,255,0.12)'; g.lineWidth = 1; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke(); } }
      break;
    case 'abyss': // руническое кольцо
      g.strokeStyle = 'rgba(167,139,250,0.08)'; g.lineWidth = 2;
      for (const r of [90, 140, 200]) { g.beginPath(); g.arc(CX, CY, r, 0, 7); g.stroke(); }
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.beginPath(); g.moveTo(CX + Math.cos(a) * 90, CY + Math.sin(a) * 90); g.lineTo(CX + Math.cos(a) * 200, CY + Math.sin(a) * 200); g.stroke(); }
      break;
  }
  g.restore();
}

// ---------- СПРАЙТЫ ПРЕПЯТСТВИЙ ПО ТЕМАМ ----------
const obsCache = {};
function seeded(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

function getObstacle(theme, v, crack) {
  const key = theme + v + (crack ? 'c' : '');
  if (obsCache[key]) return obsCache[key];
  const cv = document.createElement('canvas'); cv.width = TILE; cv.height = TILE;
  const g = cv.getContext('2d');
  const cx = TILE / 2, cy = TILE / 2 + 2, R = TILE * 0.42, rr = seeded((v + 1) * 7919 + theme.length * 31);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(cx + 2, cy + R * 0.8, R, R * 0.36, 0, 0, 7); g.fill();
  g.lineJoin = 'round';
  const poly = (pts, c0, c1, c2) => {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
    const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.5, 2, cx, cy, R * 1.1);
    gr.addColorStop(0, c0); gr.addColorStop(0.6, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineWidth = 2.2; g.stroke();
  };
  if (theme === 'crypt') { // надгробие
    const w = R * 0.85, top = cy - R * 0.95;
    g.beginPath(); g.moveTo(cx - w, cy + R * 0.7); g.lineTo(cx - w, top + w); g.arc(cx, top + w, w, Math.PI, 0); g.lineTo(cx + w, cy + R * 0.7); g.closePath();
    const gr = g.createLinearGradient(cx - w, 0, cx + w, 0); gr.addColorStop(0, '#6b7080'); gr.addColorStop(0.5, '#4b505f'); gr.addColorStop(1, '#2c303b');
    g.fillStyle = gr; g.fill(); g.strokeStyle = '#0b0c12'; g.lineWidth = 2.4; g.stroke();
    g.strokeStyle = 'rgba(15,16,24,0.7)'; g.lineWidth = 2.2;
    if (v % 2) { g.beginPath(); g.moveTo(cx, top + 8); g.lineTo(cx, top + 28); g.moveTo(cx - 6, top + 14); g.lineTo(cx + 6, top + 14); g.stroke(); }
    else { g.beginPath(); g.moveTo(cx - 6, top + 14); g.lineTo(cx + 6, top + 14); g.moveTo(cx - 6, top + 21); g.lineTo(cx + 4, top + 21); g.stroke(); }
  } else if (theme === 'temple') { // обломок колонны
    g.fillStyle = '#26474f'; g.strokeStyle = '#0a1a1f'; g.lineWidth = 2.4;
    g.fillRect(cx - R * 0.75, cy + R * 0.35, R * 1.5, R * 0.4); g.strokeRect(cx - R * 0.75, cy + R * 0.35, R * 1.5, R * 0.4);
    const gr = g.createLinearGradient(cx - R * 0.6, 0, cx + R * 0.6, 0); gr.addColorStop(0, '#4a7a85'); gr.addColorStop(0.5, '#376069'); gr.addColorStop(1, '#1f3d45');
    g.fillStyle = gr; g.fillRect(cx - R * 0.55, cy - R * 0.75 + (v % 2) * 6, R * 1.1, R * 1.15); g.strokeRect(cx - R * 0.55, cy - R * 0.75 + (v % 2) * 6, R * 1.1, R * 1.15);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.5; for (const k of [-0.2, 0.2]) { g.beginPath(); g.moveTo(cx + R * k, cy - R * 0.7); g.lineTo(cx + R * k, cy + R * 0.35); g.stroke(); }
    g.fillStyle = 'rgba(94,234,212,0.25)'; g.fillRect(cx - R * 0.55, cy + R * 0.2, R * 1.1, R * 0.2);
  } else if (theme === 'ossuary') { // куча черепов
    for (let i = 0; i < 5; i++) {
      const x = cx + (rr() - 0.5) * R * 1.2, y = cy + (rr() - 0.2) * R * 0.9, s = R * (0.34 + rr() * 0.12);
      ball(x, y, s, '#f3ecd6', '#c9bd98', '#6e6347', '#2a2316', 1.6);
      g.fillStyle = '#1a150c'; g.beginPath(); g.arc(x - s * 0.35, y - s * 0.05, s * 0.2, 0, 7); g.arc(x + s * 0.35, y - s * 0.05, s * 0.2, 0, 7); g.fill();
      g.fillRect(x - s * 0.12, y + s * 0.3, s * 0.24, s * 0.25);
    }
  } else if (theme === 'garden') { // мясистый нарост
    const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, rad = R * (0.8 + rr() * 0.35); pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.9]); }
    poly(pts, '#c0405b', '#7f1d3a', '#2e0a17');
    g.strokeStyle = 'rgba(40,5,15,0.7)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx + (rr() - 0.5) * R, cy - R * 0.5); g.quadraticCurveTo(cx + (rr() - 0.5) * R, cy, cx + (rr() - 0.5) * R * 1.2, cy + R * 0.6); g.stroke(); }
    g.fillStyle = 'rgba(255,200,210,0.25)'; g.beginPath(); g.ellipse(cx - R * 0.3, cy - R * 0.35, R * 0.22, R * 0.14, -0.5, 0, 7); g.fill();
  } else if (theme === 'necropolis') { // ледяной кристалл
    g.fillStyle = 'rgba(165,216,255,0.9)';
    for (const [dx, h, w] of [[-0.45, 0.8, 0.28], [0, 1.05, 0.34], [0.45, 0.7, 0.26]]) {
      const bx = cx + dx * R, by = cy + R * 0.6;
      g.beginPath(); g.moveTo(bx - w * R, by); g.lineTo(bx, by - h * R * 1.4); g.lineTo(bx + w * R, by); g.closePath();
      const gr = g.createLinearGradient(bx - w * R, 0, bx + w * R, 0); gr.addColorStop(0, '#dff1ff'); gr.addColorStop(0.5, '#8cc4ec'); gr.addColorStop(1, '#3c6f9c');
      g.fillStyle = gr; g.fill(); g.strokeStyle = '#173a5c'; g.lineWidth = 2; g.stroke();
    }
  } else if (theme === 'chapel') { // церковная скамья
    g.lineWidth = 2.2;
    g.fillStyle = '#4a2d1a'; g.strokeStyle = '#150a05';
    g.fillRect(cx - R * 0.95, cy - R * 0.9, R * 1.9, R * 0.7); g.strokeRect(cx - R * 0.95, cy - R * 0.9, R * 1.9, R * 0.7);
    g.fillStyle = '#6b4226';
    g.fillRect(cx - R * 0.95, cy - R * 0.1, R * 1.9, R * 0.6); g.strokeRect(cx - R * 0.95, cy - R * 0.1, R * 1.9, R * 0.6);
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.4;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(cx - R * 0.95 + i * R * 0.475, cy - R * 0.88); g.lineTo(cx - R * 0.95 + i * R * 0.475, cy - R * 0.22); g.stroke(); }
    g.fillStyle = 'rgba(255,220,160,0.18)'; g.fillRect(cx - R * 0.9, cy - R * 0.08, R * 1.8, 3);
  } else if (theme === 'plague') { // чумной кокон
    const pts = []; for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, rad = R * (0.82 + rr() * 0.3); pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.9]); }
    poly(pts, '#a3b86a', '#4d6a22', '#1a2a0a');
    g.fillStyle = 'rgba(190,242,100,0.5)';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + (rr() - 0.5) * R * 1.1, cy + (rr() - 0.5) * R, 2 + rr() * 3.5, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(20,35,5,0.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - R * 0.5, cy - R * 0.2); g.quadraticCurveTo(cx, cy + R * 0.2, cx + R * 0.5, cy - R * 0.1); g.stroke();
  } else if (theme === 'foundry') { // чугунная болванка с жаром
    poly([[cx - R * 0.8, cy + R * 0.7], [cx - R * 0.7, cy - R * 0.3], [cx - R * 0.3, cy - R * 0.85], [cx + R * 0.5, cy - R * 0.75], [cx + R * 0.85, cy - R * 0.1], [cx + R * 0.75, cy + R * 0.7]], '#6a5a58', '#3a2e2c', '#161010');
    g.strokeStyle = 'rgba(251,146,60,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - R * 0.3, cy - R * 0.5); g.lineTo(cx - R * 0.05, cy); g.lineTo(cx + R * 0.35, cy + R * 0.2); g.stroke();
    g.strokeStyle = 'rgba(253,224,71,0.5)'; g.lineWidth = 1; g.stroke();
  } else if (theme === 'scriptorium') { // книжный шкаф
    g.fillStyle = '#33241a'; g.strokeStyle = '#0d0805'; g.lineWidth = 2.2;
    g.fillRect(cx - R * 0.8, cy - R * 0.95, R * 1.6, R * 1.75); g.strokeRect(cx - R * 0.8, cy - R * 0.95, R * 1.6, R * 1.75);
    const cols = ['#7c3aed', '#be185d', '#0f766e', '#a16207', '#4338ca', '#9f1239'];
    for (let row = 0; row < 3; row++) {
      const y0 = cy - R * 0.85 + row * R * 0.56;
      g.fillStyle = '#1c130c'; g.fillRect(cx - R * 0.72, y0 + R * 0.46, R * 1.44, 3);
      let x = cx - R * 0.7;
      while (x < cx + R * 0.66) { const w = 3 + rr() * 4, h = R * (0.32 + rr() * 0.12); g.fillStyle = cols[Math.floor(rr() * cols.length)]; g.fillRect(x, y0 + R * 0.46 - h, w, h); x += w + 0.8; }
    }
  } else if (theme === 'grotto') { // бирюзовый кристалл
    for (const [dx, h, w] of [[-0.5, 0.7, 0.26], [-0.1, 1.1, 0.34], [0.38, 0.85, 0.3], [0.7, 0.5, 0.2]]) {
      const bx = cx + dx * R, by = cy + R * 0.6;
      g.beginPath(); g.moveTo(bx - w * R, by); g.lineTo(bx - w * R * 0.2, by - h * R * 1.4); g.lineTo(bx + w * R * 0.5, by - h * R * 1.2); g.lineTo(bx + w * R, by); g.closePath();
      const gr = g.createLinearGradient(bx - w * R, 0, bx + w * R, 0); gr.addColorStop(0, '#d8fbff'); gr.addColorStop(0.5, '#4fd1e0'); gr.addColorStop(1, '#0e6a7a');
      g.fillStyle = gr; g.fill(); g.strokeStyle = '#073a44'; g.lineWidth = 2; g.stroke();
    }
  } else { // abyss — чёрный обелиск
    poly([[cx - R * 0.5, cy + R * 0.7], [cx - R * 0.3, cy - R * 0.9], [cx + R * 0.1, cy - R * 1.2], [cx + R * 0.5, cy - R * 0.7], [cx + R * 0.55, cy + R * 0.7]], '#4a3a6b', '#241638', '#0b0614');
    g.strokeStyle = 'rgba(167,139,250,0.7)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - R * 0.1, cy - R * 0.5); g.lineTo(cx + R * 0.15, cy - R * 0.1); g.lineTo(cx - R * 0.05, cy + R * 0.3); g.stroke();
  }
  if (crack && theme !== 'ossuary' && theme !== 'necropolis' && theme !== 'grotto' && theme !== 'scriptorium' && theme !== 'chapel') {
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - R * 0.35, cy - R * 0.1); g.lineTo(cx, cy + 3); g.lineTo(cx + R * 0.4, cy + R * 0.1); g.stroke();
  }
  return (obsCache[key] = cv);
}

const urnCache = {};
function getUrn(hp, v) {
  const key = hp + '' + (v % 2);
  if (urnCache[key]) return urnCache[key];
  const cv = document.createElement('canvas'); cv.width = TILE; cv.height = TILE;
  const g = cv.getContext('2d');
  const cx = TILE / 2, cy = TILE / 2 + 6;
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(cx, cy + 16, 15, 5, 0, 0, 7); g.fill();
  const gr = g.createLinearGradient(cx - 16, 0, cx + 16, 0); gr.addColorStop(0, '#8c5a2b'); gr.addColorStop(0.5, '#6b4220'); gr.addColorStop(1, '#3d2410');
  g.fillStyle = gr; g.strokeStyle = '#1d1008'; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(cx - 8, cy - 18); g.quadraticCurveTo(cx - 20, cy - 4, cx - 13, cy + 14); g.lineTo(cx + 13, cy + 14); g.quadraticCurveTo(cx + 20, cy - 4, cx + 8, cy - 18); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#4d2f16'; g.fillRect(cx - 10, cy - 22, 20, 5); g.strokeRect(cx - 10, cy - 22, 20, 5);
  g.strokeStyle = 'rgba(220,170,100,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 12, cy - 2); g.quadraticCurveTo(cx, cy + 3, cx + 12, cy - 2); g.stroke();
  if (hp <= 1) { g.strokeStyle = '#120a04'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 4, cy - 18); g.lineTo(cx - 2, cy - 4); g.lineTo(cx + 6, cy + 6); g.lineTo(cx, cy + 14); g.stroke(); }
  return (urnCache[key] = cv);
}

// ---------- ПЛИТКИ ----------
function drawFloorTiles(rm) {
  if (!rm.tiles) return;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = rm.tiles[r][c];
      if (!t) continue;
      const x = PLAY.x + c * TILE, y = PLAY.y + r * TILE;
      if (t.t === 'X') {
        const lava = floorDef(floorNum).pit === 'lava';
        ctx.fillStyle = lava ? '#1a0703' : '#020104'; ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        if (lava) {
          const lg = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
          lg.addColorStop(0, `rgba(251,146,60,${0.55 + Math.sin(time * 2 + c) * 0.12})`); lg.addColorStop(1, 'rgba(127,29,29,0.6)');
          ctx.fillStyle = lg; ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = 'rgba(253,224,71,0.35)'; ctx.fillRect(x + 8 + (Math.sin(time * 1.5 + r) + 1) * 8, y + 10, 10, 4);
        }
        const g = ctx.createLinearGradient(x, y, x, y + TILE);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, lava ? 'rgba(127,29,29,0.35)' : 'rgba(70,50,110,0.35)');
        ctx.fillStyle = g; ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x + 4, y + 4, TILE - 8, 3);
      } else if (t.t === 'S') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
        ctx.fillStyle = '#b7bcc7'; ctx.strokeStyle = '#3f4452'; ctx.lineWidth = 1;
        for (const [ox, oy] of [[16, 16], [36, 16], [16, 36], [36, 36]]) {
          ctx.beginPath(); ctx.moveTo(x + ox - 6, y + oy + 6); ctx.lineTo(x + ox, y + oy - 8); ctx.lineTo(x + ox + 6, y + oy + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
    }
  }
}
function drawSolidTiles(rm) {
  if (!rm.tiles) return;
  const theme = floorDef(floorNum).theme;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = rm.tiles[r][c];
      if (!t) continue;
      const x = PLAY.x + c * TILE, y = PLAY.y + r * TILE;
      if (t.t === 'R') ctx.drawImage(getObstacle(theme, t.v, t.crack), x, y);
      else if (t.t === 'P') ctx.drawImage(getUrn(t.hp, t.v), x + (t.shake > 0 ? Math.sin(time * 70) * 2 : 0), y);
      else if (t.t === 'F') drawBrazier(x + TILE / 2, y + TILE / 2 + 4, c * 7 + r * 13);
    }
  }
}
function drawBrazier(x, y, seed) {
  shadowEllipse(x, y + 14, 15, 5, 0.45);
  ctx.fillStyle = '#2b2630'; ctx.strokeStyle = '#0c0a10'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 7, y + 14); ctx.lineTo(x - 10, y - 2); ctx.lineTo(x + 10, y - 2); ctx.lineTo(x + 7, y + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3d3642'; ctx.beginPath(); ctx.ellipse(x, y - 3, 14, 5, 0, 0, 7); ctx.fill(); ctx.stroke();
  const fl = 1 + Math.sin(time * 9 + seed) * 0.12 + Math.sin(time * 15 + seed * 2) * 0.07;
  const g = ctx.createRadialGradient(x, y - 10, 1, x, y - 10, 16 * fl);
  g.addColorStop(0, '#fff7c2'); g.addColorStop(0.35, '#fbbf24'); g.addColorStop(0.75, '#ea580c'); g.addColorStop(1, 'rgba(127,29,29,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.quadraticCurveTo(x - 10, y - 20 * fl, x, y - 30 * fl); ctx.quadraticCurveTo(x + 10, y - 20 * fl, x + 9, y - 4); ctx.closePath(); ctx.fill();
}

// ---------- ДВЕРИ ----------
function drawDoors(rm) {
  const F = floorDef(floorNum);
  for (const d of DIRS) {
    const door = rm.doors[d.name];
    if (!door) continue;
    let x, y, w, h;
    if (d.name === 'u') { x = CX - DOOR_W / 2; y = PLAY.y - WALL; w = DOOR_W; h = WALL; }
    else if (d.name === 'd') { x = CX - DOOR_W / 2; y = PLAY.y + PLAY.h; w = DOOR_W; h = WALL; }
    else if (d.name === 'l') { x = PLAY.x - WALL; y = CY - DOOR_W / 2; w = WALL; h = DOOR_W; }
    else { x = PLAY.x + PLAY.w; y = CY - DOOR_W / 2; w = WALL; h = DOOR_W; }
    if (door.hidden) { // руна проявляется, пока рядом свет
      const k = clamp((door.reveal || 0) / 1.6, 0, 1);
      if (k > 0.02) {
        ctx.strokeStyle = `rgba(196,181,253,${0.15 + k * 0.7})`; ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        glow(x + w / 2, y + h / 2, 30 + k * 30, '#a78bfa', k * 0.7);
        const horiz = d.name === 'u' || d.name === 'd';
        outlinedText('ᛟ', x + w / 2, y + h / 2, `rgba(221,214,254,${0.3 + k * 0.7})`, 18, 'center', FONT_SERIF);
        ctx.strokeStyle = 'rgba(196,181,253,0.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 17, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
      }
      continue;
    }
    const target = grid.get(door.to);
    const tt = target ? target.type : 'normal';
    const col = { treasure: '#fbbf24', shop: '#4ade80', boss: '#e11d48', secret: '#a78bfa', shrine: '#fb923c', event: '#38bdf8', trial: '#f59e0b' }[tt] || F.accent;
    const label = { treasure: '✦', shop: '$', boss: '☠', secret: '?', shrine: '♨', event: '!', trial: '»' }[tt] || '';
    const horiz = d.name === 'u' || d.name === 'd';
    ctx.fillStyle = '#04030a'; ctx.fillRect(x, y, w, h);
    if (door.locked) {
      ctx.strokeStyle = '#a16207'; ctx.lineWidth = 3; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      const px = x + w / 2, py = y + h / 2;
      ctx.fillStyle = '#d6a23a'; ctx.fillRect(px - 8, py - 3, 16, 12);
      ctx.strokeStyle = '#d6a23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py - 3, 6, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#451a03'; ctx.fillRect(px - 1.5, py + 1, 3, 5);
      if (rm.cleared && player && player.keys > 0) glow(px, py, 40, '#fbbf24', 0.25 + Math.sin(time * 6) * 0.1);
    } else if (!rm.cleared) {
      ctx.fillStyle = '#14110f'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2.5; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.strokeStyle = '#4b1515'; ctx.lineWidth = 2;
      if (horiz) for (let bx = x + 12; bx < x + w - 8; bx += 14) { ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + h); ctx.stroke(); }
      else for (let by = y + 12; by < y + h - 8; by += 14) { ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + w, by); ctx.stroke(); }
    } else {
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
      glow(x + w / 2, y + h / 2, 34, col, 0.42);
      if (label) outlinedText(label, x + w / 2, y + h / 2, col, 16);
    }
  }
}

// ---------- ЛЕСТНИЦА, ПОРТАЛЫ, КОСТЁР ----------
function drawStair(s) {
  glow(s.x, s.y, 54, '#fbbf24', 0.4 + Math.sin(time * 4) * 0.08);
  ctx.fillStyle = '#030208'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a16207'; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.strokeStyle = '#e8b64a'; ctx.lineWidth = 2.5;
  for (let i = -11; i <= 11; i += 6) { ctx.beginPath(); ctx.moveTo(s.x - 11, s.y + i); ctx.lineTo(s.x + 11, s.y + i); ctx.stroke(); }
  ctx.strokeStyle = '#d6a23a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(s.x - 11, s.y - 14); ctx.lineTo(s.x - 11, s.y + 14); ctx.moveTo(s.x + 11, s.y - 14); ctx.lineTo(s.x + 11, s.y + 14); ctx.stroke();
  outlinedText(s.final ? 'К ОГНЮ' : 'ВНИЗ', s.x, s.y - s.r - 12, '#fde68a', 11);
}
function drawPortal(pt) {
  const altar = pt.kind === 'altar';
  const c0 = altar ? '#e11d48' : '#7dd3fc';
  glow(pt.x, pt.y, 54, c0, 0.45);
  ctx.fillStyle = '#060208'; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = c0;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r - 2 - i * 5, time * (2 + i) + i, time * (2 + i) + i + 3.2); ctx.stroke(); }
  outlinedText(altar ? 'АЛТАРЬ' : 'НАЗАД', pt.x, pt.y - pt.r - 12, c0, 11);
}
function drawShrine(sh) {
  shadowEllipse(sh.x, sh.y + 18, 30, 9, 0.5);
  ctx.fillStyle = '#3a3330'; ctx.strokeStyle = '#0c0a0a'; ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(sh.x + Math.cos(a) * 22, sh.y + 10 + Math.sin(a) * 8, 8, 6, 0, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sh.x - 14, sh.y + 12); ctx.lineTo(sh.x + 12, sh.y + 2); ctx.moveTo(sh.x + 14, sh.y + 12); ctx.lineTo(sh.x - 12, sh.y + 2); ctx.stroke(); ctx.lineCap = 'butt';
  if (!sh.used) {
    const fl = 1 + Math.sin(time * 8) * 0.1;
    const g = ctx.createRadialGradient(sh.x, sh.y - 6, 2, sh.x, sh.y - 6, 26 * fl);
    g.addColorStop(0, '#fff7c2'); g.addColorStop(0.4, '#fbbf24'); g.addColorStop(0.8, '#ea580c'); g.addColorStop(1, 'rgba(127,29,29,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sh.x - 14, sh.y + 2); ctx.quadraticCurveTo(sh.x - 18, sh.y - 26 * fl, sh.x, sh.y - 46 * fl); ctx.quadraticCurveTo(sh.x + 18, sh.y - 26 * fl, sh.x + 14, sh.y + 2); ctx.closePath(); ctx.fill();
  } else outlinedText('угли', sh.x, sh.y - 16, '#78716c', 10);
}

// ---------- ПИКАПЫ ----------
function drawPickupSprite(type, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (type === 'potion') {
    ctx.fillStyle = '#7f1d1d'; ctx.strokeStyle = '#1f0808'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(-3, -5); ctx.quadraticCurveTo(-10, 0, -8, 7); ctx.quadraticCurveTo(0, 12, 8, 7); ctx.quadraticCurveTo(10, 0, 3, -5); ctx.lineTo(3, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(-8, 0, 8, 0); g.addColorStop(0, '#f87171'); g.addColorStop(1, '#991b1b'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-8, 2); ctx.quadraticCurveTo(-10, 8, 0, 10); ctx.quadraticCurveTo(10, 8, 8, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a16207'; ctx.fillRect(-4, -14, 8, 4); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-4, 2, 1.6, 4, 0.2, 0, 7); ctx.fill();
  } else if (type === 'oil') {
    ctx.fillStyle = '#92400e'; ctx.strokeStyle = '#2b1204'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(-3, -5); ctx.quadraticCurveTo(-10, 0, -8, 7); ctx.quadraticCurveTo(0, 12, 8, 7); ctx.quadraticCurveTo(10, 0, 3, -5); ctx.lineTo(3, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(-8, 0, 8, 0); g.addColorStop(0, '#fde68a'); g.addColorStop(1, '#d97706'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-8, 1); ctx.quadraticCurveTo(-10, 8, 0, 10); ctx.quadraticCurveTo(10, 8, 8, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4b5563'; ctx.fillRect(-4, -14, 8, 4); glow(0, 2, 16, '#fbbf24', 0.5);
  } else if (type === 'wisp') {
    glow(0, 0, 14, '#a5f3fc', 0.8);
    ball(0, 0, 5, '#ffffff', '#a5f3fc', '#0e7490', null);
  } else if (type === 'silver' || type === 'pouch') {
    if (type === 'pouch') {
      ball(0, 3, 10, '#d6d3d1', '#78716c', '#292524', '#0c0a09', 1.6);
      ctx.fillStyle = '#78716c'; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(0, -11); ctx.lineTo(5, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 9px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('6', 0, 4);
    } else {
      ball(0, 0, 7, '#ffffff', '#cbd5e1', '#64748b', '#334155', 1.5);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.stroke();
    }
  } else if (type === 'flask') {
    ctx.fillStyle = '#44403c'; ctx.strokeStyle = '#0c0a09'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 3, 8, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.arc(0, 4, 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#44403c'; ctx.fillRect(-2.5, -8, 5, 6); ctx.strokeRect(-2.5, -8, 5, 6);
    ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(3, -12); ctx.stroke(); glow(3, -12, 6, '#fde047', 0.9);
  } else if (type === 'key') {
    ctx.strokeStyle = '#451a03'; ctx.fillStyle = '#d6a23a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-4, -4, 5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#451a03'; ctx.beginPath(); ctx.arc(-4, -4, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = '#d6a23a'; ctx.fillRect(-1, -2, 4, 14); ctx.strokeRect(-1, -2, 4, 14); ctx.fillRect(3, 6, 5, 3); ctx.fillRect(3, 10, 4, 3);
  } else if (type === 'shard') {
    glow(0, 0, 16, '#93c5fd', 0.55);
    ctx.fillStyle = '#bfdbfe'; ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(7, -2); ctx.lineTo(3, 10); ctx.lineTo(-5, 8); ctx.lineTo(-7, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(-1, -8); ctx.lineTo(3, -2); ctx.lineTo(-2, 0); ctx.closePath(); ctx.fill();
  } else if (type === 'chest') {
    ctx.fillStyle = '#5a3a1c'; ctx.strokeStyle = '#1c0e04'; ctx.lineWidth = 2;
    ctx.fillRect(-14, -6, 28, 18); ctx.strokeRect(-14, -6, 28, 18);
    ctx.fillStyle = '#6e4723'; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(0, -20, 14, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6a23a'; ctx.fillRect(-3, -5, 6, 8); ctx.fillRect(-14, 2, 28, 3);
  } else if (type === 'sack') {
    ball(0, 3, 11, '#c9ad85', '#8d7048', '#4a3820', '#271b0c', 1.8);
    ctx.fillStyle = '#8d7048'; ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(0, -12); ctx.lineTo(5, -6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#271b0c'; ctx.stroke();
  } else if (type === 'ember') {
    glow(0, 0, 16, '#fb923c', 0.7);
    ctx.fillStyle = '#7c2d12'; ctx.strokeStyle = '#1c0a04'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(-3, -6); ctx.lineTo(3, -7); ctx.lineTo(7, 0); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(-1, -3); ctx.lineTo(3, -2); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fef08a'; ctx.fillRect(-1, -1, 2, 2);
  } else if (type === 'note') {
    ctx.fillStyle = '#e7d9b0'; ctx.strokeStyle = '#4a3a1a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.rect(-8, -10, 16, 20); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(74,58,26,0.55)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-5, -5 + i * 4.5); ctx.lineTo(5 - (i % 2) * 3, -5 + i * 4.5); ctx.stroke(); }
    glow(0, 0, 18, '#fde68a', 0.3);
  }
  ctx.restore();
}
function drawPickups(rm) {
  for (const pk of rm.pickups) {
    const bob = Math.sin(time * 4 + pk.x) * 1.8;
    if (pk.type !== 'wisp') shadowEllipse(pk.x, pk.y + 11, pk.r * 0.9, 3.5, 0.35);
    drawPickupSprite(pk.type, pk.x, pk.y + bob);
  }
}

// ---------- ПЬЕДЕСТАЛЫ ----------
function drawPeds(rm) {
  for (const ped of rm.peds) {
    if (ped.taken) continue;
    const x = ped.x, y = ped.y;
    const blood = ped.cur === 'blood';
    shadowEllipse(x, y + 14, 24, 6, 0.5);
    ctx.fillStyle = '#25222c'; ctx.fillRect(x - 16, y - 2, 32, 16);
    ctx.fillStyle = '#35303d'; ctx.fillRect(x - 19, y - 5, 38, 5);
    ctx.fillStyle = '#48424f'; ctx.fillRect(x - 21, y + 10, 42, 5);
    ctx.strokeStyle = blood ? '#e11d48' : '#a16207'; ctx.lineWidth = 1; ctx.strokeRect(x - 16, y - 2, 32, 16);
    const bob = Math.sin(time * 3.5 + x) * 4;
    if (ped.kind === 'relic') {
      const it = ped.item;
      glow(x, y - 20 + bob, 34, it.color, 0.5);
      drawSigil(it, x, y - 22, 17, bob);
      if (it.active) { ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.2; ctx.strokeRect(x - 18, y - 40 + bob, 36, 36); }
    } else drawPickupSprite(ped.pk, x, y - 18 + bob, 1.25);
    if (ped.price > 0) {
      if (ped.cur === 'silver') {
        drawPickupSprite('silver', x - 14, y + 29, 0.9);
        outlinedText(String(ped.price), x, y + 29, player && player.silver >= ped.price ? '#e2e8f0' : '#fca5a5', 13, 'left');
      } else outlinedText(`−${ped.price} жизни`, x, y + 29, '#fb7185', 12);
    }
    if (ped.kind === 'relic' && ped.item.curse) {
      glow(x, y - 22 + bob, 30, '#e11d48', 0.3 + Math.sin(time * 5) * 0.1);
      outlinedText('ПРОКЛЯТИЕ', x, y - 70, '#fb7185', 10);
    }
    if (player && Math.hypot(player.x - x, player.y - y) < 90 && ped.kind === 'relic') {
      outlinedText(ped.item.name, x, y - 58, ped.item.color, 12, 'center', FONT_SERIF);
      outlinedText(ped.item.desc, x, y - 44, ped.item.curse ? '#fecdd3' : '#d6d3d1', 10);
    }
  }
}

// ---------- ЗОНЫ, КАПКАНЫ, СКЛЯНКИ ----------
function drawZones() {
  for (const z of zones) {
    const k = Math.min(1, z.t / 0.6);
    if (z.kind === 'fire') {
      const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
      g.addColorStop(0, `rgba(253,224,71,${0.45 * k})`); g.addColorStop(0.5, `rgba(234,88,12,${0.32 * k})`); g.addColorStop(1, 'rgba(127,29,29,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, 7); ctx.fill();
    } else if (z.kind === 'acid') {
      const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
      g.addColorStop(0, `rgba(190,242,100,${0.38 * k})`); g.addColorStop(0.7, `rgba(101,163,13,${0.26 * k})`); g.addColorStop(1, 'rgba(54,83,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.72, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(217,249,157,${0.55 * k})`; ctx.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) { const a = i * 2.4 + z.x, px = z.x + Math.cos(a) * z.r * 0.75 * (0.3 + (i % 3) * 0.3), py = z.y + Math.sin(a) * z.r * 0.52 * (0.3 + (i % 3) * 0.3); const fy = ((time * 90 + i * 17) % 34); ctx.beginPath(); ctx.moveTo(px, py - fy); ctx.lineTo(px, py - fy + 7); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(z.x + Math.cos(time * 2 + i * 1.6) * z.r * 0.5, z.y + Math.sin(time * 2 + i * 1.6) * z.r * 0.35, 2 + (i % 2), 0, 7); ctx.stroke(); }
    } else if (z.kind === 'mad') {
      const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
      g.addColorStop(0, `rgba(244,114,182,${0.3 * k})`); g.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.72, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(244,114,182,${0.7 * k})`; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); const a0 = time * (2 + i) + i * 2; for (let t2 = 0; t2 <= 1; t2 += 0.1) { const a = a0 + t2 * 6, rr = t2 * z.r * 0.85; const px = z.x + Math.cos(a) * rr, py = z.y + Math.sin(a) * rr * 0.7; if (t2 === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); }
    } else {
      const pulse = 1 + Math.sin(time * 3) * 0.03;
      ctx.strokeStyle = `rgba(253,230,138,${0.7 * k})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * pulse, z.r * 0.72 * pulse, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = `rgba(253,230,138,${0.3 * k})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * 0.7, z.r * 0.5, 0, 0, 7); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + time * 0.5; ctx.fillStyle = `rgba(253,230,138,${0.5 * k})`; ctx.fillRect(z.x + Math.cos(a) * z.r * 0.85 - 2, z.y + Math.sin(a) * z.r * 0.6 - 2, 4, 4); }
      const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
      g.addColorStop(0, `rgba(253,230,138,${0.22 * k})`); g.addColorStop(1, 'rgba(253,230,138,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.72, 0, 0, 7); ctx.fill();
    }
  }
}
function drawTraps() {
  for (const t of traps) {
    const armed = t.t >= 0.6;
    ctx.save(); ctx.translate(t.x, t.y);
    ctx.fillStyle = armed ? '#78716c' : '#44403c'; ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = armed ? '#d6d3d1' : '#78716c'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a + 0.2) * 14, Math.sin(a + 0.2) * 14); ctx.stroke(); }
    if (armed) { ctx.fillStyle = `rgba(239,68,68,${0.5 + Math.sin(time * 6) * 0.3})`; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}
function drawThrown() {
  for (const f of thrown) {
    shadowEllipse(f.x, f.gy + 6, 8, 3, 0.35);
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.t * 14);
    ctx.fillStyle = '#44403c'; ctx.strokeStyle = '#0c0a09'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); ctx.stroke();
    const liq = f.kind === 'acid' ? '#84cc16' : f.kind === 'mad' ? '#ec4899' : '#ea580c';
    ctx.fillStyle = liq; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 7); ctx.fill();
    ctx.restore();
    glow(f.x, f.y, 18, liq, 0.6);
  }
}

// ---------- СНАРЯДЫ ----------
const SHOT_PAL = {
  steel: ['#ffffff', '#cbd5e1', '#64748b'],
  fire: ['#fffbeb', '#fb923c', '#9a3412'],
  venom: ['#f7fee7', '#a3e635', '#3f6212'],
  frost: ['#f0f9ff', '#7dd3fc', '#0c4a6e'],
  holy: ['#fffbeb', '#fde68a', '#a16207'],
  shadow: ['#ede9fe', '#8b5cf6', '#2e1065'],
  lead: ['#e5e7eb', '#6b7280', '#1f2937']
};
function drawShots() {
  for (const s of shots) {
    const pal = SHOT_PAL[s.col] || SHOT_PAL.steel;
    const ang = Math.atan2(s.vy, s.vx);
    if (s.kind === 'bolt') {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(ang);
      glow(0, 0, s.r * 3, pal[1], s.crit ? 0.7 : 0.4);
      ctx.fillStyle = pal[1]; ctx.globalAlpha = 0.28; ctx.fillRect(-26, -1.6, 22, 3.2); ctx.globalAlpha = 1;
      ctx.fillStyle = pal[2]; ctx.fillRect(-9, -2.2, 12, 4.4);
      ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.moveTo(3, -3.2); ctx.lineTo(11, 0); ctx.lineTo(3, 3.2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = pal[1]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-13, -3); ctx.moveTo(-9, 0); ctx.lineTo(-13, 3); ctx.stroke();
      if (s.crit) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.stroke(); }
      ctx.restore();
    } else if (s.kind === 'lead') {
      glow(s.x, s.y, s.r * 2.2, '#9ca3af', 0.25);
      ball(s.x, s.y, s.r, pal[0], pal[1], pal[2], '#0b0f17', 1.8);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(s.x - s.r * 0.35, s.y - s.r * 0.4, s.r * 0.28, s.r * 0.16, -0.6, 0, 7); ctx.fill();
      if (s.crit) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 2, 0, 7); ctx.stroke(); }
    } else if (s.kind === 'wave') {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(ang);
      ctx.globalAlpha = 0.75;
      const g = ctx.createLinearGradient(-6, 0, 12, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, pal[1]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-4, -s.r); ctx.quadraticCurveTo(14, -s.r * 0.6, 14, 0); ctx.quadraticCurveTo(14, s.r * 0.6, -4, s.r); ctx.quadraticCurveTo(4, 0, -4, -s.r); ctx.fill();
      ctx.restore();
    } else {
      glow(s.x, s.y, s.r * 3, pal[1], s.crit ? 0.8 : 0.5);
      ctx.fillStyle = pal[1] + '33'; ctx.beginPath(); ctx.arc(s.x - s.vx * 0.02, s.y - s.vy * 0.02, s.r * 0.9, 0, 7); ctx.fill();
      ball(s.x, s.y, s.r, pal[0], pal[1], pal[2], null);
      if (s.crit) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 2, 0, 7); ctx.stroke(); }
    }
  }
}
const BULLET_PAL = {
  red: ['#fecaca', '#dc2626', '#450a0a', 'rgba(220,38,38,0.6)'],
  bone: ['#fffbeb', '#d6d3d1', '#44403c', 'rgba(214,211,209,0.45)'],
  purple: ['#f5d0fe', '#a855f7', '#3b0764', 'rgba(168,85,247,0.6)'],
  green: ['#ecfccb', '#84cc16', '#365314', 'rgba(132,204,22,0.55)'],
  fire: ['#fef9c3', '#fb923c', '#7c2d12', 'rgba(251,146,60,0.6)'],
  ice: ['#f0f9ff', '#38bdf8', '#075985', 'rgba(56,189,248,0.6)'],
  water: ['#ecfeff', '#22d3ee', '#155e75', 'rgba(34,211,238,0.55)'],
  shadow: ['#ddd6fe', '#6d28d9', '#1e1b4b', 'rgba(109,40,217,0.65)'],
  earth: ['#fde68a', '#a16207', '#451a03', 'rgba(161,98,7,0.55)']
};
function drawBullets() {
  for (const b of eBullets) {
    const pal = BULLET_PAL[b.col] || BULLET_PAL.red;
    glow(b.x, b.y, b.r * 2.6, pal[3], 0.9);
    ball(b.x, b.y, b.r, pal[0], pal[1], pal[2], 'rgba(0,0,0,0.5)', 1.2);
  }
}

// ---------- ЭФФЕКТЫ ----------
function drawFx() {
  for (const f of fxs) {
    const k = 1 - f.life / f.max;
    if (f.type === 'ring') {
      ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 4 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(f.x, f.y, lerp(f.r0, f.r1, k), 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (f.type === 'boom') {
      const r = lerp(f.r0, f.r1, Math.min(1, k * 1.6));
      const g = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, r);
      g.addColorStop(0, `rgba(255,251,200,${0.9 * (1 - k)})`); g.addColorStop(0.45, `rgba(251,146,60,${0.75 * (1 - k)})`); g.addColorStop(1, 'rgba(127,29,29,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 7); ctx.fill();
    } else if (f.type === 'necro') {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang);
      const reach = f.reach * (0.45 + Math.min(1, k * 1.8) * 0.55), a = 1 - k;
      const g = ctx.createRadialGradient(0, 0, 6, 0, 0, reach);
      g.addColorStop(0, `rgba(167,139,250,${0.05 * a})`); g.addColorStop(0.7, `rgba(124,58,237,${0.45 * a})`); g.addColorStop(1, `rgba(190,242,100,${0.55 * a})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, reach, -f.arc / 2, f.arc / 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(221,214,254,${0.7 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, reach, -f.arc / 2, f.arc / 2); ctx.stroke();
      ctx.restore();
    } else if (f.type === 'line') {
      ctx.strokeStyle = f.color; ctx.lineWidth = 3; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1);
      for (let i = 1; i < 5; i++) { const q = i / 5; ctx.lineTo(lerp(f.x1, f.x2, q) + rnd(-7, 7), lerp(f.y1, f.y2, q) + rnd(-7, 7)); }
      ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
}
function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    const a = Math.max(0, Math.min(1, p.life / (p.maxLife || 0.4)));
    ctx.globalAlpha = a * 0.9; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + a * 0.5), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
function drawPops() {
  for (const p of pops) {
    ctx.globalAlpha = Math.min(1, p.life / p.max * 1.6);
    outlinedText(p.txt, p.x, p.y, p.color, p.big ? 17 : 11, 'center', FONT_SERIF);
  }
  ctx.globalAlpha = 1;
}
// пылинки, плывущие в воздухе (оживляют тьму)
const motes = [];
function drawMotes() {
  if (!motes.length) for (let i = 0; i < 40; i++) motes.push({ x: rnd(PLAY.x, PLAY.x + PLAY.w), y: rnd(PLAY.y, PLAY.y + PLAY.h), v: rnd(4, 14), p: rnd(0, 6), r: rnd(0.8, 1.8) });
  ctx.save();
  for (const m of motes) {
    m.y -= m.v / 60; m.x += Math.sin(time * 0.6 + m.p) * 0.2;
    if (m.y < PLAY.y) { m.y = PLAY.y + PLAY.h; m.x = rnd(PLAY.x, PLAY.x + PLAY.w); }
    const d = Math.hypot(m.x - player.x, m.y - player.y), a = clamp(1 - d / (lightRadius() * 1.1), 0, 1) * 0.5;
    if (a < 0.02) continue;
    ctx.fillStyle = `rgba(253,230,138,${a})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ---------- ОСВЕЩЕНИЕ ----------
let lightSprite = null, lightMask = null, lightMaskCtx = null, warmSprite = null;
function ensureLightSprites() {
  if (lightSprite) return;
  const mk = (stops) => {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return cv;
  };
  lightSprite = mk([[0, 'rgba(0,0,0,1)'], [0.45, 'rgba(0,0,0,0.85)'], [0.8, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]);
  warmSprite = mk([[0, 'rgba(255,210,120,0.34)'], [0.5, 'rgba(255,160,70,0.14)'], [1, 'rgba(255,120,40,0)']]);
  lightMask = document.createElement('canvas'); lightMask.width = W >> 1; lightMask.height = H >> 1;
  lightMaskCtx = lightMask.getContext('2d');
}
function collectLights(rm) {
  const p = player, L = [];
  if (p.decoy) L.push({ x: p.decoy.x, y: p.decoy.y, r: 90, a: 0.8 });
  for (const h of hazards) if (h.shape === 'circle') L.push({ x: h.x, y: h.y, r: h.r * 1.5, a: h.t < h.warn ? 0.5 : 0.8, warm: h.col === 'fire' });
  L.push({ x: p.x, y: p.y, r: lightRadius() * (1 + Math.sin(time * 7) * 0.012 + Math.sin(time * 13) * 0.008), a: 1, warm: true });
  for (const l of roomLights(rm)) L.push({ x: l.x, y: l.y - 8, r: 130 + Math.sin(time * 9 + l.x) * 6, a: 0.95, warm: true });
  if (rm.shrine && !rm.shrine.used) L.push({ x: rm.shrine.x, y: rm.shrine.y, r: 220, a: 1, warm: true });
  if (rm.stair) L.push({ x: rm.stair.x, y: rm.stair.y, r: 110, a: 0.9, warm: true });
  if (rm.portal) L.push({ x: rm.portal.x, y: rm.portal.y, r: 100, a: 0.85 });
  for (const ped of rm.peds) if (!ped.taken) L.push({ x: ped.x, y: ped.y - 14, r: 78, a: 0.8 });
  for (const z of zones) L.push({ x: z.x, y: z.y, r: z.r * (z.kind === 'sanctum' ? 1.5 : 1.7), a: 0.9, warm: z.kind === 'fire' });
  for (const s of shots) L.push({ x: s.x, y: s.y, r: s.col === 'fire' ? 78 : 52, a: 0.6 });
  for (const b of eBullets) L.push({ x: b.x, y: b.y, r: 42, a: 0.55 });
  for (const f of fxs) if (f.type === 'boom') L.push({ x: f.x, y: f.y, r: f.r1 * 1.6, a: 0.8 * (f.life / f.max), warm: true });
  for (const pk of rm.pickups) if (pk.type === 'wisp' || pk.type === 'oil' || pk.type === 'note' || pk.type === 'shard') L.push({ x: pk.x, y: pk.y, r: 52, a: 0.7 });
  for (const e of rm.enemies) { if (e.hidden) continue; L.push({ x: e.x, y: e.y, r: e.isBoss ? 100 : e.r * 2.6 + (e.fx.burn > 0 ? 24 : 0), a: e.isBoss ? 0.55 : (e.def && e.def.shade ? 0.12 : 0.34) }); }
  for (const f of p.fams) L.push({ x: f.x, y: f.y, r: 60, a: 0.6 });
  return L;
}
function renderLighting(rm) {
  ensureLightSprites();
  const F = floorDef(floorNum);
  const trialDark = rm.trial && rm.trial.kind === 'dark' && !rm.cleared ? 0.12 : 0;
  const dark = clamp((F.dark + runMod('dark', 0) + trialDark) * (cfg().bright < 1 ? 1.08 : cfg().bright > 1 ? 0.8 : 1) , 0.4, 0.97);
  const m = lightMaskCtx;
  m.setTransform(0.5, 0, 0, 0.5, 0, 0);
  m.globalCompositeOperation = 'source-over';
  m.clearRect(0, 0, W, H);
  m.fillStyle = `rgba(4,3,10,${dark})`;
  m.fillRect(0, 0, W, H);
  m.globalCompositeOperation = 'destination-out';
  const L = collectLights(rm);
  for (const l of L) {
    m.globalAlpha = l.a;
    m.drawImage(lightSprite, l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  m.globalAlpha = 1;
  ctx.drawImage(lightMask, 0, 0, W, H);
  // тёплый отсвет
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of L) if (l.warm) { ctx.globalAlpha = l.a * 0.8; ctx.drawImage(warmSprite, l.x - l.r * 0.9, l.y - l.r * 0.9, l.r * 1.8, l.r * 1.8); }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------- ГЕРОЙ ----------
// Тело героя: плащ, голова и отличительные детали. Используется и в игре, и в лагере (портреты).
function drawAxeOnBack(px, py) {
  ctx.save(); ctx.translate(px, py - 2); ctx.rotate(-0.85);
  ctx.strokeStyle = '#3f2a1a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, 17); ctx.lineTo(3, -24); ctx.stroke();
  glow(8, -26, 22, '#ef4444', 0.55 + Math.sin(time * 4) * 0.1);
  const g = ctx.createLinearGradient(-6, -34, 18, -16); g.addColorStop(0, '#fecaca'); g.addColorStop(0.5, '#e11d48'); g.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = g; ctx.strokeStyle = '#2a0509'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(2, -34); ctx.quadraticCurveTo(24, -36, 22, -14); ctx.quadraticCurveTo(12, -22, 3, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawHeroHead(id, hx, hy, ax, ay, h) {
  if (id === 'knight') {
    ball(hx, hy, 9.5, '#e2e8f0', '#94a3b8', '#334155', '#0b0f17', 1.8);
    ctx.fillStyle = '#0b0f17'; ctx.fillRect(hx - 6 + ax * 2, hy - 2 + ay * 1.5, 12, 3);
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx, hy - 9); ctx.quadraticCurveTo(hx - 8 - ax * 5, hy - 14, hx - 14 - ax * 8, hy - 8); ctx.stroke();
  } else if (id === 'priestess') {
    ball(hx, hy, 9, '#faf5e6', '#e5e1d3', '#8a8470', '#2a2618', 1.6);
    ctx.fillStyle = h.skin; ctx.beginPath(); ctx.ellipse(hx + ax * 1.5, hy + 1 + ay, 5.2, 5.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1e1b25'; ctx.beginPath(); ctx.arc(hx - 2 + ax * 2, hy + ay * 1.5, 1.1, 0, 7); ctx.arc(hx + 3 + ax * 2, hy + ay * 1.5, 1.1, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy - 4, 11, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else if (id === 'alchemist') {
    ball(hx, hy, 9.4, '#d9c9a0', '#a8946a', '#4a3d28', '#1a1308', 1.8);
    ctx.fillStyle = '#3a3226'; // всклокоченные волосы
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(hx + i * 3.5 - 2, hy - 7); ctx.lineTo(hx + i * 3.5 + (i % 2 ? 2 : -2), hy - 14 - (i % 2) * 2); ctx.lineTo(hx + i * 3.5 + 3, hy - 7); ctx.fill(); }
    ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(hx + ax, hy - 1, 9.8, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    for (const sg of [-1, 1]) {
      const lx = hx + sg * 4.4 + ax * 2.2, ly = hy - 1 + ay * 1.6;
      glow(lx, ly, 10, '#4ade80', 0.65);
      ctx.fillStyle = '#052e16'; ctx.strokeStyle = '#78716c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(lx, ly, 3.7, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.arc(lx, ly, 2.2, 0, 7); ctx.fill();
    }
  } else if (id === 'executioner') {
    ball(hx, hy, 10.6, '#2a1d22', '#120b0e', '#040203', '#000', 2);
    ctx.fillStyle = '#120b0e'; ctx.beginPath(); ctx.moveTo(hx - 8, hy - 6); ctx.lineTo(hx, hy - 17); ctx.lineTo(hx + 8, hy - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#05020a'; ctx.beginPath(); ctx.ellipse(hx + ax * 1.5, hy + 1 + ay, 7, 6.2, 0, 0, 7); ctx.fill();
    glowEyes(hx + ax * 2, hy + ay * 1.5, 3.6, 1.8, '#ef4444');
  } else if (id === 'trapper') {
    ball(hx, hy, 9.3, '#4a4036', '#2e2720', '#0e0c0a', '#050403', 1.8);
    ctx.fillStyle = h.skin; ctx.beginPath(); ctx.ellipse(hx + ax * 2.2, hy + 1 + ay * 1.4, 5, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1b1a1a'; ctx.beginPath(); ctx.arc(hx - 2 + ax * 2.6, hy + ay * 1.8, 1.1, 0, 7); ctx.arc(hx + 3 + ax * 2.6, hy + ay * 1.8, 1.1, 0, 7); ctx.fill();
    const fc = ['#d6c9a3', '#a8946a', '#e7e1c8'];
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(hx - 5 + i * 5, hy - 8); ctx.rotate(-0.5 + i * 0.5); ctx.fillStyle = fc[i]; ctx.strokeStyle = '#1a1308'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -5, 2.2, 6.2, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#7c2d12'; ctx.fillRect(hx - 6, hy + 7, 12, 3);
  } else if (id === 'necromancer') {
    ball(hx, hy, 10, '#2d2145', '#150f24', '#06030d', '#000', 2);
    ctx.fillStyle = '#c3cbd0'; ctx.beginPath(); ctx.ellipse(hx + ax * 1.8, hy + 1.5 + ay, 5, 5.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#05020a'; ctx.beginPath(); ctx.ellipse(hx - 2 + ax * 2, hy + ay * 1.5, 1.4, 1.9, 0, 0, 7); ctx.ellipse(hx + 3 + ax * 2, hy + ay * 1.5, 1.4, 1.9, 0, 0, 7); ctx.fill();
    glowEyes(hx + ax * 2.4, hy + ay * 1.6, 2.6, 1.1, '#a78bfa');
    ctx.strokeStyle = '#e7e5e4'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx, hy - 8, 6.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else if (id === 'fallen') {
    ball(hx, hy, 10, '#fde68a', '#b8860b', '#5c3d00', '#2a1a00', 1.8);
    ctx.fillStyle = '#3a2800'; ctx.beginPath(); ctx.ellipse(hx + ax * 1.5, hy + 1 + ay, 6.8, 5.8, 0, 0, 7); ctx.fill();
    for (const sg of [-1, 1]) {
      const lx = hx + sg * 3.8 + ax * 2, ly = hy + ay * 1.5;
      glow(lx, ly, 10, '#facc15', 0.7);
      ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(lx, ly, 3.3, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fffbeb'; ctx.beginPath(); ctx.arc(lx - 0.8, ly - 0.8, 1, 0, 7); ctx.fill();
    }
  } else if (id === 'reaper') {
    ball(hx, hy, 10.6, '#22202e', '#0d0c14', '#020204', '#000', 2);
    ctx.fillStyle = '#0d0c14'; ctx.beginPath(); ctx.moveTo(hx - 8, hy - 6); ctx.lineTo(hx, hy - 16); ctx.lineTo(hx + 8, hy - 6); ctx.closePath(); ctx.fill();
    skull(hx + ax * 1.2, hy + 1.5 + ay, 6.8);
    glowEyes(hx + ax * 1.8, hy + 0.8 + ay, 2.4, 1.2, '#ef4444');
  } else { // егерь
    ball(hx, hy, 9.5, h.cloak, '#27301f', '#0b0f08', '#050705', 1.8);
    ctx.fillStyle = h.skin; ctx.beginPath(); ctx.ellipse(hx + ax * 2.2, hy + 1 + ay * 1.4, 5, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1b1a1a'; ctx.beginPath(); ctx.arc(hx - 2 + ax * 2.6, hy + ay * 1.8, 1.1, 0, 7); ctx.arc(hx + 3 + ax * 2.6, hy + ay * 1.8, 1.1, 0, 7); ctx.fill();
  }
}
function drawHeroFigure(id, px, py2, ax, ay, hurt) {
  const h = HEROES[id];
  const wide = id === 'executioner' ? 1.16 : 1;
  if (id === 'executioner') drawAxeOnBack(px, py2);
  // плащ
  ctx.save(); ctx.translate(px, py2); ctx.scale(wide, 1);
  const cg = ctx.createRadialGradient(-4, -4, 3, 0, 4, 20);
  cg.addColorStop(0, hurt ? '#fecaca' : h.cloak); cg.addColorStop(1, hurt ? '#7f1d1d' : '#0e0d12');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.moveTo(-13, 12); ctx.quadraticCurveTo(-17, -2, -8, -11); ctx.lineTo(8, -11); ctx.quadraticCurveTo(17, -2, 13, 12);
  if (id === 'reaper' || id === 'necromancer') { for (let i = 6; i >= -6; i--) ctx.lineTo(i * 2, 15 + (i % 2 ? 5 : 0)); } else ctx.quadraticCurveTo(0, 17, -13, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  const pa = ctx.globalAlpha;
  ctx.strokeStyle = h.trim; ctx.globalAlpha = pa * 0.6; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-12, 11); ctx.quadraticCurveTo(0, 16, 12, 11); ctx.stroke(); ctx.globalAlpha = pa;
  ctx.restore();
  // детали тела
  if (id === 'alchemist') {
    ctx.fillStyle = '#6b4a2b'; ctx.strokeStyle = '#1c1005'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px - 7, py2 - 5); ctx.lineTo(px + 7, py2 - 5); ctx.lineTo(px + 10, py2 + 12); ctx.lineTo(px - 10, py2 + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    const fc = ['#84cc16', '#ec4899', '#facc15'];
    for (let i = 0; i < 3; i++) { ctx.fillStyle = fc[i]; ctx.strokeStyle = '#0c0a09'; ctx.beginPath(); ctx.arc(px - 6 + i * 6, py2 + 8, 2.6, 0, 7); ctx.fill(); ctx.stroke(); }
  } else if (id === 'executioner') {
    ctx.fillStyle = '#2a2130'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.8;
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(px + sg * 15, py2 - 7, 7, 5, sg * 0.4, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px + sg * 15, py2 - 7, 5, 3, sg * 0.4, 0, 7); ctx.stroke(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.8; }
  } else if (id === 'trapper') {
    for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(px + sg * (7 + i * 3.4), py2 - 8 + i * 2.2); ctx.rotate(sg * (0.9 + i * 0.25)); ctx.fillStyle = i % 2 ? '#a8946a' : '#d6c9a3'; ctx.strokeStyle = '#1a1308'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(0, 0, 2, 5.4, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  } else if (id === 'fallen') {
    const gg = ctx.createLinearGradient(px - 14, py2 - 10, px + 14, py2 + 6); gg.addColorStop(0, '#fde68a'); gg.addColorStop(0.5, '#ca8a04'); gg.addColorStop(1, '#713f12');
    ctx.fillStyle = gg; ctx.strokeStyle = '#2a1a00'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(px - 13, py2 - 4); ctx.quadraticCurveTo(px, py2 - 14, px + 13, py2 - 4); ctx.lineTo(px + 9, py2 + 3); ctx.quadraticCurveTo(px, py2 - 3, px - 9, py2 + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'necromancer') {
    for (let i = 0; i < 3; i++) { const a = time * 1.6 + i * 2.1; const bx = px + Math.cos(a) * 21, by = py2 + 2 + Math.sin(a) * 9; ctx.fillStyle = '#e7e5e4'; ctx.strokeStyle = '#1e1b4b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 3, by + 2); ctx.lineTo(bx, by - 4); ctx.lineTo(bx + 3, by + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  drawHeroHead(id, px + ax * 2.5, py2 - (id === 'alchemist' ? 6 : 9) + ay * 2, ax, ay, h);
}

function drawPlayer() {
  const p = player, h = HEROES[p.hero];
  if (p.iframes > 0 && !p.ghostFx && p.dashing <= 0 && Math.floor(time * 20) % 2 === 0 && !p.dead && p.hurtT > 0) return;
  const px = p.x, py = p.y;
  const a = p.aimAng, ax = Math.cos(a), ay = Math.sin(a);
  ctx.save();
  if (p.ghostFx > 0) ctx.globalAlpha = 0.5 + Math.sin(time * 12) * 0.15;
  if (p.dashing > 0) ctx.globalAlpha = 0.65;
  if (p.dead) ctx.globalAlpha = Math.max(0, 1 - p.deathT / 1.7);
  shadowEllipse(px, py + (p.fly ? 24 : 12), 14, 5, 0.5);
  const bob = p.moving ? Math.sin(p.animWalk) * 1.6 : Math.sin(time * 2) * 0.6;
  const py2 = py + (p.fly ? -5 + Math.sin(time * 5) * 2 : 0) + bob * 0.5;
  if (p.reap && p.dashing > 0) { ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px - Math.cos(p.dashDir) * 70, py2 - Math.sin(p.dashDir) * 70); ctx.lineTo(px, py2); ctx.stroke(); ctx.lineCap = 'butt'; }
  drawHeroFigure(p.hero, px, py2, ax, ay, p.hurtT > 0);
  // оружие
  drawHeroWeapon(p, px, py2);
  // фонарь у пояса (у Падшего Алхимика — парящий философский камень)
  const lx = px - ax * 10 + Math.cos(a + Math.PI / 2) * 9, ly = py2 + 6 - ay * 6 + Math.sin(a + Math.PI / 2) * 6 + Math.sin(time * 6) * 1.2;
  if (p.hero === 'fallen') {
    const sx = px + Math.cos(time * 1.4) * 22, sy = py2 - 20 + Math.sin(time * 2.2) * 4;
    glow(sx, sy, 20, '#f59e0b', 0.8);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(time * 0.8);
    ctx.fillStyle = '#b91c1c'; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, 0); ctx.lineTo(0, 7); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fecaca'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(2.5, 0); ctx.lineTo(0, 2); ctx.lineTo(-2.5, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else {
    ctx.strokeStyle = '#3f3a30'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py2 + 1); ctx.lineTo(lx, ly - 5); ctx.stroke();
    ctx.fillStyle = '#6b5a2e'; ctx.fillRect(lx - 4, ly - 5, 8, 2);
    ctx.fillStyle = '#2a2316'; ctx.fillRect(lx - 4, ly + 5, 8, 2);
    const fl = 0.8 + Math.sin(time * 11) * 0.12;
    const fg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 6);
    fg.addColorStop(0, '#fffbe0'); fg.addColorStop(0.5, `rgba(251,191,36,${0.9 * fl})`); fg.addColorStop(1, 'rgba(234,88,12,0.2)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(lx, ly, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6b5a2e'; ctx.lineWidth = 1.5; ctx.strokeRect(lx - 4, ly - 4, 8, 8);
  }
  // крылья парения (у Жнеца — клубы тьмы)
  if (p.fly) {
    if (p.hero === 'reaper') {
      ctx.fillStyle = 'rgba(30,27,45,0.65)';
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px + sg * 6, py2 - 4); ctx.quadraticCurveTo(px + sg * 26, py2 - 16 + Math.sin(time * 6 + sg) * 3, px + sg * 30, py2 + 6); ctx.quadraticCurveTo(px + sg * 18, py2 + 2, px + sg * 6, py2 + 6); ctx.fill(); }
    } else { ctx.fillStyle = 'rgba(226,232,240,0.5)'; ctx.beginPath(); ctx.ellipse(px - 18, py2 - 2 + Math.sin(time * 16) * 2, 9, 4, -0.5, 0, 7); ctx.ellipse(px + 18, py2 - 2 + Math.cos(time * 16) * 2, 9, 4, 0.5, 0, 7); ctx.fill(); }
  }
  ctx.restore();

  if (p.shield) {
    ctx.strokeStyle = `rgba(253,230,138,${0.55 + Math.sin(time * 8) * 0.2})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py2, p.r + 8, 0, 7); ctx.stroke();
  }
  if (p.ward > 0) { ctx.strokeStyle = `rgba(147,197,253,${0.18 + Math.min(0.3, p.ward / 150)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py2, p.r + 5, 0, 7); ctx.stroke(); }
  if (p.guard.on) {
    ctx.save(); ctx.translate(px + ax * 18, py2 + ay * 18); ctx.rotate(a);
    const open = p.guard.t < 0.3;
    ctx.fillStyle = open ? '#f1f5f9' : '#94a3b8'; ctx.strokeStyle = open ? '#fde68a' : '#334155'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-4, -17); ctx.quadraticCurveTo(12, -15, 12, 0); ctx.quadraticCurveTo(12, 15, -4, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7f1d1d'; ctx.fillRect(-1, -2, 8, 4);
    if (open) glow(4, 0, 30, '#fde68a', 0.6);
    ctx.restore();
  }
  if (p.harvest) { // вихрь жатвы
    ctx.save(); ctx.translate(px, py2); ctx.rotate(p.harvest.ang);
    ctx.strokeStyle = 'rgba(167,139,250,0.65)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(0, 0, 50 + i * 12, i * Math.PI, i * Math.PI + 1.7); ctx.stroke(); }
    ctx.restore();
  }
  if (p.exec) { // метка казни
    const x = p.exec, k = Math.min(1, x.t / 0.5);
    ctx.save(); ctx.strokeStyle = `rgba(239,68,68,${0.4 + k * 0.5})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x.tx, x.ty, 60 - k * 36, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x.tx - 22, x.ty); ctx.lineTo(x.tx + 22, x.ty); ctx.moveTo(x.tx, x.ty - 22); ctx.lineTo(x.tx, x.ty + 22); ctx.stroke();
    ctx.restore();
  }
  if (p.fl.aura) { ctx.strokeStyle = `rgba(251,146,60,${0.15 + Math.sin(time * 6) * 0.05})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py2, 90, 0, 7); ctx.stroke(); }
}

// Размах ближнего оружия: след и положение клинка
function swingAngle(p, ctxk) {
  const sw = p.swing;
  if (!sw) return { ang: p.aimAng + (ctxk === 'scythe' ? 0.9 : 0.5), k: -1 };
  const k = clamp(sw.t / sw.dur, 0, 1);
  const off = (k - 0.5) * sw.arc * sw.dirSign * -1;
  return { ang: sw.ang + off, k };
}
function drawSwingTrail(p, px, py, col, w) {
  const sw = p.swing;
  if (!sw) return;
  const { ang, k } = swingAngle(p);
  ctx.save(); ctx.translate(px, py);
  ctx.strokeStyle = col.replace('A', String(0.55 * (1 - k * 0.6))); ctx.lineWidth = sw.heavy ? w + 2 : w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, sw.reach * 0.88, sw.ang - sw.arc / 2 * sw.dirSign * -1, ang, sw.dirSign > 0 ? false : true); ctx.stroke();
  ctx.restore();
}
function drawHeroWeapon(p, px, py) {
  const a = p.aimAng;
  ctx.save();
  if (p.hero === 'hunter') {
    ctx.translate(px, py + 2); ctx.rotate(a);
    const recoil = Math.max(0, p.atkTimer) > 0 ? Math.min(3, p.atkTimer * 6) : 0;
    ctx.translate(-recoil, 0);
    ctx.fillStyle = '#4a3320'; ctx.strokeStyle = '#150d06'; ctx.lineWidth = 1.5;
    ctx.fillRect(4, -2.5, 20, 5); ctx.strokeRect(4, -2.5, 20, 5);
    ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(18, -11); ctx.quadraticCurveTo(24, 0, 18, 11); ctx.stroke();
    ctx.strokeStyle = '#e7e5e4'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(18, -11); ctx.lineTo(p.atkTimer > 0 ? 12 : 20, 0); ctx.lineTo(18, 11); ctx.stroke();
  } else if (p.hero === 'knight') {
    drawSwingTrail(p, px, py, 'rgba(241,245,249,A)', 4);
    const { ang } = swingAngle(p);
    ctx.translate(px, py + 2); ctx.rotate(ang);
    ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.fillRect(10, -2, 26, 4); ctx.strokeRect(10, -2, 26, 4);
    ctx.beginPath(); ctx.moveTo(36, -2); ctx.lineTo(44, 0); ctx.lineTo(36, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a16207'; ctx.fillRect(7, -5, 4, 10); ctx.fillStyle = '#44403c'; ctx.fillRect(1, -1.5, 6, 3);
  } else if (p.hero === 'executioner') {
    drawSwingTrail(p, px, py, 'rgba(239,68,68,A)', 7);
    const { ang } = swingAngle(p);
    ctx.translate(px, py + 2); ctx.rotate(ang);
    ctx.strokeStyle = '#3f2a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(46, 0); ctx.stroke();
    glow(48, -2, 26, '#ef4444', 0.55);
    const g = ctx.createLinearGradient(36, -26, 62, 4); g.addColorStop(0, '#fecaca'); g.addColorStop(0.5, '#e11d48'); g.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = g; ctx.strokeStyle = '#2a0509'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(40, -3); ctx.lineTo(44, -26); ctx.quadraticCurveTo(68, -22, 66, 4); ctx.quadraticCurveTo(54, -4, 42, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (p.hero === 'trapper') {
    drawSwingTrail(p, px, py, 'rgba(226,232,240,A)', 3);
    const { ang } = swingAngle(p);
    ctx.translate(px, py + 2); ctx.rotate(ang);
    ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(8, -2); ctx.lineTo(28, -1); ctx.lineTo(34, 0); ctx.lineTo(28, 1.6); ctx.lineTo(8, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3a1e'; ctx.fillRect(2, -2, 7, 4); ctx.fillStyle = '#a16207'; ctx.fillRect(8, -4, 2.4, 8);
  } else if (p.hero === 'reaper') {
    drawSwingTrail(p, px, py, 'rgba(167,139,250,A)', 6);
    const { ang } = swingAngle(p, 'scythe');
    ctx.translate(px, py + 2); ctx.rotate(ang);
    ctx.strokeStyle = '#3f3a4a'; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(52, 0); ctx.stroke();
    glow(60, -18, 24, '#a78bfa', 0.5);
    ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(48, -2); ctx.quadraticCurveTo(80, -8, 76, -44); ctx.quadraticCurveTo(58, -22, 44, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (p.hero === 'alchemist') {
    ctx.translate(px, py + 2); ctx.rotate(a);
    const rec = p.atkTimer > 0 ? Math.min(4, p.atkTimer * 4) : 0;
    ctx.translate(-rec, 0);
    ctx.strokeStyle = '#d4c4a0'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(14, 0); ctx.stroke();
    glow(24, 0, 18, '#84cc16', 0.5 + Math.sin(time * 9) * 0.15);
    ctx.fillStyle = 'rgba(200,230,200,0.5)'; ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(22, -3); ctx.lineTo(22, -8); ctx.lineTo(26, -8); ctx.lineTo(26, -3); ctx.quadraticCurveTo(32, 1, 29, 6); ctx.quadraticCurveTo(24, 10, 19, 6); ctx.quadraticCurveTo(16, 1, 22, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#84cc16'; ctx.beginPath(); ctx.moveTo(18, 3); ctx.quadraticCurveTo(24, 8, 30, 3); ctx.quadraticCurveTo(31, 6, 28, 7); ctx.quadraticCurveTo(24, 9, 19, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a16207'; ctx.fillRect(21.5, -10, 5, 3);
  } else if (p.hero === 'fallen') {
    ctx.translate(px, py + 2); ctx.rotate(a);
    const rec = p.atkTimer > 0 ? Math.min(5, p.atkTimer * 5) : 0;
    ctx.translate(-rec, 0);
    ctx.strokeStyle = '#a16207'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(12, 0); ctx.stroke();
    ball(20, 0, 8, '#e5e7eb', '#6b7280', '#1f2937', '#0b0f17', 1.8);
  } else if (p.hero === 'necromancer') {
    ctx.translate(px, py + 2); ctx.rotate(a);
    ctx.strokeStyle = '#d4c9a8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(32, 0); ctx.stroke();
    skull(36, 0, 6.5);
    const f = 1 + Math.sin(time * 10) * 0.2 + (p.atkTimer > 0 ? 0.45 : 0);
    glow(36, 0, 20 * f, '#a78bfa', 0.55);
    glowEyes(37, -0.5, 2.2, 1, '#c4b5fd');
  } else { // Свечница
    ctx.translate(px, py + 2); ctx.rotate(a);
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(28, 0); ctx.stroke();
    ctx.fillStyle = '#e7e5e4'; ctx.fillRect(25, -4, 6, 8);
    const f = 1 + Math.sin(time * 12) * 0.15 + (p.atkTimer > 0 ? 0.3 : 0);
    const g = ctx.createRadialGradient(34, 0, 0, 34, 0, 7 * f); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, '#fde68a'); g.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(34, 0, 7 * f, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// Призрачный двойник Некроманта
function drawDecoy() {
  const d = player && player.decoy;
  if (!d) return;
  const k = d.t / d.max;
  ctx.save();
  ctx.globalAlpha = 0.5 + Math.sin(time * 9) * 0.1;
  glow(d.x, d.y, 38, '#a78bfa', 0.6);
  shadowEllipse(d.x, d.y + 12, 13, 4, 0.3);
  drawHeroFigure('necromancer', d.x, d.y, Math.cos(d.ang), Math.sin(d.ang), false);
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(d.x, d.y, 25, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Шляпник-наперсточник в секретной комнате
function drawHatter(rm, big) {
  const h = rm.hatter;
  if (!h || h.done) return;
  const x = h.x, y = h.y + Math.sin(time * 2) * 1.2;
  shadowEllipse(x, y + 30, 20, 6, 0.5);
  glow(x, y, 54, '#7c3aed', 0.15);
  // пальто
  const g = ctx.createLinearGradient(x - 16, y, x + 16, y + 30); g.addColorStop(0, '#2a2438'); g.addColorStop(1, '#0c0a12');
  ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 15, y + 30); ctx.quadraticCurveTo(x - 20, y + 4, x - 9, y - 4); ctx.lineTo(x + 9, y - 4); ctx.quadraticCurveTo(x + 20, y + 4, x + 15, y + 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y - 3); ctx.lineTo(x + 1, y + 12); ctx.lineTo(x - 1, y + 12); ctx.closePath(); ctx.fill();
  // лицо: бледное, с натянутой улыбкой
  ball(x, y - 12, 10, '#f3ead6', '#d8cdb0', '#8a7e62', '#1a1408', 1.8);
  ctx.fillStyle = '#1a1408'; ctx.beginPath(); ctx.ellipse(x - 4, y - 14, 1.6, 2.6, 0, 0, 7); ctx.ellipse(x + 4, y - 14, 1.6, 2.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4.4, y - 15, 0.7, 0, 7); ctx.arc(x + 3.6, y - 15, 0.7, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3b0a0a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 8, y - 9); ctx.quadraticCurveTo(x, y - 2, x + 8, y - 9); ctx.stroke();
  ctx.fillStyle = '#fff';
  for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * 2.1 - 0.7, y - 7.2 + Math.abs(i) * 0.3 - (3 - Math.abs(i)) * -0.1, 1.4, 2);
  ctx.beginPath(); ctx.moveTo(x - 8, y - 9); ctx.lineTo(x - 10, y - 11); ctx.moveTo(x + 8, y - 9); ctx.lineTo(x + 10, y - 11); ctx.stroke();
  // цилиндр
  ctx.fillStyle = '#16121f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.fillRect(x - 8, y - 38, 16, 21); ctx.strokeRect(x - 8, y - 38, 16, 21);
  ctx.beginPath(); ctx.ellipse(x, y - 21, 15, 4, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7c3aed'; ctx.fillRect(x - 8, y - 27, 16, 4);
  // нож в руке
  ctx.save(); ctx.translate(x + 15, y + 8); ctx.rotate(-0.5 + Math.sin(time * 3) * 0.1);
  ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(16, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5b3a1e'; ctx.fillRect(-6, -2, 6, 4);
  ctx.restore();
  if (!big && player && Math.hypot(player.x - x, player.y - y) < 140) outlinedText('Сыграем?', x, y - 52, '#c4b5fd', 12, 'center', FONT_SERIF);
}

function drawFamiliars() {
  for (const f of player.fams) {
    shadowEllipse(f.x, f.y + 10, 8, 3, 0.35);
    ctx.save(); ctx.translate(f.x, f.y);
    if (f.type === 'wisp') {
      glow(0, 0, 22, '#5eead4', 0.7);
      ball(0, 0, 6 + Math.sin(time * 8) * 0.8, '#ffffff', '#99f6e4', '#0f766e', null);
      for (let i = 0; i < 3; i++) { const a = time * 3 + i * 2.1; ctx.fillStyle = 'rgba(94,234,212,0.5)'; ctx.beginPath(); ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 1.8, 0, 7); ctx.fill(); }
    } else if (f.type === 'crow') {
      const dive = f.mode === 'dive', sz = dive ? 1.15 : 0.9;
      ctx.rotate(dive || f.mode === 'return' ? (f.face || 0) : 0);
      glow(0, 0, 16, '#fb923c', 0.35);
      ctx.fillStyle = '#18181b'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4;
      const w = dive ? 5 : Math.sin(time * 10) * 1.5;
      ctx.beginPath(); ctx.ellipse(-3, -1 + w * 0.3, dive ? 12 : 8, 3.8 + w * 0.2, -0.5, 0, 7); ctx.ellipse(-3, 1 - w * 0.3, dive ? 12 : 8, 3.8 + w * 0.2, 0.5, 0, 7); ctx.fill();
      ctx.save(); ctx.scale(sz, sz);
      ball(0, 0, 7, '#3f3f46', '#18181b', '#000', '#000', 1.2);
      ctx.fillStyle = '#d6c9a3'; ctx.beginPath(); ctx.moveTo(5, -1.2); ctx.lineTo(11, 0.4); ctx.lineTo(5, 2); ctx.fill();
      glowEyes(2.2, -2, 0.01, 1.5, '#fb923c');
      ctx.restore();
    } else if (f.type === 'hound') {
      ctx.globalAlpha = 0.85;
      ball(0, 0, 10, '#e2e8f0', '#94a3b8', '#334155', '#0f172a', 1.5);
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-11, -15); ctx.lineTo(-3, -9); ctx.moveTo(8, -6); ctx.lineTo(11, -15); ctx.lineTo(3, -9); ctx.fill();
      ctx.fillStyle = '#5eead4'; ctx.beginPath(); ctx.arc(-3.5, -1, 1.8, 0, 7); ctx.arc(3.5, -1, 1.8, 0, 7); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(0, 4, 2.4, 0, 7); ctx.fill();
    } else if (f.type === 'cat') {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#d6d3d1';
      ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(-7, -14); ctx.lineTo(-2, -8); ctx.moveTo(9, -4); ctx.lineTo(7, -14); ctx.lineTo(2, -8); ctx.fill();
      ball(0, 0, 10, '#f5f5f4', '#d6d3d1', '#57534e', '#1c1917', 1.5);
      ctx.fillStyle = '#5eead4'; ctx.beginPath(); ctx.ellipse(-3.5, -1.5, 1.6, 2.4, 0, 0, 7); ctx.ellipse(3.5, -1.5, 1.6, 2.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1c1917'; ctx.fillRect(-1, 2, 2, 2);
    } else {
      ctx.fillStyle = '#18181b'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      const w = Math.sin(time * 18) * 4;
      ctx.beginPath(); ctx.ellipse(-8, -2 + w * 0.3, 9, 4 + w * 0.3, -0.6, 0, 7); ctx.ellipse(8, -2 + w * 0.3, 9, 4 + w * 0.3, 0.6, 0, 7); ctx.fill();
      ball(0, 0, 7, '#3f3f46', '#18181b', '#000', '#000', 1.2);
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(10, 1); ctx.lineTo(4, 3); ctx.fill();
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(1.5, -2, 1.3, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- ДЕКОР КОМНАТ ----------
function drawRoomDecor(rm) {
  if (rm.type === 'treasure') glow(CX, CY, 240, '#fbbf24', 0.1);
  else if (rm.type === 'shop') {
    ctx.fillStyle = 'rgba(70,16,24,0.6)'; ctx.fillRect(CX - 280, CY - 56, 560, 112);
    ctx.strokeStyle = 'rgba(214,162,58,0.7)'; ctx.lineWidth = 3; ctx.strokeRect(CX - 280, CY - 56, 560, 112);
    ctx.strokeStyle = 'rgba(214,162,58,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(CX - 272, CY - 48, 544, 96);
  } else if (rm.type === 'boss') { ctx.fillStyle = 'rgba(127,29,29,0.12)'; ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h); }
  else if (rm.type === 'secret') { ctx.fillStyle = 'rgba(76,29,149,0.14)'; ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h); }
  else if (rm.type === 'altar') {
    ctx.fillStyle = 'rgba(110,10,30,0.3)'; ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
    ctx.strokeStyle = 'rgba(225,29,72,0.45)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(CX, CY, 150, 0, 7); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 5; const x = CX + Math.cos(a) * 150, y = CY + Math.sin(a) * 150; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); ctx.stroke();
  } else if (rm.type === 'start' && floorNum === 1) {
    ctx.save(); ctx.globalAlpha = 0.5;
    outlinedText('WASD — идти    ЛКМ — атака    ПКМ — умение', CX, CY - 78, '#cbd5e1', 14, 'center', FONT_SERIF);
    outlinedText('ПРОБЕЛ — рывок    Q — склянка    F — зелье    E — артефакт', CX, CY - 54, '#cbd5e1', 13, 'center', FONT_SERIF);
    outlinedText('Береги масло в фонаре: тьма опасна. Стой у стены на свету — тайные ходы проявятся.', CX, CY + 70, '#94a3b8', 12, 'center', FONT_SERIF);
    ctx.restore();
  }
}

// ---------- ГЛАВНАЯ ОТРИСОВКА МИРА ----------
let vignetteCache = null;
function getVignette() {
  if (vignetteCache) return vignetteCache;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.66);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0.3)'); v.addColorStop(1, 'rgba(0,0,0,0.78)');
  g.fillStyle = v; g.fillRect(0, HUD_H, W, H - HUD_H);
  return (vignetteCache = cv);
}

function drawReticle() {
  if (!mouse.active || state !== 'play' || shootStack.length) return;
  const x = mouse.x, y = mouse.y, p = player;
  const d = Math.hypot(x - p.x, y - p.y);
  ctx.save();
  ctx.strokeStyle = 'rgba(253,230,138,0.85)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.stroke();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.beginPath(); ctx.moveTo(x + dx * 11, y + dy * 11); ctx.lineTo(x + dx * 16, y + dy * 16); ctx.stroke(); }
  ctx.fillStyle = 'rgba(253,230,138,0.9)'; ctx.fillRect(x - 1, y - 1, 2, 2);
  if (HEROES[p.hero].weapon !== 'blade' && d > 40) { ctx.strokeStyle = 'rgba(253,230,138,0.12)'; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}

function renderGame() {
  const rm = curRoom;
  ctx.save();
  if (shake > 0 && cfg().shake > 0) ctx.translate((Math.random() - 0.5) * shake * cfg().shake, (Math.random() - 0.5) * shake * cfg().shake);
  ctx.drawImage(getBg(floorDef(floorNum)), 0, 0);
  drawRoomDecor(rm);
  for (const s of rm.splatters) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  drawFloorTiles(rm);
  drawZones();
  drawDoors(rm);
  if (rm.shrine) drawShrine(rm.shrine);
  if (rm.stair) drawStair(rm.stair);
  if (rm.portal) drawPortal(rm.portal);
  drawTraps();
  drawSolidTiles(rm);
  drawPickups(rm);
  drawPeds(rm);
  drawBossMarks(rm);
  const list = rm.enemies.slice().sort((a, b) => a.y - b.y);
  for (const e of list) drawEnemy(e);
  drawHatter(rm);
  drawDecoy();
  drawFamiliars();
  drawPlayer();
  drawThrown();
  drawShots();
  drawBullets();
  drawFx();
  drawParticles();
  drawMotes();
  renderLighting(rm);
  drawHazards();
  drawPops();
  ctx.drawImage(getVignette(), 0, 0);
  if (hurtFlash > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.65);
    g.addColorStop(0, 'rgba(120,0,10,0)'); g.addColorStop(1, `rgba(150,0,20,${hurtFlash * 0.55})`);
    ctx.fillStyle = g; ctx.fillRect(0, HUD_H, W, H - HUD_H);
  }
  if (player.oil < 22 && !player.dead) {
    const k = (22 - player.oil) / 22;
    ctx.fillStyle = `rgba(0,0,0,${0.35 * k + Math.sin(time * 5) * 0.05 * k})`; ctx.fillRect(0, HUD_H, W, H - HUD_H);
  }
  if (roomTransition > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, roomTransition / 0.2)})`;
    ctx.fillRect(0, HUD_H, W, H - HUD_H);
  }
  ctx.restore();
  drawReticle();
  renderHUD();
}
