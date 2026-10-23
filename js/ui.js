'use strict';
/* =====================================================================
   UI: HUD, мини-карта, оверлеи, меню, лагерь, настройки, хроники, реликвии, итоги, ввод
   Дополнительные экраны (достижения, бестиарий, статистика, сид, сюжет, события) — в ui2.js
   ===================================================================== */
let uiButtons = [];
let menuSel = 0, pauseSel = 0, selHero = 0, campSel = 0, codexSel = 0, chronSel = 0, settingsSel = 0;
let campTab = 0, campMode = 'classic', lavkaSel = 0;
let endTimer = 0;

function setSpacing(px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
function centerText(txt, x, y, font, color, blur = 0, spacing = 0) {
  txt = tr(txt);
  ctx.save();
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (spacing) setSpacing(spacing);
  if (blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
  ctx.fillStyle = color; ctx.fillText(txt, x + spacing / 2, y);
  ctx.restore();
}
function leftText(txt, x, y, font, color) {
  txt = tr(txt);
  ctx.save(); ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.restore();
}
function rightText(txt, x, y, font, color) {
  txt = tr(txt);
  ctx.save(); ctx.font = font; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.restore();
}
function wrapText(text, x, y, maxW, lh, font, color, align = 'left') {
  text = tr(text);
  ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
  ctx.restore();
  return yy;
}
function hovered(b) { return mouse.active && mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h; }

function drawButton(label, x, y, w, h, action, selected, color = '#d6a23a', font = `bold 16px ${FONT_SERIF}`, disabled = false) {
  const b = { x, y, w, h, action: disabled ? () => Snd.play('error') : action };
  uiButtons.push(b);
  const hot = !disabled && (selected || hovered(b));
  ctx.save();
  ctx.fillStyle = hot ? 'rgba(214,162,58,0.16)' : 'rgba(12,10,18,0.78)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hot ? color : '#4a4452'; ctx.lineWidth = hot ? 2 : 1.2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (hot) { ctx.strokeStyle = 'rgba(214,162,58,0.25)'; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8); }
  ctx.restore();
  centerText(label, x + w / 2, y + h / 2 + 1, font, disabled ? '#5b5666' : hot ? '#fff7e0' : '#c8c2b4', hot ? 8 : 0, 1);
  return b;
}

// ---------- ПОЛОСЫ И ИКОНКИ HUD ----------
function bar(x, y, w, h, k, c0, c1, bg = '#17121c') {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, c0); g.addColorStop(1, c1);
  ctx.fillStyle = g; ctx.fillRect(x, y, w * clamp(k, 0, 1), h);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function skillIcon(kind, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#e7e5e4'; ctx.fillStyle = '#e7e5e4'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (kind === 'trap') {
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); ctx.lineTo(Math.cos(a + 0.3) * 10, Math.sin(a + 0.3) * 10); ctx.stroke(); }
  } else if (kind === 'sanctum') {
    ctx.beginPath(); ctx.ellipse(0, 3, 10, 6, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(5, -4, 0, 3); ctx.quadraticCurveTo(-5, -4, 0, -10); ctx.fill();
  } else if (kind === 'madness') { // колба и вихрь
    ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-3, -3); ctx.lineTo(-8, 7); ctx.lineTo(8, 7); ctx.lineTo(3, -3); ctx.lineTo(3, -9); ctx.stroke();
    ctx.strokeStyle = '#f472b6'; ctx.beginPath(); ctx.arc(0, 2, 2, 0, 5); ctx.arc(0, 2, 4.5, 0.5, 5.5); ctx.stroke();
  } else if (kind === 'execute') { // топор
    ctx.beginPath(); ctx.moveTo(-8, 9); ctx.lineTo(6, -8); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(1, -10); ctx.quadraticCurveTo(10, -9, 9, 0); ctx.quadraticCurveTo(5, -3, 0, -3); ctx.closePath(); ctx.fill();
  } else if (kind === 'crow') { // ворон
    ctx.fillStyle = '#0c0a09'; ctx.strokeStyle = '#e7e5e4';
    ctx.beginPath(); ctx.moveTo(-9, 2); ctx.quadraticCurveTo(-4, -9, 3, -3); ctx.lineTo(10, -2); ctx.lineTo(3, 1); ctx.quadraticCurveTo(-2, 8, -9, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(2, -3, 1.4, 0, 7); ctx.fill();
  } else if (kind === 'transmute') { // монета-ромб
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#713f12'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.stroke();
  } else if (kind === 'echo') { // призрачная фигура
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#a78bfa'; ctx.beginPath(); ctx.arc(5, 0, 7, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(-3, 0, 7, 0, 7); ctx.stroke();
  } else if (kind === 'harvest') { // коса
    ctx.beginPath(); ctx.moveTo(-8, 9); ctx.lineTo(5, -9); ctx.stroke();
    ctx.strokeStyle = '#a78bfa'; ctx.beginPath(); ctx.arc(4, -3, 8, -2.2, 0.8); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-8, -9); ctx.quadraticCurveTo(10, -8, 9, 0); ctx.quadraticCurveTo(8, 9, -8, 10); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, -5); ctx.lineTo(-1, 6); ctx.moveTo(-5, 0); ctx.lineTo(4, 0); ctx.stroke();
  }
  ctx.restore();
}

// ---------- HUD ----------
function renderHUD() {
  const p = player, h = HEROES[p.hero];
  const hg = ctx.createLinearGradient(0, 0, 0, HUD_H);
  hg.addColorStop(0, '#16121d'); hg.addColorStop(1, '#09070d');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, HUD_H);
  ctx.strokeStyle = 'rgba(214,162,58,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, HUD_H - 1); ctx.lineTo(W, HUD_H - 1); ctx.stroke();

  // здоровье, оберег, масло
  bar(12, 6, 212, 14, p.hp / p.maxHp, '#ef4444', '#7f1d1d');
  if (p.healBuf > 0) { ctx.fillStyle = 'rgba(254,202,202,0.6)'; ctx.fillRect(12 + 212 * clamp(p.hp / p.maxHp, 0, 1), 6, 212 * clamp(p.healBuf / p.maxHp, 0, 1 - p.hp / p.maxHp), 14); }
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(13, 7, 210, 3);
  centerText(`${Math.ceil(p.hp)} / ${p.maxHp}`, 118, 13.5, `bold 11px ${FONT_SANS}`, '#fff1f1');
  bar(12, 22, 212, 5, p.ward / 100, '#bae6fd', '#38bdf8');
  if (p.ward > 0) leftText(String(Math.ceil(p.ward)), 230, 24.5, `10px ${FONT_SANS}`, '#7dd3fc');
  const om = Math.max(100, p.oilMax), oilK = p.oil / om, low = p.oil / p.oilMax < 0.22;
  bar(12, 30, 212, 8, oilK, low ? '#f87171' : '#fde68a', low ? '#7f1d1d' : '#d97706');
  if (p.oilMax < om) { ctx.fillStyle = 'rgba(0,0,0,0.78)'; const cx0 = 12 + 212 * (p.oilMax / om); ctx.fillRect(cx0, 30, 224 - cx0, 8); ctx.strokeStyle = '#7f1d1d'; ctx.strokeRect(cx0 + 0.5, 30.5, 224 - cx0 - 1, 7); }
  glow(14, 34, 9, '#fbbf24', 0.5 + Math.sin(time * 9) * 0.15);
  if (low) leftText('ФОНАРЬ ГАСНЕТ', 100, 34.5, `bold 9px ${FONT_SANS}`, '#fff');

  // рывки
  for (let i = 0; i < p.dashMax; i++) {
    const x = 262 + i * 14, y = 14;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#17121c'; ctx.fillRect(-5, -5, 10, 10);
    if (i < p.dashCharges) { ctx.fillStyle = '#e7e5e4'; ctx.fillRect(-4, -4, 8, 8); }
    else if (i === p.dashCharges) { ctx.fillStyle = '#64748b'; ctx.fillRect(-4, 4 - 8 * clamp(p.dashTimer / p.dashCd, 0, 1), 8, 8 * clamp(p.dashTimer / p.dashCd, 0, 1)); }
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(-5, -5, 10, 10);
    ctx.restore();
  }
  leftText('РЫВОК', 246, 33, `9px ${FONT_SANS}`, '#64748b');

  // умение
  const sx = 334, sy = 6;
  ctx.fillStyle = 'rgba(12,10,18,0.9)'; ctx.fillRect(sx, sy, 32, 32);
  const ready = h.skill === 'guard' ? p.guard.cd <= 0 : p.skillCd <= 0;
  ctx.strokeStyle = ready ? '#d6a23a' : '#3a3542'; ctx.lineWidth = 1.5; ctx.strokeRect(sx + 0.5, sy + 0.5, 31, 31);
  ctx.globalAlpha = ready ? 1 : 0.4; skillIcon(h.skill, sx + 16, sy + 16, 1); ctx.globalAlpha = 1;
  if (!ready && h.skill !== 'guard') {
    const k = clamp(p.skillCd / (h.skillMax * (h.skill === 'trap' ? 0.85 : 1)), 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(sx + 1, sy + 1, 30, 30 * k);
  }
  centerText('ПКМ', sx + 16, sy + 38, `8px ${FONT_SANS}`, '#64748b');

  // зелья
  for (let i = 0; i < p.potionMax; i++) {
    const x = 382 + i * 15;
    ctx.globalAlpha = i < p.potions ? 1 : 0.2;
    drawPickupSprite('potion', x, 19, 0.68);
  }
  ctx.globalAlpha = 1;
  leftText('F', 382, 38, `9px ${FONT_SANS}`, '#64748b');

  // склянки, ключи, серебро
  drawPickupSprite('flask', 482, 19, 0.85);
  leftText('×' + p.flasks, 492, 20, `bold 13px ${FONT_SANS}`, p.flasks ? '#f1f5f9' : '#64748b');
  leftText('Q', 482, 38, `9px ${FONT_SANS}`, '#64748b');
  drawPickupSprite('key', 538, 19, 0.85);
  leftText('×' + p.keys, 548, 20, `bold 13px ${FONT_SANS}`, p.keys ? '#f1f5f9' : '#64748b');
  drawPickupSprite('silver', 590, 19, 0.9);
  leftText(String(p.silver), 600, 20, `bold 13px ${FONT_SANS}`, p.silver ? '#f1f5f9' : '#64748b');

  // артефакт
  const ax = 628;
  ctx.fillStyle = 'rgba(12,10,18,0.9)'; ctx.fillRect(ax, 4, 36, 36);
  if (p.active) {
    const full = p.charge >= p.active.active.max;
    ctx.strokeStyle = full ? `rgba(253,230,138,${0.7 + Math.sin(time * 8) * 0.3})` : '#3a3542'; ctx.lineWidth = full ? 2 : 1.2; ctx.strokeRect(ax + 0.5, 4.5, 35, 35);
    ctx.globalAlpha = full ? 1 : 0.5; drawSigil(p.active, ax + 18, 22, 14); ctx.globalAlpha = 1;
    const mx = p.active.active.max;
    for (let i = 0; i < mx; i++) { ctx.fillStyle = i < p.charge ? (full ? '#fde047' : '#7dd3fc') : '#1e1b26'; ctx.fillRect(ax + 40, 39 - (i + 1) * (34 / mx), 4, 34 / mx - 1); }
  } else { ctx.strokeStyle = '#2a2632'; ctx.lineWidth = 1; ctx.strokeRect(ax + 0.5, 4.5, 35, 35); centerText('E', ax + 18, 22, `12px ${FONT_SANS}`, '#2e2a36'); }

  // последние реликвии
  const maxIcons = 4, list = p.relics.slice(-maxIcons);
  list.forEach((it, i) => drawSigil(it, 688 + i * 21, 22, 9));
  if (p.relics.length > maxIcons) leftText('+' + (p.relics.length - maxIcons), 688 + maxIcons * 21 - 6, 22, `bold 10px ${FONT_SANS}`, '#94a3b8');

  // глубина / волна и время
  const F = floorDef(floorNum);
  if (run.mode === 'survival') {
    rightText(`ВОЛНА ${Math.max(1, run.wave)}`, W - 12, 14, `bold 13px ${FONT_SERIF}`, '#fb7185');
    rightText(`${fmtTime(run.time)} · убито ${run.kills}`, W - 12, 30, `10px ${FONT_SANS}`, '#8a8494');
  } else {
    rightText(F.name, W - 12, 14, `bold 11px ${FONT_SERIF}`, F.accent);
    rightText(`Глубина ${floorNum}/${MAX_FLOOR} · ${fmtTime(run.time)}`, W - 12, 30, `10px ${FONT_SANS}`, '#8a8494');
    renderMinimap(W - 124, HUD_H + 6, 112, 84, 11, 0.62);
  }
  // сид и модификатор дня
  ctx.save(); ctx.globalAlpha = 0.55;
  rightText(`Сид ${run.seedStr}`, W - 14, HUD_H + (run.mode === 'survival' ? 12 : 100), `10px ${FONT_MONO}`, '#94a3b8');
  if (run.mod) rightText(run.mod.name, W - 14, HUD_H + (run.mode === 'survival' ? 26 : 114), `bold 10px ${FONT_SERIF}`, '#fbbf24');
  ctx.restore();
  renderBossBar();
  renderOverlays();
}

// ---------- МИНИ-КАРТА ----------
function roomShown(rm) {
  const p = player;
  if (rm.visited) return 2;
  if (rm.revealed) return 1;
  for (const dn in rm.doors) {
    const door = rm.doors[dn];
    if (door.hidden) continue;
    const nb = grid.get(door.to);
    if (nb && nb.visited) return 1;
  }
  if (p.fl.mapAll && rm.type !== 'secret') return 1;
  if (p.fl.compass && rm.type !== 'normal' && rm.type !== 'secret' && rm.type !== 'start') return 1;
  return 0;
}
function renderMinimap(mx, my, mw, mh, cell, alpha) {
  const center = grid.has(roomKey(curRoom.gx, curRoom.gy)) ? curRoom : (curRoom.backRoom || curRoom);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(8,6,12,0.9)'; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#4a4452'; ctx.lineWidth = 1.5; ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
  ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
  const ox = mx + mw / 2, oy = my + mh / 2, st = cell + 3;
  const pos = rm => [ox + (rm.gx - center.gx) * st, oy + (rm.gy - center.gy) * st];
  ctx.strokeStyle = '#4a4452'; ctx.lineWidth = 2;
  for (const rm of grid.values()) {
    if (!roomShown(rm)) continue;
    const [x, y] = pos(rm);
    for (const dn of ['r', 'd']) {
      const door = rm.doors[dn];
      if (!door || door.hidden) continue;
      const nb = grid.get(door.to);
      if (!nb || !roomShown(nb)) continue;
      const [x2, y2] = pos(nb);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }
  const colors = { boss: '#be123c', treasure: '#d6a23a', shop: '#22a35a', secret: '#7c5cd6', shrine: '#ea6a1a', event: '#0ea5e9', trial: '#d97706' };
  const glyph = { boss: '☠', treasure: '✦', shop: '$', secret: '?', shrine: '♨', event: '!', trial: '»' };
  for (const rm of grid.values()) {
    const sh = roomShown(rm);
    if (!sh) continue;
    const [x, y] = pos(rm);
    const rx = x - cell / 2, ry = y - cell / 2;
    const special = colors[rm.type];
    if (rm === curRoom) {
      ctx.fillStyle = '#f5efe0'; ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 5 + Math.sin(time * 6) * 3;
      ctx.fillRect(rx, ry, cell, cell); ctx.shadowBlur = 0;
    } else if (sh === 1) {
      ctx.fillStyle = special && rm.type !== 'secret' ? special : '#1f1b26';
      ctx.globalAlpha = alpha * 0.55; ctx.fillRect(rx, ry, cell, cell); ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#4a4452'; ctx.lineWidth = 1; ctx.strokeRect(rx, ry, cell, cell);
    } else {
      ctx.fillStyle = special || (rm.cleared ? '#5b5666' : '#8a8494');
      ctx.fillRect(rx, ry, cell, cell);
      ctx.strokeStyle = '#0a0810'; ctx.lineWidth = 1; ctx.strokeRect(rx, ry, cell, cell);
    }
    if (special && (sh === 2 || rm.type !== 'secret') && rm !== curRoom) centerText(glyph[rm.type], x, y + 1, `bold ${Math.max(7, cell - 3)}px ${FONT_SANS}`, sh === 2 ? '#fff' : '#d6d3d1');
  }
  ctx.restore();
}

// ---------- ПОЛОСА БОССА ----------
function renderBossBar() {
  const b = curRoom.enemies.find(e => e.isBoss && !e.dead);
  if (!b) return;
  const barW = 380, barH = 12, bx = W / 2 - barW / 2, by = H - 22;
  ctx.fillStyle = 'rgba(8,6,12,0.92)'; ctx.fillRect(bx - 8, by - 24, barW + 16, barH + 30);
  ctx.strokeStyle = 'rgba(214,162,58,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 8.5, by - 24.5, barW + 17, barH + 31);
  ctx.fillStyle = '#17121c'; ctx.fillRect(bx, by, barW, barH);
  const k = Math.max(0, b.hp / b.maxHp);
  const g = ctx.createLinearGradient(bx, by, bx, by + barH); g.addColorStop(0, '#ef4444'); g.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = g; ctx.fillRect(bx, by, barW * k, barH);
  if (b.type === 'nameless' || b.type === 'keeper') { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(bx + barW * 0.33, by, 2, barH); ctx.fillRect(bx + barW * 0.66, by, 2, barH); }
  if (b.armor > 0.5) { ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, barW - 2, barH - 2); }
  ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 0.5, by + 0.5, barW - 1, barH - 1);
  centerText(b.name, W / 2, by - 11, `bold 14px ${FONT_SERIF}`, '#f5efe0', 6, 2);
}

// ---------- ОВЕРЛЕИ: подбор, баннер, подсказка, свиток ----------
function renderOverlays() {
  if (floatText) {
    const f = floatText, a = clamp(Math.min(f.timer / 0.5, (f.max - f.timer) / 0.2 + 0.2), 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    if (f.note) {
      const w = 520, x = W / 2 - w / 2, y = HUD_H + 54;
      ctx.fillStyle = 'rgba(28,22,14,0.95)'; ctx.fillRect(x, y, w, 118);
      ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 2; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 117);
      ctx.strokeStyle = 'rgba(138,109,59,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x + 6.5, y + 6.5, w - 13, 105);
      centerText(f.title, W / 2, y + 22, `bold 17px ${FONT_SERIF}`, '#f1e3b8', 0, 1);
      wrapText(f.desc, W / 2, y + 50, w - 60, 21, `italic 14px ${FONT_SERIF}`, '#e7d9b0', 'center');
      if (f.fresh) centerText('новая запись в Хрониках', W / 2, y + 106, `10px ${FONT_SANS}`, '#a8845a');
    } else {
      const w = 460, x = W / 2 - w / 2, y = HUD_H + 8;
      ctx.fillStyle = 'rgba(8,6,12,0.92)'; ctx.fillRect(x, y, w, 58);
      ctx.strokeStyle = f.color; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 57);
      drawSigil(f.relic, x + 32, y + 29, 20);
      leftText(f.title, x + 64, y + 21, `bold 17px ${FONT_SERIF}`, f.color);
      leftText(f.desc, x + 64, y + 42, `12px ${FONT_SANS}`, '#d6d3d1');
      if (f.active) rightText('артефакт · E', x + w - 10, y + 12, `bold 10px ${FONT_SANS}`, '#fde68a');
      else if (f.relic && f.relic.curse) rightText('ПРОКЛЯТИЕ', x + w - 10, y + 12, `bold 10px ${FONT_SANS}`, '#fb7185');
    }
    ctx.restore();
  }
  if (banner) {
    const b = banner, a = clamp(Math.min(b.timer / 0.6, (b.max - b.timer) / 0.3), 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const hh = b.sub ? 110 : 84, y0 = H / 2 - hh / 2 - 24;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + hh); g.addColorStop(0, 'rgba(4,3,8,0)'); g.addColorStop(0.2, 'rgba(4,3,8,0.88)'); g.addColorStop(0.8, 'rgba(4,3,8,0.88)'); g.addColorStop(1, 'rgba(4,3,8,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, hh);
    centerText(b.text, W / 2, y0 + (b.sub ? 40 : hh / 2), `bold ${b.boss ? 38 : 30}px ${FONT_SERIF}`, b.color, 14, 4);
    if (b.sub) centerText(b.sub, W / 2, y0 + 78, `italic 15px ${FONT_SERIF}`, '#cfc8b8');
    ctx.restore();
  }
  if (message) {
    const a = clamp(message.timer / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `bold 13px ${FONT_SANS}`;
    const w = ctx.measureText(tr(message.text)).width + 40;
    ctx.fillStyle = 'rgba(8,6,12,0.85)'; ctx.fillRect(W / 2 - w / 2, H - 70, w, 28);
    ctx.strokeStyle = message.color; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - w / 2 + 0.5, H - 69.5, w - 1, 27);
    centerText(message.text, W / 2, H - 56, `bold 13px ${FONT_SANS}`, message.color);
    ctx.restore();
  }
  if (restartHold > 0.15) {
    ctx.fillStyle = 'rgba(8,6,12,0.88)'; ctx.fillRect(W / 2 - 110, HUD_H + 70, 220, 28);
    ctx.fillStyle = '#b91c1c'; ctx.fillRect(W / 2 - 106, HUD_H + 90, 212 * clamp(restartHold, 0, 1), 5);
    centerText('Начать спуск заново…', W / 2, HUD_H + 80, `bold 12px ${FONT_SANS}`, '#fca5a5');
  }
  if (keys.Tab) renderStatsPanel(true);
}

// ---------- ПАНЕЛЬ ХАРАКТЕРИСТИК (Tab / пауза) ----------
const FLAG_NAMES = { homing: 'самонаведение', pierce: 'пробивание', spectral: 'сквозь стены', bounce: 'рикошет', slow: 'замедление', poison: 'яд', burn: 'поджог', fear: 'страх',
  blast: 'взрывы', split: 'осколки', chain: 'молния', rear: 'назад', side: 'вбок', flight: 'парение', lifesteal: 'вампиризм', regen: 'регенерация', holy: 'оберег в комнатах',
  block: 'уклонение', aura: 'огненная аура', mapAll: 'карта', compass: 'подзорная труба', execute: 'казнь', thorns: 'шипы', dashFire: 'огненный рывок', lastStand: 'ярость раненого',
  oilKill: 'масло за убийства', potionPlus: 'крепкие зелья', wardRegen: 'оберег за зачистку',
  corrode: 'кислота', rot: 'гниение', madhit: 'безумие', blind: 'ослепление', midas: 'золото Мидаса', emberdrop: 'угли из врагов',
  killHeal: 'лечение за убийства', greed: 'жадность', rotRoom: 'гниль комнат', swarm: 'полчища', beggar: 'нищета', fuel: 'голодный огонь' };
function renderStatsPanel(full) {
  const p = player;
  ctx.save();
  if (full) { ctx.fillStyle = 'rgba(4,3,8,0.9)'; ctx.fillRect(0, HUD_H, W, H - HUD_H); }
  const x0 = 34, y0 = HUD_H + 26;
  leftText('ХАРАКТЕРИСТИКИ', x0, y0, `bold 15px ${FONT_SERIF}`, '#d6a23a');
  const stats = [
    ['Здоровье', `${Math.ceil(p.hp)} / ${p.maxHp}`, '#fca5a5'], ['Оберег', Math.ceil(p.ward), '#7dd3fc'],
    ['Урон', p.dmg.toFixed(1), '#fdba74'], ['Атак в секунду', p.atk.toFixed(2), '#fde68a'],
    ['Дальность', Math.round(HEROES[p.hero].range + p.rangeBonus), '#a5b4fc'], ['Скорость', Math.round(p.speed), '#86efac'],
    ['Удача', p.luck.toFixed(1), '#f9a8d4'], ['Крит', `${Math.round(p.crit * 100)}% ×${p.critDmg.toFixed(2)}`, '#fde047'],
    ['Свет', Math.round(lightRadius()), '#fbbf24'], ['Рывки', `${p.dashMax}  (${p.dashCd.toFixed(2)} с)`, '#e5e7eb']
  ];
  if (p.armorPierce > 0) stats.push(['Пробитие брони', Math.round(p.armorPierce * 100) + '%', '#cbd5e1']);
  stats.forEach(([n, v, c], i) => {
    leftText(n, x0, y0 + 28 + i * 20, `13px ${FONT_SANS}`, '#8a8494');
    leftText(String(v), x0 + 130, y0 + 28 + i * 20, `bold 13px ${FONT_SANS}`, c);
  });
  const yy = y0 + 28 + stats.length * 20 + 12;
  leftText('ЭФФЕКТЫ', x0, yy, `bold 12px ${FONT_SERIF}`, '#a78bfa');
  const fl = Object.keys(p.fl).map(k => FLAG_NAMES[k]).filter(Boolean).map(tr);
  wrapText(fl.length ? fl.join(', ') : 'нет', x0, yy + 20, 260, 16, `12px ${FONT_SANS}`, '#cbd5e1');
  const os = OATHS.filter(o => p.oaths[o.id]);
  leftText('ОБЕТЫ', x0, yy + 76, `bold 12px ${FONT_SERIF}`, os.length ? '#f472b6' : '#5b5666');
  if (os.length) os.forEach((o, i) => leftText('✦ ' + o.name, x0, yy + 96 + i * 17, `bold 12px ${FONT_SANS}`, SCHOOLS[o.school].color));
  else OATHS.slice(0, 4).forEach((o, i) => leftText(`${tr(SCHOOLS[o.school].name)}: ${Math.min(o.need, p.relics.filter(r => r.school === o.school).length)}/${o.need}`, x0 + (i % 2) * 120, yy + 96 + Math.floor(i / 2) * 16, `11px ${FONT_SANS}`, '#5b5666'));
  // реликвии
  const xi = 330;
  leftText(`РЕЛИКВИИ (${p.relics.length + (p.active ? 1 : 0)})`, xi, y0, `bold 15px ${FONT_SERIF}`, '#d6a23a');
  const all = (p.active ? [p.active] : []).concat(p.relics);
  const colW = 295, rowH = 28, perCol = 14;
  all.slice(0, perCol * 2).forEach((it, i) => {
    const cx = xi + Math.floor(i / perCol) * colW, cy = y0 + 30 + (i % perCol) * rowH;
    drawSigil(it, cx + 11, cy, 11);
    leftText(it.name, cx + 28, cy - 6, `bold 12px ${FONT_SERIF}`, it.active ? '#fde68a' : it.curse ? '#fb7185' : '#e7e5e4');
    const ds = tr(it.desc);
    leftText(ds.length > 44 ? ds.slice(0, 43) + '…' : ds, cx + 28, cy + 8, `10px ${FONT_SANS}`, '#6b6676');
  });
  if (all.length > perCol * 2) leftText(`…и ещё ${all.length - perCol * 2}`, xi, y0 + 30 + perCol * rowH + 6, `12px ${FONT_SANS}`, '#94a3b8');
  if (!all.length) leftText('Пока пусто. Ищи реликварий ✦', xi, y0 + 40, `italic 13px ${FONT_SERIF}`, '#6b6676');
  if (full && run.mode !== 'survival') renderMinimap(W - 238, H - 194, 210, 150, 20, 0.95);
  ctx.restore();
}

// ---------- ФОН МЕНЮ: собор и подвижный свет ----------
let menuBgCache = null;
function getMenuBg() {
  if (menuBgCache) return menuBgCache;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1426'); bg.addColorStop(1, '#09060f');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // арки собора
  g.strokeStyle = '#2c2540'; g.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const cx = 70 + i * 135, base = H - 60;
    g.fillStyle = '#120d1c'; g.beginPath(); g.moveTo(cx - 52, base); g.lineTo(cx - 52, 200); g.quadraticCurveTo(cx - 52, 90, cx, 70); g.quadraticCurveTo(cx + 52, 90, cx + 52, 200); g.lineTo(cx + 52, base); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#080510'; g.beginPath(); g.moveTo(cx - 34, base); g.lineTo(cx - 34, 210); g.quadraticCurveTo(cx - 34, 120, cx, 104); g.quadraticCurveTo(cx + 34, 120, cx + 34, 210); g.lineTo(cx + 34, base); g.closePath(); g.fill();
    g.fillStyle = '#1d1730'; g.fillRect(cx - 58, base - 8, 116, 14);
  }
  g.fillStyle = '#0b0712'; g.fillRect(0, H - 60, W, 60);
  g.strokeStyle = '#3a2f52'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H - 60); g.lineTo(W, H - 60); g.stroke();
  return (menuBgCache = cv);
}
function drawMenuBackdrop() {
  ctx.drawImage(getMenuBg(), 0, 0);
  ensureLightSprites();
  // тьма с отверстием света от мыши (или медленно плывущего огонька)
  const lx = mouse.active ? mouse.x : W / 2 + Math.sin(time * 0.5) * 220, ly = mouse.active ? mouse.y : 300 + Math.cos(time * 0.7) * 60;
  const m = lightMaskCtx;
  m.setTransform(0.5, 0, 0, 0.5, 0, 0);
  m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W, H);
  m.fillStyle = 'rgba(2,1,6,0.9)'; m.fillRect(0, 0, W, H);
  m.globalCompositeOperation = 'destination-out';
  const r = 230 + Math.sin(time * 7) * 6;
  m.globalAlpha = 1; m.drawImage(lightSprite, lx - r, ly - r, r * 2, r * 2);
  m.globalAlpha = 0.5; m.drawImage(lightSprite, W / 2 - 330, 100, 660, 440);
  m.globalAlpha = 1;
  ctx.drawImage(lightMask, 0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9; ctx.drawImage(warmSprite, lx - r * 0.9, ly - r * 0.9, r * 1.8, r * 1.8); ctx.restore();
  // рамка
  ctx.strokeStyle = '#2a2236'; ctx.lineWidth = 3; ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.strokeStyle = 'rgba(214,162,58,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.fillStyle = '#d6a23a';
  for (const [x, y] of [[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
}

// ---------- ЗАСТАВКА ----------
// колонки: игра · летопись · нижний ряд
const MENU_ITEMS = [
  { label: 'Начать спуск', col: 0, act: () => openCamp('classic') },
  { label: 'Выживание', col: 0, act: () => openCamp('survival') },
  { label: 'Ежедневный забег', col: 0, act: () => openCamp('daily') },
  { label: 'Свой сид', col: 0, act: () => { state = 'seed'; } },
  { label: 'Реликвии', col: 1, act: () => { state = 'relics'; codexSel = 0; } },
  { label: 'Бестиарий', col: 1, act: () => { state = 'bestiary'; bestSel = 0; bestPage = 0; } },
  { label: 'Достижения', col: 1, act: () => { state = 'achievements'; achPage = 0; } },
  { label: 'Хроники', col: 1, act: () => { state = 'chronicle'; chronSel = 0; } },
  { label: 'Статистика', col: 1, act: () => { state = 'stats'; } },
  { label: 'Настройки', col: 2, act: () => { state = 'settings'; settingsSel = 0; } },
  { label: 'Как играть', col: 2, act: () => { state = 'help'; } }
];
function menuColumn(c) { return MENU_ITEMS.map((m, i) => ({ m, i })).filter(o => o.m.col === c).map(o => o.i); }
function menuAction(i) {
  Snd.play('confirm');
  const it = MENU_ITEMS[i];
  if (it) it.act();
}
function openCamp(mode) {
  campMode = mode; state = 'camp'; campTab = 0; campSel = 0;
  selHero = Math.max(0, HERO_ORDER.findIndex(h => Save.data.heroes[h]));
}
function renderTitle() {
  uiButtons = [];
  drawMenuBackdrop();
  centerText('ПОСЛЕДНИЙ ФОНАРЬ', W / 2, 98, `bold 54px ${FONT_SERIF}`, '#f1e3b8', 22, 9);
  centerText('СПУСК В БЕЗДНУ', W / 2, 144, `italic 18px ${FONT_SERIF}`, '#a78bfa', 0, 8);
  // фонарь
  const fl = 1 + Math.sin(time * 9) * 0.08;
  glow(W / 2, 202, 40 * fl, '#fbbf24', 0.8);
  ctx.strokeStyle = '#8a7240'; ctx.lineWidth = 3; ctx.strokeRect(W / 2 - 11, 188, 22, 30);
  ctx.beginPath(); ctx.moveTo(W / 2 - 13, 188); ctx.lineTo(W / 2, 178); ctx.lineTo(W / 2 + 13, 188); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, 172, 6, Math.PI, 0); ctx.stroke();
  const g = ctx.createRadialGradient(W / 2, 203, 1, W / 2, 203, 12 * fl); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, '#fbbf24'); g.addColorStop(1, 'rgba(234,88,12,0.2)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(W / 2, 204, 7 * fl, 11 * fl, 0, 0, 7); ctx.fill();
  const colX = [W / 2 - 262, W / 2 + 12], bw = 250, bh = 36, by0 = 244;
  leftText('ИГРАТЬ', colX[0] + 4, by0 - 10, `bold 11px ${FONT_SERIF}`, '#8a7240');
  leftText('ЛЕТОПИСЬ', colX[1] + 4, by0 - 10, `bold 11px ${FONT_SERIF}`, '#8a7240');
  MENU_ITEMS.forEach((it, i) => {
    if (it.col > 1) return;
    const row = menuColumn(it.col).indexOf(i);
    drawButton(it.label, colX[it.col], by0 + row * 42, bw, bh, () => menuAction(i), menuSel === i, '#d6a23a', `bold 15px ${FONT_SERIF}`);
  });
  MENU_ITEMS.forEach((it, i) => {
    if (it.col !== 2) return;
    const row = menuColumn(2).indexOf(i);
    drawButton(it.label, W / 2 - 262 + row * 276, by0 + 5 * 42 + 4, 248, 32, () => menuAction(i), menuSel === i, '#d6a23a', `bold 14px ${FONT_SERIF}`);
  });
  const d = Save.data;
  centerText(`Спусков: ${d.runs}   Побед: ${d.wins}   Лучшая глубина: ${d.bestFloor}   Угли: ${d.embers}   Монеты: ${d.coins}`, W / 2, H - 52, `12px ${FONT_SANS}`, '#8a8494');
  centerText('W/S — выбор · A/D — столбец · Enter — подтвердить · M — звук · L — язык', W / 2, H - 34, `11px ${FONT_SANS}`, '#5b5666');
  // язык
  drawButton(LANG === 'ru' ? 'RU · en' : 'ru · EN', W - 96, 28, 70, 24, toggleLang, false, '#d6a23a', `bold 11px ${FONT_SANS}`);
  // версия и авторство
  rightText('v' + VERSION, W - 30, H - 50, `bold 12px ${FONT_SERIF}`, '#d6a23a');
  rightText(COPYRIGHT, W - 30, H - 34, `11px ${FONT_SERIF}`, '#8a8494');
}
function toggleLang() { setLang(LANG === 'ru' ? 'en' : 'ru'); Snd.play('select'); }

// ---------- ЛАГЕРЬ ----------
const CAMP_TABS = ['Герои', 'Улучшения', 'Лавка угольщика'];
function startFromCamp() {
  const hid = HERO_ORDER[selHero];
  if (!Save.data.heroes[hid]) { Snd.play('error'); return; }
  cfg().burden = clamp(cfg().burden, 0, Save.data.burdenMax);
  Save.store();
  Snd.play('confirm');
  startRun(hid, { mode: campMode, seedStr: campMode === 'seed' ? seedInput : undefined });
}
function buyHero(i) {
  const id = HERO_ORDER[i], h = HEROES[id];
  if (Save.data.heroes[id]) { selHero = i; Snd.play('select'); return; }
  if (h.cond) { selHero = i; Snd.play('error'); return; }
  if (Save.data.embers >= h.unlock) {
    Save.data.embers -= h.unlock; Save.data.spent = (Save.data.spent || 0) + h.unlock;
    Save.data.heroes[id] = true; Save.store(); selHero = i; Snd.play('relic');
    checkHeroUnlocks();
  } else Snd.play('error');
}
function buyUpgrade(i) {
  const u = CAMP_UPGRADES[i], lv = Save.data.upgrades[u.id] || 0;
  if (lv >= u.max) { Snd.play('error'); return; }
  const cost = u.cost[lv];
  if (Save.data.embers < cost) { Snd.play('error'); return; }
  Save.data.embers -= cost; Save.data.spent = (Save.data.spent || 0) + cost;
  Save.data.upgrades[u.id] = lv + 1; Save.store(); Snd.play('buy');
  checkHeroUnlocks();
}
const MODE_NAMES = { classic: 'Классический спуск', survival: 'Выживание', daily: 'Ежедневный забег', seed: 'Забег по сиду' };

function heroCardStatus(id) {
  const h = HEROES[id];
  if (Save.data.heroes[id]) return { owned: true };
  if (h.cond) { const [a, b] = heroCondProgress(h); return { owned: false, cond: true, text: h.condText, a, b }; }
  return { owned: false, cost: h.unlock, afford: Save.data.embers >= h.unlock };
}
function renderCamp() {
  uiButtons = [];
  drawMenuBackdrop();
  centerText('ЛАГЕРЬ У КОСТРА', W / 2, 42, `bold 26px ${FONT_SERIF}`, '#f1e3b8', 10, 5);
  drawPickupSprite('oil', W / 2 - 150, 68, 0.75);
  centerText(`Угли: ${Save.data.embers}`, W / 2 - 98, 68, `bold 14px ${FONT_SERIF}`, '#fbbf24');
  drawPickupSprite('silver', W / 2 + 22, 68, 0.9);
  centerText(`Монеты: ${Save.data.coins}`, W / 2 + 74, 68, `bold 14px ${FONT_SERIF}`, '#e5e7eb');
  rightText(`Потрачено углей: ${Save.data.spent || 0}`, W - 38, 68, `11px ${FONT_SANS}`, '#8a8494');
  // вкладки
  CAMP_TABS.forEach((t, i) => {
    const x = 40 + i * 168, b = { x, y: 86, w: 160, h: 26, action: () => { campTab = i; Snd.play('select'); } };
    uiButtons.push(b);
    const sel = campTab === i;
    ctx.fillStyle = sel ? 'rgba(214,162,58,0.18)' : 'rgba(10,8,16,0.8)'; ctx.fillRect(x, 86, 160, 26);
    ctx.strokeStyle = sel ? '#d6a23a' : (hovered(b) ? '#8a7240' : '#3a3542'); ctx.lineWidth = sel ? 2 : 1.2; ctx.strokeRect(x + 0.5, 86.5, 159, 25);
    centerText(t, x + 80, 99, `bold 13px ${FONT_SERIF}`, sel ? '#fff7e0' : '#a8a29e');
  });
  rightText(MODE_NAMES[campMode], W - 38, 99, `bold 13px ${FONT_SERIF}`, '#a78bfa');

  if (campTab === 0) renderCampHeroes();
  else if (campTab === 1) renderCampUpgrades();
  else renderCampLavka();

  const hid = HERO_ORDER[selHero], owned = !!Save.data.heroes[hid];
  drawButton('СПУСТИТЬСЯ', W - 270, H - 62, 230, 44, startFromCamp, false, '#fbbf24', `bold 18px ${FONT_SERIF}`, !owned);
  drawButton('Назад', 40, H - 56, 110, 34, () => { state = 'title'; Snd.play('select'); }, false);
  if (campMode === 'seed') centerText(`Сид: ${seedInput || '—'}`, 330, H - 46, `bold 13px ${FONT_MONO}`, '#fbbf24');
  else if (campMode === 'daily') {
    const dm = DAILY_MODS[hashStr('D' + todayKey().replace(/-/g, '')) % DAILY_MODS.length], best = Save.data.daily[todayKey()];
    centerText(`${tr(dm.name)}: ${tr(dm.desc)}`, 470, H - 54, `italic 12px ${FONT_SERIF}`, '#fbbf24');
    centerText(best ? `Лучший счёт сегодня: ${best.score}` : 'Сегодня вы ещё не играли', 470, H - 34, `11px ${FONT_SANS}`, '#8a8494');
  } else if (campMode === 'survival') {
    const sv = Save.data.survival;
    centerText(`Рекорд: волна ${sv.bestWave} · счёт ${sv.bestScore}`, 330, H - 46, `12px ${FONT_SANS}`, '#fb7185');
  } else centerText('Tab / 1-2-3 — вкладки · A/D — герой · Enter — выбрать/купить · Пробел — спуск', 420, H - 34, `10px ${FONT_SANS}`, '#5b5666');
}
function renderCampHeroes() {
  const cw = 168, ch = 110, gx = 8, x0 = 44, y0 = 120;
  HERO_ORDER.forEach((id, i) => {
    const h = HEROES[id], st = heroCardStatus(id);
    const x = x0 + (i % 5) * (cw + gx), y = y0 + Math.floor(i / 5) * (ch + gx);
    const sel = selHero === i, b = { x, y, w: cw, h: ch, action: () => buyHero(i) };
    uiButtons.push(b);
    const secret = h.secret && !st.owned;
    ctx.fillStyle = sel ? 'rgba(214,162,58,0.14)' : 'rgba(10,8,16,0.82)'; ctx.fillRect(x, y, cw, ch);
    ctx.strokeStyle = sel ? '#d6a23a' : (hovered(b) ? '#8a7240' : '#3a3542'); ctx.lineWidth = sel ? 2 : 1.2; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, cw - 2, ch - 2); ctx.clip();
    ctx.globalAlpha = st.owned ? 1 : secret ? 0.12 : 0.35;
    drawHeroPortrait(id, x + cw / 2, y + 52, 1.5, sel);
    ctx.restore();
    if (secret) centerText('?', x + cw / 2, y + 46, `bold 34px ${FONT_SERIF}`, '#4a4452');
    centerText(secret ? '???' : h.name, x + cw / 2, y + 86, `bold 13px ${FONT_SERIF}`, st.owned ? '#f1e3b8' : '#6b6676');
    if (st.owned) centerText(Save.data.wonWith[id] ? `побед: ${Save.data.wonWith[id]}` : 'открыт', x + cw / 2, y + 100, `10px ${FONT_SANS}`, '#8a8494');
    else if (st.cond) centerText(secret ? 'Секрет' : `${st.a} / ${st.b}`, x + cw / 2, y + 100, `10px ${FONT_SANS}`, '#a78bfa');
    else centerText(`${st.cost} углей`, x + cw / 2, y + 100, `bold 11px ${FONT_SANS}`, st.afford ? '#fbbf24' : '#7f1d1d');
  });
  // карточка выбранного героя
  const id = HERO_ORDER[selHero], h = HEROES[id], st = heroCardStatus(id), secret = h.secret && !st.owned;
  const px = 44, py = 352, pw = 872, ph = 122;
  ctx.fillStyle = 'rgba(10,8,16,0.88)'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#3a3542'; ctx.lineWidth = 1.2; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.save(); ctx.globalAlpha = st.owned ? 1 : secret ? 0.1 : 0.4; drawHeroPortrait(id, px + 52, py + 62, 2.1, true); ctx.restore();
  if (secret) {
    leftText('Неизвестный', px + 112, py + 22, `bold 20px ${FONT_SERIF}`, '#6b6676');
    wrapText('Говорят, коса принадлежит тому, кого она победила трижды. Но кто захочет проиграть Костяному Жнецу?', px + 112, py + 52, 720, 17, `italic 13px ${FONT_SERIF}`, '#8a8494');
    return;
  }
  leftText(h.name, px + 112, py + 20, `bold 20px ${FONT_SERIF}`, st.owned ? '#f1e3b8' : '#8a8494');
  leftText(h.title, px + 112, py + 40, `italic 12px ${FONT_SERIF}`, '#8a8494');
  wrapText(h.desc, px + 112, py + 62, 520, 15, `12px ${FONT_SANS}`, '#c8c2b4');
  leftText(`Жизнь ${h.maxHp} · Урон ${h.dmg} · ${h.atk}/с`, px + 112, py + ph - 14, `bold 12px ${FONT_SANS}`, '#fdba74');
  const sx = px + pw - 12;
  const hs = Save.data.heroStats[id];
  if (hs && hs.runs) rightText(`спусков: ${hs.runs} · побед: ${hs.wins || 0} · лучшая глубина: ${hs.bestFloor || 0}`, sx, py + 16, `11px ${FONT_SANS}`, '#8a8494');
  if (st.owned) rightText('Нажми СПУСТИТЬСЯ', sx, py + ph - 14, `bold 12px ${FONT_SANS}`, '#86efac');
  else if (st.cond) {
    rightText(h.condText, sx, py + ph - 32, `bold 12px ${FONT_SANS}`, '#a78bfa');
    rightText(`${st.a} / ${st.b}`, sx, py + ph - 14, `bold 13px ${FONT_SANS}`, '#c4b5fd');
    ctx.fillStyle = '#1e1b26'; ctx.fillRect(sx - 160, py + ph - 52, 160, 6); ctx.fillStyle = '#a78bfa'; ctx.fillRect(sx - 160, py + ph - 52, 160 * (st.a / st.b), 6);
  } else rightText(`Открыть: ${st.cost} углей`, sx, py + ph - 14, `bold 13px ${FONT_SANS}`, st.afford ? '#fbbf24' : '#7f1d1d');
}
function renderCampUpgrades() {
  const pure = campMode === 'daily';
  const colW = 428, rowH = 50, x0 = 44, y0 = 122;
  CAMP_UPGRADES.forEach((u, i) => {
    const col = Math.floor(i / 6), row = i % 6, x = x0 + col * (colW + 16), y = y0 + row * (rowH + 4);
    const lv = Save.data.upgrades[u.id] || 0, maxed = lv >= u.max, cost = maxed ? 0 : u.cost[lv];
    const afford = !maxed && Save.data.embers >= cost, sel = campSel === i;
    const b = { x, y, w: colW, h: rowH, action: () => { campSel = i; buyUpgrade(i); } };
    uiButtons.push(b);
    ctx.fillStyle = sel ? 'rgba(214,162,58,0.12)' : 'rgba(10,8,16,0.8)'; ctx.fillRect(x, y, colW, rowH);
    ctx.strokeStyle = sel ? '#d6a23a' : (hovered(b) ? '#8a7240' : '#2e2a36'); ctx.lineWidth = sel ? 1.8 : 1; ctx.strokeRect(x + 0.5, y + 0.5, colW - 1, rowH - 1);
    leftText(u.name, x + 10, y + 14, `bold 13px ${FONT_SERIF}`, maxed ? '#86efac' : '#e7e5e4');
    wrapText(u.desc, x + 10, y + 31, colW - 130, 12, `10px ${FONT_SANS}`, '#8a8494');
    if (u.max <= 8) for (let k = 0; k < u.max; k++) { ctx.fillStyle = k < lv ? '#fbbf24' : '#2a2632'; ctx.fillRect(x + colW - 120 + k * 13, y + 10, 10, 10); }
    else rightText(`ур. ${lv}/${u.max}`, x + colW - 76, y + 15, `bold 11px ${FONT_SANS}`, lv ? '#fbbf24' : '#5b5666');
    rightText(maxed ? 'МАКС.' : `${cost}`, x + colW - 12, y + 36, `bold 13px ${FONT_SANS}`, maxed ? '#86efac' : afford ? '#fbbf24' : '#7f1d1d');
  });
  if (pure) centerText('В ежедневном забеге постоянные улучшения не действуют', W / 2, 442, `italic 12px ${FONT_SERIF}`, '#a78bfa');
  const by = 454;
  if (Save.data.burdenMax > 0) {
    leftText('БРЕМЯ', 44, by + 14, `bold 13px ${FONT_SERIF}`, '#e11d48');
    drawButton('−', 116, by, 28, 28, () => { cfg().burden = clamp(cfg().burden - 1, 0, Save.data.burdenMax); Snd.play('select'); }, false);
    centerText(String(cfg().burden), 160, by + 14, `bold 16px ${FONT_SERIF}`, '#fff');
    drawButton('+', 176, by, 28, 28, () => { cfg().burden = clamp(cfg().burden + 1, 0, Save.data.burdenMax); Snd.play('select'); }, false);
    leftText('враги крепче, угли — щедрее', 216, by + 14, `11px ${FONT_SANS}`, '#8a8494');
  } else leftText('Победи Безымянного, чтобы открыть Бремя — усложнение спуска.', 44, by + 14, `italic 11px ${FONT_SERIF}`, '#5b5666');
}
function renderCampLavka() {
  leftText('Товары покупаются за монеты (их дают Выживание и ежедневные забеги) и применяются в следующем спуске', 44, 130, `italic 11px ${FONT_SERIF}`, '#8a8494');
  const colW = 428, rowH = 66, x0 = 44, y0 = 146;
  LAVKA.forEach((it, i) => {
    const col = Math.floor(i / 4), row = i % 4, x = x0 + col * (colW + 16), y = y0 + row * (rowH + 6);
    const have = Save.data.armed[it.id] || 0, afford = Save.data.coins >= it.cost && have < LAVKA_MAX, sel = lavkaSel === i;
    const b = { x, y, w: colW, h: rowH, action: () => { lavkaSel = i; buyLavka(i); } };
    uiButtons.push(b);
    ctx.fillStyle = sel ? 'rgba(214,162,58,0.12)' : 'rgba(10,8,16,0.8)'; ctx.fillRect(x, y, colW, rowH);
    ctx.strokeStyle = sel ? '#d6a23a' : (hovered(b) ? '#8a7240' : '#2e2a36'); ctx.lineWidth = sel ? 1.8 : 1; ctx.strokeRect(x + 0.5, y + 0.5, colW - 1, rowH - 1);
    leftText(it.name, x + 12, y + 18, `bold 14px ${FONT_SERIF}`, '#e7e5e4');
    wrapText(it.desc, x + 12, y + 40, colW - 150, 13, `11px ${FONT_SANS}`, '#8a8494');
    rightText(have >= LAVKA_MAX ? 'ЗАПАС' : `${it.cost} мон.`, x + colW - 12, y + 20, `bold 13px ${FONT_SANS}`, have >= LAVKA_MAX ? '#86efac' : afford ? '#e5e7eb' : '#7f1d1d');
    rightText(`в запасе: ${have}/${LAVKA_MAX}`, x + colW - 12, y + 44, `11px ${FONT_SANS}`, have ? '#fbbf24' : '#5b5666');
  });
}

function drawHeroPortrait(id, cx, cy, s, bright) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  shadowEllipse(0, 20, 16, 5, 0.5);
  drawHeroFigure(id, 0, 0, 1, 0, false);
  // фонарь
  if (id !== 'fallen') {
    const fl = 0.8 + Math.sin(time * 11) * 0.12;
    glow(12, 8, 16, '#fbbf24', bright ? 0.8 : 0.4);
    ctx.strokeStyle = '#6b5a2e'; ctx.lineWidth = 1.5; ctx.strokeRect(8, 4, 8, 9);
    ctx.fillStyle = `rgba(251,191,36,${0.9 * fl})`; ctx.beginPath(); ctx.arc(12, 8.5, 3, 0, 7); ctx.fill();
  } else {
    glow(14, -14, 14, '#f59e0b', bright ? 0.8 : 0.4);
    ctx.fillStyle = '#b91c1c'; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(14, -20); ctx.lineTo(19, -14); ctx.lineTo(14, -8); ctx.lineTo(9, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// ---------- НАСТРОЙКИ ----------
const SETTINGS_ROWS = [
  { name: 'Язык', get: () => LANG === 'ru' ? 'Русский' : 'English', step() { toggleLang(); } },
  { name: 'Музыка', get: () => Math.round(cfg().music * 100) + '%', step(d) { cfg().music = clamp(Math.round((cfg().music + d * 0.1) * 10) / 10, 0, 1); Snd.applyVolumes(); } },
  { name: 'Эффекты', get: () => Math.round(cfg().sfx * 100) + '%', step(d) { cfg().sfx = clamp(Math.round((cfg().sfx + d * 0.1) * 10) / 10, 0, 1); Snd.applyVolumes(); Snd.play('hit'); } },
  { name: 'Яркость мира', get: () => cfg().bright < 1 ? 'темнее' : cfg().bright > 1 ? 'светлее' : 'обычная', step(d) { const v = [0.8, 1, 1.2]; const i = clamp(v.indexOf(cfg().bright) + d, 0, 2); cfg().bright = v[i < 0 ? 1 : i]; } },
  { name: 'Тряска экрана', get: () => cfg().shake >= 1 ? 'полная' : cfg().shake > 0 ? 'слабая' : 'выкл', step(d) { const v = [0, 0.5, 1]; const i = clamp(v.indexOf(cfg().shake) + d, 0, 2); cfg().shake = v[i < 0 ? 2 : i]; } },
  { name: 'Числа урона', get: () => cfg().numbers ? 'вкл' : 'выкл', step() { cfg().numbers = !cfg().numbers; } },
  { name: 'Сюжетные вставки', get: () => cfg().story !== false ? 'вкл' : 'выкл', step() { cfg().story = cfg().story === false; } }
];
function renderSettings() {
  uiButtons = [];
  drawMenuBackdrop();
  centerText('НАСТРОЙКИ', W / 2, 58, `bold 30px ${FONT_SERIF}`, '#f1e3b8', 10, 6);
  SETTINGS_ROWS.forEach((r, i) => {
    const y = 96 + i * 54, sel = settingsSel === i;
    ctx.fillStyle = sel ? 'rgba(214,162,58,0.12)' : 'rgba(10,8,16,0.8)'; ctx.fillRect(W / 2 - 250, y, 500, 44);
    ctx.strokeStyle = sel ? '#d6a23a' : '#2e2a36'; ctx.lineWidth = sel ? 1.8 : 1; ctx.strokeRect(W / 2 - 249.5, y + 0.5, 499, 43);
    leftText(r.name, W / 2 - 230, y + 22, `bold 16px ${FONT_SERIF}`, '#e7e5e4');
    drawButton('‹', W / 2 + 60, y + 7, 30, 30, () => { settingsSel = i; r.step(-1); Save.store(); Snd.play('select'); }, false);
    centerText(r.get(), W / 2 + 150, y + 22, `bold 14px ${FONT_SANS}`, '#fde68a');
    drawButton('›', W / 2 + 210, y + 7, 30, 30, () => { settingsSel = i; r.step(1); Save.store(); Snd.play('select'); }, false);
  });
  drawButton('Назад', W / 2 - 60, H - 84, 120, 38, () => { state = 'title'; Save.store(); Snd.play('select'); }, false);
  centerText('W/S — строка · A/D — изменить · Esc — назад', W / 2, H - 38, `11px ${FONT_SANS}`, '#5b5666');
}

// ---------- ХРОНИКИ ----------
function renderChronicle() {
  uiButtons = [];
  drawMenuBackdrop();
  const found = NOTES.filter(n => Save.data.notes[n.id]).length;
  centerText('ХРОНИКИ АЛЬМАРА', W / 2, 52, `bold 28px ${FONT_SERIF}`, '#f1e3b8', 10, 5);
  centerText(`Найдено записей: ${found} из ${NOTES.length}`, W / 2, 80, `12px ${FONT_SANS}`, '#8a8494');
  NOTES.forEach((n, i) => {
    const col = Math.floor(i / 16), row = i % 16, x = 40 + col * 200, y = 98 + row * 25;
    const known = !!Save.data.notes[n.id];
    const b = { x, y, w: 192, h: 22, action: () => { chronSel = i; Snd.play('select'); } };
    uiButtons.push(b);
    const sel = chronSel === i;
    ctx.fillStyle = sel ? 'rgba(214,162,58,0.14)' : 'rgba(10,8,16,0.75)'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = sel ? '#d6a23a' : (hovered(b) ? '#8a7240' : '#2e2a36'); ctx.lineWidth = sel ? 1.6 : 1; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    leftText(known ? n.title : '· · ·', x + 8, y + 12, `${known ? 'bold ' : ''}11px ${FONT_SERIF}`, known ? '#e7d9b0' : '#4a4452');
    if (hovered(b)) chronSel = i;
  });
  const n = NOTES[chronSel], known = !!Save.data.notes[n.id];
  const px = 450, py = 98, pw = 470, ph = 400;
  ctx.fillStyle = 'rgba(26,20,12,0.92)'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 2; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.strokeStyle = 'rgba(138,109,59,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(px + 8.5, py + 8.5, pw - 17, ph - 17);
  if (known) {
    centerText(n.title, px + pw / 2, py + 44, `bold 22px ${FONT_SERIF}`, '#f1e3b8', 0, 1);
    ctx.strokeStyle = '#8a6d3b'; ctx.beginPath(); ctx.moveTo(px + 120, py + 66); ctx.lineTo(px + pw - 120, py + 66); ctx.stroke();
    wrapText(n.text, px + pw / 2, py + 110, pw - 90, 28, `italic 17px ${FONT_SERIF}`, '#e7d9b0', 'center');
  } else centerText('Запись ещё не найдена. Ищи свитки в комнатах глубин.', px + pw / 2, py + ph / 2, `italic 15px ${FONT_SERIF}`, '#6b5a3a');
  drawButton('Назад', 40, H - 70, 110, 34, () => { state = 'title'; Snd.play('select'); }, false);
  centerText('W/S, A/D — выбор · Esc — назад', W / 2, H - 36, `11px ${FONT_SANS}`, '#5b5666');
}

// ---------- РЕЛИКВИИ ----------
const CODEX_COLS = 17;
function renderRelics() {
  uiButtons = [];
  drawMenuBackdrop();
  const found = RELICS.filter(r => Save.data.discovered[r.id]).length;
  centerText('РЕЛИКВИИ И АРТЕФАКТЫ', W / 2, 46, `bold 26px ${FONT_SERIF}`, '#f1e3b8', 10, 4);
  centerText(`Открыто: ${found} / ${RELICS.length}`, W / 2, 72, `12px ${FONT_SANS}`, '#8a8494');
  const cols = CODEX_COLS, cw = 54, ch = 47, x0 = W / 2 - cols * cw / 2, y0 = 90;
  RELICS.forEach((it, i) => {
    const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * ch;
    const known = !!Save.data.discovered[it.id], locked = !relicUnlocked(it);
    const b = { x, y, w: cw - 4, h: ch - 4, action: () => { codexSel = i; Snd.play('select'); } };
    uiButtons.push(b);
    const hot = codexSel === i || hovered(b);
    ctx.fillStyle = hot ? 'rgba(214,162,58,0.16)' : 'rgba(10,8,16,0.75)'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = hot ? '#d6a23a' : (it.curse && known ? '#7f1d1d' : '#2e2a36'); ctx.lineWidth = hot ? 1.8 : 1; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    if (known) drawSigil(it, x + b.w / 2, y + b.h / 2, 16);
    else if (locked) { ctx.fillStyle = '#4a4452'; ctx.fillRect(x + b.w / 2 - 7, y + b.h / 2 - 2, 14, 11); ctx.strokeStyle = '#4a4452'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + b.w / 2, y + b.h / 2 - 2, 5, Math.PI, 0); ctx.stroke(); }
    else centerText('?', x + b.w / 2, y + b.h / 2, `bold 18px ${FONT_SERIF}`, '#3a3542');
    if (hovered(b)) codexSel = i;
  });
  codexSel = clamp(codexSel, 0, RELICS.length - 1);
  const it = RELICS[codexSel], known = !!Save.data.discovered[it.id], locked = !relicUnlocked(it);
  const py = y0 + Math.ceil(RELICS.length / cols) * ch + 6;
  ctx.fillStyle = 'rgba(10,8,16,0.88)'; ctx.fillRect(W / 2 - 360, py, 720, 78);
  ctx.strokeStyle = known ? it.color : '#2e2a36'; ctx.lineWidth = 1.6; ctx.strokeRect(W / 2 - 359.5, py + 0.5, 719, 77);
  if (known) {
    drawSigil(it, W / 2 - 322, py + 39, 25);
    leftText(tr(it.name) + (it.active ? tr(`  · артефакт, ${it.active.max} зарядов`) : '') + (it.curse ? tr('  · ПРОКЛЯТИЕ') : ''), W / 2 - 286, py + 22, `bold 18px ${FONT_SERIF}`, it.curse ? '#fb7185' : it.color);
    leftText(it.desc, W / 2 - 286, py + 46, `13px ${FONT_SANS}`, '#d6d3d1');
    leftText(SCHOOLS[it.school].name, W / 2 - 286, py + 64, `italic 11px ${FONT_SERIF}`, '#6b6676');
  } else centerText(locked ? `Закрыто: открывается улучшением «Архив реликвий» (ур. ${it.tier})` : 'Реликвия ещё не найдена', W / 2, py + 39, `italic 14px ${FONT_SERIF}`, '#6b6676');
  drawButton('Назад', 40, H - 60, 110, 34, () => { state = 'title'; Snd.play('select'); }, false);
}

// ---------- КАК ИГРАТЬ ----------
function renderHelp() {
  uiButtons = [];
  drawMenuBackdrop();
  centerText('КАК ИГРАТЬ', W / 2, 46, `bold 28px ${FONT_SERIF}`, '#f1e3b8', 10, 6);
  const lines = [
    ['W A S D', 'ходьба'], ['Мышь / ЛКМ', 'прицел и атака'], ['ПКМ или X', 'умение героя'], ['Пробел / Shift', 'рывок: короткая неуязвимость'], ['Q', 'зажигательная склянка в курсор'],
    ['F', 'выпить зелье'], ['E', 'артефакт (заряжается за комнаты)'], ['Tab (держать)', 'характеристики и карта'], ['Esc / P', 'пауза'], ['R (держать)', 'начать заново']
  ];
  lines.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    leftText(k, 60 + col * 430, 88 + row * 24, `bold 13px ${FONT_SERIF}`, '#fde68a');
    leftText(v, 190 + col * 430, 88 + row * 24, `12px ${FONT_SANS}`, '#d6d3d1');
  });
  const tips = [
    'Фонарь — твоя жизнь: масло тает, свет сужается. Пополняй его огоньками душ, флаконами и костром.',
    'Тени неуязвимы во тьме — выманивай их на свет. Светоеды пьют масло из фонаря.',
    'Тайные ходы проявляются, если постоять у стены на свету. В тайной комнате иногда сидит Шляпник — играй с умом.',
    '✦ реликварий, $ торговец, ♨ костёр, ☠ босс, ! событие-развилка, » испытание. Три реликвии одной школы дают Обет.',
    'Проклятые реликвии очень сильны, но у каждой есть цена. Исповедник и ребёнок со свечой могут снять проклятие.',
    'Выживание: бесконечные волны и боссы, награда — угли и монеты для лавки. Ежедневный забег один на всех, с модификатором дня.',
    'Сид задаёт карту, врагов и события: поделись кодом — и друг увидит те же комнаты. Секретных героев и концовки ищи сам.'
  ];
  tips.forEach((t, i) => wrapText('• ' + tr(t), 60, 236 + i * 40, 840, 16, `13px ${FONT_SERIF}`, '#a8a29e'));
  drawButton('Назад', W / 2 - 60, H - 56, 120, 36, () => { state = 'title'; Snd.play('select'); }, false);
}

// ---------- ПАУЗА ----------
const PAUSE_ITEMS = ['Продолжить', 'Звук: ', 'Покинуть спуск'];
function pauseAction(i) {
  Snd.play('confirm');
  if (i === 0) state = 'play';
  else if (i === 1) Snd.setMuted(!Snd.muted);
  else { endRun(false); }
}
function renderPause() {
  uiButtons = [];
  renderGame();
  ctx.fillStyle = 'rgba(4,3,8,0.86)'; ctx.fillRect(0, HUD_H, W, H - HUD_H);
  renderStatsPanel(false);
  centerText('ПАУЗА', W - 168, 100, `bold 30px ${FONT_SERIF}`, '#f1e3b8', 10, 6);
  PAUSE_ITEMS.forEach((label, i) => {
    let txt = i === 1 ? tr(label) + tr(Snd.muted ? 'выкл' : 'вкл') : label;
    if (i === 2 && run.mode === 'survival') txt = 'Завершить и забрать награду';
    drawButton(txt, W - 290, 140 + i * 54, 240, 42, () => pauseAction(i), pauseSel === i);
  });
  if (run.mode !== 'survival') renderMinimap(W - 290, 320, 240, 170, 22, 0.95);
  centerText(`${MODE_NAMES[run.mode]} · сид ${run.seedStr}`, W - 170, 306, `11px ${FONT_MONO}`, '#94a3b8');
  if (run.mod) centerText(`${tr(run.mod.name)}: ${tr(run.mod.desc)}`, W - 170, 500, `italic 11px ${FONT_SERIF}`, '#fbbf24');
}

// ---------- КОНЕЦ СПУСКА ----------
function renderEnd(win) {
  uiButtons = [];
  renderGame();
  ctx.fillStyle = 'rgba(4,3,8,0.92)'; ctx.fillRect(0, HUD_H, W, H - HUD_H);
  const col = win ? '#fbbf24' : '#e11d48';
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(44.5, HUD_H + 24.5, W - 89, H - HUD_H - 49);
  ctx.strokeStyle = 'rgba(214,162,58,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(52.5, HUD_H + 32.5, W - 105, H - HUD_H - 65);
  const surv = run.mode === 'survival';
  const endTitle = win ? (ENDINGS[run.ending || 'light'][2].title) : (surv ? 'КОНЕЦ ВЫЖИВАНИЯ' : 'ФОНАРЬ ПОГАС');
  centerText(endTitle, W / 2, 100, `bold ${tr(endTitle).length > 14 ? 38 : 46}px ${FONT_SERIF}`, col, 22, 7);
  if (win) wrapText(ENDINGS[run.ending || 'light'][2].text, W / 2, 138, 760, 20, `italic 14px ${FONT_SERIF}`, '#e7e1d0', 'center');
  else centerText(surv ? `Ты продержался до волны ${run.wave}` : DEATH_LINES[(run.kills + run.floorReached) % DEATH_LINES.length], W / 2, 148, `italic 16px ${FONT_SERIF}`, '#cfc8b8');
  const rows = [
    ['Герой', HEROES[run.hero].name], ['Режим', MODE_NAMES[run.mode]], ['Время', fmtTime(run.time)],
    [surv ? 'Волна' : 'Глубина', surv ? run.wave : `${run.floorReached} / ${MAX_FLOOR}`],
    ['Убито', run.kills], ['Боссов', run.bossKills], ['Получено ударов', run.hits], ['Счёт', run.score]
  ];
  rows.forEach(([k, v], i) => {
    const colx = i < 4 ? W / 2 - 330 : W / 2 + 30, yy = 206 + (i % 4) * 25;
    leftText(k, colx, yy, `14px ${FONT_SANS}`, '#8a8494');
    rightText(String(v), colx + 300, yy, `bold 14px ${FONT_SANS}`, '#f1f5f9');
  });
  const earned = Math.round(run.embers * clamp(endTimer / 1.4, 0, 1));
  drawPickupSprite('oil', W / 2 - 150, 330, 0.9);
  centerText(`+${earned} углей`, W / 2 - 66, 330, `bold 20px ${FONT_SERIF}`, '#fbbf24', 8);
  if (run.coins > 0) { drawPickupSprite('silver', W / 2 + 40, 330, 1); centerText(`+${Math.round(run.coins * clamp(endTimer / 1.4, 0, 1))} монет`, W / 2 + 112, 330, `bold 18px ${FONT_SERIF}`, '#e5e7eb'); }
  if (run.record) centerText(surv ? 'НОВЫЙ РЕКОРД ВОЛН!' : 'РЕКОРД ДНЯ!', W / 2, 360, `bold 13px ${FONT_SERIF}`, '#fb7185', 8, 2);
  if (run.bonusEmbers) centerText(`из них найдено в спуске: ${run.bonusEmbers}`, W / 2, 380, `11px ${FONT_SANS}`, '#8a8494');
  const ids = run.collected.slice(0, 26);
  ids.forEach((id, i) => { const it = RELIC_BY_ID[id]; if (it) drawSigil(it, W / 2 - (Math.min(ids.length, 13) - 1) * 17 + (i % 13) * 34, 424 + Math.floor(i / 13) * 34, 14); });
  drawButton('В лагерь (Enter)', W / 2 - 230, H - 78, 210, 42, () => { openCamp(run.mode); selHero = Math.max(0, HERO_ORDER.indexOf(run.hero)); Snd.play('select'); }, false, '#fbbf24');
  drawButton('Снова (R)', W / 2 + 20, H - 78, 210, 42, () => restartRun(), false);
}

// ---------- ВВОД: клавиши и мышь ----------
const navDelta = code => (code === 'KeyW' || code === 'ArrowUp') ? -1 : (code === 'KeyS' || code === 'ArrowDown') ? 1 : 0;
const horizDelta = code => (code === 'KeyA' || code === 'ArrowLeft') ? -1 : (code === 'KeyD' || code === 'ArrowRight') ? 1 : 0;
const isConfirm = c => c === 'Enter' || c === 'Space' || c === 'NumpadEnter';

function handleKey(code) {
  if (code === 'KeyM') { Snd.setMuted(!Snd.muted); if (state === 'play') showMessage(Snd.muted ? 'Звук выключен' : 'Звук включён'); return; }
  if (code === 'KeyL' && state !== 'seed' && state !== 'play' && state !== 'pause') { toggleLang(); return; }
  switch (state) {
    case 'title': {
      const d = navDelta(code), h = horizDelta(code);
      if (d) { const colItems = menuColumn(MENU_ITEMS[menuSel].col); const k = colItems.indexOf(menuSel); menuSel = colItems[(k + d + colItems.length) % colItems.length]; Snd.play('select'); }
      else if (h) {
        const c = MENU_ITEMS[menuSel].col, row = menuColumn(c).indexOf(menuSel);
        const nc = clamp(c + h, 0, 2), items = menuColumn(nc);
        menuSel = items[Math.min(row, items.length - 1)]; Snd.play('select');
      } else if (isConfirm(code)) menuAction(menuSel);
      break;
    }
    case 'camp': {
      const h = horizDelta(code), v = navDelta(code);
      if (code === 'Tab') { campTab = (campTab + 1) % 3; Snd.play('select'); }
      else if (code === 'Digit1' || code === 'Digit2' || code === 'Digit3') { campTab = +code.slice(-1) - 1; Snd.play('select'); }
      else if (campTab === 0) {
        if (h) selHero = clamp(selHero + h, 0, HERO_ORDER.length - 1);
        else if (v) selHero = clamp(selHero + v * 5, 0, HERO_ORDER.length - 1);
        if (h || v) Snd.play('select');
        else if (code === 'Enter') buyHero(selHero);
      } else if (campTab === 1) {
        if (v) { campSel = clamp(campSel + v, 0, CAMP_UPGRADES.length - 1); Snd.play('select'); }
        else if (h) { campSel = clamp(campSel + h * 6, 0, CAMP_UPGRADES.length - 1); Snd.play('select'); }
        else if (code === 'Enter') buyUpgrade(campSel);
      } else {
        if (v) { lavkaSel = clamp(lavkaSel + v, 0, LAVKA.length - 1); Snd.play('select'); }
        else if (h) { lavkaSel = clamp(lavkaSel + h * 4, 0, LAVKA.length - 1); Snd.play('select'); }
        else if (code === 'Enter') buyLavka(lavkaSel);
      }
      if (code === 'Space') startFromCamp();
      else if (code === 'Escape') state = 'title';
      break;
    }
    case 'settings': {
      const v = navDelta(code), h = horizDelta(code);
      if (v) { settingsSel = (settingsSel + v + SETTINGS_ROWS.length) % SETTINGS_ROWS.length; Snd.play('select'); }
      else if (h) { SETTINGS_ROWS[settingsSel].step(h); Save.store(); Snd.play('select'); }
      else if (code === 'Escape' || code === 'Enter') { Save.store(); state = 'title'; }
      break;
    }
    case 'chronicle': {
      const v = navDelta(code), h = horizDelta(code);
      if (v) chronSel = clamp(chronSel + v, 0, NOTES.length - 1);
      else if (h) chronSel = clamp(chronSel + h * 16, 0, NOTES.length - 1);
      else if (code === 'Escape' || code === 'Enter') state = 'title';
      break;
    }
    case 'relics': {
      const h = horizDelta(code), v = navDelta(code), cols = CODEX_COLS;
      if (h) codexSel = (codexSel + h + RELICS.length) % RELICS.length;
      else if (v) codexSel = clamp(codexSel + v * cols, 0, RELICS.length - 1);
      else if (code === 'Escape' || code === 'Enter') state = 'title';
      break;
    }
    case 'help':
      if (code === 'Escape' || isConfirm(code)) state = 'title';
      break;
    case 'achievements': case 'bestiary': case 'stats': case 'seed': case 'story': case 'event': case 'hatter':
      handleKey2(code);
      break;
    case 'play':
      if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') tryDash((keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0));
      else if (code === 'KeyE') useActive();
      else if (code === 'KeyQ') throwFlask();
      else if (code === 'KeyF') drinkPotion();
      else if (code === 'Escape' || code === 'KeyP') { state = 'pause'; pauseSel = 0; }
      break;
    case 'pause': {
      const d = navDelta(code);
      if (code === 'Escape' || code === 'KeyP') state = 'play';
      else if (d) { pauseSel = (pauseSel + d + PAUSE_ITEMS.length) % PAUSE_ITEMS.length; Snd.play('select'); }
      else if (isConfirm(code)) pauseAction(pauseSel);
      break;
    }
    case 'dead':
    case 'win':
      if (endTimer < 0.6) break;
      if (code === 'Enter') { openCamp(run.mode); selHero = Math.max(0, HERO_ORDER.indexOf(run.hero)); Snd.play('select'); }
      else if (code === 'KeyR' || code === 'Space') { restartRun(); if (code === 'KeyR') restartHold = -2; }
      else if (code === 'Escape') { state = 'title'; menuSel = 0; }
      break;
  }
}

function handleClick(x, y) {
  if (state === 'play') return;
  if ((state === 'dead' || state === 'win') && endTimer < 0.6) return;
  for (let i = uiButtons.length - 1; i >= 0; i--) {
    const b = uiButtons[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.action(); return; }
  }
  // Крупная зона касания для мелких пунктов меню на экранах телефонов.
  if (mobileInput.active && Date.now() - mobileInput.lastTouch < 900) {
    let nearest = null, dmin = 20;
    for (const b of uiButtons) {
      const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
      const dy = Math.max(b.y - y, 0, y - (b.y + b.h));
      const d = Math.hypot(dx, dy);
      if (d < dmin) { dmin = d; nearest = b; }
    }
    if (nearest) { nearest.action(); return; }
  }
  if (state === 'story') storyAdvance();
}
