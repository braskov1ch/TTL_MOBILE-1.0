'use strict';
/* =====================================================================
   RENDER_ENT: рисование врагов и боссов
   ===================================================================== */
const lookDir = e => { const a = angTo(e, player); return [Math.cos(a), Math.sin(a)]; };
function glowEyes(x, y, gap, r, col = '#fbbf24', px = 0, py = 0) {
  glow(x - gap, y, r * 3, col, 0.5); glow(x + gap, y, r * 3, col, 0.5);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x - gap + px, y + py, r, 0, 7); ctx.arc(x + gap + px, y + py, r, 0, 7); ctx.fill();
}
function skull(x, y, r, e) {
  ball(x, y, r, '#f4eed8', '#cfc4a0', '#6e6347', '#241d10', 1.8);
  ctx.fillStyle = '#120d06';
  ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.08, r * 0.24, r * 0.3, 0, 0, 7); ctx.ellipse(x + r * 0.38, y - r * 0.08, r * 0.24, r * 0.3, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.1); ctx.lineTo(x - r * 0.1, y + r * 0.3); ctx.lineTo(x + r * 0.1, y + r * 0.3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#120d06'; ctx.lineWidth = 1.3;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * r * 0.18, y + r * 0.55); ctx.lineTo(x + i * r * 0.18, y + r * 0.82); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * 0.62); ctx.lineTo(x + r * 0.45, y + r * 0.62); ctx.stroke();
}

const ENEMY_ART = {
  bat(e) {
    const w = Math.sin(time * 30 + e.x) * 9;
    ctx.fillStyle = '#2a1f3d'; ctx.strokeStyle = '#0d0818'; ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(e.x, e.y - 2); ctx.quadraticCurveTo(e.x + s * 14, e.y - 14 + w, e.x + s * 22, e.y - 2 + w * 0.5);
      ctx.quadraticCurveTo(e.x + s * 16, e.y + 2, e.x + s * 11, e.y + 3); ctx.quadraticCurveTo(e.x + s * 6, e.y + 1, e.x, e.y + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ball(e.x, e.y, e.r - 3, '#4a3a63', '#2a1f3d', '#0d0818', '#0d0818', 1.5);
    ctx.fillStyle = '#2a1f3d'; ctx.beginPath(); ctx.moveTo(e.x - 5, e.y - 6); ctx.lineTo(e.x - 6, e.y - 13); ctx.lineTo(e.x - 1, e.y - 8); ctx.moveTo(e.x + 5, e.y - 6); ctx.lineTo(e.x + 6, e.y - 13); ctx.lineTo(e.x + 1, e.y - 8); ctx.fill();
    glowEyes(e.x, e.y - 1, 3, 1.5, '#f87171');
  },
  ghoul(e) {
    const bob = Math.sin(time * 7 + e.x) * 1.4;
    ball(e.x, e.y + bob, e.r, '#9aa58a', '#5d6850', '#222a1c', '#0d120a');
    ctx.strokeStyle = '#2a3322'; ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * 10, e.y + 2 + bob); ctx.lineTo(e.x + s * 19, e.y + 11 + bob); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.x + s * 19, e.y + 11 + bob); ctx.lineTo(e.x + s * 22, e.y + 16 + bob); ctx.moveTo(e.x + s * 19, e.y + 11 + bob); ctx.lineTo(e.x + s * 17, e.y + 17 + bob); ctx.stroke(); }
    ctx.fillStyle = '#0a0d07'; ctx.beginPath(); ctx.ellipse(e.x - 5, e.y - 3 + bob, 3.4, 4.2, 0, 0, 7); ctx.ellipse(e.x + 5, e.y - 3 + bob, 3.4, 4.2, 0, 0, 7); ctx.fill();
    glowEyes(e.x, e.y - 3 + bob, 5, 1.4, '#fde047');
    ctx.fillStyle = '#2b0a0a'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 7 + bob, 5, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#d6d3c4'; for (let i = -1; i <= 1; i++) ctx.fillRect(e.x + i * 3 - 0.7, e.y + 4.5 + bob, 1.4, 2.5);
  },
  archer(e) {
    const a = angTo(e, player);
    ctx.fillStyle = '#d6cfb4'; ctx.strokeStyle = '#2a2414'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(e.x, e.y + 8, 7, 9, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6e6347'; ctx.lineWidth = 1.3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(e.x - 5, e.y + 4 + i * 4); ctx.lineTo(e.x + 5, e.y + 4 + i * 4); ctx.stroke(); }
    skull(e.x, e.y - 4, 9, e);
    glowEyes(e.x, e.y - 5, 3.4, 1.4, '#7dd3fc');
    ctx.save(); ctx.translate(e.x, e.y + 4); ctx.rotate(a);
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(14, -12); ctx.quadraticCurveTo(22, 0, 14, 12); ctx.stroke();
    ctx.strokeStyle = '#e7e5e4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, -12); ctx.lineTo(e.cd < 0.4 ? 8 : 14, 0); ctx.lineTo(14, 12); ctx.stroke();
    if (e.cd < 0.4) { ctx.strokeStyle = '#d6d3d1'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(26, 0); ctx.stroke(); }
    ctx.restore();
  },
  hound(e) {
    ctx.save(); ctx.translate(e.x, e.y);
    if (e.state === 'wind' || e.state === 'dash') ctx.rotate(e.dirA + Math.PI / 2); else ctx.rotate(angTo(e, player) + Math.PI / 2);
    if (e.state === 'wind') ctx.translate(Math.sin(time * 90) * 1.5, 0);
    const leg = Math.sin(time * 28) * 3;
    ctx.strokeStyle = '#0b0a10'; ctx.lineWidth = 2.5;
    for (const s of [-1, 1]) for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(s * 7, i * 7); ctx.lineTo(s * 12, i * 10 + leg * s * i); ctx.stroke(); }
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, e.r);
    g.addColorStop(0, e.state === 'wind' ? '#7f1d1d' : '#3b3548'); g.addColorStop(1, '#0a0910');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 2, e.r * 0.75, e.r * 1.15, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a0910'; ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(-9, -22); ctx.lineTo(-2, -14); ctx.moveTo(7, -12); ctx.lineTo(9, -22); ctx.lineTo(2, -14); ctx.fill();
    ctx.restore();
    glowEyes(e.x + Math.cos(e.state === 'dash' || e.state === 'wind' ? e.dirA : angTo(e, player)) * 7, e.y + Math.sin(e.state === 'dash' || e.state === 'wind' ? e.dirA : angTo(e, player)) * 7 - 2, 3, 1.5, '#ef4444');
  },
  leaper(e) {
    const k = e.state === 'hop' ? 1 - e.t / 0.42 : 0;
    const lift = Math.sin(k * Math.PI) * 18;
    const squash = e.state === 'wait' && e.t < 0.35 ? 0.8 : 1;
    ctx.save(); ctx.translate(e.x, e.y - lift); ctx.scale(1 + (1 - squash) * 0.5, squash);
    ball(0, 0, e.r, '#b7bfa4', '#6c7658', '#252c1b', '#0c1008');
    ctx.fillStyle = '#d9dec7'; ctx.beginPath(); ctx.arc(-6, -9, 4.5, 0, 7); ctx.arc(6, -9, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#0c1008'; ctx.beginPath(); ctx.arc(-6, -9, 2, 0, 7); ctx.arc(6, -9, 2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#0c1008'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 2, 6, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.restore();
  },
  spider(e) {
    ctx.strokeStyle = '#0b0a10'; ctx.lineWidth = 1.6;
    const w = Math.sin(time * 40 + e.x) * 3;
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const y0 = -4 + i * 3; ctx.beginPath(); ctx.moveTo(e.x, e.y + y0); ctx.lineTo(e.x + s * 10, e.y + y0 - 4 + (i % 2 ? w : -w)); ctx.lineTo(e.x + s * 15, e.y + y0 + 5); ctx.stroke(); }
    ball(e.x, e.y, e.r, '#4b4560', '#1d1a29', '#050408', '#000');
    ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.arc(e.x, e.y + 3, 3.5, 0, 7); ctx.fill();
    glowEyes(e.x, e.y - 3, 2.6, 1.2, '#f87171');
  },
  sporepod(e) {
    const pulse = 1 + Math.sin(time * 5 + e.x) * 0.06;
    for (const s of [-1, 1]) { ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y + 4); ctx.quadraticCurveTo(e.x + s * 12, e.y + 14, e.x + s * 8 + Math.sin(time * 3 + s) * 3, e.y + 22); ctx.stroke(); }
    ball(e.x, e.y, e.r * pulse, '#bef264', '#65a30d', '#1a2e05', '#142204');
    ctx.fillStyle = 'rgba(30,60,5,0.6)'; for (const [ox, oy] of [[-5, -3], [4, -5], [1, 4], [-6, 5], [7, 3]]) { ctx.beginPath(); ctx.arc(e.x + ox, e.y + oy, 2.3, 0, 7); ctx.fill(); }
    glow(e.x, e.y, e.r * 2.2, '#a3e635', 0.2);
  },
  flesh(e) {
    const w = Math.sin(time * 6 + e.x) * 0.08;
    ctx.save(); ctx.translate(e.x, e.y + 2); ctx.scale(1 + w, 1 - w);
    ball(0, 0, e.r, '#d77a8c', '#9d3550', '#3d0d1b', '#1f0510');
    ctx.fillStyle = 'rgba(255,200,210,0.35)'; ctx.beginPath(); ctx.ellipse(-e.r * 0.35, -e.r * 0.45, e.r * 0.25, e.r * 0.14, -0.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3d0d1b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-e.r * 0.6, e.r * 0.1); ctx.lineTo(-e.r * 0.2, e.r * 0.25); ctx.lineTo(e.r * 0.1, e.r * 0.05); ctx.stroke();
    ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.arc(-e.r * 0.28, -e.r * 0.1, e.r * 0.2, 0, 7); ctx.arc(e.r * 0.25, -e.r * 0.18, e.r * 0.15, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a0a0a'; ctx.beginPath(); ctx.arc(-e.r * 0.25, -e.r * 0.08, e.r * 0.09, 0, 7); ctx.arc(e.r * 0.28, -e.r * 0.16, e.r * 0.07, 0, 7); ctx.fill();
    ctx.restore();
  },
  worm(e) {
    const rise = e.state === 'rise' ? 1 - e.t / 0.55 : 1;
    ctx.fillStyle = '#3b2a1b'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 8, e.r * 1.2, e.r * 0.5, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(e.x, e.y + (1 - rise) * 14);
    ctx.strokeStyle = '#6e4d7a'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(Math.sin(time * 4) * 6, 0, 0, -6); ctx.stroke();
    ctx.strokeStyle = '#a77cb8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(Math.sin(time * 4) * 6, 0, 0, -6); ctx.stroke(); ctx.lineCap = 'butt';
    ball(0, -9, 9, '#c9a3d9', '#8b5fa0', '#2e1a3a', '#150a1c');
    ctx.fillStyle = '#1a0a1f'; ctx.beginPath(); ctx.ellipse(0, -7, 5, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e7e5e4'; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4.5, -7 + Math.sin(a) * 3.5); ctx.lineTo(Math.cos(a) * 2.5, -7 + Math.sin(a) * 2); ctx.lineTo(Math.cos(a + 0.4) * 4.5, -7 + Math.sin(a + 0.4) * 3.5); ctx.fill(); }
    ctx.restore();
  },
  gargoyle(e) {
    const firing = e.t < 0.45 && e.t > 0;
    ctx.fillStyle = '#4a4a55'; ctx.strokeStyle = '#0d0d14'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * 8, e.y - 2); ctx.lineTo(e.x + s * 24, e.y - 14); ctx.lineTo(e.x + s * 20, e.y + 4); ctx.lineTo(e.x + s * 8, e.y + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ball(e.x, e.y, e.r - 3, '#8a8a96', '#5a5a66', '#262630', '#0d0d14', 2);
    ctx.fillStyle = '#4a4a55'; ctx.beginPath(); ctx.moveTo(e.x - 8, e.y - 9); ctx.lineTo(e.x - 11, e.y - 19); ctx.lineTo(e.x - 3, e.y - 12); ctx.moveTo(e.x + 8, e.y - 9); ctx.lineTo(e.x + 11, e.y - 19); ctx.lineTo(e.x + 3, e.y - 12); ctx.fill();
    glowEyes(e.x, e.y - 3, 5, firing ? 2.6 : 1.6, firing ? '#f0abfc' : '#7c3aed');
    ctx.fillStyle = '#0d0d14'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, 4, firing ? 4 : 2, 0, 0, 7); ctx.fill();
  },
  necro(e) {
    const bob = Math.sin(time * 3 + e.x) * 2;
    ctx.fillStyle = '#1d1630'; ctx.strokeStyle = '#08050f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(e.x - 13, e.y + 16 + bob); ctx.quadraticCurveTo(e.x - 15, e.y - 4, e.x - 7, e.y - 12 + bob); ctx.lineTo(e.x + 7, e.y - 12 + bob); ctx.quadraticCurveTo(e.x + 15, e.y - 4, e.x + 13, e.y + 16 + bob); for (let i = 3; i >= -3; i--) ctx.lineTo(e.x + i * 4, e.y + 16 + bob + (i % 2 ? 3 : 0)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0b0714'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 6 + bob, 8, 9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e5dfc7'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 5 + bob, 5, 6, 0, 0, 7); ctx.fill();
    glowEyes(e.x, e.y - 6 + bob, 2.2, 1.4, '#a78bfa');
    const a = angTo(e, player);
    ctx.strokeStyle = '#5b4636'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x + 12, e.y + 14 + bob); ctx.lineTo(e.x + 12, e.y - 14 + bob); ctx.stroke();
    glow(e.x + 12, e.y - 16 + bob, 14, '#a78bfa', e.t < 0.6 ? 1 : 0.55);
    ball(e.x + 12, e.y - 16 + bob, 4 + (e.t < 0.6 ? 2 : 0), '#fff', '#c4b5fd', '#5b21b6', null);
  },
  servant(e) {
    const bob = Math.sin(time * 12 + e.x) * 1;
    ctx.fillStyle = '#cfc4a0'; ctx.strokeStyle = '#2a2414'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(e.x, e.y + 6 + bob, 5, 6, 0, 0, 7); ctx.fill(); ctx.stroke();
    skull(e.x, e.y - 3 + bob, 7.5, e);
    glowEyes(e.x, e.y - 4 + bob, 2.8, 1.1, '#a78bfa');
  },
  knight(e) {
    ball(e.x, e.y, e.r, '#9aa3b2', '#5a6272', '#1c2029', '#06080c', 2.4);
    ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.moveTo(e.x - 3, e.y - e.r + 2); ctx.quadraticCurveTo(e.x - 10, e.y - e.r - 8, e.x - 6, e.y - e.r - 12); ctx.lineTo(e.x, e.y - e.r); ctx.fill();
    ctx.fillStyle = '#05060a'; ctx.fillRect(e.x - 7, e.y - 4, 14, 4);
    glowEyes(e.x, e.y - 2, 3.5, 1.1, '#f87171');
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 5, e.face - 1.05, e.face + 1.05); ctx.stroke();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 5, e.face - 1.05, e.face + 1.05); ctx.stroke();
    ctx.lineCap = 'butt';
  },
  golem(e) {
    const p = 1 + Math.sin(time * 3) * 0.03 + (e.t < 0.5 ? 0.08 : 0);
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(p, p);
    ball(0, 0, e.r, '#c98d8d', '#8a4a52', '#2a0f14', '#150608', 2.6);
    ctx.strokeStyle = '#1f0a0e'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(-e.r * 0.6, -e.r * 0.4); ctx.lineTo(e.r * 0.6, e.r * 0.1); ctx.moveTo(e.r * 0.3, -e.r * 0.7); ctx.lineTo(-e.r * 0.2, e.r * 0.5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#140608'; ctx.beginPath(); ctx.arc(-7, -6, 3, 0, 7); ctx.arc(7, -6, 3, 0, 7); ctx.fill();
    glowEyes(0, -6, 7, 1.5, '#fbbf24');
    ctx.fillStyle = '#2a0508'; ctx.beginPath(); ctx.ellipse(0, 8, 9, e.t < 0.5 ? 7 : 4, 0, 0, 7); ctx.fill();
    ctx.restore();
  },
  shade(e) {
    const lit = !!e.lit;
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha || 1) * (lit ? 0.95 : 0.35);
    const w = Math.sin(time * 5 + e.x) * 3;
    ctx.fillStyle = lit ? '#3b2d5c' : '#150f24';
    ctx.beginPath(); ctx.moveTo(e.x - 14, e.y + 14); ctx.quadraticCurveTo(e.x - 18, e.y - 4, e.x - 6, e.y - 15); ctx.lineTo(e.x + 6, e.y - 15); ctx.quadraticCurveTo(e.x + 18, e.y - 4, e.x + 14, e.y + 14);
    for (let i = 4; i >= -4; i--) ctx.lineTo(e.x + i * 3.5, e.y + 14 + (i % 2 ? 6 + w : 0)); ctx.closePath(); ctx.fill();
    if (lit) { ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.restore();
    glowEyes(e.x, e.y - 4, 4.5, lit ? 2 : 1.7, lit ? '#e9d5ff' : '#c4b5fd');
    if (lit) { ctx.strokeStyle = 'rgba(167,139,250,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6 + Math.sin(time * 10) * 2, 0, 7); ctx.stroke(); }
  },
  leech(e) {
    const w = Math.sin(time * 18 + e.x) * 3;
    for (let i = 1; i <= 4; i++) { ctx.fillStyle = `rgba(56,189,248,${0.5 - i * 0.1})`; ctx.beginPath(); ctx.arc(e.x - Math.cos(e.ang || 0) * i * 4, e.y - Math.sin(e.ang || 0) * i * 4 + (i % 2 ? w : -w) * 0.3, e.r - i * 1.5, 0, 7); ctx.fill(); }
    glow(e.x, e.y, e.r * 3, '#38bdf8', 0.4);
    ball(e.x, e.y, e.r, '#1e293b', '#0c4a6e', '#020617', '#0ea5e9', 1.5);
    ctx.fillStyle = e.state === 'dart' ? '#fbbf24' : '#e0f2fe'; ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, 7); ctx.fill();
  },
  cultist(e) {
    const bob = Math.sin(time * 4 + e.x) * 1.5;
    ctx.fillStyle = '#3b1f5c'; ctx.strokeStyle = '#120720'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(e.x - 12, e.y + 15 + bob); ctx.quadraticCurveTo(e.x - 14, e.y - 2, e.x - 6, e.y - 11 + bob); ctx.lineTo(e.x + 6, e.y - 11 + bob); ctx.quadraticCurveTo(e.x + 14, e.y - 2, e.x + 12, e.y + 15 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0b0614'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 5 + bob, 7, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e7e5e4'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 4 + bob, 4.5, 5.5, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x - 3, e.y - 6 + bob); ctx.lineTo(e.x - 1, e.y - 2 + bob); ctx.moveTo(e.x + 3, e.y - 6 + bob); ctx.lineTo(e.x + 1, e.y - 2 + bob); ctx.stroke();
    const casting = e.cd < 0.5;
    glow(e.x, e.y + 4, casting ? 26 : 14, '#a855f7', casting ? 0.9 : 0.4);
    ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y + 5, 7, 0, 7); ctx.stroke();
  }
};

// ---------- БОССЫ ----------
const BOSS_ART = {
  warden(e) {
    ctx.save(); ctx.translate(e.x, e.y - e.jumpH);
    // плечи-латы
    ctx.fillStyle = '#4b505f'; ctx.strokeStyle = '#0b0c12'; ctx.lineWidth = 3;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 30, 8, 16, 12, s * 0.3, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, 12, 28, 24, 0, 0, 7); ctx.fillStyle = '#34384a'; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6e6347'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-18, 2 + i * 6); ctx.lineTo(18, 2 + i * 6); ctx.stroke(); }
    skull(0, -12, 24, e);
    // рога шлема
    ctx.fillStyle = '#2a2a33'; ctx.strokeStyle = '#0b0c12'; ctx.lineWidth = 2.5;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 18, -28); ctx.quadraticCurveTo(s * 34, -34, s * 32, -52); ctx.quadraticCurveTo(s * 24, -40, s * 12, -34); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    glowEyes(0, -14, 9, e.phase === 2 ? 4.4 : 3.6, e.phase === 2 ? '#f87171' : '#7dd3fc');
    ctx.restore();
  },
  drowned(e) {
    const x = e.x, y = e.y;
    ctx.strokeStyle = 'rgba(12,30,36,0.9)'; ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const a = e.rot * 0.4 + i / 14 * Math.PI * 2, len = 54 + Math.sin(time * 2 + i) * 8;
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24);
      ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * len * 0.7, y + Math.sin(a + 0.4) * len * 0.7, x + Math.cos(a + 0.2) * len, y + Math.sin(a + 0.2) * len); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    ball(x, y, e.r - 6, '#d7e8e6', '#9bbcb8', '#3c5a58', '#0f2220', 3);
    ctx.fillStyle = 'rgba(8,22,26,0.7)'; ctx.beginPath(); ctx.ellipse(x - 13, y - 5, 8, 11, 0, 0, 7); ctx.ellipse(x + 13, y - 5, 8, 11, 0, 0, 7); ctx.fill();
    glowEyes(x, y - 4, 13, 3.4, '#5eead4');
    ctx.fillStyle = '#0a1a1c'; ctx.beginPath(); ctx.ellipse(x, y + 17, 9, e.state === 'spin' ? 11 : 6, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(94,234,212,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, y, e.r + 6 + i * 7 + Math.sin(time * 3 + i) * 2, 0, 7); ctx.globalAlpha = 0.25 - i * 0.07; ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) { const yy = y + 4 + ((time * 40 + i * 20) % 36); ctx.fillStyle = 'rgba(94,234,212,0.7)'; ctx.beginPath(); ctx.arc(x + (i - 1.5) * 9, yy, 2, 0, 7); ctx.fill(); }
  },
  reaper(e) {
    const a = (e.state === 'aim' || e.state === 'dash') ? e.dirA : angTo(e, player);
    ctx.save(); ctx.translate(e.x, e.y);
    // коса
    ctx.save(); ctx.rotate(a);
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-e.r - 60, 0); ctx.lineTo(e.r + 40, 0); ctx.stroke();
    ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(e.r + 36, -3); ctx.quadraticCurveTo(e.r + 64, -8, e.r + 60, -50); ctx.quadraticCurveTo(e.r + 38, -22, e.r + 28, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // балахон
    const g = ctx.createRadialGradient(-6, -6, 4, 0, 4, e.r + 6); g.addColorStop(0, '#2c2a38'); g.addColorStop(1, '#07060b');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-e.r + 2, e.r - 4); ctx.quadraticCurveTo(-e.r - 6, -4, -12, -e.r + 4); ctx.lineTo(12, -e.r + 4); ctx.quadraticCurveTo(e.r + 6, -4, e.r - 2, e.r - 4);
    for (let i = 5; i >= -5; i--) ctx.lineTo(i * 6, e.r - 4 + (i % 2 ? 8 : 0)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#05040a'; ctx.beginPath(); ctx.ellipse(0, -10, 15, 16, 0, 0, 7); ctx.fill();
    skull(0, -9, 11, e);
    glowEyes(0, -10, 4.5, 2.4, '#f87171');
    ctx.restore();
    if (e.state === 'stun') for (let i = 0; i < 3; i++) outlinedText('✦', e.x + Math.cos(time * 5 + i * 2.1) * 26, e.y - e.r - 14 + Math.sin(time * 5 + i * 2.1) * 6, '#fde047', 12);
  },
  bloom(e) {
    const sucking = e.state === 'suck';
    ctx.save(); ctx.translate(e.x, e.y);
    // листья
    ctx.fillStyle = '#14532d'; ctx.strokeStyle = '#052e16'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2 + Math.sin(time * 2 + i) * 0.08; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 36, Math.sin(a) * 36 + 14, 26, 9, a, 0, 7); ctx.fill(); ctx.stroke(); }
    // лепестки
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = e.face + i / n * Math.PI * 2 + Math.sin(time * 1.5) * 0.05;
      ctx.save(); ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, e.r + 20, 0); g.addColorStop(0, '#9f1239'); g.addColorStop(1, sucking ? '#fda4af' : '#e11d48');
      ctx.fillStyle = g; ctx.strokeStyle = '#4c0519'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(e.r * 0.8, -20, e.r + 18, 0); ctx.quadraticCurveTo(e.r * 0.8, 20, 10, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // пасть
    ball(0, 0, 22, '#7f1d1d', '#3b0a14', '#0b0206', '#000', 3);
    ctx.save(); ctx.rotate(e.face);
    const open = sucking ? 14 : e.state === 'blast' ? 16 : 7;
    ctx.fillStyle = '#05010a'; ctx.beginPath(); ctx.ellipse(9, 0, 13, open, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f1f5f9';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(4 + Math.abs(i) * 1.5, i * open / 3.2); ctx.lineTo(10 + Math.abs(i), i * open / 3.2 + 2); ctx.lineTo(2 + Math.abs(i), i * open / 3.2 + 3.5); ctx.fill(); }
    ctx.restore();
    glowEyes(0, -14, 8, 2.6, '#fde047', Math.cos(e.face) * 1.5, Math.sin(e.face) * 1.5);
    ctx.restore();
  },
  sarcophagus(e) {
    ctx.save(); ctx.translate(e.x, e.y - e.jumpH);
    const w = e.r * 0.82, h = e.r * 1.3;
    const g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#7d93a8'); g.addColorStop(0.5, '#a8bccd'); g.addColorStop(1, '#4e6378');
    ctx.fillStyle = g; ctx.strokeStyle = '#0e1b27'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-w * 0.8, -h); ctx.lineTo(w * 0.8, -h); ctx.lineTo(w, -h * 0.55); ctx.lineTo(w * 0.7, h); ctx.lineTo(-w * 0.7, h); ctx.lineTo(-w, -h * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (e.doorOpen > 0) {
      ctx.fillStyle = '#04111c'; ctx.beginPath(); ctx.moveTo(-w * 0.6, -h * 0.9); ctx.lineTo(w * 0.6, -h * 0.9); ctx.lineTo(w * 0.78, -h * 0.5); ctx.lineTo(w * 0.5, h * 0.55); ctx.lineTo(-w * 0.5, h * 0.55); ctx.lineTo(-w * 0.78, -h * 0.5); ctx.closePath(); ctx.fill();
      glow(0, -h * 0.2, 60, '#7dd3fc', 0.8);
      ctx.fillStyle = '#e0f2fe'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-w * 0.5 + i * w * 0.25, -h * 0.4 + Math.sin(time * 4 + i) * 4); ctx.lineTo(-w * 0.5 + i * w * 0.25 + 6, -h * 0.4 + 14); ctx.lineTo(-w * 0.5 + i * w * 0.25 - 6, -h * 0.4 + 14); ctx.closePath(); ctx.fill(); }
    } else {
      ctx.strokeStyle = 'rgba(14,27,39,0.8)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, -h * 0.35, 20, 0, 7); ctx.stroke();
      glowEyes(0, -h * 0.4, 8, 3, '#7dd3fc');
      ctx.beginPath(); ctx.moveTo(-10, -h * 0.2); ctx.lineTo(10, -h * 0.2); ctx.moveTo(0, -h * 0.8); ctx.lineTo(0, h * 0.8); ctx.moveTo(-w * 0.5, h * 0.2); ctx.lineTo(w * 0.5, h * 0.2); ctx.stroke();
    }
    ctx.fillStyle = '#05111c'; ctx.beginPath(); ctx.ellipse(0, h * 0.45, 16, e.state === 'volley' ? 10 : 5, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(224,242,254,0.5)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const yy = -h + i * 20; ctx.beginPath(); ctx.moveTo(-w + 6 + (i % 2) * 10, yy); ctx.lineTo(-w + 14 + (i % 2) * 10, yy + 8); ctx.stroke(); }
    ctx.restore();
  },
  nameless(e) {
    const x = e.x, y = e.y, rage = e.phase;
    // щупальца
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + time * 0.3, len = 62 + Math.sin(time * 2 + i * 1.7) * 14 + rage * 8;
      ctx.strokeStyle = 'rgba(20,10,35,0.95)'; ctx.lineWidth = 9 - (i % 3) * 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20);
      ctx.quadraticCurveTo(x + Math.cos(a + Math.sin(time + i) * 0.7) * len * 0.6, y + Math.sin(a + Math.sin(time + i) * 0.7) * len * 0.6, x + Math.cos(a + 0.3) * len, y + Math.sin(a + 0.3) * len); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // корона огня-тьмы
    ctx.strokeStyle = `rgba(167,139,250,${0.5 + Math.sin(time * 3) * 0.2})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, e.r + 12 + Math.sin(time * 2) * 2, 0, 7); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + time * 0.4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (e.r + 12), y + Math.sin(a) * (e.r + 12)); ctx.lineTo(x + Math.cos(a) * (e.r + 24 + (i % 2) * 8), y + Math.sin(a) * (e.r + 24 + (i % 2) * 8)); ctx.stroke(); }
    const g = ctx.createRadialGradient(x - 8, y - 10, 4, x, y, e.r);
    g.addColorStop(0, rage === 3 ? '#4a0e2a' : '#2a1747'); g.addColorStop(0.6, '#0d0618'); g.addColorStop(1, '#020006');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, e.r - 4, 0, 7); ctx.fill(); ctx.stroke();
    // глаза: число растёт с фазой
    const [lx, ly] = lookDir(e);
    const eyes = [[0, -14, 6], [-18, -4, 4.5], [18, -4, 4.5], [-9, 10, 3.5], [9, 10, 3.5], [0, 24, 3]].slice(0, 2 + rage * 1.4 | 0);
    for (const [ox, oy, r] of eyes) glowEyes(x + (ox ? 0 : 0) + ox * (ox === 0 ? 0 : 1), y + oy, 0.01, r, rage === 3 ? '#fb7185' : '#c4b5fd', lx * 1.5, ly * 1.5);
    ctx.fillStyle = '#05010a'; ctx.beginPath(); ctx.ellipse(x, y + 18, 16, (e.state === 'wail' ? 11 : 4), 0, 0, 7); ctx.fill();
    if (e.say) {
      const tw = e.say.txt.length * 9 + 26, bx = clamp(x - tw / 2, 20, W - tw - 20), by = y - e.r - 66;
      ctx.fillStyle = 'rgba(6,3,12,0.9)'; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2;
      ctx.fillRect(bx, by, tw, 30); ctx.strokeRect(bx, by, tw, 30);
      ctx.fillStyle = '#ddd6fe'; ctx.font = `italic 14px ${FONT_SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.say.txt, bx + tw / 2, by + 15);
    }
  }
};

function drawBossMarks(rm) {
  for (const e of rm.enemies) {
    if (!e.isBoss || e.spawnT > 0) continue;
    if (e.jumping) {
      const k = Math.min(1, e.jt);
      ctx.fillStyle = `rgba(0,0,0,${0.25 + k * 0.3})`;
      ctx.beginPath(); ctx.ellipse(e.tx, e.ty + e.r * 0.5, e.r * (0.6 + k * 0.4), e.r * 0.3, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(225,29,72,${0.3 + k * 0.5})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.tx, e.ty, lerp(e.r * 1.8, e.r, k), 0, 7); ctx.stroke();
    }
    if (e.type === 'reaper' && e.state === 'aim') {
      ctx.strokeStyle = `rgba(225,29,72,${0.25 + Math.sin(time * 30) * 0.15})`; ctx.lineWidth = e.r * 1.2;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dirA) * 900, e.y + Math.sin(e.dirA) * 900); ctx.stroke();
    }
    if (e.type === 'nameless') {
      for (const m of e.marks) {
        const k = 1 - m.t / m.max;
        ctx.fillStyle = `rgba(20,5,40,${0.2 + k * 0.4})`; ctx.beginPath(); ctx.ellipse(m.x, m.y + 4, 62, 34, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = `rgba(167,139,250,${0.4 + k * 0.5})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(m.x, m.y + 4, lerp(70, 40, k), lerp(40, 22, k), 0, 0, 7); ctx.stroke();
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(m.x + Math.cos(a) * 12, m.y + Math.sin(a) * 7); ctx.lineTo(m.x + Math.cos(a) * lerp(60, 30, k), m.y + Math.sin(a) * lerp(34, 17, k)); ctx.stroke(); }
      }
    }
    if (e.type === 'bloom' && e.state === 'suck') {
      ctx.strokeStyle = 'rgba(251,191,36,0.2)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(e.x, e.y, 60 + ((time * 120 + i * 40) % 160), 0, 7); ctx.stroke(); }
    }
  }
}

function drawEnemy(e) {
  const boss = !!e.isBoss;
  ctx.save();
  if (e.spawnT > 0) {
    const k = 1 - Math.min(1, e.spawnT / (boss ? 1.4 : 0.8));
    ctx.globalAlpha = 0.15 + 0.6 * k;
    ctx.strokeStyle = boss ? '#e11d48' : '#a8a29e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1.8 - k * 0.8), 0, 7); ctx.stroke();
    if (!boss) { ctx.strokeStyle = 'rgba(167,139,250,0.6)'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1.2 - k * 0.4), 0, 7); ctx.stroke(); }
  }
  if (e.phased) ctx.globalAlpha *= 0.3;
  if (e.hidden) {
    drawHiddenEnemy(e);
    ctx.restore();
    return;
  }
  const lift = e.jumpH || 0;
  shadowEllipse(e.x, e.y + e.r * 0.85, e.r * (0.9 - lift * 0.003), e.r * 0.35, boss ? 0.5 : 0.4);
  (boss ? BOSS_ART[e.type] : ENEMY_ART[e.type])(e);

  if (e.gold > 0) { // золотая статуя
    ctx.save();
    const gg = ctx.createRadialGradient(e.x - e.r * 0.35, e.y - e.r * 0.4, 2, e.x, e.y, e.r * 1.15);
    gg.addColorStop(0, '#fffbeb'); gg.addColorStop(0.35, '#fbbf24'); gg.addColorStop(1, '#78350f');
    ctx.globalAlpha = 0.92; ctx.fillStyle = gg; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, 7); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff';
    const gl = (time * 1.8) % 1; ctx.fillRect(e.x - e.r + gl * e.r * 2, e.y - e.r * 0.6, 3, e.r * 1.2);
    ctx.restore();
    glow(e.x, e.y, e.r + 14, '#fbbf24', 0.35);
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, -Math.PI / 2, -Math.PI / 2 + (e.gold / Math.max(0.1, e.goldMax)) * Math.PI * 2); ctx.stroke();
  }
  if (e.fx.mad > 0) { // безумие: розовый вихрь над головой
    ctx.strokeStyle = 'rgba(244,114,182,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let t2 = 0; t2 <= 1; t2 += 0.1) { const a = time * 7 + t2 * 9, r = 3 + t2 * 9; const px = e.x + Math.cos(a) * r, py = e.y - e.r - 12 + Math.sin(a) * r * 0.5; if (t2 === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
    glow(e.x, e.y, e.r + 8, '#f472b6', 0.18);
  }
  if (e.fx.blind > 0) { ctx.fillStyle = 'rgba(2,6,23,0.85)'; ctx.fillRect(e.x - e.r * 0.7, e.y - e.r * 0.35, e.r * 1.4, e.r * 0.34); outlinedText('?', e.x, e.y - e.r - 14, '#94a3b8', 14); }
  if (e.fx.corrode > 0) { ctx.strokeStyle = 'rgba(163,230,53,0.8)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const bx = e.x + (i - 1) * e.r * 0.5, by = e.y - e.r * 0.4 + ((time * 40 + i * 13) % (e.r * 1.2)); ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 2), 0, 7); ctx.stroke(); } }
  if (e.fx.haste > 0) { ctx.strokeStyle = 'rgba(253,230,138,0.7)'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(e.x - e.r - 4 - i * 4, e.y - 6 + i * 6); ctx.lineTo(e.x - e.r + 8 - i * 4, e.y - 6 + i * 6); ctx.stroke(); } }
  if (e.rotS && e.rotS.n > 0) { for (let i = 0; i < e.rotS.n; i++) { ctx.fillStyle = '#a3e635'; ctx.strokeStyle = '#1a2e05'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x - 8 + i * 8, e.y + e.r + 6, 3.4, 0, 7); ctx.fill(); ctx.stroke(); } }
  if (e.fx.slow > 0) { ctx.strokeStyle = 'rgba(125,211,252,0.8)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  if (e.fx.poison > 0) { ctx.fillStyle = 'rgba(132,204,22,0.25)'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill(); }
  if (e.fx.fear > 0) outlinedText('!', e.x, e.y - e.r - 12, '#c084fc', 16);
  if (e.fx.stun > 0) for (let i = 0; i < 3; i++) outlinedText('✦', e.x + Math.cos(time * 6 + i * 2.1) * 12, e.y - e.r - 6, '#7dd3fc', 10);
  if (e.elite) {
    ctx.strokeStyle = `rgba(251,191,36,${0.55 + Math.sin(time * 8) * 0.3})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 5, 0, 7); ctx.stroke();
    glow(e.x, e.y, e.r + 14, '#fbbf24', 0.25);
    if (e.affix && AFFIXES[e.affix]) outlinedText(AFFIXES[e.affix].label, e.x, e.y - e.r - 22, AFFIXES[e.affix].color, 9);
  }
  if (e.armor >= 0.25 && !(e.fx.corrode > 0)) { ctx.strokeStyle = 'rgba(203,213,225,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  if (e.hitFlash > 0) {
    ctx.globalAlpha = Math.min(0.7, e.hitFlash * 6);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x, e.y - lift, e.r, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (!boss && e.hp < e.maxHp) {
    const bw = Math.max(28, e.r * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(e.x - bw / 2 - 1, e.y - e.r - 13, bw + 2, 6);
    ctx.fillStyle = e.elite ? '#fbbf24' : '#b91c1c'; ctx.fillRect(e.x - bw / 2, e.y - e.r - 12, bw * Math.max(0, e.hp / e.maxHp), 4);
  }
  ctx.restore();
}
