'use strict';
/* =====================================================================
   RENDER_ENT2: рисование новых врагов и боссов v2.0
   ===================================================================== */
Object.assign(ENEMY_ART, {
  beetle(e) {
    const a = (e.state === 'wind' || e.state === 'roll') ? e.dirA : angTo(e, player);
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(a);
    const roll = e.state === 'roll';
    if (!roll) {
      ctx.strokeStyle = '#0b0a10'; ctx.lineWidth = 2;
      const w = Math.sin(time * 22 + e.x) * 3;
      for (const sg of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 5, sg * 6); ctx.lineTo(i * 5 + (i + w * sg * 0.3), sg * 13); ctx.stroke(); }
    }
    const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, e.r + 3);
    g.addColorStop(0, '#9aa3b2'); g.addColorStop(0.6, '#4b5262'); g.addColorStop(1, '#14161d');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, 0, roll ? e.r * 0.95 : e.r * 1.15, roll ? e.r * 0.95 : e.r * 0.88, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-e.r, 0); ctx.lineTo(e.r * 0.8, 0); ctx.moveTo(-e.r * 0.2, -e.r * 0.8); ctx.quadraticCurveTo(e.r * 0.2, 0, -e.r * 0.2, e.r * 0.8); ctx.stroke();
    ctx.fillStyle = '#d6cfb4'; ctx.fillRect(-e.r * 0.6, -3, 2.5, 6); // надпись на плите
    if (!roll) { ctx.fillStyle = '#20232b'; ctx.beginPath(); ctx.arc(e.r * 1.05, 0, 5, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    if (!roll) glowEyes(e.x + Math.cos(a) * (e.r + 1), e.y + Math.sin(a) * (e.r + 1) - 1, 2.2, 1.1, e.state === 'wind' ? '#ef4444' : '#fbbf24');
  },
  hand(e) {
    const a = angTo(e, player);
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(a);
    ctx.fillStyle = '#d6cfb4'; ctx.strokeStyle = '#2a2414'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 6.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      const w = Math.sin(time * 9 + i * 1.3 + e.x) * 0.25;
      ctx.strokeStyle = '#2a2414'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(6, i * 2.6); ctx.lineTo(13, i * 4 + w * 6); ctx.lineTo(18, i * 5.2 + w * 12); ctx.stroke();
      ctx.strokeStyle = '#e7e1c8'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(6, i * 2.6); ctx.lineTo(13, i * 4 + w * 6); ctx.lineTo(18, i * 5.2 + w * 12); ctx.stroke();
    }
    ctx.fillStyle = '#3b2a1b'; ctx.fillRect(-14, -4, 8, 8);
    ctx.restore();
    if (e.t < 0.9) glow(e.x, e.y, 22, '#a8a29e', 0.3);
  },
  weeper(e) {
    const bob = Math.sin(time * 3 + e.x) * 2;
    ctx.save(); ctx.globalAlpha = 0.9;
    const g = ctx.createLinearGradient(e.x, e.y - 14, e.x, e.y + 22); g.addColorStop(0, 'rgba(203,225,232,0.95)'); g.addColorStop(1, 'rgba(94,140,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(e.x - 10, e.y - 6 + bob); ctx.quadraticCurveTo(e.x - 18, e.y + 12, e.x - 12, e.y + 24 + bob); for (let i = 5; i >= -5; i--) ctx.lineTo(e.x + i * 2.4, e.y + 22 + (i % 2 ? 6 : 0) + bob); ctx.quadraticCurveTo(e.x + 18, e.y + 12, e.x + 10, e.y - 6 + bob); ctx.closePath(); ctx.fill();
    ball(e.x, e.y - 10 + bob, 8.5, '#eef6f6', '#b9d2d4', '#5b7d82', '#1b2a2c', 1.5);
    ctx.fillStyle = 'rgba(30,50,60,0.8)'; ctx.beginPath(); ctx.moveTo(e.x - 10, e.y - 14 + bob); ctx.quadraticCurveTo(e.x, e.y - 24 + bob, e.x + 10, e.y - 14 + bob); ctx.lineTo(e.x + 8, e.y - 6 + bob); ctx.lineTo(e.x - 8, e.y - 6 + bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0b1c20'; ctx.beginPath(); ctx.ellipse(e.x - 3, e.y - 10 + bob, 1.4, 2.4, 0, 0, 7); ctx.ellipse(e.x + 3, e.y - 10 + bob, 1.4, 2.4, 0, 0, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#7dd3fc';
    for (const sg of [-1, 1]) { const ty = e.y - 5 + bob + ((time * 30 + sg * 9) % 20); ctx.beginPath(); ctx.arc(e.x + sg * 3, ty, 1.5, 0, 7); ctx.fill(); }
  },
  chorister(e) {
    const bob = Math.sin(time * 4 + e.x) * 1.4;
    const sing = e.cd < 0.5;
    if (sing) glow(e.x, e.y - 6, 40, '#fde68a', 0.45);
    ctx.fillStyle = '#e7e1c8'; ctx.strokeStyle = '#2a2414'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(e.x - 9, e.y + 14 + bob); ctx.quadraticCurveTo(e.x - 12, e.y - 2, e.x - 6, e.y - 8 + bob); ctx.lineTo(e.x + 6, e.y - 8 + bob); ctx.quadraticCurveTo(e.x + 12, e.y - 2, e.x + 9, e.y + 14 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b91c1c'; ctx.fillRect(e.x - 7, e.y + 6 + bob, 14, 3);
    ball(e.x, e.y - 10 + bob, 7.6, '#f4eed8', '#cfc4a0', '#6e6347', '#241d10', 1.6);
    ctx.fillStyle = '#120d06'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 8 + bob, 2.6, sing ? 3.6 : 1.8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x - 3, e.y - 12 + bob, 1, 0, 7); ctx.arc(e.x + 3, e.y - 12 + bob, 1, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(e.x, e.y - 21 + bob, 7, 2.4, 0, 0, 7); ctx.stroke();
    if (sing) { ctx.fillStyle = '#fde68a'; for (let i = 0; i < 3; i++) { const nx = e.x + 10 + i * 6, ny = e.y - 14 - ((time * 40 + i * 12) % 22); ctx.beginPath(); ctx.ellipse(nx, ny, 2.4, 1.8, -0.4, 0, 7); ctx.fill(); ctx.fillRect(nx + 1.6, ny - 7, 1.2, 7); } }
  },
  thornroot(e) {
    const warn = e.cd < 1 ? 1 - e.cd : 0;
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.strokeStyle = '#1b3a14'; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(Math.cos(a) * 14, 6 + Math.sin(a) * 6 + 4, Math.cos(a) * 24, 10 + Math.sin(a) * 9); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#2f5d1f'; ctx.strokeStyle = '#0b1c07'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, 10); ctx.quadraticCurveTo(-11, -6, -5, -14); ctx.lineTo(5, -14); ctx.quadraticCurveTo(11, -6, 9, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6e8a8';
    for (let i = 0; i < 6; i++) { const y = -10 + i * 4, sx = i % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(sx * 8, y); ctx.lineTo(sx * 15, y - 2); ctx.lineTo(sx * 8, y + 3); ctx.fill(); }
    ctx.rotate(e.face || 0);
    ball(6, -2, 8 + warn * 3, warn > 0.2 ? '#fde68a' : '#a3e635', '#3f6212', '#14260a', '#0b1c07', 1.8);
    ctx.restore();
    if (warn > 0) glow(e.x + Math.cos(e.face) * 8, e.y + Math.sin(e.face) * 8, 22, '#a3e635', 0.6 * warn);
  },
  frostcaster(e) {
    const a = angTo(e, player), bob = Math.sin(time * 3 + e.x) * 1.5;
    ctx.fillStyle = '#7dd3fc'; ctx.strokeStyle = '#082f49'; ctx.lineWidth = 1.8;
    const g = ctx.createLinearGradient(e.x, e.y - 10, e.x, e.y + 18); g.addColorStop(0, '#bae6fd'); g.addColorStop(1, '#0c4a6e'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(e.x - 11, e.y + 18 + bob); ctx.quadraticCurveTo(e.x - 14, e.y - 4, e.x - 6, e.y - 9 + bob); ctx.lineTo(e.x + 6, e.y - 9 + bob); ctx.quadraticCurveTo(e.x + 14, e.y - 4, e.x + 11, e.y + 18 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ball(e.x, e.y - 12 + bob, 8, '#1e3a5f', '#0c1f3a', '#040a14', '#000', 1.8);
    glowEyes(e.x + Math.cos(a) * 1.5, e.y - 12 + bob, 3, 1.2, '#e0f2fe');
    ctx.save(); ctx.translate(e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 8); ctx.rotate(a);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(14, 0); ctx.stroke();
    const f = e.cd < 0.7 ? 1.6 : 1; glow(16, 0, 12 * f, '#7dd3fc', 0.7);
    ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(21, 0); ctx.lineTo(14, 5); ctx.lineTo(11, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  abyssal(e) {
    const t = time * 3 + e.x;
    glow(e.x, e.y, e.r * 2, '#6d28d9', 0.3);
    ctx.fillStyle = '#05010a'; ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, r = e.r + Math.sin(a * 3 + t) * 3.2 + Math.sin(a * 5 - t * 1.4) * 1.6; const x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r * 0.95; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(109,40,217,0.8)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const a = t * 0.4 + i * 1.57; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * e.r * 0.8, e.y + Math.sin(a) * e.r * 0.8); ctx.quadraticCurveTo(e.x + Math.cos(a + 0.5) * e.r * 1.5, e.y + Math.sin(a + 0.5) * e.r * 1.5, e.x + Math.cos(a + 0.2) * e.r * 1.9, e.y + Math.sin(a + 0.2) * e.r * 1.9); ctx.stroke(); }
    ctx.lineCap = 'butt';
    glowEyes(e.x, e.y - 2, 4.4, 2.2, '#c4b5fd');
    ctx.fillStyle = '#c4b5fd'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 5, 3, 1.4, 0, 0, 7); ctx.fill();
  },
  mimic(e) {
    const a = e.state === 'lunge' || e.state === 'wind' ? e.dirA : angTo(e, player);
    const open = e.state === 'wind' || e.state === 'lunge' ? 10 : 4 + Math.sin(time * 5) * 1.5;
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.fillStyle = '#5a3a1c'; ctx.strokeStyle = '#1c0e04'; ctx.lineWidth = 2.2;
    ctx.fillRect(-15, -4, 30, 17); ctx.strokeRect(-15, -4, 30, 17);
    ctx.fillStyle = '#d6a23a'; ctx.fillRect(-15, 3, 30, 3);
    // пасть
    ctx.fillStyle = '#2b0709'; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(0, -4 - open, 14, -4); ctx.lineTo(14, -2); ctx.lineTo(-14, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6e4723'; ctx.beginPath(); ctx.moveTo(-15, -4 - open * 0.2); ctx.quadraticCurveTo(0, -20 - open * 1.2, 15, -4 - open * 0.2); ctx.quadraticCurveTo(0, -8 - open, -15, -4 - open * 0.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 4 - 1.6, -3); ctx.lineTo(i * 4, 2); ctx.lineTo(i * 4 + 1.6, -3); ctx.fill(); }
    ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 2, -1, 4, 1.6 + open * 0.15, 0, 0, 7); ctx.fill();
    ctx.restore();
    glowEyes(e.x + Math.cos(a), e.y - 11 - open * 0.4, 5, 1.8, '#fde047');
  }
});

Object.assign(BOSS_ART, {
  gravedigger(e) {
    const a = angTo(e, player);
    const swing = e.state === 'swing';
    ctx.save(); ctx.translate(e.x, e.y);
    // лопата
    ctx.save(); ctx.rotate(swing ? e.aimA - 0.3 + Math.min(1, (0.62 - e.t) / 0.4) * 1.0 : a + 0.4);
    ctx.strokeStyle = '#5b3a1e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(e.r + 34, 0); ctx.stroke();
    ctx.fillStyle = '#9aa3b2'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(e.r + 26, -9); ctx.lineTo(e.r + 52, -7); ctx.quadraticCurveTo(e.r + 58, 0, e.r + 52, 7); ctx.lineTo(e.r + 26, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // сутулое тело
    const g = ctx.createRadialGradient(-6, -4, 4, 0, 6, e.r + 6); g.addColorStop(0, '#4a4036'); g.addColorStop(1, '#0d0b09');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 8, e.r * 0.95, e.r * 0.85, 0, 0, 7); ctx.fill(); ctx.stroke();
    // фонарь на поясе
    glow(e.r * 0.7, 14, 20, '#fbbf24', 0.55);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(e.r * 0.7 - 3, 11, 6, 7);
    // голова и шляпа
    ball(0, -14, 14, '#c9c0a6', '#8d8467', '#3b3724', '#1a1710', 2.4);
    ctx.fillStyle = '#16120d'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -22, 24, 6, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillRect(-12, -38, 24, 17); ctx.strokeRect(-12, -38, 24, 17);
    ctx.fillStyle = '#a16207'; ctx.fillRect(-12, -26, 24, 4);
    glowEyes(0, -14, 5.5, 2.5, e.phase === 2 ? '#f87171' : '#fbbf24');
    ctx.fillStyle = '#05020a'; ctx.beginPath(); ctx.ellipse(0, -6, 5, 2.4, 0, 0, 7); ctx.fill();
    ctx.restore();
    if (e.state === 'dig' && e.spot) { ctx.strokeStyle = 'rgba(180,83,9,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.spot.x, e.spot.y); ctx.stroke(); ctx.setLineDash([]); }
  },
  bellringer(e) {
    const x = e.x, y = e.y, sw = Math.sin(e.swing) * 0.22;
    ctx.save(); ctx.translate(x, y - 18); ctx.rotate(sw);
    ctx.strokeStyle = '#3f2a14'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -e.r - 6); ctx.lineTo(0, -e.r + 8); ctx.stroke();
    const g = ctx.createLinearGradient(-e.r, 0, e.r, 0); g.addColorStop(0, '#6b4a1a'); g.addColorStop(0.35, '#d6a23a'); g.addColorStop(0.7, '#8d6a24'); g.addColorStop(1, '#3a2a0c');
    ctx.fillStyle = g; ctx.strokeStyle = '#1a1204'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(-e.r * 0.4, -e.r + 8); ctx.quadraticCurveTo(-e.r * 0.8, -e.r * 0.2, -e.r * 1.05, e.r * 0.65); ctx.lineTo(e.r * 1.05, e.r * 0.65); ctx.quadraticCurveTo(e.r * 0.8, -e.r * 0.2, e.r * 0.4, -e.r + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; for (const k of [-0.45, 0, 0.45]) { ctx.beginPath(); ctx.moveTo(k * e.r * 0.5, -e.r + 14); ctx.lineTo(k * e.r * 1.3, e.r * 0.62); ctx.stroke(); }
    ctx.fillStyle = '#031a1c'; ctx.beginPath(); ctx.ellipse(0, e.r * 0.65, e.r * 1.0, 8, 0, 0, 7); ctx.fill();
    // водоросли
    ctx.strokeStyle = 'rgba(21,128,98,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-e.r + i * e.r * 0.4, e.r * 0.6); ctx.quadraticCurveTo(-e.r + i * e.r * 0.4 + Math.sin(time * 2 + i) * 6, e.r * 0.9, -e.r + i * e.r * 0.4 + Math.sin(time * 2.4 + i) * 9, e.r * 1.2); ctx.stroke(); }
    ctx.lineCap = 'butt';
    // язык-колокольчик с черепом
    ctx.save(); ctx.translate(Math.sin(e.swing + 1) * 14, e.r * 0.62); skull(0, 4, 8); ctx.restore();
    ctx.restore();
    glowEyes(x, y - e.r * 0.4, 12, 3.4, e.phase === 2 ? '#f87171' : '#5eead4');
    ctx.strokeStyle = 'rgba(94,234,212,0.4)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.3 - i * 0.08; ctx.beginPath(); ctx.arc(x, y, e.r + 8 + i * 8 + Math.sin(time * 3 + i) * 2, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
  },
  collector(e) {
    const x = e.x, y = e.y;
    // орбитальные кости
    for (let i = 0; i < 9; i++) {
      const a = e.ang * (i % 2 ? 1 : -1) + i / 9 * Math.PI * 2, r = e.r + 18 + (i % 3) * 8;
      const bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r * 0.85;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(a * 2);
      ctx.fillStyle = '#e7e1c8'; ctx.strokeStyle = '#2a2414'; ctx.lineWidth = 1.6;
      ctx.fillRect(-9, -2, 18, 4); ctx.strokeRect(-9, -2, 18, 4);
      ctx.beginPath(); ctx.arc(-9, 0, 3.2, 0, 7); ctx.arc(9, 0, 3.2, 0, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // грудная клетка
    ctx.fillStyle = '#cfc4a0'; ctx.strokeStyle = '#241d10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y + 8, e.r * 0.85, e.r * 0.8, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6e6347'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - e.r * 0.7, y - 4 + i * 8); ctx.quadraticCurveTo(x, y + 2 + i * 8, x + e.r * 0.7, y - 4 + i * 8); ctx.stroke(); }
    // мелкие черепа на плечах
    skull(x - e.r * 0.85, y - 6, 8); skull(x + e.r * 0.85, y - 6, 8);
    skull(x, y - 18, 17, e);
    ctx.fillStyle = '#241d10'; ctx.beginPath(); ctx.moveTo(x - 14, y - 32); ctx.lineTo(x - 8, y - 44); ctx.lineTo(x, y - 33); ctx.lineTo(x + 8, y - 44); ctx.lineTo(x + 14, y - 32); ctx.closePath(); ctx.fill();
    glowEyes(x, y - 19, 7, 2.8, e.phase === 2 ? '#f87171' : '#a3e635');
  },
  thornqueen(e) {
    const x = e.x, y = e.y;
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) { // лианы
      const a = i / 12 * Math.PI * 2 + time * 0.2, len = 54 + Math.sin(time * 2 + i * 1.4) * 8;
      ctx.strokeStyle = '#14301a'; ctx.lineWidth = 5 - (i % 3);
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16 + 10);
      ctx.quadraticCurveTo(x + Math.cos(a + 0.5) * len * 0.6, y + Math.sin(a + 0.5) * len * 0.6 + 10, x + Math.cos(a + 0.2) * len, y + Math.sin(a + 0.2) * len + 10); ctx.stroke();
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(x + Math.cos(a + 0.2) * len, y + Math.sin(a + 0.2) * len + 10, 3, 0, 7); ctx.fill();
    }
    ctx.lineCap = 'butt';
    // платье из лепестков
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * 0.15 + i / 10 * Math.PI * 0.7;
      ctx.save(); ctx.translate(x, y + 6); ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, e.r + 14, 0); g.addColorStop(0, '#9f1239'); g.addColorStop(1, '#fb7185');
      ctx.fillStyle = g; ctx.strokeStyle = '#4c0519'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.quadraticCurveTo(e.r * 0.8, -12, e.r + 14, 0); ctx.quadraticCurveTo(e.r * 0.8, 12, 6, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ball(x, y - 6, 16, '#e8d8d0', '#b9a094', '#4a3a34', '#241008', 2.4);
    glowEyes(x, y - 8, 6, 2.6, '#fde047');
    ctx.fillStyle = '#05010a'; ctx.beginPath(); ctx.ellipse(x, y + 2, 4, e.state === 'thorns' ? 3.4 : 1.8, 0, 0, 7); ctx.fill();
    // шипастая корона
    ctx.strokeStyle = '#14301a'; ctx.fillStyle = '#365314'; ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 3.6 - 2, y - 19); ctx.lineTo(x + i * 3.6, y - 32 - (4 - Math.abs(i)) * 2.4); ctx.lineTo(x + i * 3.6 + 2, y - 19); ctx.fill(); ctx.stroke(); }
  },
  blizzard(e) {
    const x = e.x, y = e.y;
    glow(x, y, e.r * 2.6, '#bae6fd', 0.25);
    // платье из метели
    ctx.save(); ctx.globalAlpha = 0.88;
    const g = ctx.createLinearGradient(x, y - 20, x, y + 50); g.addColorStop(0, '#f0f9ff'); g.addColorStop(0.6, '#93c5fd'); g.addColorStop(1, 'rgba(147,197,253,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 18, y - 6); ctx.quadraticCurveTo(x - e.r - 14, y + 20, x - e.r - 4, y + 52); for (let i = 8; i >= -8; i--) ctx.lineTo(x + i * 5, y + 50 + (i % 2 ? 10 : 0) + Math.sin(time * 3 + i) * 3); ctx.quadraticCurveTo(x + e.r + 14, y + 20, x + 18, y - 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    // волосы-метель
    ctx.strokeStyle = 'rgba(224,242,254,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(x + (i - 4) * 3, y - 16); ctx.quadraticCurveTo(x + (i - 4) * 9 + Math.sin(time * 4 + i) * 8, y + 8, x + (i - 4) * 12 + Math.sin(time * 3 + i) * 12, y + 34); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ball(x, y - 14, 13, '#f5fbff', '#bfe0f5', '#5a86ab', '#0c2a44', 2);
    glowEyes(x, y - 15, 5, 2.4, e.phase === 2 ? '#f87171' : '#38bdf8');
    // ледяная корона
    ctx.fillStyle = '#e0f2fe'; ctx.strokeStyle = '#0c4a6e'; ctx.lineWidth = 1.6;
    for (let i = -3; i <= 3; i++) { const h = 12 + (3 - Math.abs(i)) * 4; ctx.beginPath(); ctx.moveTo(x + i * 4.4 - 2.2, y - 24); ctx.lineTo(x + i * 4.4, y - 24 - h); ctx.lineTo(x + i * 4.4 + 2.2, y - 24); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (e.state === 'gale') { ctx.strokeStyle = 'rgba(224,242,254,0.35)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x, y, 50 + ((time * 120 + i * 40) % 170), 0, 7); ctx.stroke(); } }
  },
  keeper(e) {
    const x = e.x, y = e.y, a = angTo(e, player);
    const guard = e.state === 'guard';
    // чёрный плащ
    const g = ctx.createRadialGradient(x - 6, y - 8, 4, x, y + 4, e.r + 10); g.addColorStop(0, '#2a2433'); g.addColorStop(1, '#050408');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - e.r - 4, y + e.r); ctx.quadraticCurveTo(x - e.r - 10, y - 6, x - 14, y - e.r + 6); ctx.lineTo(x + 14, y - e.r + 6); ctx.quadraticCurveTo(x + e.r + 10, y - 6, x + e.r + 4, y + e.r); for (let i = 5; i >= -5; i--) ctx.lineTo(x + i * 7, y + e.r - 2 + (i % 2 ? 9 : 0)); ctx.closePath(); ctx.fill(); ctx.stroke();
    // доспех
    ctx.fillStyle = '#6b7280'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.ellipse(x, y + 4, e.r * 0.6, e.r * 0.7, 0, 0, 7); ctx.fill(); ctx.stroke();
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sg * (e.r * 0.72), y - 8, 13, 10, sg * 0.3, 0, 7); ctx.fill(); ctx.stroke(); }
    // шлем
    ball(x, y - 18, 16, '#d1d5db', '#6b7280', '#1f2937', '#0b0f17', 2.4);
    ctx.fillStyle = '#0b0f17'; ctx.fillRect(x - 11, y - 21, 22, 5);
    glowEyes(x + Math.cos(a) * 2, y - 19, 5, 2, e.phase === 3 ? '#fb7185' : '#fb923c');
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y - 33); ctx.quadraticCurveTo(x - 14, y - 40, x - 26, y - 28); ctx.stroke(); ctx.lineCap = 'butt';
    // пылающий меч
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + 0.2);
    ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 2;
    ctx.fillRect(e.r * 0.4, -3, 50, 6); ctx.strokeRect(e.r * 0.4, -3, 50, 6);
    ctx.beginPath(); ctx.moveTo(e.r * 0.4 + 50, -3); ctx.lineTo(e.r * 0.4 + 62, 0); ctx.lineTo(e.r * 0.4 + 50, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    glow(e.r * 0.4 + 30, 0, 38, '#fb923c', 0.55 + Math.sin(time * 14) * 0.12);
    ctx.fillStyle = '#a16207'; ctx.fillRect(e.r * 0.4 - 8, -7, 5, 14);
    ctx.restore();
    // щит
    ctx.save(); ctx.translate(x - Math.cos(a) * 14, y + 4 - Math.sin(a) * 6); ctx.rotate(a + Math.PI);
    ctx.fillStyle = guard ? '#f1f5f9' : '#4b5563'; ctx.strokeStyle = guard ? '#fde68a' : '#111827'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, -22); ctx.quadraticCurveTo(18, -18, 18, 0); ctx.quadraticCurveTo(18, 18, -6, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (guard) glow(6, 0, 44, '#fde68a', 0.6);
    ctx.restore();
    if (e.say) {
      const tw = e.say.txt.length * 9 + 26, bx = clamp(x - tw / 2, 20, W - tw - 20), by = y - e.r - 70;
      ctx.fillStyle = 'rgba(12,6,4,0.9)'; ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2;
      ctx.fillRect(bx, by, tw, 30); ctx.strokeRect(bx, by, tw, 30);
      ctx.fillStyle = '#fed7aa'; ctx.font = `italic 14px ${FONT_SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tr(e.say.txt), bx + tw / 2, by + 15);
    }
  }
});

// знак «скрыт»: бугорок земли, вихрь Бездны и т. п.
function drawHiddenEnemy(e) {
  if (e.type === 'abyssal') {
    for (let i = 0; i < 5; i++) { const a = time * 5 + i * 1.26; ctx.fillStyle = 'rgba(109,40,217,0.6)'; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 6, 2.4, 0, 7); ctx.fill(); }
    return;
  }
  if (e.type === 'blizzard') {
    for (let i = 0; i < 6; i++) { const a = time * 6 + i * 1.05; ctx.fillStyle = 'rgba(224,242,254,0.7)'; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 16, e.y + Math.sin(a) * 8, 2, 0, 7); ctx.fill(); }
    return;
  }
  const w = e.isBoss ? Math.min(e.r, 34) : 11;
  ctx.fillStyle = '#3b2a1b'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 8, w, w * 0.45, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#4a3320'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 5, w * 0.7, w * 0.3, 0, 0, 7); ctx.fill();
  if (Math.random() < 0.15) spawnParticles(e.x, e.y + 6, 1, '#4a3320');
}
