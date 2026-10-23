'use strict';
/* =====================================================================
   GAME: игровой цикл, бой, пикапы, реликвии, зоны, двери, глубины, спуск
   ===================================================================== */
let restartHold = 0;

// ---------- ЭФФЕКТЫ ----------
function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    if (particles.length > 420) break;
    const a = rnd(0, Math.PI * 2), s = rnd(50, 250), life = rnd(0.25, 0.6);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rnd(1.8, 3.6), color, life, maxLife: life });
  }
}
function showMessage(text, color = '#e7e5e4') { message = { text, color, timer: 2.6 }; }

function updateCosmetics(dt) {
  updateToasts(dt);
  if (shake > 0) shake = Math.max(0, shake - dt * 28);
  if (roomTransition > 0) roomTransition = Math.max(0, roomTransition - dt);
  if (hurtFlash > 0) hurtFlash = Math.max(0, hurtFlash - dt * 1.6);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= Math.exp(-dt * 2.5); p.vy *= Math.exp(-dt * 2.5);
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = fxs.length - 1; i >= 0; i--) { fxs[i].life -= dt; if (fxs[i].life <= 0) fxs.splice(i, 1); }
  for (let i = pops.length - 1; i >= 0; i--) { pops[i].life -= dt; pops[i].y -= dt * 30; if (pops[i].life <= 0) pops.splice(i, 1); }
  if (floatText) { floatText.timer -= dt; if (floatText.timer <= 0) floatText = null; }
  if (banner) { banner.timer -= dt; if (banner.timer <= 0) banner = null; }
  if (message) { message.timer -= dt; if (message.timer <= 0) message = null; }
}

// ---------- СВЕТ ----------
function roomLights(rm) {
  if (rm._lights) return rm._lights;
  const l = [];
  if (rm.tiles) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = rm.tiles[r][c]; if (t && t.t === 'F') l.push({ x: tileX(c), y: tileY(r) }); }
  return (rm._lights = l);
}
function isLit(o) {
  const p = player;
  if (Math.hypot(o.x - p.x, o.y - p.y) < lightRadius() * 0.95) return true;
  for (const z of zones) if ((z.kind === 'sanctum' || z.kind === 'fire') && Math.hypot(o.x - z.x, o.y - z.y) < z.r + 25) return true;
  for (const l of roomLights(curRoom)) if (Math.hypot(o.x - l.x, o.y - l.y) < 125) return true;
  if (curRoom.shrine && Math.hypot(o.x - curRoom.shrine.x, o.y - curRoom.shrine.y) < 210) return true;
  return false;
}

// ---------- ПИКАПЫ ----------
const PICKUP_R = { potion: 10, oil: 10, silver: 8, pouch: 10, flask: 9, key: 10, shard: 10, chest: 15, sack: 13, note: 11, wisp: 8, ember: 9 };

function rollDrop(rich) {
  const p = player;
  const beggar = p && p.fl.beggar;
  const table = [
    ['silver', beggar ? 0 : 30], ['oil', p && p.oil < 60 ? 26 : 11], ['potion', p && p.hp < p.maxHp * 0.7 ? 15 : 5], ['flask', 9],
    ['key', 8], ['shard', 6], ['pouch', beggar ? 0 : 4], ['sack', rich ? 6 : 2.5], ['chest', rich ? 4 : 1.2]
  ];
  return wpick(table, t => t[1])[0];
}

function spawnPickup(rm, type, x, y) {
  const pk = { type, x, y, vx: rnd(-90, 90), vy: rnd(-90, 90), r: PICKUP_R[type] || 9, age: 0, warn: 0 };
  if (type === 'chest' && floorNum >= 3 && rm.type !== 'secret' && chance(0.2)) pk.mimic = true;
  rm.pickups.push(pk);
}

function readNote() {
  const unread = NOTES.filter(n => !Save.data.notes[n.id]);
  const n = unread.length ? pick(unread) : pick(NOTES);
  const fresh = !Save.data.notes[n.id];
  Save.data.notes[n.id] = true;
  Save.store();
  if (run) run.notes++;
  floatText = { title: n.title, desc: n.text, color: '#e7d9b0', note: true, timer: 9, max: 9, fresh };
  Snd.play('note');
}

function collectPickup(pk, rm) {
  const p = player;
  switch (pk.type) {
    case 'potion': if (p.potions >= p.potionMax) return false; p.potions++; Snd.play('pickup'); return true;
    case 'oil': if (p.oil >= p.oilMax - 3) return false; p.oil = Math.min(p.oilMax, p.oil + 35); Snd.play('oil'); spawnParticles(pk.x, pk.y, 10, '#fbbf24'); return true;
    case 'silver': { const g = p.fl.beggar ? 0 : (p.fl.greed ? 2 : 1); p.silver = Math.min(999, p.silver + g); Stats.add('silverGot', g); Snd.play('silver'); return true; }
    case 'pouch': { const g = p.fl.beggar ? 0 : (p.fl.greed ? 12 : 6); p.silver = Math.min(999, p.silver + g); Stats.add('silverGot', g); Snd.play('silver'); return true; }
    case 'ember': run.bonusEmbers = (run.bonusEmbers || 0) + 1; Snd.play('wisp'); spawnParticles(pk.x, pk.y, 6, '#fb923c'); pushToast({ title: '+1 уголь', text: '', color: '#fb923c', kind: 'mini', life: 1.1, max: 1.1 }); return true;
    case 'flask': if (p.flasks >= 9) return false; p.flasks++; Snd.play('pickup'); return true;
    case 'key': if (p.keys >= 9) return false; p.keys++; Snd.play('key'); return true;
    case 'shard': if (p.ward >= 100) return false; p.ward = Math.min(100, p.ward + 15); Snd.play('shield'); spawnParticles(pk.x, pk.y, 10, '#93c5fd'); return true;
    case 'wisp': p.oil = Math.min(p.oilMax, p.oil + 6); Snd.play('wisp'); return true;
    case 'note': readNote(); return true;
    case 'chest':
      if (pk.mimic) { // ларец оказался мимиком
        const m = makeEnemy('mimic', pk.x, pk.y, floorNum, { noSpawn: true });
        m.spawnT = 0.4; rm.enemies.push(m);
        if (rm.cleared) rm.cleared = false;
        spawnParticles(pk.x, pk.y, 16, '#7f1d1d'); Snd.play('boss_intro'); shake = Math.max(shake, 6);
        showMessage('Это был мимик!', '#fca5a5');
        return true;
      }
      if (p.keys <= 0) {
        if (pk.warn <= 0) { Snd.play('error'); showMessage('Ларец заперт — нужен ключ', '#fca5a5'); pk.warn = 1.5; }
        return false;
      }
      p.keys--; Snd.play('unlock'); spawnParticles(pk.x, pk.y, 20, '#fbbf24');
      for (let i = rndInt(2, 4); i > 0; i--) spawnPickup(rm, rollDrop(true), pk.x, pk.y);
      if (chance(luckChance(0.12, 0.02))) rm.peds.push(makePed(rollRelic('treasure'), pk.x, pk.y - 60));
      return true;
    case 'sack':
      Snd.play('pickup'); spawnParticles(pk.x, pk.y, 12, '#a8845a');
      for (let i = rndInt(1, 3); i > 0; i--) spawnPickup(rm, rollDrop(), pk.x, pk.y);
      return true;
  }
  return false;
}

function updatePickups(dt) {
  const rm = curRoom, p = player;
  for (let i = rm.pickups.length - 1; i >= 0; i--) {
    const pk = rm.pickups[i];
    pk.age += dt;
    if (pk.warn > 0) pk.warn -= dt;
    // огоньки душ тянутся к герою
    if (pk.type === 'wisp') {
      const d = Math.hypot(p.x - pk.x, p.y - pk.y);
      if (d < 170) { const a = Math.atan2(p.y - pk.y, p.x - pk.x); pk.vx += Math.cos(a) * 700 * dt; pk.vy += Math.sin(a) * 700 * dt; }
    }
    const fr = Math.exp(-dt * (pk.type === 'wisp' ? 2 : 5));
    pk.vx *= fr; pk.vy *= fr;
    pk.x = clamp(pk.x + pk.vx * dt, PLAY.x + 14, PLAY.x + PLAY.w - 14);
    pk.y = clamp(pk.y + pk.vy * dt, PLAY.y + 14, PLAY.y + PLAY.h - 14);
    if (pk.type === 'wisp' && pk.age > 9) { rm.pickups.splice(i, 1); continue; }
    if (pk.age < 0.3) continue;
    if (Math.hypot(p.x - pk.x, p.y - pk.y) < p.r + pk.r) {
      if (collectPickup(pk, rm)) rm.pickups.splice(i, 1);
    }
  }
}

// ---------- ПЬЕДЕСТАЛЫ: реликвии, лавка, алтарь ----------
const POOL_BY_ROOM = { treasure: 'treasure', shop: 'shop', boss: 'boss', secret: 'secret', altar: 'altar' };

function rerollPeds() {
  const pool = POOL_BY_ROOM[curRoom.type] || 'treasure';
  let any = false;
  const used = curRoom.peds.filter(p => !p.taken && p.kind === 'relic').map(p => p.item);
  for (const ped of curRoom.peds) {
    if (ped.taken || ped.kind !== 'relic') continue;
    const wasActive = !!ped.item.active;
    ped.item = rollRelic(pool, wasActive, used);
    used.push(ped.item);
    if (curRoom.type === 'shop') ped.price = relicPrice(ped.item);
    else if (curRoom.type === 'survival' || (curRoom.type === 'arena')) ped.price = 0;
    if (curRoom.type === 'altar') ped.price = Math.round(player.maxHp * (ped.item.q >= 4 ? 0.28 : 0.18) / 5) * 5;
    any = true;
    spawnParticles(ped.x, ped.y - 10, 16, '#e7e5e4');
  }
  return any;
}

function takeRelic(ped) {
  const it = ped.item;
  if (it.active && player.active) {
    const old = player.active;
    ped.item = old; ped.lock = 1.2; ped.price = 0; ped.group = 0;
  } else ped.taken = true;
  if (ped.group) for (const o of curRoom.peds) if (o !== ped && o.group === ped.group && !o.taken) { o.taken = true; spawnParticles(o.x, o.y - 14, 14, '#64748b'); }
  addRelic(player, it);
  Snd.play(it.curse ? 'blood' : 'relic');
  if (it.curse) Stats.add('curses', 1);
  spawnParticles(ped.x, ped.y - 14, 28, it.color);
  floatText = { title: it.name, desc: it.desc, color: it.color, relic: it, timer: 4, max: 4, active: !!it.active };
  shake = Math.max(shake, 3);
}

function pedWarn(ped, text) {
  if (ped.warn > 0) return;
  ped.warn = 1.4;
  Snd.play('error');
  showMessage(text, '#fca5a5');
}

function tryTakePed(ped) {
  const p = player;
  if (ped.price > 0) {
    if (ped.cur === 'silver' && p.silver < ped.price) { pedWarn(ped, `Не хватает серебра: нужно ${ped.price}`); return; }
    if (ped.cur === 'blood' && p.maxHp - ped.price < 40) { pedWarn(ped, 'Слишком мало крови для такой цены'); return; }
  }
  if (ped.kind === 'pickup') {
    if (ped.pk === 'potion' && p.potions >= p.potionMax) { pedWarn(ped, 'Все слоты для зелий заняты'); return; }
    if (ped.pk === 'flask' && p.flasks >= 9) { pedWarn(ped, 'Больше склянок не унести'); return; }
    if (ped.pk === 'key' && p.keys >= 9) { pedWarn(ped, 'Некуда класть ключи'); return; }
  }
  if (ped.price > 0) {
    if (ped.cur === 'silver') { p.silver -= ped.price; Snd.play('buy'); }
    else {
      p.debt = (p.debt || 0) + ped.price;
      recalcPlayer(p);
      p.hp = Math.min(p.hp, p.maxHp);
      Snd.play('blood'); shake = Math.max(shake, 6);
      spawnParticles(p.x, p.y, 16, '#9f1239');
    }
  }
  if (ped.kind === 'relic') takeRelic(ped);
  else {
    ped.taken = true;
    if (ped.pk === 'potion') p.potions++; else if (ped.pk === 'flask') p.flasks++; else if (ped.pk === 'key') p.keys++;
    Snd.play('pickup');
    spawnParticles(ped.x, ped.y, 12, '#e7d9b0');
  }
}

function updatePeds(dt) {
  for (const ped of curRoom.peds) {
    if (ped.taken) continue;
    if (ped.warn > 0) ped.warn -= dt;
    if (ped.lock > 0) { ped.lock -= dt; continue; }
    if (Math.hypot(player.x - ped.x, player.y - ped.y) < player.r + ped.r) tryTakePed(ped);
  }
}

// ---------- УРОН ВРАГАМ ----------
function targetable(e) {
  if (e.dead || e.spawnT > 0 || e.hidden || e.phased || e.untouchable) return false;
  if (e.def && e.def.shade && !e.lit) return false;
  return true;
}

function damageEnemy(e, dmg, o = {}) {
  if (!targetable(e)) return false;
  if (e.gold > 0) { // золотая статуя разбивается любым прямым ударом
    if (!o.quiet && !o.fromMad) { shatterStatue(e); return true; }
    return false;
  }
  if (!o.fromMad) {
    const arm = e.fx.corrode > 0 ? 0 : (o.quiet ? 0 : e.armor * (1 - (o.armorPierce || 0)));
    dmg *= (e.fx.corrode > 0 ? 1.22 : 1) * (1 - arm);
    Stats.add('damageDealt', dmg);
  }
  e.hp -= dmg;
  e.hitFlash = 0.1;
  if (!o.quiet) { Snd.play('hit'); spawnParticles(e.x, e.y, 4, e.blood || '#7f1d1d'); }
  if (cfg().numbers && (!o.quiet || o.color) && pops.length < 36) {
    pops.push({ x: e.x + rnd(-8, 8), y: e.y - e.r - 6, txt: String(Math.max(1, Math.round(dmg))), life: 0.7, max: 0.7, color: o.crit ? '#fde047' : (o.color || '#e7e5e4'), big: !!o.crit });
  }
  if (e.hp <= 0) { killEnemy(e); return true; }
  return false;
}

function strike(e, dmg, o = {}) {
  if (!targetable(e)) return false;
  const p = player;
  if (p.fl.execute && !e.isBoss && e.hp - dmg < e.maxHp * 0.12) dmg = e.hp + 1;
  const died = damageEnemy(e, dmg, { crit: o.crit, armorPierce: o.armorPierce !== undefined ? o.armorPierce : p.armorPierce });
  if (e.gold > 0 || (died && e.goldBreak)) return died;
  if (p.fl.lifesteal && !died) p.hp = Math.min(p.maxHp, p.hp + dmg * 0.03 * p.fl.lifesteal);
  if (!died) applyStatus(e, o.fx);
  if (e.mass && o.ang !== undefined) {
    const k = (70 + (o.knock || 0) * 150) * e.mass;
    e.kx += Math.cos(o.ang) * k; e.ky += Math.sin(o.ang) * k;
  }
  const fx = o.fx || {};
  if (fx.chain && chance(luckChance(0.35, 0.02))) chainLightning(e, dmg * 0.55);
  if (fx.blast && chance(luckChance(0.14, 0.02))) explode(e.x, e.y, 62, { dmg: dmg * 1.6, small: true });
  return died;
}

function damageAllEnemies(n) {
  for (const e of curRoom.enemies) damageEnemy(e, n);
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  run.kills++;
  const p = player;
  Stats.hero(p.hero, 'kills', 1);
  noteKill(e);
  if (e.madHit) Stats.add('madKills', 1);
  if (p.fl.killHeal && !e.owner) { p.hp = Math.min(p.maxHp, p.hp + 2 * p.fl.killHeal); }
  shake = Math.max(shake, e.isBoss ? 14 : 2.5);
  const blood = e.blood || '#7f1d1d';
  spawnParticles(e.x, e.y, e.isBoss ? 60 : 14, blood);
  Snd.play(e.isBoss ? 'boss_die' : 'enemy_die');
  for (let i = 0; i < (e.isBoss ? 14 : 5); i++) {
    const a = rnd(0, 6.28), d = rnd(0, e.isBoss ? 50 : 24);
    curRoom.splatters.push({ x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, rx: rnd(4, 11), ry: rnd(3, 8), rot: rnd(0, 3.14), color: e.type === 'sporepod' || e.type === 'spider' ? 'rgba(90,140,40,0.30)' : 'rgba(110,14,24,0.38)' });
  }
  if (curRoom.splatters.length > 140) curRoom.splatters.splice(0, curRoom.splatters.length - 140);
  if (e.def.onDeath) e.def.onDeath(e);
  if (e.affix === 'explosive') {
    bulletRing(e.x, e.y, 8, 175, rnd(0, 1), { col: 'fire', dmg: dmgScale(8) });
    fxs.push({ type: 'boom', x: e.x, y: e.y, r0: 6, r1: 56, life: 0.3, max: 0.3 });
  }
  if (e.affix === 'splitting') {
    for (let i = 0; i < 2; i++) {
      const k = makeEnemy(e.type, e.x + (i ? 14 : -14), e.y, e.floor, { noSpawn: true, small: true });
      k.spawnT = 0.3; curRoom.enemies.push(k);
    }
  }
  if (e.goldBreak) statueRewards(e);
  if (e.isBoss) {
    run.lastBoss = e.type;
    for (const k of curRoom.enemies) if (k.owner === e && !k.dead) { k.dead = true; spawnParticles(k.x, k.y, 10, '#7f1d1d'); }
    eBullets.length = 0;
  } else if (!e.owner) {
    const dm = (p.fl.swarm ? 1.6 : 1) * runMod('drops');
    if (chance(luckChance(e.elite ? 0.6 : 0.28, 0.02))) spawnPickup(curRoom, 'wisp', e.x, e.y);
    if (e.elite) spawnPickup(curRoom, 'wisp', e.x, e.y);
    if (chance(luckChance((e.elite ? 0.5 : 0.06) * dm, 0.015))) spawnPickup(curRoom, rollDrop(e.elite), e.x, e.y);
    if (p.fl.oilKill) p.oil = Math.min(p.oilMax, p.oil + 3);
    if (HEROES[p.hero].skill === 'transmute' && !e.goldBreak && chance(0.3)) spawnPickup(curRoom, 'ember', e.x, e.y);
    if (p.fl.emberdrop && chance(e.elite ? 0.8 : 0.07)) spawnPickup(curRoom, 'ember', e.x, e.y);
    if (e.elite && !p.fl.emberdrop && chance(0.25)) spawnPickup(curRoom, 'ember', e.x, e.y);
  }
}

function shockwave(x, y, radius, dmg, knock) {
  for (const e of curRoom.enemies) {
    if (e.dead) continue;
    if (Math.hypot(e.x - x, e.y - y) < radius + e.r) {
      damageEnemy(e, dmg);
      const a = Math.atan2(e.y - y, e.x - x);
      e.kx += Math.cos(a) * knock * e.mass; e.ky += Math.sin(a) * knock * e.mass;
    }
  }
  eBullets.length = 0;
  shake = Math.max(shake, 8);
  Snd.play('stomp');
  fxs.push({ type: 'ring', x, y, r0: 10, r1: radius, life: 0.4, max: 0.4, color: '#fde68a' });
}

function chainLightning(from, dmg) {
  let best = null, bd2 = 170;
  for (const e of curRoom.enemies) {
    if (e === from || !targetable(e)) continue;
    const d = dist(from, e);
    if (d < bd2) { bd2 = d; best = e; }
  }
  if (!best) return;
  fxs.push({ type: 'line', x1: from.x, y1: from.y, x2: best.x, y2: best.y, life: 0.18, max: 0.18, color: '#bae6fd' });
  Snd.play('zap');
  damageEnemy(best, dmg, { quiet: true, color: '#bae6fd' });
}

function explode(x, y, radius, o = {}) {
  const rm = curRoom;
  Snd.play('burst');
  shake = Math.max(shake, o.small ? 4 : 10);
  fxs.push({ type: 'boom', x, y, r0: 6, r1: radius, life: 0.4, max: 0.4 });
  spawnParticles(x, y, o.small ? 12 : 30, '#fb923c');
  for (const e of rm.enemies) {
    if (e.dead) continue;
    if (Math.hypot(e.x - x, e.y - y) < radius + e.r) {
      damageEnemy(e, o.dmg || 50);
      const a = Math.atan2(e.y - y, e.x - x);
      e.kx += Math.cos(a) * 260 * e.mass; e.ky += Math.sin(a) * 260 * e.mass;
      if (o.burn) { e.fx.burn = 3; e.burnDmg = Math.max(2, player.dmg * 0.2); }
    }
  }
  if (o.breakUrns && rm.tiles) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = rm.tiles[r][c];
      if (t && t.t === 'P' && Math.hypot(tileX(c) - x, tileY(r) - y) < radius + 20) destroyTile(rm, c, r);
    }
  }
}

// ---------- ЗОНЫ, КАПКАНЫ, СКЛЯНКИ ----------
function flaskBurst(x, y) {
  const dmg = 40 * (player.dmg / 24 + 0.3);
  explode(x, y, 82, { dmg, burn: true, breakUrns: true });
  zones.push({ kind: 'fire', x, y, r: 74, t: 4.5, max: 4.5, dps: 26 * (player.dmg / 24 + 0.3), tick: 0 });
}

function updateThrown(dt) {
  for (let i = thrown.length - 1; i >= 0; i--) {
    const f = thrown[i];
    f.t += dt;
    const k = Math.min(1, f.t / f.dur);
    f.x = lerp(f.x0, f.x1, k); f.y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 60;
    f.gy = lerp(f.y0, f.y1, k);
    if (f.t >= f.dur) {
      thrown.splice(i, 1);
      if (f.kind === 'acid') acidBurst(f.x1, f.y1, f.dmg, f.crit);
      else if (f.kind === 'mad') madBurst(f.x1, f.y1);
      else flaskBurst(f.x1, f.y1);
    }
  }
}

function updateZones(dt) {
  const p = player;
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    z.t -= dt; z.tick -= dt;
    if (z.t <= 0) { zones.splice(i, 1); continue; }
    if (z.kind === 'fire' && Math.random() < dt * (z.small ? 10 : 30)) particles.push({ x: z.x + rnd(-z.r, z.r) * 0.8, y: z.y + rnd(-z.r, z.r) * 0.5, vx: rnd(-10, 10), vy: rnd(-70, -25), r: rnd(2, 4), color: '#fb923c', life: 0.5, maxLife: 0.5 });
    if (z.kind === 'acid' && Math.random() < dt * 24) particles.push({ x: z.x + rnd(-z.r, z.r) * 0.8, y: z.y + rnd(-z.r, z.r) * 0.5 - 20, vx: 0, vy: rnd(60, 110), r: rnd(1.4, 2.4), color: '#a3e635', life: 0.25, maxLife: 0.25 });
    if (z.kind === 'mad' && Math.random() < dt * 18) particles.push({ x: z.x + rnd(-z.r, z.r) * 0.8, y: z.y + rnd(-z.r, z.r) * 0.6, vx: rnd(-14, 14), vy: rnd(-45, -15), r: rnd(1.5, 2.8), color: '#f472b6', life: 0.6, maxLife: 0.6 });
    if (z.kind === 'sanctum' && Math.random() < dt * 20) particles.push({ x: z.x + rnd(-z.r, z.r) * 0.8, y: z.y + rnd(-z.r, z.r) * 0.6, vx: 0, vy: rnd(-50, -20), r: rnd(1.5, 3), color: '#fde68a', life: 0.7, maxLife: 0.7 });
    if (z.tick <= 0) {
      z.tick = 0.25;
      for (const e of curRoom.enemies) {
        if (e.dead || e.spawnT > 0 || e.hidden) continue;
        if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r * 0.5) {
          if (z.kind === 'fire') { damageEnemy(e, z.dps * 0.25, { quiet: true, color: '#fb923c' }); if (!e.dead) { e.fx.burn = Math.max(e.fx.burn, 1.2); e.burnDmg = Math.max(e.burnDmg || 0, 3); } }
          else if (z.kind === 'acid') { e.fx.corrode = Math.max(e.fx.corrode, 1.4); damageEnemy(e, z.dps * 0.25, { quiet: true, color: '#a3e635' }); }
          else if (z.kind === 'mad') { if (e.isBoss) e.fx.slow = Math.max(e.fx.slow, 1.5); else e.fx.mad = Math.max(e.fx.mad, 3.4); }
          else { e.lit = true; damageEnemy(e, z.dps * 0.25, { quiet: true, color: '#fde68a' }); }
        }
      }
    }
    if (z.kind === 'sanctum' && Math.hypot(p.x - z.x, p.y - z.y) < z.r && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 4 * dt);
  }
}

function updateTraps(dt) {
  for (let i = traps.length - 1; i >= 0; i--) {
    const t = traps[i];
    t.t += dt; t.life -= dt;
    if (t.flash > 0) t.flash -= dt;
    if (t.life <= 0) { traps.splice(i, 1); continue; }
    if (t.t < 0.6) continue;
    for (const e of curRoom.enemies) {
      if (!targetable(e) || (e.fly && !e.isBoss)) continue;
      if (Math.hypot(e.x - t.x, e.y - t.y) < t.r + e.r * 0.6) {
        Snd.play('trap');
        shake = Math.max(shake, 4);
        spawnParticles(t.x, t.y, 14, '#cbd5e1');
        fxs.push({ type: 'ring', x: t.x, y: t.y, r0: 6, r1: 50, life: 0.25, max: 0.25, color: '#cbd5e1' });
        const dmg = 55 * (player.dmg / 24) * (1 + 0.04 * floorNum);
        damageEnemy(e, dmg);
        if (!e.dead) { if (e.isBoss) e.fx.slow = Math.max(e.fx.slow, 2.5); else e.fx.stun = Math.max(e.fx.stun, 2.6); }
        traps.splice(i, 1);
        break;
      }
    }
  }
}

// ---------- СНАРЯДЫ ГЕРОЯ ----------
function shotDie(s, reason) {
  spawnParticles(s.x, s.y, 3, s.col === 'fire' ? '#fb923c' : s.col === 'venom' ? '#a3e635' : s.col === 'frost' ? '#bae6fd' : '#e7e5e4');
  if (s.fx.split && !s.child && reason !== 'range' && s.kind !== 'wave') {
    for (const a0 of [-0.7, 0.7]) {
      const a = Math.atan2(s.vy, s.vx) + a0;
      const c = spawnShot({ x: s.x, y: s.y, ang: a, speed: Math.hypot(s.vx, s.vy) * 0.8, r: Math.max(3.5, s.r * 0.6), dmg: s.dmg * 0.5, range: 130, kind: s.kind === 'orb' ? 'orb' : 'bolt', child: true, pierce: 0 });
      c.hit = s.hit.slice();
    }
  }
}

function hitEnemyWithShot(s, e) {
  if (e.def.shield && !s.spectral && e.fx.corrode <= 0) {
    const ta = Math.atan2(s.vy, s.vx);
    if (Math.abs(angDiff(ta, e.face + Math.PI)) < 1.15) {
      Snd.play('block');
      spawnParticles(s.x, s.y, 5, '#e2e8f0');
      return 'blocked';
    }
  }
  strike(e, s.dmg, { ang: Math.atan2(s.vy, s.vx), knock: s.knock, fx: s.fx, crit: s.crit });
  return 'hit';
}

function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    const spd = Math.hypot(s.vx, s.vy);
    const steps = Math.max(1, Math.ceil(spd * dt / 14));
    const sdt = dt / steps;
    let dead = false, reason = 'range';
    s.wob += dt * 10;
    for (let k = 0; k < steps && !dead; k++) {
      if (s.homing) {
        let tg = null, best = 330;
        for (const e of curRoom.enemies) {
          if (!targetable(e) || s.hit.includes(e)) continue;
          const d = Math.hypot(e.x - s.x, e.y - s.y);
          if (d < best) { best = d; tg = e; }
        }
        if (tg) {
          const cur = Math.atan2(s.vy, s.vx), want = Math.atan2(tg.y - s.y, tg.x - s.x);
          const na = cur + clamp(angDiff(want, cur), -s.turn * sdt, s.turn * sdt);
          s.vx = Math.cos(na) * spd; s.vy = Math.sin(na) * spd;
        }
      }
      s.x += s.vx * sdt; s.y += s.vy * sdt;
      s.travelled += spd * sdt;
      if (s.x < PLAY.x || s.x > PLAY.x + PLAY.w || s.y < PLAY.y || s.y > PLAY.y + PLAY.h) {
        if (s.bounce > 0) {
          if (s.x < PLAY.x || s.x > PLAY.x + PLAY.w) { s.vx = -s.vx; s.x = clamp(s.x, PLAY.x, PLAY.x + PLAY.w); }
          if (s.y < PLAY.y || s.y > PLAY.y + PLAY.h) { s.vy = -s.vy; s.y = clamp(s.y, PLAY.y, PLAY.y + PLAY.h); }
          s.bounce--;
        } else { dead = true; reason = 'wall'; break; }
      }
      if (s.travelled >= s.range) { dead = true; reason = 'range'; break; }
      if (!s.spectral && curRoom.tiles) {
        const c = tileCol(s.x), r = tileRow(s.y), tl = tileAt(curRoom, c, r);
        if (tl && (tl.t === 'R' || tl.t === 'P' || tl.t === 'F')) {
          if (tl.t === 'P') hitUrn(curRoom, c, r);
          dead = true; reason = 'wall'; break;
        }
      }
      for (const e of curRoom.enemies) {
        if (!targetable(e) || s.hit.includes(e)) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) < e.r + s.r) {
          const res = hitEnemyWithShot(s, e);
          if (res === 'blocked') { dead = true; reason = 'hit'; break; }
          if (s.pierce > 0) { s.pierce--; s.hit.push(e); }
          else { dead = true; reason = 'hit'; break; }
        }
      }
    }
    if (dead) { shotDie(s, reason); shots.splice(i, 1); }
  }
}

// ---------- ВРАЖЕСКИЕ СНАРЯДЫ И ВРАГИ ----------
function updateBullets(dt) {
  const p = player;
  for (let i = eBullets.length - 1; i >= 0; i--) {
    const b = eBullets[i];
    if (!b) continue;
    b.age += dt;
    if (b.home && !p.dead) { // самонаводящаяся слеза
      const sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx), want = Math.atan2(p.y - b.y, p.x - b.x);
      const na = cur + clamp(angDiff(want, cur), -b.home * dt, b.home * dt);
      b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
    }
    if (b.flip && b.age > b.flip) { b.vx = -b.vx * 0.95; b.vy = -b.vy * 0.95; b.flip = 0; } // бумеранг
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.age > b.life || b.x < PLAY.x - 4 || b.x > PLAY.x + PLAY.w + 4 || b.y < PLAY.y - 4 || b.y > PLAY.y + PLAY.h + 4) { eBullets.splice(i, 1); continue; }
    const tl = curRoom.tiles ? tileAtPos(curRoom, b.x, b.y) : null;
    if (tl && (tl.t === 'R' || tl.t === 'P' || tl.t === 'F')) { spawnParticles(b.x, b.y, 3, '#7f1d1d'); eBullets.splice(i, 1); continue; }
    if (!p.dead && p.iframes <= 0 && Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.r * 0.75) {
      hurtPlayer(b.dmg, b);
      const bi = eBullets.indexOf(b);
      if (bi >= 0) eBullets.splice(bi, 1);
    }
  }
}

function updateEnemies(dt) {
  const arr = curRoom.enemies, p = player;
  for (let i = 0; i < arr.length; i++) {
    const e = arr[i];
    if (e.dead) continue;
    updateEnemy(e, dt);
    if (e.dead) continue;
    if (e.spawnT <= 0) noteSeen(e);
    if (e.spawnT <= 0 && !e.hidden && !e.phased && !e.untouchable && !(e.gold > 0) && !(e.fx.mad > 0) && p.iframes <= 0 && !p.dead) {
      if (Math.hypot(p.x - e.x, p.y - e.y) < e.r * 0.92 + p.r * 0.8) {
        if (e.def.onTouch && e.def.onTouch(e)) continue;
        hurtPlayer(e.state === 'dash' ? e.touch + 4 : e.touch, e);
      }
    }
  }
  curRoom.enemies = arr.filter(e => !e.dead);
}

// ---------- ТАЙНЫЕ ХОДЫ, КОСТЁР ----------
function revealDoor(rm, dn) {
  const door = rm.doors[dn];
  door.hidden = false;
  const t = grid.get(door.to);
  if (t) t.doors[DIR_BY_NAME[dn].opp].hidden = false;
  Snd.play('unlock');
  const d = DIR_BY_NAME[dn];
  spawnParticles(d.x, d.y, 24, '#a78bfa');
  showMessage('Свет проявил тайный ход', '#c4b5fd');
}

function updateRunes(dt) {
  const rm = curRoom, p = player;
  for (const d of DIRS) {
    const door = rm.doors[d.name];
    if (!door || !door.hidden) continue;
    const near = Math.hypot(p.x - d.x, p.y - d.y) < 110 && p.oil > 0;
    door.reveal = clamp((door.reveal || 0) + (near ? dt : -dt * 1.5), 0, 2);
    if (door.reveal >= 1.6) revealDoor(rm, d.name);
  }
}

function updateShrine(dt) {
  const sh = curRoom.shrine;
  if (!sh) return;
  const p = player;
  if (!sh.used && Math.hypot(p.x - sh.x, p.y - sh.y) < p.r + sh.r) {
    sh.used = true;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.6);
    p.oil = p.oilMax;
    p.ward = Math.min(100, p.ward + 10);
    if (p.potions < p.potionMax) p.potions++;
    Snd.play('sanctum'); Snd.play('potion');
    spawnParticles(sh.x, sh.y, 30, '#fbbf24');
    showMessage('У костра: раны затянулись, фонарь полон', '#fde68a');
  }
}

// ---------- ДВЕРИ, КОМНАТЫ, ГЛУБИНЫ ----------
function fixPlayerPos() {
  const p = player;
  if (p.fly || !curRoom.tiles) return;
  const t = tileAtPos(curRoom, p.x, p.y);
  if (!t || t.t === 'S') return;
  let best = null, bdist = 1e9;
  for (const c of curRoom.spawnCells) {
    const d = Math.hypot(tileX(c.c) - p.x, tileY(c.r) - p.y);
    if (d < bdist) { bdist = d; best = c; }
  }
  if (best) { p.x = tileX(best.c); p.y = tileY(best.r); }
}

function enterRoomObj(rm, px, py) {
  curRoom = rm;
  const p = player;
  hazards = [];
  if (!rm.populated) withSeed(hashStr(run.seedStr + '|r' + floorNum + '|' + rm.gx + ',' + rm.gy), () => populateRoom(rm, { x: px, y: py }));
  if (p.fl.rotRoom && !rm.rotted && rm.type !== 'start') { rm.rotted = true; p.hp = Math.max(1, p.hp - 4 * p.fl.rotRoom); hurtFlash = 0.3; showMessage('Гниль точит плоть: −4 здоровья', '#a3e635'); }
  if (rm.type === 'secret' && !rm.found) { rm.found = true; Stats.add('secrets', 1); }
  if (rm.type === 'event' && !rm.evDone) rm.evPending = 0.6;
  rm.visited = true;
  p.x = px; p.y = py; p.vx = p.vy = p.kx = p.ky = 0; p.swing = null;
  p.portalCd = 0.9;
  fixPlayerPos();
  shots = []; eBullets = []; thrown = []; traps = []; zones = [];
  for (const f of p.fams) { f.x = p.x; f.y = p.y; }
  roomTransition = 0.2;
  if (p.fl.holy && (rm.enemies.length || rm.type === 'boss')) p.shield = true;
  Snd.play('door');
  if (rm.enemies.some(e => e.isBoss) && !rm.cleared) {
    const b = rm.enemies.find(e => e.isBoss);
    banner = { text: b.name, sub: b.sub, color: '#e11d48', timer: 2.8, max: 2.8, boss: true };
    Music.mode = 'boss';
    Snd.play('boss_intro');
  } else {
    Music.mode = 'calm';
    if (rm.type === 'shop') showMessage('Странствующий торговец: серебро — на стол', '#86efac');
    else if (rm.type === 'treasure') showMessage('Реликварий', '#fde68a');
    else if (rm.type === 'secret') showMessage('Тайная комната', '#c4b5fd');
    else if (rm.type === 'altar') showMessage('Алтарь крови: цена — часть жизни', '#fca5a5');
    else if (rm.type === 'shrine') showMessage('Костёр. Здесь можно перевести дух', '#fde68a');
    else if (rm.type === 'event') showMessage('Здесь что-то происходит…', '#7dd3fc');
    else if (rm.type === 'trial' && !rm.cleared) {
      const tt = { dark: ['ИСПЫТАНИЕ: МРАК', 'Тени вышли на охоту. Выманивай их на свет'], siege: ['ИСПЫТАНИЕ: ОСАДА', 'Три волны. Награда — тому, кто устоит'], hunt: ['ИСПЫТАНИЕ: ОХОТА', 'Избранный и его свита. Не дай им окружить себя'] }[rm.trialKind] || ['ИСПЫТАНИЕ', ''];
      banner = { text: tt[0], sub: tt[1], color: '#f59e0b', timer: 3, max: 3 };
    } else if (rm.type === 'arena') { /* баннеры волн ставит режим выживания */ }
    if (rm.hatter && !rm.hatter.done) showMessage('Кто-то улыбается в темноте…', '#c4b5fd');
  }
}

function checkDoors() {
  const p = player, rm = curRoom;
  for (const d of DIRS) {
    const door = rm.doors[d.name];
    if (!door || door.hidden) continue;
    const half = DOOR_W / 2 - 8;
    let touching = false;
    if (d.name === 'u') touching = p.y <= PLAY.y + p.r + 2 && Math.abs(p.x - CX) < half;
    else if (d.name === 'd') touching = p.y >= PLAY.y + PLAY.h - p.r - 2 && Math.abs(p.x - CX) < half;
    else if (d.name === 'l') touching = p.x <= PLAY.x + p.r + 2 && Math.abs(p.y - CY) < half;
    else touching = p.x >= PLAY.x + PLAY.w - p.r - 2 && Math.abs(p.y - CY) < half;
    const push = { u: keys.KeyW, d: keys.KeyS, l: keys.KeyA, r: keys.KeyD }[d.name];
    if (!touching || !rm.cleared || !push) continue;
    const target = grid.get(door.to);
    if (!target) continue;
    if (door.locked) {
      if (p.keys > 0) {
        p.keys--;
        door.locked = false;
        target.doors[d.opp].locked = false;
        Snd.play('unlock');
        spawnParticles(d.x, d.y, 18, '#fbbf24');
      } else if (!rm.keyWarn || rm.keyWarn <= 0) {
        rm.keyWarn = 1.5; Snd.play('error'); showMessage('Дверь заперта — нужен ключ', '#fca5a5');
      }
      continue;
    }
    let px = CX, py = CY;
    if (d.name === 'u') py = PLAY.y + PLAY.h - p.r - 8;
    else if (d.name === 'd') py = PLAY.y + p.r + 8;
    else if (d.name === 'l') px = PLAY.x + PLAY.w - p.r - 8;
    else px = PLAY.x + p.r + 8;
    enterRoomObj(target, px, py);
    return;
  }
  if (rm.keyWarn > 0) rm.keyWarn -= 1 / 60;
}

function loadFloor(n) {
  floorNum = n;
  run.mapAll = false; run.floorHits = 0; run.bossHit = false;
  curRoom = withSeed(hashStr(run.seedStr + '|f' + n), () => generateFloor(n));
  const p = player;
  p.x = CX; p.y = CY; p.vx = p.vy = p.kx = p.ky = 0;
  shots = []; eBullets = []; thrown = []; traps = []; zones = []; fxs = []; pops = []; hazards = [];
  for (const f of p.fams) { f.x = p.x; f.y = p.y; }
  Music.setFloor(n); Music.mode = 'calm';
  const F = floorDef(n);
  banner = { text: `ГЛУБИНА ${n}: ${F.name}`, sub: FLOOR_EPIGRAPH_ALT[F.id] || FLOOR_EPIGRAPH[n], color: F.accent, timer: 3.6, max: 3.6 };
  run.floorReached = Math.max(run.floorReached, n);
  roomTransition = 0.5;
  if (p.fl.holy) p.shield = true;
}

function nextFloor() {
  Snd.play('stair');
  if (run.mode === 'survival') return;
  if (floorNum >= MAX_FLOOR) { beginFinale(); return; }
  if (run.floorHits === 0) Ach.unlock('flawless_floor');
  const next = floorNum + 1;
  if (cfg().story !== false && INTERLUDES[floorNum]) startStory(INTERLUDES[floorNum](), () => { state = 'play'; loadFloor(next); });
  else loadFloor(next);
}

function teleportRandom() {
  const cands = [...grid.values()].filter(r => r !== curRoom && r.type !== 'secret' && r.type !== 'boss');
  if (!cands.length) return false;
  const rm = pick(cands);
  Snd.play('use');
  enterRoomObj(rm, CX, CY);
  player.iframes = Math.max(player.iframes, 1.2);
  return true;
}

// ---------- ЗАЧИСТКА КОМНАТЫ ----------
function checkRoomClear(dt) {
  const rm = curRoom;
  if (rm.cleared) { if (rm.stair && rm.stair.delay > 0) rm.stair.delay -= dt; return; }
  if (rm.enemies.length > 0) return;
  if (rm.waves.length) {
    if (!(rm.waveTimer > 0)) rm.waveTimer = 0.8;
    rm.waveTimer -= dt;
    if (rm.waveTimer <= 0) {
      rm.waveTimer = 0;
      spawnEnemyGroup(rm, rm.waves.shift(), { x: player.x, y: player.y });
      Snd.play('spawn');
    }
    return;
  }
  onRoomCleared(rm);
}

function trialReward(rm) {
  const k = rm.trial ? rm.trial.kind : '';
  const cx = CX, cy = CY;
  if (k === 'dark') {
    spawnPickup(rm, 'chest', cx, cy - 30);
    for (let i = 0; i < 3; i++) spawnPickup(rm, 'wisp', cx + rnd(-60, 60), cy + rnd(-30, 30));
    if (chance(luckChance(0.55, 0.03))) rm.peds.push(makePed(rollRelic('treasure'), cx, cy + 40));
  } else if (k === 'siege') {
    rm.peds.push(makePed(rollRelic('treasure'), cx, cy));
    for (let i = 0; i < 3; i++) spawnPickup(rm, rollDrop(true), cx + rnd(-80, 80), cy + rnd(40, 90));
  } else {
    spawnPickup(rm, 'key', cx - 40, cy);
    for (let i = 0; i < 5; i++) spawnPickup(rm, 'pouch', cx + rnd(-60, 60), cy + rnd(-30, 50));
    if (chance(luckChance(0.6, 0.03))) rm.peds.push(makePed(rollRelic('treasure'), cx + 60, cy));
  }
  showMessage('Испытание пройдено!', '#fde68a'); Snd.play('relic');
  Stats.add('trials', 1);
}

function onRoomCleared(rm) {
  rm.cleared = true;
  Snd.play('door');
  Stats.add('roomsCleared', 1);
  if (rm.type === 'trial') trialReward(rm);
  if (rm.ambushReward === 'relic') { rm.peds.push(makePed(rollRelic('boss'), CX, CY)); rm.ambushReward = null; showMessage('Награда за смелость', '#fde68a'); }
  shake = Math.max(shake, 3);
  Music.mode = 'calm';
  const p = player;
  p.oil = Math.min(p.oilMax, p.oil + 10);
  if (rm.type === 'boss') bossDefeated(rm);
  else {
    chargeActive(1);
    if (chance(luckChance(0.34 * runMod('drops'), 0.03))) spawnPickup(rm, rollDrop(), CX + rnd(-50, 50), CY + rnd(-30, 30));
  }
  if (p.fl.regen) healPlayer(10);
  if (p.fl.wardRegen) p.ward = Math.min(100, p.ward + 8);
  run.cleared++;
}

function bossDefeated(rm) {
  const p = player;
  run.bossKills++;
  const bid = run.lastBoss || '';
  if (bid) { const bk = Save.data.bossKills; bk[bid] = (bk[bid] || 0) + 1; }
  Stats.add('bossKills', 1);
  run.finalBoss = floorNum >= MAX_FLOOR ? bid : run.finalBoss;
  if (!run.bossHit) Ach.unlock('flawless_boss');
  run.bossHit = false;
  checkHeroUnlocks();
  rm.stair = { x: CX, y: CY, r: 24, delay: 1.2, final: floorNum >= MAX_FLOOR };
  clearTilesNear(rm, CX, CY, 80);
  clearTilesNear(rm, CX - 140, CY, 60);
  clearTilesNear(rm, CX + 140, CY, 60);
  fixPlayerPos();
  eBullets.length = 0;
  chargeActive(2);
  p.oil = Math.min(p.oilMax, p.oil + 30);
  spawnParticles(CX, CY, 50, '#fbbf24');
  for (let i = rndInt(2, 3); i > 0; i--) spawnPickup(rm, rollDrop(true), CX + rnd(-90, 90), CY + rnd(60, 130));
  if (floorNum < MAX_FLOOR && chance(luckChance(0.6, 0.02))) rm.peds.push(makePed(rollRelic('boss'), CX - 140, CY));
  if (floorNum < MAX_FLOOR && chance(luckChance(0.3, 0.02))) rm.portal = { x: CX + 140, y: CY, r: 22, kind: 'altar', target: null };
  if (p.fl.holy) p.shield = true;
  showMessage(BOSS_EPITAPH_ID[bid] || BOSS_EPITAPH[floorNum] || 'Босс повержен', '#fde68a');
}

function updateStairPortal(dt) {
  const rm = curRoom, p = player;
  if (rm.stair && rm.stair.delay <= 0 && Math.hypot(p.x - rm.stair.x, p.y - rm.stair.y) < p.r + rm.stair.r) { nextFloor(); return; }
  if (rm.portal && p.portalCd <= 0 && Math.hypot(p.x - rm.portal.x, p.y - rm.portal.y) < p.r + rm.portal.r) {
    const pt = rm.portal;
    if (pt.kind === 'altar') {
      if (!rm.altarRoom) rm.altarRoom = makeAltarRoom(rm);
      enterRoomObj(rm.altarRoom, CX, CY + 90);
    } else {
      enterRoomObj(pt.target, pt.target.portal ? pt.target.portal.x : CX, pt.target.portal ? pt.target.portal.y + 78 : CY);
    }
  }
}

// ---------- СПУСК ----------
function startRun(heroId, opts = {}) {
  const mode = opts.mode || 'classic';
  const seedStr = normSeed(opts.seedStr) || (mode === 'daily' ? 'D' + todayKey().replace(/-/g, '') : randomSeedCode());
  const dm = mode === 'daily' ? DAILY_MODS[hashStr(seedStr) % DAILY_MODS.length] : null;
  run = {
    hero: heroId, mode, seedStr, seed: hashStr(seedStr), live: true, pure: mode === 'daily',
    burden: mode === 'daily' ? 0 : cfg().burden, time: 0, kills: 0, hits: 0, collected: [], seen: new Set(),
    floorReached: 1, bossKills: 0, cleared: 0, notes: 0, won: false, embers: 0, coins: 0, bonusEmbers: 0, score: 0,
    wave: 0, events: 0, s: {}, fv: {}, mod: dm, modv: dm ? dm.modv : null, seenEv: [], mapAll: false, floorHits: 0, bossHit: false,
    ending: null, record: false, lastBoss: '', finalBoss: '', armedUsed: []
  };
  shots = []; eBullets = []; thrown = []; zones = []; traps = []; particles = []; fxs = []; pops = []; hazards = []; toasts = [];
  floatText = null; banner = null; message = null; shake = 0; restartHold = 0; hurtFlash = 0;
  player = createPlayer(heroId);
  if (mode !== 'daily') {
    applyArmed();
    const forge = Save.upgrade('forge');
    for (let i = 0; i < forge; i++) addRelic(player, rollRelic('treasure', false));
  }
  if (mode === 'survival') startSurvival(); else loadFloor(1);
  state = 'play';
  Save.data.runs++;
  if (mode === 'seed') Save.data.seedsPlayed++;
  Stats.add('runs', 1); Stats.hero(heroId, 'runs', 1);
  Save.store();
  if (!Save.data.prologue && mode !== 'survival' && cfg().story !== false) {
    Save.data.prologue = true; Save.store();
    startStory(PROLOGUE(), () => { state = 'play'; });
  }
}
function restartRun() {
  const m = run.mode;
  startRun(player.hero, { mode: m, seedStr: (m === 'daily' || m === 'seed') ? run.seedStr : undefined });
}

function endRun(won) {
  run.won = won; run.live = false;
  banner = null; floatText = null; message = null; evUI = null; Hat.s = null;
  const d = Save.data, surv = run.mode === 'survival';
  d.kills += run.kills;
  d.bosses += run.bossKills;
  Stats.hero(run.hero, 'kills', 0);
  Stats.add('playTime', Math.round(run.time));
  Stats.hero(run.hero, 'time', Math.round(run.time));
  if (!surv) { d.bestFloor = Math.max(d.bestFloor, run.floorReached); Stats.heroMax(run.hero, 'bestFloor', run.floorReached); }
  const bounty = 1 + 0.08 * Save.upgrade('bounty');
  if (surv) {
    run.embers = Math.round((run.wave * 3.2 + run.kills * 0.18 + run.time / 25 + run.bossKills * 12) * (1 + 0.25 * run.burden) * bounty);
    run.coins = Math.floor(run.wave * 0.9 + run.bossKills * 2);
  } else {
    run.embers = Math.round((run.floorReached * 7 + run.kills * 0.2 + run.bossKills * 18 + run.collected.length * 1.5 + (won ? 120 : 0)) * (1 + 0.25 * run.burden) * bounty * (run.mode === 'daily' ? 0.6 : 1));
    run.coins = won ? 4 + run.burden * 2 : 0;
    if (run.mode === 'daily') run.coins += 3;
  }
  run.embers += run.bonusEmbers;
  run.score = calcScore(run);
  if (surv) {
    const sv = d.survival;
    sv.runs++;
    if (run.wave > sv.bestWave) { sv.bestWave = run.wave; run.record = true; run.coins += 5; }
    sv.bestTime = Math.max(sv.bestTime, Math.round(run.time));
    sv.bestScore = Math.max(sv.bestScore, run.score);
    Stats.add('survivalWaves', run.wave);
  }
  if (run.mode === 'daily') {
    const key = todayKey(), prev = d.daily[key];
    if (!prev || run.score > prev.score) { d.daily[key] = { score: run.score, floor: run.floorReached, hero: run.hero, won, time: Math.round(run.time), mod: run.mod ? run.mod.id : '', tries: (prev ? prev.tries : 0) + 1 }; run.record = true; }
    else prev.tries = (prev.tries || 1) + 1;
  }
  d.embers += run.embers;
  d.coins += run.coins;
  if (won) {
    d.wins++;
    d.wonWith[run.hero] = (d.wonWith[run.hero] || 0) + 1;
    if (run.mode !== 'daily') d.burdenMax = Math.min(3, Math.max(d.burdenMax, run.burden + 1));
    if (run.mode === 'classic' && (!d.bestTime || run.time < d.bestTime)) d.bestTime = Math.round(run.time);
    Stats.hero(run.hero, 'wins', 1);
    if (run.burden >= 3) Stats.add('burden3win', 1);
    if (run.ending) { d.endings[run.ending] = (d.endings[run.ending] || 0) + 1; Ach.unlock('end_' + run.ending); }
  } else { Stats.add('deaths', 1); Stats.hero(run.hero, 'deaths', 1); }
  checkHeroUnlocks();
  Ach.check();
  Save.store();
  Snd.play(won ? 'win' : 'lose');
  state = won ? 'win' : 'dead';
}

// ---------- ГЛАВНОЕ ОБНОВЛЕНИЕ ----------
let autosaveT = 0;
function update(dt) {
  Music.update(dt);
  updateCosmetics(dt);
  autosaveT += dt;
  if (autosaveT > 25) { autosaveT = 0; Save.store(); }
  if (state === 'hatter') { updateHatter(dt); return; }
  if (state === 'story' && storyUI) { storyUI.t += dt; return; }
  if (state !== 'play') return;
  run.time += dt;
  Ach.tick(dt);

  if (keys.KeyR) {
    restartHold += dt;
    if (restartHold >= 1) { restartRun(); return; }
  } else restartHold = 0;

  if (player.dead) {
    player.deathT += dt;
    if (player.deathT > 1.8) endRun(false);
    return;
  }

  if (player.oil <= 0) Stats.add('darkTime', dt);
  updatePlayer(dt);
  checkDoors();
  updateShots(dt);
  updateThrown(dt);
  updateZones(dt);
  updateTraps(dt);
  updateHazards(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updatePickups(dt);
  updatePeds(dt);
  updateRunes(dt);
  updateShrine(dt);
  updateStairPortal(dt);
  if (run.mode === 'survival') updateSurvival(dt); else checkRoomClear(dt);
  if (curRoom.tiles) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = curRoom.tiles[r][c];
      if (t && t.shake > 0) t.shake -= dt;
    }
  }
  // события и Шляпник
  const rm = curRoom;
  if (rm.evPending > 0) { rm.evPending -= dt; if (rm.evPending <= 0) startEvent(rm); }
  const h = rm.hatter;
  if (h && !h.done && state === 'play') {
    h.cd = (h.cd || 0) - dt;
    if (h.cd <= 0 && Math.hypot(player.x - h.x, player.y - h.y) < 64) openHatter(rm);
  }
}
