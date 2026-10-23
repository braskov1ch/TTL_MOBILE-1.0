'use strict';
/* =====================================================================
   HERO: герои, характеристики, оружие, рывок, умения, фонарь, спутники
   ===================================================================== */
const HEROES = {
  hunter: {
    id: 'hunter', name: 'Егерь', title: 'Охотник на ночных тварей',
    desc: 'Арбалет бьёт редко, но насквозь. ПКМ — капкан: обездвиживает добычу.',
    weapon: 'bolt', skill: 'trap', skillName: 'Капкан', skillMax: 7,
    maxHp: 90, ward: 0, dmg: 24, atk: 1.7, range: 540, projSpeed: 760, speed: 196, luck: 0, crit: 0.08,
    flasks: 2, potions: 1, dashCharges: 2, unlock: 0, cloak: '#3d4a36', trim: '#b7c28a', skin: '#e8c9a2'
  },
  knight: {
    id: 'knight', name: 'Пилигрим', title: 'Рыцарь сломанного ордена',
    desc: 'Меч с серией ударов рассекает и снаряды. ПКМ — щит: вовремя поднятый, он отражает удар.',
    weapon: 'blade', skill: 'guard', skillName: 'Щит', skillMax: 0,
    maxHp: 130, ward: 15, dmg: 32, atk: 1.9, range: 74, projSpeed: 540, speed: 178, luck: 0, crit: 0.06,
    flasks: 1, potions: 1, dashCharges: 2, unlock: 60, cloak: '#5b2a2a', trim: '#cbd5e1', skin: '#e9c9a4'
  },
  priestess: {
    id: 'priestess', name: 'Свечница', title: 'Последняя из хора',
    desc: 'Посох мечет быстрые огни, что слегка ищут цель. ПКМ — святилище: круг света, жгущий нечисть.',
    weapon: 'orb', skill: 'sanctum', skillName: 'Святилище', skillMax: 16,
    maxHp: 80, ward: 25, dmg: 11, atk: 4.0, range: 430, projSpeed: 440, speed: 190, luck: 1, crit: 0.05,
    flasks: 1, potions: 2, dashCharges: 2, unlock: 120, cloak: '#e5e1d3', trim: '#fde68a', skin: '#f1d4b5'
  }
};
Object.assign(HEROES, {
  alchemist: {
    id: 'alchemist', name: 'Алхимик', title: 'Одержимый наукой безумец',
    desc: 'ЛКМ — кислотный дождь, разъедающий броню. ПКМ — эликсир безумия: враги нападают друг на друга.',
    weapon: 'acid', skill: 'madness', skillName: 'Эликсир безумия', skillMax: 11,
    maxHp: 80, ward: 0, dmg: 18, atk: 1.2, range: 440, projSpeed: 400, speed: 186, luck: 0, crit: 0.06,
    flasks: 2, potions: 1, dashCharges: 2, unlock: 150, cloak: '#3b4a2a', trim: '#a3e635', skin: '#d9c9a0'
  },
  executioner: {
    id: 'executioner', name: 'Палач', title: 'Немой служитель павших королей',
    desc: 'Топор помнит вкус тысячи шей. ЛКМ — медленные сокрушительные удары сквозь броню. ПКМ — казнь: огромный урон одной цели, остальные оглушены.',
    weapon: 'axe', skill: 'execute', skillName: 'Казнь', skillMax: 9, armorPierce: 0.5,
    maxHp: 140, ward: 10, dmg: 45, atk: 0.8, range: 88, projSpeed: 400, speed: 166, luck: 0, crit: 0.07,
    flasks: 1, potions: 1, dashCharges: 2, unlock: 200, cloak: '#2b1b1f', trim: '#e11d48', skin: '#1a1214'
  },
  trapper: {
    id: 'trapper', name: 'Ловчий', title: 'Тот, кто приручил тьму',
    desc: 'Сражается в паре с ручным вороном. ЛКМ — быстрые удары кинжалом. ПКМ — приказ ворону: пикирует на врага, ранит и слепит.',
    weapon: 'dagger', skill: 'crow', skillName: 'Приказ ворону', skillMax: 6,
    maxHp: 95, ward: 0, dmg: 22, atk: 1.8, range: 54, projSpeed: 400, speed: 206, luck: 0, crit: 0.10,
    flasks: 1, potions: 1, dashCharges: 2, unlock: 90, cloak: '#4a4036', trim: '#d6c9a3', skin: '#e0c29c'
  },
  necromancer: {
    id: 'necromancer', name: 'Некромант', title: 'Должник у собственной смерти',
    desc: 'ЛКМ — прикосновение могилы: гниение (до 3 раз). ПКМ — кровавое эхо: жертвует 20% здоровья ради призрачного двойника, к которому липнут враги. Здоровье медленно возвращается.',
    weapon: 'grave', skill: 'echo', skillName: 'Кровавое эхо', skillMax: 8, regen: 0.9,
    maxHp: 60, ward: 0, dmg: 16, atk: 1.4, range: 118, projSpeed: 400, speed: 186, luck: 0, crit: 0.06,
    flasks: 1, potions: 1, dashCharges: 2, unlock: 0, cond: { type: 'bosses', need: 10 },
    condText: 'Убей 10 боссов', cloak: '#241b36', trim: '#a78bfa', skin: '#b8c4c9'
  },
  fallen: {
    id: 'fallen', name: 'Падший Алхимик', title: 'Золото — вот единственная истина',
    desc: 'ЛКМ — тяжёлые свинцовые шары отбрасывают врагов. ПКМ — трансмутация: враг становится золотой статуей, а разбитая статуя щедро платит углями.',
    weapon: 'lead', skill: 'transmute', skillName: 'Трансмутация', skillMax: 6.5,
    maxHp: 70, ward: 0, dmg: 12, atk: 1.5, range: 380, projSpeed: 380, speed: 178, luck: 1, crit: 0.05,
    flasks: 1, potions: 1, dashCharges: 2, unlock: 0, cond: { type: 'spent', need: 5000 },
    condText: 'Потрать в лагере 5000 углей', cloak: '#7a5c14', trim: '#facc15', skin: '#e6d3a1'
  },
  reaper: {
    id: 'reaper', name: 'Жнец', title: 'Коса, не знающая преграды',
    desc: 'Парит над землёй. ЛКМ — широкие взмахи косы. Рывок — бросок как у Костяного Жнеца. ПКМ — жатва: вихрь теней.',
    weapon: 'scythe', skill: 'harvest', skillName: 'Жатва', skillMax: 10, fly: true, dash: 'reap', dashCd: 1.7,
    maxHp: 100, ward: 0, dmg: 24, atk: 1.2, range: 98, projSpeed: 420, speed: 188, luck: 0, crit: 0.08,
    flasks: 1, potions: 1, dashCharges: 2, unlock: 0, cond: { type: 'reaper', need: 3 }, secret: true,
    condText: 'Секрет', cloak: '#15131d', trim: '#94a3b8', skin: '#d6cfb4'
  }
});
const HERO_ORDER = ['hunter', 'knight', 'priestess', 'alchemist', 'executioner', 'trapper', 'necromancer', 'fallen', 'reaper'];

// Условные герои открываются сами, как только условие выполнено
function heroCondMet(h) {
  const d = Save.data;
  if (!h.cond) return false;
  if (h.cond.type === 'bosses') return d.bosses >= h.cond.need;
  if (h.cond.type === 'spent') return (d.spent || 0) >= h.cond.need;
  if (h.cond.type === 'reaper') return ((d.bossKills || {}).reaper || 0) >= h.cond.need;
  return false;
}
function heroCondProgress(h) {
  const d = Save.data;
  if (!h.cond) return [0, 1];
  if (h.cond.type === 'bosses') return [Math.min(d.bosses, h.cond.need), h.cond.need];
  if (h.cond.type === 'spent') return [Math.min(d.spent || 0, h.cond.need), h.cond.need];
  if (h.cond.type === 'reaper') return [Math.min((d.bossKills || {}).reaper || 0, h.cond.need), h.cond.need];
  return [0, 1];
}
function checkHeroUnlocks() {
  let any = false;
  for (const id of HERO_ORDER) {
    const h = HEROES[id];
    if (!Save.data.heroes[id] && h.cond && heroCondMet(h)) {
      Save.data.heroes[id] = true; any = true;
      pendingHeroUnlocks.push(id);
      if (typeof pushToast === 'function') pushToast({ title: 'Новый герой', text: h.name, color: '#a78bfa', kind: 'hero' });
      if (typeof Ach !== 'undefined') Ach.unlock('hero_' + id);
    }
  }
  if (any) Save.store();
  return any;
}
const pendingHeroUnlocks = [];

const CAMP_UPGRADES = [
  { id: 'vigor', name: 'Закалка', desc: '+8 здоровья за уровень', max: 5, cost: [15, 25, 40, 60, 90] },
  { id: 'edge', name: 'Заточка', desc: '+4% урона за уровень', max: 5, cost: [15, 25, 40, 60, 90] },
  { id: 'stride', name: 'Лёгкая поступь', desc: '+5 скорости за уровень', max: 3, cost: [20, 40, 70] },
  { id: 'wick', name: 'Длинный фитиль', desc: 'Масло тратится на 7% медленнее за уровень', max: 4, cost: [20, 35, 55, 80] },
  { id: 'purse', name: 'Походный кошель', desc: '+12 серебра на старте за уровень', max: 3, cost: [10, 20, 35] },
  { id: 'alchemy', name: 'Алхимия', desc: 'Ур. 1: +1 зелье на старте. Ур. 2: +2 склянки', max: 2, cost: [25, 45] },
  { id: 'memory', name: 'Рунная память', desc: 'В реликварии можно выбирать из нескольких реликвий (2, затем 3)', max: 2, cost: [60, 120] },
  { id: 'archive', name: 'Архив реликвий', desc: 'Открывает новые реликвии в реликвариях, лавках и наградах', max: 3, cost: [50, 100, 160] },
  { id: 'bounty', name: 'Награда за голову', desc: '+8% углей за спуск за уровень', max: 5, cost: [80, 140, 220, 320, 450] },
  { id: 'resolve', name: 'Воля к жизни', desc: 'Раз за спуск смерть не берёт вас: возвращается 40% здоровья', max: 1, cost: [400] },
  { id: 'forge', name: 'Походная кузня', desc: 'Начинаете спуск со случайной реликвией', max: 2, cost: [260, 600] },
  { id: 'eternal', name: 'Вечное пламя', desc: '+1% урона и +1 здоровья за уровень', max: 25, cost: Array.from({ length: 25 }, (_, i) => 60 + i * 24) }
];

function createPlayer(heroId) {
  const h = HEROES[heroId];
  const U = id => Save.upgrade(id);
  const p = {
    hero: heroId, x: CX, y: CY, vx: 0, vy: 0, kx: 0, ky: 0, r: 14,
    maxHp: h.maxHp + U('vigor') * 8 + U('eternal'), hp: 0, ward: h.ward,
    potions: h.potions + (U('alchemy') >= 1 ? 1 : 0), flasks: h.flasks + (U('alchemy') >= 2 ? 2 : 0),
    keys: 0, silver: U('purse') * 12, oil: 100, oilMax: 100,
    base: {
      dmg: h.dmg * (1 + U('edge') * 0.04 + U('eternal') * 0.01), atk: h.atk, range: h.range, projSpeed: h.projSpeed,
      speed: h.speed + U('stride') * 5, luck: h.luck, crit: h.crit, dashMax: h.dashCharges, oilSave: U('wick') * 0.07
    },
    dmg: h.dmg, atk: h.atk, rangeBonus: 0, projSpeed: h.projSpeed, speed: h.speed, luck: h.luck, crit: h.crit, critDmg: 1.75,
    light: 0, dashMax: h.dashCharges, dashCd: 1.35, potionMax: 3, knock: 0, projExtra: 0, size: 0, oilSave: 0, famMul: 1,
    fl: {}, relics: [], active: null, charge: 0, oaths: {},
    iframes: 0, hurtT: 0, aimAng: 0, aim: { x: 1, y: 0 }, attacking: false, atkTimer: 0, swing: null, combo: 0, comboT: 0,
    dashing: 0, dashDir: 0, dashCharges: h.dashCharges, dashTimer: 0, skillCd: 0, skillMax: h.skillMax,
    skillHeld: false, guard: { on: false, t: 0, cd: 0 }, healBuf: 0, potionCd: 0, ghostFx: 0, shield: false,
    regenCount: 0, fams: [], dead: false, deathT: 0, animWalk: 0, portalCd: 0, fly: false, moving: false, lowOilWarn: 0, dashTrailT: 0,
    // v2.0
    armorPierce: h.armorPierce || 0, enemyDmg: 0, shopMul: 0, potionMul: 1, slowT: 0, decoy: null, exec: null, harvest: null, reap: null,
    resolveUsed: false, regenHero: h.regen || 0
  };
  p.hp = p.maxHp;
  recalcPlayer(p);
  p.hp = p.maxHp;
  return p;
}

// Пересчёт всех характеристик: база + реликвии + обеты
function recalcPlayer(p) {
  const b = p.base;
  let dmgPct = 0, atkPct = 0, range = 0, ps = 0, speed = 0, luck = 0, crit = 0, critDmg = 0, maxHp = 0, light = 0;
  let dashC = 0, dashCd = 0, potMax = 0, knock = 0, pex = 0, size = 0, oilSave = 0, famMul = 0;
  let oilMaxS = 0, enemyDmg = 0, potPct = 0, shopMul = 0, armorP = 0;
  const fl = {};
  const apply = m => {
    oilMaxS += m.oilMax || 0; enemyDmg += m.enemyDmg || 0; potPct += m.potionPct || 0; shopMul += m.shopMul || 0; armorP += m.armorPierce || 0;
    dmgPct += m.dmgPct || 0; atkPct += m.atkPct || 0; range += m.range || 0; ps += m.projSpeed || 0; speed += m.speed || 0;
    luck += m.luck || 0; crit += m.crit || 0; critDmg += m.critDmg || 0; maxHp += m.maxHp || 0; light += m.light || 0;
    dashC += m.dashCharges || 0; dashCd += m.dashCd || 0; potMax += m.potionMax || 0; knock += m.knock || 0;
    pex += m.projExtra || 0; size += m.size || 0; oilSave += m.oilSave || 0; famMul += m.famMul || 0;
  };
  for (const it of p.relics) {
    apply(it.mods);
    for (const f of it.flags) fl[f] = (fl[f] || 0) + 1;
  }
  for (const o of OATHS) {
    if (!p.oaths[o.id]) continue;
    apply(o.mods || {});
    for (const f of (o.flags || [])) fl[f] = (fl[f] || 0) + 1;
  }
  p.dmg = Math.max(2, b.dmg * (1 + dmgPct) * runMod('heroDmg'));
  p.atk = clamp(b.atk * (1 + atkPct), 0.5, 14);
  p.rangeBonus = range;
  p.projSpeed = clamp(b.projSpeed + ps, 200, 1100);
  p.speed = clamp(b.speed + speed, 100, 330);
  p.luck = b.luck + luck;
  p.crit = clamp(b.crit + crit, 0, 0.8);
  p.critDmg = 1.75 + critDmg;
  p.light = light;
  p.dashMax = Math.min(5, b.dashMax + dashC);
  p.dashCd = Math.max(0.5, (HEROES[p.hero].dashCd || 1.35) + dashCd);
  p.potionMax = Math.min(6, 3 + potMax);
  p.knock = knock;
  p.projExtra = Math.min(3, pex);
  p.size = size;
  p.oilSave = clamp(b.oilSave + oilSave, -0.8, 0.8);
  p.oilMax = clamp(100 + oilMaxS, 40, 160);
  p.oil = Math.min(p.oil, p.oilMax);
  p.enemyDmg = enemyDmg;
  p.shopMul = shopMul;
  p.potionMul = clamp(1 + potPct, 0.3, 2);
  p.armorPierce = clamp((HEROES[p.hero].armorPierce || 0) + armorP, 0, 0.9);
  p.famMul = 1 + famMul;
  p.fl = fl;
  p.fly = !!fl.flight || !!HEROES[p.hero].fly;
  const base = HEROES[p.hero].maxHp + Save.upgrade('vigor') * 8 + Save.upgrade('eternal');
  p.maxHp = Math.max(30, Math.round((base + maxHp - (p.debt || 0)) * runMod('heroHp')));
  p.hp = Math.min(p.hp, p.maxHp);
  p.dashCharges = Math.min(p.dashCharges, p.dashMax);
  p.potions = Math.min(p.potions, p.potionMax);
  rebuildFamiliars(p);
}

function rebuildFamiliars(p) {
  const want = [];
  if (p.hero === 'trapper') want.push('crow');
  for (const it of p.relics) if (it.fam) want.push(it.fam);
  const old = p.fams.slice(), out = [];
  for (const type of want) {
    const i = old.findIndex(f => f.type === type);
    if (i >= 0) out.push(old.splice(i, 1)[0]);
    else out.push({ type, x: p.x, y: p.y, a: rnd(0, 6.28), cd: 0, fireT: 0, r: type === 'wisp' ? 9 : 11, mode: 'perch', target: null, t: 0 });
  }
  p.fams = out;
}

function addRelic(p, it) {
  if (it.active) { p.active = it; p.charge = it.active.max; }
  else {
    p.relics.push(it);
    recalcPlayer(p);
    if (it.onPickup) it.onPickup(p);
    p.hp = clamp(p.hp, 1, p.maxHp);
    checkOaths(p);
    recalcPlayer(p);
  }
  if (run) run.collected.push(it.id);
  if (!it.boon) Save.discover(it.id);
}

function checkOaths(p) {
  for (const o of OATHS) {
    if (p.oaths[o.id]) continue;
    if (p.relics.filter(r => r.school === o.school).length >= o.need) {
      p.oaths[o.id] = true;
      if (o.gain) o.gain(p);
      banner = { text: o.name, sub: o.desc, color: SCHOOLS[o.school].color, timer: 3.6, max: 3.6 };
      Snd.play('charge');
    }
  }
}

const lightRadius = () => clamp(110 + player.oil * 1.5 + player.light, 70, 520);

// ---------- ЛЕЧЕНИЕ / УРОН ----------
function healPlayer(n) {
  const p = player;
  if (p.hp >= p.maxHp) return false;
  p.hp = Math.min(p.maxHp, p.hp + n);
  Snd.play('potion');
  spawnParticles(p.x, p.y, 10, '#fca5a5');
  return true;
}
function drinkPotion() {
  const p = player;
  if (!p || p.dead || state !== 'play') return;
  if (p.potions <= 0) { Snd.play('error'); showMessage('Нет зелий', '#fca5a5'); return; }
  if (p.hp >= p.maxHp - 1) { Snd.play('error'); showMessage('Здоровье почти полное', '#cbd5e1'); return; }
  if (p.potionCd > 0) return;
  p.potions--;
  p.potionCd = 0.9;
  p.healBuf += 42 * (p.fl.potionPlus ? 1.3 : 1) * p.potionMul;
  Stats.add('potions', 1);
  Snd.play('potion');
}

function hurtPlayer(amount, src) {
  const p = player;
  if (p.dead || p.iframes > 0 || state !== 'play') return false;
  // щит Пилигрима
  if (p.guard.on && src) {
    const a = Math.atan2(src.y - p.y, src.x - p.x);
    if (Math.abs(angDiff(a, p.aimAng)) < 1.5) {
      if (p.guard.t < 0.3) { parryBurst(src); p.iframes = 0.4; return false; }
      amount *= 0.2;
      Snd.play('block');
      spawnParticles(p.x + p.aim.x * 16, p.y + p.aim.y * 16, 5, '#e2e8f0');
    }
  }
  if (p.fl.block && chance(0.18)) {
    p.iframes = 0.5;
    Snd.play('block');
    pops.push({ x: p.x, y: p.y - 24, txt: 'ТЕНЬ', life: 0.8, max: 0.8, color: '#c4b5fd' });
    return false;
  }
  if (p.shield) {
    p.shield = false; p.iframes = 0.6;
    Snd.play('shield');
    fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 12, r1: 60, life: 0.35, max: 0.35, color: '#fde68a' });
    return false;
  }
  amount = Math.max(1, Math.round(amount * (1 + p.enemyDmg)));
  const w = Math.min(p.ward, amount);
  p.ward -= w; amount -= w;
  p.hp -= amount;
  Stats.add('damageTaken', amount + w);
  if (run) { run.floorHits = (run.floorHits || 0) + 1; if (curRoom && curRoom.enemies.some(e => e.isBoss && !e.dead)) run.bossHit = true; }
  if (src && src.affix === 'vampiric' && src.hp > 0 && src.maxHp) src.hp = Math.min(src.maxHp, src.hp + (amount + w) * 1.5);
  if (src && src.slowHit) p.slowT = Math.max(p.slowT, 1.6);
  p.iframes = 0.9;
  p.hurtT = 0.35;
  hurtFlash = 0.5;
  shake = Math.max(shake, 7);
  Snd.play('hurt');
  spawnParticles(p.x, p.y, 14, '#b91c1c');
  if (src) {
    const a = Math.atan2(p.y - src.y, p.x - src.x);
    p.kx += Math.cos(a) * 240; p.ky += Math.sin(a) * 240;
    if (p.fl.thorns && src.fx && !src.dead) damageEnemy(src, 20, { quiet: false });
  }
  if (run) run.hits++;
  if (p.hp <= 0) {
    if (!p.resolveUsed && Save.upgrade('resolve') > 0) {
      p.resolveUsed = true; p.hp = Math.round(p.maxHp * 0.4); p.iframes = 2.2; hurtFlash = 0;
      showMessage('Воля к жизни: смерть отступила', '#fde68a'); Snd.play('charge');
      fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 10, r1: 160, life: 0.6, max: 0.6, color: '#fde68a' });
      return true;
    }
    p.hp = 0; p.dead = true; p.deathT = 0; Snd.play('lose');
  }
  return true;
}

// Парирование: отражает снаряды и оглушает нападавшего
function parryBurst(src) {
  const p = player;
  Stats.add('parries', 1);
  Snd.play('parry');
  shake = Math.max(shake, 5);
  fxs.push({ type: 'ring', x: p.x + p.aim.x * 20, y: p.y + p.aim.y * 20, r0: 8, r1: 90, life: 0.3, max: 0.3, color: '#fde68a' });
  spawnParticles(p.x + p.aim.x * 20, p.y + p.aim.y * 20, 16, '#fde68a');
  for (let i = eBullets.length - 1; i >= 0; i--) {
    const b = eBullets[i];
    if (Math.hypot(b.x - p.x, b.y - p.y) < 130) {
      const sp = Math.hypot(b.vx, b.vy) || 200;
      const a = Math.atan2(b.y - p.y, b.x - p.x);
      spawnShot({ x: b.x, y: b.y, ang: a, speed: Math.max(420, sp * 1.4), r: 7, dmg: p.dmg * 1.4, range: 600, kind: 'orb', noFx: true, pierce: 0 });
      eBullets.splice(i, 1);
    }
  }
  if (src && src.fx && !src.isBoss) src.fx.stun = Math.max(src.fx.stun, 1.8);
  else if (src && src.fx) src.fx.slow = Math.max(src.fx.slow, 1.5);
  chargeActive(1);
}

// ---------- СНАРЯДЫ ----------
function playerFx(child) {
  const f = player.fl;
  return { slow: !!f.slow, poison: !!f.poison, burn: !!f.burn, fear: !!f.fear, blast: !!f.blast, chain: !!f.chain, split: !!f.split && !child,
    corrode: !!f.corrode, rot: !!f.rot, madhit: !!f.madhit, blind: !!f.blind, midas: !!f.midas };
}

function spawnShot(o) {
  const p = player;
  const own = o.own || 'p';
  const s = {
    x: o.x, y: o.y, vx: Math.cos(o.ang) * o.speed, vy: Math.sin(o.ang) * o.speed,
    r: o.r, dmg: o.dmg, range: o.range, travelled: 0, own, kind: o.kind || 'bolt',
    homing: o.homing !== undefined ? o.homing : (!!p.fl.homing && own === 'p'),
    turn: o.turn || (o.kind === 'orb' ? 2.2 : 4.5),
    pierce: o.pierce !== undefined ? o.pierce : (p.fl.pierce || 0),
    spectral: !!p.fl.spectral && own === 'p',
    bounce: (p.fl.bounce && own === 'p') ? 3 : 0,
    fx: (o.noFx || own === 'f') ? {} : playerFx(o.child),
    crit: !!o.crit, hit: [], child: !!o.child, knock: own === 'f' ? 0 : (o.knock !== undefined ? o.knock : p.knock), wob: rnd(0, 6.28)
  };
  s.col = s.fx.burn ? 'fire' : s.fx.poison ? 'venom' : s.fx.slow ? 'frost' : (s.kind === 'orb' ? 'holy' : 'steel');
  if (o.col) s.col = o.col;
  else if (s.kind === 'lead') s.col = 'lead';
  shots.push(s);
  return s;
}

function attackRoll() {
  const p = player;
  const crit = chance(clamp(p.crit + p.luck * 0.01, 0, 0.9));
  let dmg = p.dmg * (crit ? p.critDmg : 1);
  if (p.fl.lastStand && p.hp < p.maxHp * 0.4) dmg *= 1.35;
  return { crit, dmg };
}
const shotRange = () => player.base.range + player.rangeBonus * (HEROES[player.hero].weapon === 'orb' ? 0.8 : 1);

function fireProjectiles(weapon) {
  const p = player;
  const { crit, dmg } = attackRoll();
  const n = 1 + p.projExtra, spread = 0.13;
  const sz = 1 + p.size * 0.5;
  const mk = (ang, d, rangeMul = 1, rMul = 1) => {
    if (weapon === 'lead') spawnShot({ x: p.x + Math.cos(ang) * 14, y: p.y + Math.sin(ang) * 14, ang, speed: p.projSpeed, r: 9 * sz * rMul, dmg: d * 1.25, range: shotRange() * rangeMul, kind: 'lead', crit, pierce: 1, knock: 3.4 + p.knock });
    else if (weapon === 'bolt') spawnShot({ x: p.x + Math.cos(ang) * 14, y: p.y + Math.sin(ang) * 14, ang, speed: p.projSpeed, r: 5.5 * sz * rMul, dmg: d, range: shotRange() * rangeMul, kind: 'bolt', crit, pierce: 1 + (p.fl.pierce || 0) });
    else spawnShot({ x: p.x + Math.cos(ang) * 14, y: p.y + Math.sin(ang) * 14, ang, speed: p.projSpeed, r: (5.5 + Math.sqrt(d) * 0.55) * sz * rMul, dmg: d, range: shotRange() * rangeMul, kind: 'orb', crit });
  };
  for (let i = 0; i < n; i++) mk(p.aimAng + (i - (n - 1) / 2) * spread, dmg);
  if (p.fl.rear) mk(p.aimAng + Math.PI, dmg * 0.7, 0.9, 0.9);
  if (p.fl.side) for (const s of [-1, 1]) mk(p.aimAng + s * Math.PI / 2, dmg * 0.5, 0.75, 0.85);
  Snd.play(weapon === 'bolt' ? 'bolt' : weapon === 'lead' ? 'lead' : 'orb');
  if (weapon === 'bolt') { p.kx -= p.aim.x * 40; p.ky -= p.aim.y * 40; }
  if (weapon === 'lead') { p.kx -= p.aim.x * 70; p.ky -= p.aim.y * 70; }
}

// Ближний бой: меч (серия из трёх), топор (медленно, сквозь броню), кинжал (быстро), коса (широкий взмах)
const SWING_KINDS = {
  blade:  { reach: 74, dur: 0.24, arc: 1.9, hitAt: 0.35, wave: 'steel', combo: true, kb: 0.6 },
  axe:    { reach: 88, dur: 0.42, arc: 2.15, hitAt: 0.52, wave: null, always: true, kb: 2.0 },
  dagger: { reach: 60, dur: 0.15, arc: 1.55, hitAt: 0.3, wave: null, combo: true, kb: 0.2 },
  scythe: { reach: 98, dur: 0.30, arc: 2.7, hitAt: 0.35, wave: 'shadow', kb: 0.8 }
};
function startSwing(kind) {
  const p = player;
  kind = kind || 'blade';
  const K = SWING_KINDS[kind];
  p.combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0;
  p.comboT = kind === 'dagger' ? 0.6 : 0.9;
  const heavy = K.always || (K.combo && p.combo === 2);
  const dur = Math.min(K.dur, 0.62 / p.atk);
  const { crit, dmg } = attackRoll();
  const arc = K.arc + 0.35 * p.projExtra + (p.fl.side ? 1.3 : 0) + (heavy && kind === 'blade' ? 0.4 : 0);
  const reach = (K.reach + p.rangeBonus * 0.3) * (heavy && kind === 'blade' ? 1.18 : 1) * (1 + p.size * 0.4);
  const dirSign = p.combo % 2 ? -1 : 1;
  const mult = kind === 'blade' ? (heavy ? 1.4 : 1) : kind === 'dagger' ? (heavy ? 1.5 : 1) : kind === 'axe' ? 1.15 : 1;
  p.swing = { t: 0, dur, ang: p.aimAng, arc, reach, dmg: dmg * mult, crit, heavy, dirSign, done: false, hit: [], kind, hitAt: K.hitAt, kb: K.kb };
  Snd.play(kind === 'axe' ? 'axe' : kind === 'scythe' ? 'scythe' : 'swing');
  p.kx += p.aim.x * (heavy ? 190 : 110); p.ky += p.aim.y * (heavy ? 190 : 110);
  if (K.wave) { // «волна» — призрачный снаряд, несущий эффекты реликвий
    spawnShot({ x: p.x + p.aim.x * 22, y: p.y + p.aim.y * 22, ang: p.aimAng, speed: 560, r: 13 + (heavy ? 4 : 0), dmg: dmg * (heavy ? 0.5 : 0.3), range: 170 + p.rangeBonus * 0.4, kind: 'wave', crit, pierce: 99, homing: false, col: K.wave === 'shadow' ? 'shadow' : undefined });
  }
}

function updateSwing(dt) {
  const p = player, sw = p.swing;
  if (!sw) return;
  sw.t += dt;
  if (!sw.done && sw.t >= sw.dur * sw.hitAt) {
    sw.done = true;
    const fx = playerFx(true);
    let hits = 0;
    for (const e of curRoom.enemies) {
      if (!targetable(e)) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > sw.reach + e.r) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      const front = Math.abs(angDiff(a, sw.ang)) < sw.arc / 2 + Math.min(0.5, e.r / Math.max(d, 1));
      const back = p.fl.rear && Math.abs(angDiff(a, sw.ang + Math.PI)) < sw.arc / 2;
      if (!front && !back) continue;
      strike(e, sw.dmg, { ang: a, knock: p.knock + (sw.heavy ? sw.kb + 0.9 : sw.kb), fx, crit: sw.crit, melee: true });
      hits++;
    }
    if (sw.kind === 'axe' && hits) { shake = Math.max(shake, 5); Snd.play('stomp'); }
    for (let i = eBullets.length - 1; i >= 0; i--) { // клинок рассекает снаряды
      const b = eBullets[i];
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < sw.reach + 10 && Math.abs(angDiff(Math.atan2(b.y - p.y, b.x - p.x), sw.ang)) < sw.arc / 2) {
        spawnParticles(b.x, b.y, 4, '#e2e8f0'); eBullets.splice(i, 1); Snd.play('block');
      }
    }
  }
  if (sw.t >= sw.dur) p.swing = null;
}

function fireRadial(n, mult) {
  const p = player;
  const dmg = p.dmg * mult;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    spawnShot({ x: p.x, y: p.y, ang, speed: 460, r: 7, dmg, range: 360, kind: 'orb', homing: false });
  }
  Snd.play('orb');
  fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 10, r1: 90, life: 0.3, max: 0.3, color: '#fde68a' });
}

// ---------- РЫВОК, УМЕНИЯ, СКЛЯНКИ ----------
function tryDash(mx, my) {
  const p = player;
  if (p.dead || p.dashing > 0 || p.dashCharges < 1 || state !== 'play') return;
  let ang = p.aimAng;
  if (mx || my) ang = Math.atan2(my, mx);
  p.dashDir = ang;
  p.dashing = 0.17;
  p.iframes = Math.max(p.iframes, 0.26);
  if (HEROES[p.hero].dash === 'reap') { // бросок как у Костяного Жнеца
    p.dashing = 0.36; p.iframes = Math.max(p.iframes, 0.44); p.reap = { hit: [] };
    shake = Math.max(shake, 3);
  }
  p.dashCharges--;
  p.swing = null;
  Stats.add('dashes', 1);
  Snd.play(p.reap ? 'reapdash' : 'dash');
  spawnParticles(p.x, p.y, 8, '#94a3b8');
}

function castSkill() {
  const p = player, h = HEROES[p.hero];
  if (p.skillCd > 0) { return; }
  if (h.skill === 'trap') {
    if (traps.length >= 3) { traps.shift(); }
    const tx = clamp(mouse.active ? mouse.x : p.x + p.aim.x * 80, PLAY.x + 20, PLAY.x + PLAY.w - 20);
    const ty = clamp(mouse.active ? mouse.y : p.y + p.aim.y * 80, PLAY.y + 20, PLAY.y + PLAY.h - 20);
    const d = Math.hypot(tx - p.x, ty - p.y), k = d > 260 ? 260 / d : 1;
    traps.push({ x: p.x + (tx - p.x) * k, y: p.y + (ty - p.y) * k, t: 0, life: 30, r: 22, flash: 0 });
    p.skillCd = h.skillMax * 0.85;
    Snd.play('trap');
  } else if (h.skill === 'sanctum') {
    const tx = clamp(mouse.active ? mouse.x : p.x + p.aim.x * 100, PLAY.x + 20, PLAY.x + PLAY.w - 20);
    const ty = clamp(mouse.active ? mouse.y : p.y + p.aim.y * 100, PLAY.y + 20, PLAY.y + PLAY.h - 20);
    const d = Math.hypot(tx - p.x, ty - p.y), k = d > 300 ? 300 / d : 1;
    zones.push({ kind: 'sanctum', x: p.x + (tx - p.x) * k, y: p.y + (ty - p.y) * k, r: 110, t: 7.5, max: 7.5, dps: p.dmg * 1.6, tick: 0 });
    p.skillCd = h.skillMax;
    Snd.play('sanctum');
  } else if (h.skill === 'madness') { if (castMadness()) p.skillCd = h.skillMax; }
  else if (h.skill === 'execute') { if (startExecute()) p.skillCd = h.skillMax; }
  else if (h.skill === 'crow') { if (sendCrow()) p.skillCd = h.skillMax; }
  else if (h.skill === 'transmute') { if (castTransmute()) p.skillCd = h.skillMax; }
  else if (h.skill === 'echo') { if (castEcho()) p.skillCd = h.skillMax; }
  else if (h.skill === 'harvest') { startHarvest(); p.skillCd = h.skillMax; }
}

function doAttack(h) {
  const p = player;
  if (p.fl.fuel) p.oil = Math.max(0, p.oil - 0.08);
  Stats.add('attacks', 1);
  switch (h.weapon) {
    case 'blade': startSwing('blade'); break;
    case 'axe': startSwing('axe'); break;
    case 'dagger': startSwing('dagger'); break;
    case 'scythe': startSwing('scythe'); break;
    case 'acid': throwAcid(); break;
    case 'grave': necroWave(p.x, p.y, p.aimAng, false); break;
    default: fireProjectiles(h.weapon);
  }
}

function throwFlask() {
  const p = player;
  if (!p || p.dead || state !== 'play') return;
  if (p.flasks <= 0) { Snd.play('error'); showMessage('Нет зажигательных склянок', '#fca5a5'); return; }
  p.flasks--;
  const tx = clamp(mouse.active ? mouse.x : p.x + p.aim.x * 200, PLAY.x + 10, PLAY.x + PLAY.w - 10);
  const ty = clamp(mouse.active ? mouse.y : p.y + p.aim.y * 200, PLAY.y + 10, PLAY.y + PLAY.h - 10);
  const d = Math.hypot(tx - p.x, ty - p.y), k = d > 380 ? 380 / d : 1;
  thrown.push({ x0: p.x, y0: p.y, x1: p.x + (tx - p.x) * k, y1: p.y + (ty - p.y) * k, t: 0, dur: 0.45 });
  Snd.play('flask');
}

function useActive() {
  const p = player;
  if (!p || p.dead || state !== 'play' || !p.active) return;
  if (p.charge < p.active.active.max) { Snd.play('error'); showMessage('Артефакт ещё не заряжен', '#fca5a5'); return; }
  const ok = p.active.active.use(p);
  if (ok !== false) { p.charge = 0; Snd.play('use'); }
}
function chargeActive(n) {
  const p = player;
  if (!p.active) return;
  const was = p.charge >= p.active.active.max;
  p.charge = Math.min(p.active.active.max, p.charge + n);
  if (!was && p.charge >= p.active.active.max) { Snd.play('charge'); showMessage(`${p.active.name} заряжен`, '#fde68a'); }
}

// ---------- ОБНОВЛЕНИЕ ----------
function updatePlayer(dt) {
  const p = player;
  if (p.iframes > 0) p.iframes -= dt;
  if (p.hurtT > 0) p.hurtT -= dt;
  if (p.ghostFx > 0) p.ghostFx -= dt;
  if (p.potionCd > 0) p.potionCd -= dt;
  if (p.skillCd > 0) p.skillCd -= dt;
  if (p.comboT > 0) p.comboT -= dt;
  if (p.lowOilWarn > 0) p.lowOilWarn -= dt;
  if (p.portalCd > 0) p.portalCd -= dt;
  if (p.slowT > 0) p.slowT -= dt;
  if (p.regenHero > 0 && p.hp < p.maxHp && !p.dead) p.hp = Math.min(p.maxHp, p.hp + p.regenHero * dt);
  if (p.decoy) updateDecoy(dt);

  // плавное лечение зельем
  if (p.healBuf > 0) {
    const h = Math.min(p.healBuf, 70 * dt);
    p.healBuf -= h; p.hp = Math.min(p.maxHp, p.hp + h);
    if (Math.random() < dt * 20) spawnParticles(p.x, p.y, 1, '#fca5a5');
  }

  // масло фонаря
  const drain = (curRoom.enemies.length ? 0.9 : 0.4) * (1 - p.oilSave) * runMod('oilDrain');
  p.oil = Math.max(0, p.oil - drain * dt);
  if (p.oil <= 0) {
    p.hp = Math.max(1, p.hp - 1.6 * dt);
    if (p.lowOilWarn <= 0) { p.lowOilWarn = 6; showMessage('Фонарь гаснет! Тьма вгрызается в плоть', '#fbbf24'); }
  }

  // перезарядка рывка
  if (p.dashCharges < p.dashMax) {
    p.dashTimer += dt;
    if (p.dashTimer >= p.dashCd) { p.dashTimer = 0; p.dashCharges++; }
  } else p.dashTimer = 0;

  if (p.exec) { updateExecute(dt); updateFamiliars(dt); return; }

  // ввод движения
  let mx = 0, my = 0;
  if (keys.KeyW) my--; if (keys.KeyS) my++; if (keys.KeyA) mx--; if (keys.KeyD) mx++;
  const touch = mobileInput.active ? mobileInput : null;
  if (touch) { mx += touch.moveX; my += touch.moveY; }
  // Аналоговый джойстик позволяет идти медленно; клавиатура остаётся бинарной.
  const rawLen = Math.hypot(mx, my);
  const len = Math.min(1, rawLen);
  if (rawLen > 1) { mx /= rawLen; my /= rawLen; }
  if (len > 0) { p.animWalk += dt * 10; }
  p.moving = len > 0;

  // прицел
  let attacking = false;
  if (touch && touch.attack) {
    // При ведении пальца по кнопке атаки прицел направлен вдоль жеста.
    if (touch.aiming) {
      p.aimAng = Math.atan2(touch.aimY, touch.aimX);
    } else {
      // Простое нажатие: автоматически направлять удар на ближайшего видимого врага.
      let closest = null, best = 600;
      if (curRoom) for (const enemy of curRoom.enemies) {
        if (enemy.dead || enemy.hidden || enemy.spawnT > 0 || enemy.phased) continue;
        const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (d < best) { best = d; closest = enemy; }
      }
      if (closest) p.aimAng = Math.atan2(closest.y - p.y, closest.x - p.x);
      else if (len > 0) p.aimAng = Math.atan2(my, mx);
    }
    // Для прицельных умений позиция курсора соответствует выбранному направлению.
    mouse.active = true;
    mouse.x = p.x + Math.cos(p.aimAng) * 240;
    mouse.y = p.y + Math.sin(p.aimAng) * 240;
    attacking = true;
  } else if (shootStack.length) {
    const k = shootStack[shootStack.length - 1];
    p.aimAng = k === 'ArrowUp' ? -Math.PI / 2 : k === 'ArrowDown' ? Math.PI / 2 : k === 'ArrowLeft' ? Math.PI : 0;
    attacking = true;
  } else if (mouse.active) {
    p.aimAng = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    attacking = mouse.down;
  } else if (len > 0) p.aimAng = Math.atan2(my, mx);
  p.aim = { x: Math.cos(p.aimAng), y: Math.sin(p.aimAng) };
  p.attacking = attacking;

  // умение (ПКМ / X)
  const h = HEROES[p.hero];
  const skillIn = mouse.right || keys.KeyX || (touch && touch.skill);
  if (h.skill === 'guard') {
    const g = p.guard;
    if (g.cd > 0) g.cd -= dt;
    if (skillIn && !g.on && g.cd <= 0 && p.dashing <= 0) { g.on = true; g.t = 0; p.swing = null; Snd.play('shield'); }
    if (g.on) { g.t += dt; if (!skillIn) { g.on = false; g.cd = 0.35; } }
  } else if (skillIn && !p.skillHeld) castSkill();
  p.skillHeld = !!skillIn;

  // движение
  let sp = p.speed;
  if (p.slowT > 0) sp *= 0.6;
  if (p.harvest) sp *= 0.75;
  if (p.guard.on) sp *= 0.55;
  if (p.swing) sp *= 0.8;
  let vx, vy;
  if (p.dashing > 0) {
    p.dashing -= dt;
    const dsp = p.reap ? 760 : 640;
    vx = Math.cos(p.dashDir) * dsp; vy = Math.sin(p.dashDir) * dsp;
    p.vx = vx * 0.5; p.vy = vy * 0.5;
    if (Math.random() < dt * 60) particles.push({ x: p.x, y: p.y, vx: rnd(-20, 20), vy: rnd(-20, 20), r: rnd(3, 6), color: '#64748b', life: 0.3, maxLife: 0.3 });
    if (p.fl.dashFire) {
      p.dashTrailT -= dt;
      if (p.dashTrailT <= 0) { p.dashTrailT = 0.04; zones.push({ kind: 'fire', x: p.x, y: p.y, r: 34, t: 2.2, max: 2.2, dps: 26 * (p.dmg / 24), tick: 0, small: true }); }
    }
  } else {
    const a = Math.min(1, dt * 18);
    p.vx += (mx * sp - p.vx) * a; p.vy += (my * sp - p.vy) * a;
    vx = p.vx; vy = p.vy;
  }
  const kd = Math.exp(-dt * 8);
  p.kx *= kd; p.ky *= kd;
  moveWithCollisions(p, p.x + (vx + p.kx) * dt, p.y + (vy + p.ky) * dt);
  if (p.reap) { reapDashTick(); if (p.dashing <= 0) reapDashEnd(); }

  // шипы
  if (!p.fly && p.dashing <= 0) {
    const t = tileAt(curRoom, tileCol(p.x), tileRow(p.y));
    if (t && t.t === 'S' && Math.abs(p.x - tileX(tileCol(p.x))) < 20 && Math.abs(p.y - tileY(tileRow(p.y))) < 20) hurtPlayer(dmgScale(8));
  }

  // атака
  p.atkTimer = Math.max(p.atkTimer - dt, -0.05);
  if (attacking && p.atkTimer <= 0 && p.dashing <= 0 && !p.guard.on && !p.harvest) {
    p.atkTimer += 1 / p.atk;
    if (p.atkTimer < 0) p.atkTimer = 0;
    doAttack(h);
  }
  updateSwing(dt);
  if (p.harvest) updateHarvest(dt);

  // тлеющий плащ
  if (p.fl.aura) {
    p.auraT = (p.auraT || 0) - dt;
    if (p.auraT <= 0) {
      p.auraT = 0.35;
      for (const e of curRoom.enemies) if (targetable(e) && dist(p, e) < 90 + e.r) { damageEnemy(e, Math.max(3, p.dmg * 0.22), { quiet: true }); if (!e.isBoss || chance(0.3)) e.fx.burn = Math.max(e.fx.burn, 1.5); e.burnDmg = Math.max(e.burnDmg || 0, p.dmg * 0.15); }
    }
  }
  updateFamiliars(dt);
}

// ---------- СПУТНИКИ ----------
function updateFamiliars(dt) {
  const p = player;
  const orbit = p.fams.filter(f => f.type === 'wisp');
  let oi = 0;
  for (const f of p.fams) {
    f.cd -= dt;
    if (f.type === 'wisp') {
      f.a += dt * 3.2;
      const ang = f.a + (oi++ / orbit.length) * Math.PI * 2;
      f.x = lerp(f.x, p.x + Math.cos(ang) * 44, Math.min(1, dt * 14));
      f.y = lerp(f.y, p.y + Math.sin(ang) * 44, Math.min(1, dt * 14));
      for (let i = eBullets.length - 1; i >= 0; i--) {
        const b = eBullets[i];
        if (Math.hypot(b.x - f.x, b.y - f.y) < f.r + b.r) { eBullets.splice(i, 1); spawnParticles(b.x, b.y, 5, '#5eead4'); Snd.play('block'); }
      }
      famContact(f, p.dmg * 0.3 * p.famMul, 0.35);
    } else if (f.type === 'hound' || f.type === 'cat') {
      const hunt = f.type === 'cat' ? 1000 : 240;
      let target = null, best = hunt;
      for (const e of curRoom.enemies) { if (!targetable(e)) continue; const d = dist(f, e); if (d < best) { best = d; target = e; } }
      let tx, ty, sp;
      if (target) { tx = target.x; ty = target.y; sp = f.type === 'cat' ? 290 : 250; }
      else { tx = p.x - p.aim.x * 40 + Math.cos(f.a) * 8; ty = p.y - p.aim.y * 40 + Math.sin(f.a) * 8; sp = 240; f.a += dt * 2; }
      const a = Math.atan2(ty - f.y, tx - f.x), d = Math.hypot(tx - f.x, ty - f.y);
      const step = Math.min(d, sp * dt * (target ? 1 : Math.min(2, d / 60 + 0.4)));
      f.x = clamp(f.x + Math.cos(a) * step, PLAY.x + 10, PLAY.x + PLAY.w - 10);
      f.y = clamp(f.y + Math.sin(a) * step, PLAY.y + 10, PLAY.y + PLAY.h - 10);
      famContact(f, p.dmg * (f.type === 'hound' ? 0.5 : 0.32) * p.famMul, f.type === 'hound' ? 0.45 : 0.3);
    } else if (f.type === 'crow') {
      updateCrow(f, dt);
    } else if (f.type === 'raven') {
      f.x = lerp(f.x, p.x - 30 - p.aim.x * 14, Math.min(1, dt * 5));
      f.y = lerp(f.y, p.y - 26 - p.aim.y * 14, Math.min(1, dt * 5));
      f.fireT -= dt;
      if (p.attacking && f.fireT <= 0) {
        f.fireT = Math.max(0.4, 0.8 / p.atk * 2);
        const dmg = Math.max(5, p.dmg * 0.45) * p.famMul;
        spawnShot({ x: f.x, y: f.y, ang: p.aimAng, speed: 520, r: 5, dmg, range: shotRange() * 0.8, kind: 'bolt', own: 'f', pierce: 0 });
      }
    }
  }
}
function famContact(f, dmg, cd) {
  if (f.cd > 0) return;
  for (const e of curRoom.enemies) {
    if (!targetable(e)) continue;
    if (dist(f, e) < f.r + e.r) {
      damageEnemy(e, dmg, { quiet: true });
      f.cd = cd;
      const a = Math.atan2(e.y - f.y, e.x - f.x);
      e.kx += Math.cos(a) * 120 * e.mass; e.ky += Math.sin(a) * 120 * e.mass;
      break;
    }
  }
}
