'use strict';
/* =====================================================================
   ENEMIES: бестиарий, ИИ, статус-эффекты. Скорости — px/с, урон — здоровье.
   ===================================================================== */
const burdenLevel = () => (run ? run.burden : 0);
// модификаторы забега (ежедневный режим): run.modv = { enemyDmg, enemyHp, ... }
const runMod = (k, d = 1) => (run && run.modv && run.modv[k] !== undefined) ? run.modv[k] : d;
const dmgScale = base => Math.max(1, Math.round(base * 1.2 * (1 + 0.16 * (floorNum - 1)) * (1 + 0.12 * burdenLevel()) * runMod('enemyDmg')));
const hpScale = floor => (1 + 0.34 * (floor - 1)) * (1 + 0.15 * burdenLevel()) * runMod('enemyHp');
const newFx = () => ({ slow: 0, poison: 0, burn: 0, fear: 0, stun: 0, corrode: 0, mad: 0, blind: 0, haste: 0 });

// Аффиксы элитных врагов
const AFFIXES = {
  swift:     { label: 'СКОРОСТЬ',  color: '#38bdf8' },
  vampiric:  { label: 'ВАМПИРИЗМ', color: '#e11d48' },
  explosive: { label: 'ВЗРЫВ',     color: '#fb923c' },
  armored:   { label: 'БРОНЯ',     color: '#cbd5e1' },
  splitting: { label: 'ДЕЛЕНИЕ',   color: '#84cc16' }
};

function shootBullet(x, y, ang, speed, o = {}) {
  eBullets.push({
    x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
    r: o.r || 6, dmg: o.dmg === undefined ? dmgScale(8) : o.dmg,
    life: o.life || 7, col: o.col || 'red', age: 0, home: o.home || 0, flip: o.flip || 0
  });
}
function bulletRing(x, y, n, speed, offset = 0, o = {}) {
  for (let i = 0; i < n; i++) shootBullet(x, y, offset + (i / n) * Math.PI * 2, speed, o);
}

// множитель скорости от статусов
function esp(e) {
  if (e.fx.stun > 0) return 0;
  return (e.fx.slow > 0 ? 0.5 : 1) * (e.fx.haste > 0 ? 1.4 : 1);
}

// Движение по направлению с обходом препятствий; возвращает пройденное расстояние
function steer(e, ang, speed, dt) {
  if (e.fx.fear > 0) ang += Math.PI;
  const m = esp(e);
  if (m === 0) return 0;
  if (e.detourT > 0) { ang += e.detourA; e.detourT -= dt; }
  const step = speed * m * dt;
  const ox = e.x, oy = e.y;
  moveWithCollisions(e, e.x + Math.cos(ang) * step, e.y + Math.sin(ang) * step);
  const moved = Math.hypot(e.x - ox, e.y - oy);
  if (!e.fly && step > 0.01) {
    if (moved < step * 0.35) {
      e.stuck = (e.stuck || 0) + dt;
      if (e.stuck > 0.3 && !(e.detourT > 0)) { e.detourT = 0.7; e.detourA = pick([-1, 1]) * Math.PI / 2 * rnd(0.7, 1.2); e.stuck = 0; }
    } else e.stuck = Math.max(0, (e.stuck || 0) - dt);
  }
  return moved;
}
const chase = (e, speed, dt) => steer(e, angTo(e, player), speed, dt);

const ENEMY_DEFS = {
  bat: {
    name: 'Летучая мышь', r: 11, hp: 30, spd: 125, cost: 1, minFloor: 1, weight: 3, fly: true, pack: true, touch: 7,
    init(e) { e.t = rnd(0, 6); },
    update(e, dt, sdt) {
      e.t += sdt * 3.4;
      const a = angTo(e, player);
      const mx = Math.cos(a) + Math.cos(e.t) * 0.7, my = Math.sin(a) + Math.sin(e.t * 1.3) * 0.7;
      steer(e, Math.atan2(my, mx), e.spd * Math.min(1.25, Math.hypot(mx, my)), dt);
    }
  },
  ghoul: {
    name: 'Упырь', r: 15, hp: 95, spd: 70, cost: 1.5, minFloor: 1, weight: 3, strong: true, touch: 12,
    update(e, dt) { chase(e, e.spd, dt); }
  },
  archer: {
    name: 'Костяной лучник', r: 14, hp: 62, spd: 56, cost: 2, minFloor: 1, weight: 3, touch: 8,
    init(e, floor) { e.cd = rnd(1, 2); e.dir = pick([-1, 1]); e.burst = floor >= 3 ? 3 : 1; e.flip = rnd(2, 4); },
    update(e, dt, sdt) {
      const d = dist(e, player), a = angTo(e, player);
      e.flip -= sdt; if (e.flip <= 0) { e.flip = rnd(2, 4); e.dir *= -1; }
      if (d < 180) steer(e, a + Math.PI, e.spd * 1.1, dt);
      else if (d > 300) steer(e, a, e.spd * 0.8, dt);
      else steer(e, a + Math.PI / 2 * e.dir, e.spd * 0.6, dt);
      e.cd -= sdt;
      if (e.cd <= 0) {
        e.cd = rnd(1.7, 2.5) / (e.elite ? 1.3 : 1);
        const n = e.burst;
        for (let i = 0; i < n; i++) shootBullet(e.x, e.y, a + (i - (n - 1) / 2) * 0.22, 250, { r: 5, col: 'bone' });
      }
    }
  },
  hound: {
    name: 'Гончая тьмы', r: 14, hp: 85, spd: 78, cost: 2, minFloor: 1, weight: 3, strong: true, touch: 12,
    init(e) { e.state = 'walk'; e.t = rnd(1, 2.2); e.dirA = 0; },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.state === 'walk') { chase(e, e.spd, dt); if (e.t <= 0) { e.state = 'wind'; e.t = 0.5; } }
      else if (e.state === 'wind') { e.dirA = angTo(e, player); if (e.t <= 0) { e.state = 'dash'; e.t = 0.85; } }
      else if (e.state === 'dash') {
        const step = 400 * esp(e) * dt;
        const moved = steer(e, e.dirA, 400, dt);
        if (e.t <= 0 || (step > 0 && moved < step * 0.5)) { e.state = 'rest'; e.t = 0.7; }
      } else if (e.t <= 0) { e.state = 'walk'; e.t = rnd(1.3, 2.5); }
    }
  },
  leaper: {
    name: 'Могильный прыгун', r: 13, hp: 80, spd: 320, cost: 1.5, minFloor: 1, weight: 2, touch: 10,
    init(e) { e.state = 'wait'; e.t = rnd(0.4, 1); e.dirA = 0; },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.state === 'wait') { if (e.t <= 0) { e.state = 'hop'; e.t = 0.42; e.dirA = angTo(e, player) + rnd(-0.35, 0.35); } }
      else {
        steer(e, e.dirA, e.spd, dt);
        if (e.t <= 0) { e.state = 'wait'; e.t = rnd(0.55, 1.1); if (floorNum >= 3) bulletRing(e.x, e.y, 4, 190, rnd(0, 1.5), { col: 'green' }); }
      }
    }
  },
  spider: {
    name: 'Паук-сторож', r: 10, hp: 38, spd: 250, cost: 1.2, minFloor: 2, weight: 2, pack: true, touch: 7,
    init(e) { e.t = rnd(0.1, 0.4); e.mv = false; e.dirA = 0; },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.t <= 0) { e.mv = !e.mv; e.t = e.mv ? rnd(0.25, 0.45) : rnd(0.15, 0.35); e.dirA = angTo(e, player) + rnd(-0.9, 0.9); }
      if (e.mv) steer(e, e.dirA, e.spd, dt);
    }
  },
  sporepod: {
    name: 'Споровик', r: 13, hp: 55, spd: 80, cost: 1.5, minFloor: 2, weight: 2, fly: true, touch: 6,
    init(e) { e.t = rnd(0, 6); },
    update(e, dt, sdt) { e.t += sdt * 2; steer(e, angTo(e, player) + Math.sin(e.t) * 0.5, e.spd, dt); },
    onDeath(e) {
      bulletRing(e.x, e.y, 7, 175, rnd(0, 1), { col: 'green', dmg: dmgScale(6) });
      fxs.push({ type: 'ring', x: e.x, y: e.y, r0: 4, r1: 50, life: 0.3, max: 0.3, color: '#84cc16' });
    }
  },
  flesh: {
    name: 'Ком плоти', r: 20, hp: 150, spd: 48, cost: 2, minFloor: 2, weight: 2, strong: true, touch: 12,
    init(e) {
      if (e.gen > 0) { e.r = 12; e.hp *= 0.32; e.spd *= 1.6; e.name = 'Кусок плоти'; }
      e.t = rnd(0, 6);
    },
    update(e, dt, sdt) { e.t += sdt * 4; chase(e, e.spd * (0.7 + 0.5 * Math.sin(e.t)), dt); },
    onDeath(e) {
      if (e.gen > 0) return;
      for (let i = 0; i < 2; i++) {
        const k = makeEnemy('flesh', e.x + (i ? 16 : -16), e.y, e.floor, { gen: 1, noSpawn: true });
        k.spawnT = 0.25;
        curRoom.enemies.push(k);
      }
    }
  },
  worm: {
    name: 'Могильный червь', r: 13, hp: 100, spd: 140, cost: 2.5, minFloor: 3, weight: 2, touch: 10,
    init(e) { e.state = 'burrow'; e.t = rnd(1.2, 2.2); e.hidden = true; e.fly = true; },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.state === 'burrow') {
        steer(e, angTo(e, player), e.spd, dt);
        if (e.t <= 0) { e.state = 'rise'; e.t = 0.55; e.hidden = false; e.fly = false; moveWithCollisions(e, e.x, e.y); Snd.play('poop'); spawnParticles(e.x, e.y, 8, '#4a3320'); }
      } else if (e.state === 'rise') {
        if (e.t <= 0) { e.state = 'shoot'; e.t = 1.3; e.fired = false; const off = e.alt ? Math.PI / 4 : 0; e.alt = !e.alt; bulletRing(e.x, e.y, 4, 210, off, { col: 'bone' }); }
      } else if (e.state === 'shoot') {
        if (!e.fired && e.t < 0.65) { e.fired = true; shootBullet(e.x, e.y, angTo(e, player), 250, { col: 'green' }); }
        if (e.t <= 0) { e.state = 'burrow'; e.t = rnd(1.6, 2.6); e.hidden = true; e.fly = true; spawnParticles(e.x, e.y, 8, '#4a3320'); }
      }
    }
  },
  gargoyle: {
    name: 'Горгулья', r: 17, hp: 120, spd: 0, cost: 2, minFloor: 3, weight: 2, fly: true, mass: 0, noElite: true, immobile: true, touch: 8, armor: 0.25,
    init(e) { e.variant = pick(['aim', 'cross', 'spiral']); e.t = rnd(0.8, 2); e.ang = rnd(0, 6); e.burst = 0; },
    update(e, dt, sdt) {
      e.t -= sdt;
      const a = angTo(e, player);
      if (e.variant === 'aim') {
        if (e.t <= 0) { e.t = 2; const n = floorNum >= 4 ? 3 : 1; for (let i = 0; i < n; i++) shootBullet(e.x, e.y, a + (i - (n - 1) / 2) * 0.24, 230, { col: 'purple', dmg: dmgScale(9) }); }
      } else if (e.variant === 'cross') {
        if (e.t <= 0) { e.t = 1.5; e.ang += 0.4; bulletRing(e.x, e.y, 4, 180, e.ang, { col: 'purple', dmg: dmgScale(8) }); }
      } else {
        if (e.burst > 0) {
          if (e.t <= 0) { e.t = 0.13; e.burst--; e.ang += 0.55; shootBullet(e.x, e.y, e.ang, 185, { col: 'purple', dmg: dmgScale(6) }); if (e.burst === 0) e.t = 2.4; }
        } else if (e.t <= 0) { e.burst = 14; e.t = 0; }
      }
    }
  },
  necro: {
    name: 'Некромант', r: 16, hp: 140, spd: 52, cost: 3, minFloor: 3, weight: 1.6, touch: 8,
    init(e) { e.t = rnd(1.5, 2.5); e.dir = pick([-1, 1]); },
    update(e, dt, sdt) {
      const d = dist(e, player), a = angTo(e, player);
      if (d < 210) steer(e, a + Math.PI, e.spd, dt);
      else if (d > 330) steer(e, a, e.spd, dt);
      else steer(e, a + Math.PI / 2 * e.dir, e.spd * 0.5, dt);
      e.t -= sdt;
      if (e.t <= 0) {
        e.t = 3.6;
        const kids = curRoom.enemies.filter(k => k.owner === e && !k.dead).length;
        if (kids < 3) {
          const k = makeEnemy('servant', e.x + rnd(-20, 20), e.y + 20, e.floor, { owner: e, noSpawn: true });
          k.spawnT = 0.5;
          curRoom.enemies.push(k);
          fxs.push({ type: 'ring', x: k.x, y: k.y, r0: 4, r1: 36, life: 0.4, max: 0.4, color: '#a78bfa' });
          Snd.play('spawn');
        }
        if (floorNum >= 5) shootBullet(e.x, e.y, a, 220, { col: 'purple' });
      }
    }
  },
  servant: {
    name: 'Костяной слуга', r: 11, hp: 36, spd: 100, cost: 1, minFloor: 99, weight: 0, noElite: true, touch: 8,
    update(e, dt) { chase(e, e.spd, dt); }
  },
  knight: {
    name: 'Проклятый рыцарь', r: 17, hp: 175, spd: 68, cost: 3, minFloor: 4, weight: 2, strong: true, shield: true, touch: 14, armor: 0.15,
    init(e) { e.face = 0; },
    update(e, dt) {
      e.face += angDiff(angTo(e, player), e.face) * Math.min(1, dt * 5);
      chase(e, e.spd, dt);
    }
  },
  golem: {
    name: 'Мясной голем', r: 24, hp: 330, spd: 40, cost: 3.5, minFloor: 4, weight: 1.5, strong: true, mass: 0.25, touch: 16, armor: 0.2,
    init(e) { e.t = rnd(1.5, 2.5); e.alt = false; },
    update(e, dt, sdt) {
      chase(e, e.spd, dt);
      e.t -= sdt;
      if (e.t <= 0) { e.t = 2.8; e.alt = !e.alt; bulletRing(e.x, e.y, 8, 170, e.alt ? Math.PI / 8 : 0, { r: 7, col: 'red', dmg: dmgScale(10) }); Snd.play('hit'); }
    }
  },
  shade: {
    name: 'Тень', r: 15, hp: 105, spd: 150, cost: 2.5, minFloor: 3, weight: 2.2, fly: true, shade: true, noElite: true, touch: 12,
    init(e) { e.cd = 1.6; },
    update(e, dt, sdt) {
      const lit = isLit(e);
      e.lit = lit;
      const a = angTo(e, player);
      if (lit) { steer(e, a + Math.PI * 0.85, e.spd * 0.35, dt); }  // свет заставляет отшатнуться
      else steer(e, a + Math.sin(time * 2 + e.x) * 0.3, e.spd, dt);
      e.cd -= sdt;
      if (!lit && e.cd <= 0 && dist(e, player) < 320) { e.cd = 2.4; shootBullet(e.x, e.y, a, 190, { col: 'shadow', dmg: dmgScale(9), r: 7 }); }
    }
  },
  leech: {
    name: 'Светоед', r: 9, hp: 42, spd: 150, cost: 1.5, minFloor: 2, weight: 1.6, fly: true, noElite: true, touch: 3,
    init(e) { e.state = 'orbit'; e.t = rnd(1, 2); e.ang = rnd(0, 6.28); },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.state === 'orbit') {
        e.ang += sdt * 2.4;
        const tx = player.x + Math.cos(e.ang) * 120, ty = player.y + Math.sin(e.ang) * 120;
        steer(e, Math.atan2(ty - e.y, tx - e.x), e.spd * 0.9, dt);
        if (e.t <= 0) { e.state = 'dart'; e.t = 1.4; }
      } else if (e.state === 'dart') {
        chase(e, 270, dt);
        if (e.t <= 0) { e.state = 'orbit'; e.t = rnd(1, 2); }
      } else {
        steer(e, angTo(player, e), 230, dt);
        if (e.t <= 0) { e.state = 'orbit'; e.t = rnd(1, 2); }
      }
    },
    onTouch(e) {
      if (e.state !== 'dart') return true;
      const p = player;
      p.oil = Math.max(0, p.oil - 16);
      hurtPlayer(dmgScale(4), e);
      Snd.play('oil');
      showMessage('Светоед пьёт масло из фонаря!', '#fbbf24');
      e.state = 'flee'; e.t = 1.4;
      return true;
    }
  },
  cultist: {
    name: 'Культист', r: 14, hp: 85, spd: 62, cost: 2.5, minFloor: 2, weight: 2.2, touch: 8,
    init(e) { e.cd = rnd(1.2, 2); e.blinkCd = rnd(1, 3); },
    update(e, dt, sdt) {
      const d = dist(e, player), a = angTo(e, player);
      if (d < 200) steer(e, a + Math.PI, e.spd, dt); else if (d > 320) steer(e, a, e.spd * 0.8, dt);
      e.cd -= sdt; e.blinkCd -= sdt;
      if (e.cd <= 0) {
        e.cd = rnd(2.2, 3.2);
        const n = floorNum >= 4 ? 5 : 3;
        for (let i = 0; i < n; i++) shootBullet(e.x, e.y, a + (i - (n - 1) / 2) * 0.28, 205, { col: 'purple', dmg: dmgScale(8) });
      }
      if (d < 150 && e.blinkCd <= 0 && !e.fx.stun) {
        e.blinkCd = rnd(3, 4.5);
        spawnParticles(e.x, e.y, 14, '#7c3aed');
        const cells = curRoom.spawnCells.filter(c => Math.hypot(tileX(c.c) - player.x, tileY(c.r) - player.y) > 240);
        if (cells.length) { const c = pick(cells); e.x = tileX(c.c); e.y = tileY(c.r); spawnParticles(e.x, e.y, 14, '#7c3aed'); }
      }
    }
  }
};

function makeEnemy(type, x, y, floor, opts = {}) {
  const d = ENEMY_DEFS[type];
  const e = {
    type, def: d, name: d.name, x, y, r: d.r, hp: d.hp * hpScale(floor), maxHp: 1,
    spd: d.spd * (1 + 0.03 * (floor - 1)) * runMod('enemySpd'), fly: !!d.fly,
    touch: dmgScale(d.touch || 8) + (d.strong && floor >= 3 ? 2 : 0),
    mass: d.mass === undefined ? 1 : d.mass,
    spawnT: opts.noSpawn ? 0.2 : 0.8, fx: newFx(),
    kx: 0, ky: 0, hitFlash: 0, t: 0, state: '', floor, gen: opts.gen || 0, elite: !!opts.elite,
    owner: opts.owner || null, dead: false, hidden: false, phased: false,
    armor: d.armor || 0, gold: 0, rotS: { n: 0, t: 0, tick: 0 }, affix: null
  };
  if (e.elite) {
    e.hp *= 1.8; e.spd *= 1.12;
    const ok = Object.keys(AFFIXES).filter(a => !(a === 'splitting' && (d.gen !== undefined || type === 'flesh' || d.immobile)));
    if (!d.noAffix) e.affix = opts.affix || pick(ok);
    if (e.affix === 'swift') e.spd *= 1.28;
    if (e.affix === 'armored') e.armor = Math.min(0.75, e.armor + 0.4);
  }
  if (opts.small) { e.r *= 0.72; e.hp *= 0.4; e.spd *= 1.15; e.small = true; }
  if (d.init) d.init(e, floor);
  e.maxHp = e.hp;
  return e;
}

// Безумие: враг нападает на ближайшего другого врага
function madAI(e, dt) {
  e.madCd = (e.madCd || 0) - dt;
  let tg = null, bd = 1e9;
  for (const o of curRoom.enemies) {
    if (o === e || o.dead || o.spawnT > 0 || o.hidden || o.phased || o.gold > 0) continue;
    const d = dist(e, o);
    if (d < bd) { bd = d; tg = o; }
  }
  if (tg) {
    if (!e.def.immobile) steer(e, angTo(e, tg), Math.max(e.spd, 80) * 1.15, dt);
    if (bd < e.r + tg.r + 6 && e.madCd <= 0) {
      e.madCd = 0.5;
      tg.madHit = true;
      damageEnemy(tg, Math.max(7, e.touch * 1.7), { fromMad: true, color: '#f472b6' });
      const a = angTo(e, tg);
      tg.kx += Math.cos(a) * 170 * tg.mass; tg.ky += Math.sin(a) * 170 * tg.mass;
      spawnParticles((e.x + tg.x) / 2, (e.y + tg.y) / 2, 4, '#f472b6');
    }
  } else if (!e.def.immobile) {
    e.wanderT = (e.wanderT || 0) - dt;
    if (e.wanderT <= 0) { e.wanderT = rnd(0.5, 1.2); e.wanderA = rnd(0, 6.28); }
    steer(e, e.wanderA, e.spd * 0.5, dt);
  }
}
// Слепота: враг бродит наугад
function blindAI(e, dt) {
  if (e.def.immobile) return;
  e.wanderT = (e.wanderT || 0) - dt;
  if (e.wanderT <= 0) { e.wanderT = rnd(0.35, 0.9); e.wanderA = rnd(0, 6.28); }
  steer(e, e.wanderA, e.spd * 0.6, dt);
}

// Покадровое обновление врага: статусы, отбрасывание, ИИ
function updateEnemy(e, dt) {
  if (e.hitFlash > 0) e.hitFlash -= dt;
  if (e.spawnT > 0) { e.spawnT -= dt; return; }
  const fx = e.fx;
  if (e.gold > 0) { // золотая статуя: неподвижна, пока не разбита
    e.gold -= dt;
    if (e.gold > 0) { fx.stun = Math.max(fx.stun, e.gold); return; }
    fx.stun = 0; spawnParticles(e.x, e.y, 10, '#fbbf24');
  }
  if (fx.poison > 0) {
    fx.poison -= dt; e.poisonT = (e.poisonT || 0) - dt;
    if (e.poisonT <= 0) { e.poisonT = 0.5; damageEnemy(e, e.poisonDmg || 2, { quiet: true, color: '#84cc16' }); }
  }
  if (fx.burn > 0) {
    fx.burn -= dt; e.burnT = (e.burnT || 0) - dt;
    if (Math.random() < dt * 14) particles.push({ x: e.x + rnd(-e.r, e.r), y: e.y - e.r * 0.4, vx: rnd(-10, 10), vy: rnd(-60, -20), r: rnd(2, 4), color: '#fb923c', life: 0.4, maxLife: 0.4 });
    if (e.burnT <= 0) { e.burnT = 0.4; damageEnemy(e, e.burnDmg || 2, { quiet: true, color: '#fb923c' }); }
  }
  if (e.rotS && e.rotS.n > 0) {
    e.rotS.t -= dt; e.rotS.tick -= dt;
    if (e.rotS.tick <= 0) { e.rotS.tick = 0.5; damageEnemy(e, (e.rotDmg || 2) * e.rotS.n, { quiet: true, color: '#a3e635' }); }
    if (e.rotS.t <= 0) e.rotS.n = 0;
  }
  if (fx.slow > 0) fx.slow -= dt;
  if (fx.fear > 0) fx.fear -= dt;
  if (fx.stun > 0) fx.stun -= dt;
  if (fx.corrode > 0) fx.corrode -= dt;
  if (fx.mad > 0) fx.mad -= dt;
  if (fx.blind > 0) fx.blind -= dt;
  if (fx.haste > 0) fx.haste -= dt;
  if (e.dead) return;

  if (e.kx || e.ky) {
    moveWithCollisions(e, e.x + e.kx * dt, e.y + e.ky * dt);
    const f = Math.exp(-dt * 9);
    e.kx *= f; e.ky *= f;
    if (Math.abs(e.kx) < 1) e.kx = 0;
    if (Math.abs(e.ky) < 1) e.ky = 0;
  }
  const sdt = dt * esp(e);
  if (!e.isBoss && fx.mad > 0) { madAI(e, dt); return; }
  if (!e.isBoss && fx.blind > 0) { blindAI(e, dt); return; }
  const dec = player.decoy;
  if (dec && !e.isBoss && !(e.def.shade)) { // враги цепляются за двойника Некроманта
    const real = player;
    player = dec.proxy;
    try { e.def.update(e, dt, sdt); } finally { player = real; }
  } else e.def.update(e, dt, sdt);
}

// Эффекты реликвий при попадании: fx — таблица флагов
function applyStatus(e, fx) {
  const p = player;
  if (!fx) return;
  if (fx.slow) e.fx.slow = Math.max(e.fx.slow, 2.2);
  if (fx.poison && chance(luckChance(0.45, 0.03))) { e.fx.poison = 3.2; e.poisonDmg = Math.max(2, p.dmg * 0.14); }
  if (fx.burn && chance(luckChance(0.45, 0.03))) { e.fx.burn = 2.8; e.burnDmg = Math.max(2, p.dmg * 0.2); }
  if (!e.isBoss && fx.fear && chance(luckChance(0.22, 0.02))) e.fx.fear = 2.5;
  if (fx.corrode) e.fx.corrode = Math.max(e.fx.corrode, 3.5);
  if (fx.rot && chance(luckChance(0.5, 0.03))) applyRot(e, p.dmg);
  if (fx.madhit && !e.isBoss && chance(luckChance(0.07, 0.01))) e.fx.mad = Math.max(e.fx.mad, 3);
  if (fx.blind && chance(luckChance(0.09, 0.01))) blindEnemy(e, 3);
  if (fx.midas && !e.isBoss && chance(luckChance(0.04, 0.006))) makeStatue(e, 3.5);
}
