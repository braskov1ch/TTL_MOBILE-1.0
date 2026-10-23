'use strict';
/* =====================================================================
   HERO_EXT: оружие и умения героев v2.0
   Алхимик (кислота, безумие) · Палач (казнь) · Ловчий (ворон) · Некромант (гниение, эхо)
   Падший Алхимик (трансмутация) · Жнец (рывок-бросок, жатва)
   ===================================================================== */

// цель для умений: враг у курсора, иначе ближайший к герою
function pickTarget(maxFromCursor, maxFromPlayer) {
  const p = player;
  const cx = mouse.active ? mouse.x : p.x + p.aim.x * 150, cy = mouse.active ? mouse.y : p.y + p.aim.y * 150;
  let best = null, bd = maxFromCursor;
  for (const e of curRoom.enemies) {
    if (!targetable(e) || e.gold > 0) continue;
    const d = Math.hypot(e.x - cx, e.y - cy) - e.r;
    if (d < bd) { bd = d; best = e; }
  }
  if (best) return best;
  bd = maxFromPlayer;
  for (const e of curRoom.enemies) {
    if (!targetable(e) || e.gold > 0) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y) - e.r;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function cursorPoint(maxDist, fallback = 200) {
  const p = player;
  let tx = mouse.active ? mouse.x : p.x + p.aim.x * fallback, ty = mouse.active ? mouse.y : p.y + p.aim.y * fallback;
  tx = clamp(tx, PLAY.x + 10, PLAY.x + PLAY.w - 10); ty = clamp(ty, PLAY.y + 10, PLAY.y + PLAY.h - 10);
  const d = Math.hypot(tx - p.x, ty - p.y), k = d > maxDist ? maxDist / d : 1;
  return { x: p.x + (tx - p.x) * k, y: p.y + (ty - p.y) * k };
}

// ---------- СТАТУСЫ ----------
function applyRot(e, base) {
  if (!e.rotS) e.rotS = { n: 0, t: 0, tick: 0 };
  e.rotS.n = Math.min(3, e.rotS.n + 1);
  e.rotS.t = 5;
  e.rotDmg = Math.max(e.rotDmg || 0, base * 0.17);
}
function blindEnemy(e, t) {
  if (e.isBoss) { e.fx.slow = Math.max(e.fx.slow, t * 0.6); return; }
  e.fx.blind = Math.max(e.fx.blind, t);
  Stats.add('blinded', 1);
}
function makeStatue(e, t) {
  if (e.isBoss || e.dead || e.gold > 0) return false;
  e.gold = t; e.goldMax = t;
  e.fx.stun = Math.max(e.fx.stun, t); e.fx.fear = 0; e.fx.mad = 0;
  spawnParticles(e.x, e.y, 18, '#fbbf24');
  fxs.push({ type: 'ring', x: e.x, y: e.y, r0: 6, r1: e.r * 2.4, life: 0.4, max: 0.4, color: '#fbbf24' });
  Snd.play('coin');
  return true;
}
function shatterStatue(e) {
  if (e.dead) return;
  e.goldBreak = true; e.gold = 0;
  spawnParticles(e.x, e.y, 26, '#fde047');
  fxs.push({ type: 'ring', x: e.x, y: e.y, r0: 6, r1: 96, life: 0.3, max: 0.3, color: '#fde047' });
  Snd.play('shatter');
  for (const o of curRoom.enemies) { // золотые осколки ранят соседей
    if (o === e || o.dead || o.gold > 0 || !targetable(o)) continue;
    if (Math.hypot(o.x - e.x, o.y - e.y) < 90 + o.r) damageEnemy(o, Math.max(8, player.dmg * 3.2), { quiet: true, color: '#fde047' });
  }
  e.hp = 0;
  killEnemy(e);
}

// ---------- АЛХИМИК ----------
function throwAcid() {
  const p = player, n = 1 + p.projExtra;
  const { crit, dmg } = attackRoll();
  const R = shotRange();
  const tx = mouse.active ? mouse.x : p.x + p.aim.x * 240, ty = mouse.active ? mouse.y : p.y + p.aim.y * 240;
  const base = Math.atan2(ty - p.y, tx - p.x), d = Math.min(Math.hypot(tx - p.x, ty - p.y), R);
  for (let i = 0; i < n; i++) {
    const ang = base + (i - (n - 1) / 2) * 0.3;
    const x1 = clamp(p.x + Math.cos(ang) * d, PLAY.x + 10, PLAY.x + PLAY.w - 10), y1 = clamp(p.y + Math.sin(ang) * d, PLAY.y + 10, PLAY.y + PLAY.h - 10);
    thrown.push({ kind: 'acid', x0: p.x, y0: p.y, x1, y1, t: 0, dur: 0.3 + d / 1100, dmg, crit });
  }
  Snd.play('flask');
}
function acidBurst(x, y, dmg, crit) {
  const p = player, fx = playerFx(true);
  fxs.push({ type: 'ring', x, y, r0: 6, r1: 74, life: 0.35, max: 0.35, color: '#84cc16' });
  spawnParticles(x, y, 18, '#a3e635');
  Snd.play('acid');
  for (const e of curRoom.enemies) {
    if (e.dead) continue;
    if (Math.hypot(e.x - x, e.y - y) < 66 + e.r) {
      if (targetable(e)) {
        e.fx.corrode = Math.max(e.fx.corrode, 4.5);
        strike(e, dmg, { ang: Math.atan2(e.y - y, e.x - x), knock: 0, fx, crit });
      }
    }
  }
  if (curRoom.tiles) { // кислота плавит урны
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = curRoom.tiles[r][c];
      if (t && t.t === 'P' && Math.hypot(tileX(c) - x, tileY(r) - y) < 70) destroyTile(curRoom, c, r);
    }
  }
  const acid = zones.filter(z => z.kind === 'acid');
  if (acid.length >= 7) zones.splice(zones.indexOf(acid[0]), 1);
  zones.push({ kind: 'acid', x, y, r: 62, t: 2.6, max: 2.6, dps: p.dmg * 0.85, tick: 0 });
}
function castMadness() {
  const p = player;
  const pt = cursorPoint(380, 220);
  thrown.push({ kind: 'mad', x0: p.x, y0: p.y, x1: pt.x, y1: pt.y, t: 0, dur: 0.48 });
  Snd.play('flask');
  return true;
}
function madBurst(x, y) {
  zones.push({ kind: 'mad', x, y, r: 104, t: 5, max: 5, dps: 0, tick: 0 });
  fxs.push({ type: 'ring', x, y, r0: 6, r1: 110, life: 0.45, max: 0.45, color: '#f472b6' });
  spawnParticles(x, y, 24, '#f472b6');
  Snd.play('mad');
  shake = Math.max(shake, 3);
}

// ---------- ПАЛАЧ ----------
function startExecute() {
  const p = player;
  const tg = pickTarget(170, 320);
  if (!tg) { showMessage('Нет цели для казни', '#fca5a5'); Snd.play('error'); return false; }
  p.exec = { target: tg, t: 0, tx: tg.x, ty: tg.y, sx: p.x, sy: p.y, slammed: false };
  p.iframes = Math.max(p.iframes, 0.85); p.swing = null; p.attacking = false;
  Snd.play('exec_wind');
  return true;
}
function updateExecute(dt) {
  const p = player, x = p.exec;
  x.t += dt;
  const tg = x.target;
  if (tg && !tg.dead) { x.tx = tg.x; x.ty = tg.y; }
  p.vx = p.vy = 0;
  if (x.t >= 0.32 && x.t < 0.5) { // прыжок к цели
    const k = (x.t - 0.32) / 0.18;
    const a = Math.atan2(x.ty - x.sy, x.tx - x.sx), d = Math.hypot(x.tx - x.sx, x.ty - x.sy);
    const stand = Math.max(0, d - ((tg ? tg.r : 16) + p.r + 6));
    moveWithCollisions(p, x.sx + Math.cos(a) * stand * k, x.sy + Math.sin(a) * stand * k);
  }
  if (x.t >= 0.5 && !x.slammed) {
    x.slammed = true;
    const ix = x.tx, iy = x.ty;
    const { crit, dmg } = attackRoll();
    if (tg && !tg.dead) strike(tg, dmg * 5.5, { ang: Math.atan2(iy - p.y, ix - p.x), knock: 2.4, fx: playerFx(true), crit: true, armorPierce: 1 });
    for (const e of curRoom.enemies) {
      if (e.dead || e === tg) continue;
      if (Math.hypot(e.x - ix, e.y - iy) < 175 + e.r) {
        if (e.isBoss) e.fx.slow = Math.max(e.fx.slow, 1.8);
        else e.fx.stun = Math.max(e.fx.stun, 2.4);
        const a = Math.atan2(e.y - iy, e.x - ix);
        e.kx += Math.cos(a) * 240 * e.mass; e.ky += Math.sin(a) * 240 * e.mass;
      }
    }
    eBullets.length = 0;
    shake = Math.max(shake, 16);
    Snd.play('execute');
    fxs.push({ type: 'ring', x: ix, y: iy, r0: 10, r1: 185, life: 0.45, max: 0.45, color: '#e11d48' });
    fxs.push({ type: 'ring', x: ix, y: iy, r0: 4, r1: 110, life: 0.3, max: 0.3, color: '#fecaca' });
    spawnParticles(ix, iy, 36, '#b91c1c');
    Stats.add('executions', 1);
  }
  if (x.t >= 0.72) p.exec = null;
}

// ---------- ЛОВЧИЙ ----------
function sendCrow() {
  const f = player.fams.find(f => f.type === 'crow');
  if (!f || f.mode !== 'perch') { Snd.play('error'); return false; }
  const tg = pickTarget(210, 440);
  if (!tg) { showMessage('Ворону некого атаковать', '#fca5a5'); Snd.play('error'); return false; }
  f.mode = 'dive'; f.target = tg; f.t = 0;
  Snd.play('crow');
  return true;
}
function updateCrow(f, dt) {
  const p = player;
  const sx = p.x + (Math.cos(p.aimAng) > 0 ? -13 : 13), sy = p.y - 22 + Math.sin(time * 3) * 1.5;
  if (f.mode === 'dive') {
    const tg = f.target;
    if (!tg || tg.dead) { f.mode = 'return'; return; }
    const a = Math.atan2(tg.y - f.y, tg.x - f.x), step = 640 * dt;
    f.x += Math.cos(a) * step; f.y += Math.sin(a) * step; f.face = a;
    f.t += dt;
    if (Math.hypot(tg.x - f.x, tg.y - f.y) < tg.r + 10 || f.t > 1.6) {
      const { crit, dmg } = attackRoll();
      if (targetable(tg)) strike(tg, dmg * 2.4, { ang: a, knock: 1, fx: playerFx(true), crit });
      blindEnemy(tg, 4.2);
      for (const e of curRoom.enemies) if (!e.dead && e !== tg && Math.hypot(e.x - tg.x, e.y - tg.y) < 70) blindEnemy(e, 2);
      fxs.push({ type: 'ring', x: tg.x, y: tg.y, r0: 4, r1: 46, life: 0.3, max: 0.3, color: '#1f2937' });
      spawnParticles(f.x, f.y, 12, '#18181b');
      Snd.play('crow');
      f.mode = 'return';
    }
  } else if (f.mode === 'return') {
    const a = Math.atan2(sy - f.y, sx - f.x), d = Math.hypot(sx - f.x, sy - f.y), step = Math.min(d, 560 * dt);
    f.x += Math.cos(a) * step; f.y += Math.sin(a) * step; f.face = a;
    if (d < 8) f.mode = 'perch';
  } else {
    f.x = lerp(f.x, sx, Math.min(1, dt * 12)); f.y = lerp(f.y, sy, Math.min(1, dt * 12));
    f.face = Math.cos(p.aimAng) > 0 ? 0 : Math.PI;
    // ворон клюёт врагов рядом с хозяином
    f.peckCd = (f.peckCd || 1) - dt;
    if (f.peckCd <= 0 && p.attacking) {
      let tg = null, bd2 = 120;
      for (const e of curRoom.enemies) { if (!targetable(e)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y) - e.r; if (d < bd2) { bd2 = d; tg = e; } }
      if (tg) {
        f.peckCd = 1.3;
        strike(tg, Math.max(5, p.dmg * 0.6), { ang: Math.atan2(tg.y - p.y, tg.x - p.x), knock: 0, fx: playerFx(true), crit: false });
        fxs.push({ type: 'line', x1: f.x, y1: f.y, x2: tg.x, y2: tg.y, life: 0.12, max: 0.12, color: '#d6c9a3' });
        Snd.play('crow');
      } else f.peckCd = 0.3;
    }
  }
}

// ---------- НЕКРОМАНТ ----------
function necroWave(ox, oy, ang, clone) {
  const p = player;
  const { crit, dmg } = attackRoll();
  const reach = (118 + p.rangeBonus * 0.25) * (1 + p.size * 0.3), arc = 1.15 + 0.3 * p.projExtra + (p.fl.side ? 1.2 : 0);
  fxs.push({ type: 'necro', x: ox, y: oy, ang, reach, arc, life: 0.3, max: 0.3, clone: !!clone });
  const fx = playerFx(true);
  for (const e of curRoom.enemies) {
    if (!targetable(e)) continue;
    const d = Math.hypot(e.x - ox, e.y - oy);
    if (d > reach + e.r) continue;
    const a = Math.atan2(e.y - oy, e.x - ox);
    const inArc = Math.abs(angDiff(a, ang)) < arc / 2 + Math.min(0.5, e.r / Math.max(d, 1)) || (p.fl.rear && Math.abs(angDiff(a, ang + Math.PI)) < arc / 2);
    if (!inArc) continue;
    strike(e, dmg * (clone ? 0.8 : 1), { ang: a, knock: p.knock + 0.2, fx, crit, melee: true });
    if (!e.dead) { applyRot(e, p.dmg); Stats.add('rots', 1); }
  }
  Snd.play('necro');
}
function castEcho() {
  const p = player;
  if (p.decoy) { Snd.play('error'); return false; }
  const cost = Math.max(1, Math.round(p.hp * 0.2));
  if (p.hp - cost < 1) { showMessage('Слишком мало крови для эха', '#fca5a5'); Snd.play('error'); return false; }
  p.hp -= cost;
  p.decoy = {
    x: p.x, y: p.y, t: 5, max: 5, atkT: 0.25, ang: p.aimAng,
    proxy: { x: p.x, y: p.y, vx: 0, vy: 0, r: 14, fly: false, dashing: 0, iframes: 999, oil: 100, oilMax: 100, light: 0, dead: false, hp: 999, maxHp: 999, fl: {}, aim: { x: 1, y: 0 }, aimAng: 0, decoy: true }
  };
  fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 8, r1: 90, life: 0.45, max: 0.45, color: '#a78bfa' });
  spawnParticles(p.x, p.y, 22, '#a78bfa');
  Snd.play('echo');
  shake = Math.max(shake, 3);
  Stats.add('echoes', 1);
  return true;
}
function updateDecoy(dt) {
  const p = player, d = p.decoy;
  d.t -= dt; d.atkT -= dt;
  d.proxy.x = d.x; d.proxy.y = d.y;
  if (d.t <= 0) {
    fxs.push({ type: 'ring', x: d.x, y: d.y, r0: 8, r1: 60, life: 0.35, max: 0.35, color: '#a78bfa' });
    spawnParticles(d.x, d.y, 14, '#a78bfa');
    p.decoy = null;
    return;
  }
  if (d.atkT <= 0) {
    let tg = null, bd2 = 170;
    for (const e of curRoom.enemies) { if (!targetable(e)) continue; const dd = Math.hypot(e.x - d.x, e.y - d.y) - e.r; if (dd < bd2) { bd2 = dd; tg = e; } }
    if (tg) d.ang = Math.atan2(tg.y - d.y, tg.x - d.x);
    else if (p.attacking) d.ang = p.aimAng;
    if (tg || p.attacking) { d.atkT = 1 / p.atk; necroWave(d.x, d.y, d.ang, true); }
    else d.atkT = 0.1;
  }
}

// ---------- ПАДШИЙ АЛХИМИК ----------
function castTransmute() {
  const tg = pickTarget(150, 300);
  if (!tg || tg.isBoss) {
    // боссов статуей не сделать — ищем обычного врага
    const alt = curRoom.enemies.filter(e => targetable(e) && !e.isBoss && e.gold <= 0).sort((a, b) => dist(a, player) - dist(b, player))[0];
    if (!alt) { showMessage('Нечего превращать в золото', '#fca5a5'); Snd.play('error'); return false; }
    return makeStatue(alt, 5) && (Stats.add('statues', 1), true);
  }
  if (makeStatue(tg, 5)) { Stats.add('statues', 1); return true; }
  Snd.play('error'); return false;
}
function statueRewards(e) {
  const p = player;
  const n = HEROES[p.hero].skill === 'transmute' ? 3 : 1;
  for (let i = 0; i < n; i++) spawnPickup(curRoom, 'ember', e.x, e.y);
  for (let i = 0; i < 2; i++) spawnPickup(curRoom, 'pouch', e.x, e.y);
  spawnParticles(e.x, e.y, 20, '#fde047');
  Stats.add('statuesBroken', 1);
}

// ---------- ЖНЕЦ ----------
function reapDashTick() {
  const p = player, r = p.reap;
  const { crit, dmg } = attackRoll();
  for (const e of curRoom.enemies) {
    if (!targetable(e) || r.hit.includes(e)) continue;
    if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 12) {
      r.hit.push(e);
      strike(e, dmg * 1.7, { ang: p.dashDir, knock: 1.6, fx: playerFx(true), crit, melee: true });
    }
  }
}
function reapDashEnd() {
  const p = player;
  p.reap = null;
  const n = 10, { dmg } = attackRoll();
  for (let i = 0; i < n; i++) {
    spawnShot({ x: p.x, y: p.y, ang: p.dashDir + (i / n) * Math.PI * 2, speed: 380, r: 6.5, dmg: dmg * 0.5, range: 250, kind: 'orb', col: 'shadow', homing: false, pierce: 1, noFx: false });
  }
  for (const e of curRoom.enemies) {
    if (e.dead || e.isBoss) continue;
    if (Math.hypot(e.x - p.x, e.y - p.y) < 90 + e.r) e.fx.stun = Math.max(e.fx.stun, 0.8);
  }
  fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 8, r1: 100, life: 0.35, max: 0.35, color: '#94a3b8' });
  shake = Math.max(shake, 7);
  Snd.play('stomp');
}
function startHarvest() {
  const p = player;
  p.harvest = { t: 2.6, fireT: 0, ang: p.aimAng, auraT: 0 };
  p.swing = null;
  Snd.play('harvest');
}
function updateHarvest(dt) {
  const p = player, h = p.harvest;
  h.t -= dt; h.fireT -= dt; h.auraT -= dt;
  h.ang += dt * 7.5;
  if (h.fireT <= 0) {
    h.fireT = 0.075;
    for (let k = 0; k < 2; k++) {
      spawnShot({ x: p.x, y: p.y, ang: h.ang + k * Math.PI, speed: 400, r: 6, dmg: p.dmg * 0.5, range: 330, kind: 'orb', col: 'shadow', homing: false, pierce: 1 });
    }
  }
  if (h.auraT <= 0) {
    h.auraT = 0.3;
    for (const e of curRoom.enemies) if (targetable(e) && dist(p, e) < 76 + e.r) damageEnemy(e, p.dmg * 0.55, { quiet: true, color: '#c4b5fd' });
  }
  if (h.t <= 0) p.harvest = null;
}
