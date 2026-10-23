'use strict';
/* =====================================================================
   HAZARDS: телеграфируемые угрозы — круги, лучи и зоны тьмы.
   Сначала появляется предупреждение (warn), затем удар. kind:
     'strike'    — разовый удар в момент срабатывания
     'lingering' — после срабатывания ранит каждые 0.5 с, пока длится life
   ===================================================================== */
const HAZARD_COL = {
  red:   ['rgba(239,68,68,', '#fecaca'], bone:  ['rgba(214,211,209,', '#fafaf9'], green: ['rgba(132,204,22,', '#ecfccb'],
  ice:   ['rgba(56,189,248,', '#e0f2fe'], void:  ['rgba(109,40,217,', '#ddd6fe'], fire:  ['rgba(251,146,60,', '#fef9c3'],
  earth: ['rgba(161,98,7,', '#fde68a'], water: ['rgba(34,211,238,', '#ecfeff']
};

function addHazard(o) {
  const h = Object.assign({
    shape: 'circle', x: CX, y: CY, r: 40, ang: 0, len: 700, w: 34, warn: 0.8, life: 0.25, dmg: dmgScale(10), col: 'red',
    t: 0, fired: false, active: false, kind: 'strike', tick: 0, slow: false, owner: null
  }, o);
  hazards.push(h);
  return h;
}

function hazardContains(h, x, y, r) {
  if (h.shape === 'circle') return Math.hypot(x - h.x, y - h.y) < h.r + r;
  const dx = x - h.x, dy = y - h.y, c = Math.cos(h.ang), s = Math.sin(h.ang);
  const along = dx * c + dy * s, across = Math.abs(-dx * s + dy * c);
  return along > -r && along < h.len + r && across < h.w / 2 + r;
}

function hazardHit(h) {
  const p = player;
  if (p.dead) return;
  if (hazardContains(h, p.x, p.y, p.r * 0.7)) {
    if (!p.fly || h.kind === 'lingering' || h.shape === 'line') {
      const hit = hurtPlayer(h.dmg, null);
      if (hit && h.slow) p.slowT = Math.max(p.slowT, 1.8);
    }
  }
}

function updateHazards(dt) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.t += dt;
    if (!h.fired && h.t >= h.warn) {
      h.fired = true; h.active = true;
      if (h.kind === 'strike') {
        hazardHit(h);
        shake = Math.max(shake, h.shape === 'line' ? 5 : 4);
        const cx = h.shape === 'circle' ? h.x : h.x + Math.cos(h.ang) * 80, cy = h.shape === 'circle' ? h.y : h.y + Math.sin(h.ang) * 80;
        spawnParticles(cx, cy, 8, HAZARD_COL[h.col] ? HAZARD_COL[h.col][1] : '#fff');
        Snd.play(h.col === 'ice' ? 'shield' : 'stomp');
      } else h.tick = 0;
    }
    if (h.active && h.kind === 'lingering') {
      h.tick -= dt;
      if (h.tick <= 0) { h.tick = 0.5; hazardHit(h); }
    }
    if (h.t >= h.warn + h.life) hazards.splice(i, 1);
  }
}

function drawHazards() {
  for (const h of hazards) {
    const pal = HAZARD_COL[h.col] || HAZARD_COL.red;
    const warn = h.t < h.warn;
    const k = warn ? h.t / h.warn : 1 - Math.min(1, (h.t - h.warn) / Math.max(0.05, h.life));
    ctx.save();
    if (h.shape === 'circle') {
      if (warn) {
        ctx.fillStyle = pal[0] + (0.10 + k * 0.22 + Math.sin(time * 22) * 0.04) + ')';
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.74, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = pal[0] + '0.85)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.74, 0, 0, 7); ctx.stroke();
        ctx.strokeStyle = pal[0] + '0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * (1 - k * 0.92) + 2, h.r * 0.74 * (1 - k * 0.92) + 2, 0, 0, 7); ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.r);
        const a = h.kind === 'lingering' ? 0.45 + Math.sin(time * 6) * 0.08 : 0.7 * k;
        g.addColorStop(0, pal[0] + a + ')'); g.addColorStop(0.7, pal[0] + a * 0.55 + ')'); g.addColorStop(1, pal[0] + '0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * 1.05, h.r * 0.78, 0, 0, 7); ctx.fill();
        if (h.kind === 'lingering') {
          ctx.strokeStyle = pal[0] + '0.7)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.74, 0, 0, 7); ctx.stroke();
          for (let i = 0; i < 4; i++) { const a2 = time * 1.6 + i * 1.57; ctx.fillStyle = pal[1]; ctx.globalAlpha = 0.5; ctx.fillRect(h.x + Math.cos(a2) * h.r * 0.6, h.y + Math.sin(a2) * h.r * 0.42 - ((time * 30 + i * 9) % 18), 2, 2); }
        }
      }
    } else {
      ctx.translate(h.x, h.y); ctx.rotate(h.ang);
      if (warn) {
        ctx.fillStyle = pal[0] + (0.08 + k * 0.2 + Math.sin(time * 24) * 0.03) + ')';
        ctx.fillRect(0, -h.w / 2, h.len, h.w);
        ctx.strokeStyle = pal[0] + '0.75)'; ctx.lineWidth = 2;
        ctx.strokeRect(0, -h.w / 2, h.len, h.w);
        ctx.fillStyle = pal[0] + '0.5)'; ctx.fillRect(0, -h.w / 2 * (1 - k), h.len, h.w * (1 - k));
      } else {
        const g = ctx.createLinearGradient(0, -h.w / 2, 0, h.w / 2);
        g.addColorStop(0, pal[0] + '0)'); g.addColorStop(0.5, pal[0] + (0.85 * k) + ')'); g.addColorStop(1, pal[0] + '0)');
        ctx.fillStyle = g; ctx.fillRect(0, -h.w / 2 - 4, h.len, h.w + 8);
        ctx.fillStyle = pal[1]; ctx.globalAlpha = 0.6 * k; ctx.fillRect(0, -2, h.len, 4);
      }
    }
    ctx.restore();
  }
}
