'use strict';
/* =====================================================================
   MODES: сюжетные вставки, финальный выбор, режим «Выживание», лавка угольщика
   ===================================================================== */

// ---------- СЮЖЕТ ----------
let storyUI = null;
const STORY_CPS = 46;   // символов в секунду
function startStory(pages, onDone) {
  storyUI = { pages, i: 0, t: 0, onDone, canSkip: true };
  state = 'story';
}
function storyAdvance() {
  const S = storyUI;
  if (!S) return;
  const len = tr(S.pages[S.i].text).length;
  if (S.t * STORY_CPS < len) { S.t = len / STORY_CPS + 0.01; return; }
  S.i++; S.t = 0;
  if (S.i >= S.pages.length) storyFinish();
}
function storyFinish() {
  const S = storyUI;
  if (!S) return;
  storyUI = null;
  if (S.onDone) S.onDone();
}
const notesRead = () => Object.keys(Save.data.notes).length;

function endingPages(ending, finalBoss) {
  const pages = ENDINGS[ending] || ENDINGS.light;
  return (finalBoss === 'keeper' ? [KEEPER_PAGE] : []).concat(pages);
}
function finalEvent() {
  const kp = run.finalBoss === 'keeper';
  return {
    id: 'final', art: 'fire', final: true, title: 'ПОСЛЕДНИЙ ВЫБОР', text: kp ? FINAL_TEXT_KEEPER : FINAL_TEXT,
    choices: [
      { label: 'Опустить фонарь в Огонь', run() { run.ending = 'light'; return 'Ты делаешь шаг к огню. Это тяжело — и правильно.'; } },
      { label: 'Назвать Безымянного по имени', cond: p => notesRead() >= 20, condText: 'Нужно знать больше: 20 записей Хроник', run() { run.ending = 'name'; return 'Слово срывается с губ само — оно ждало тебя всё это время.'; } },
      { label: 'Забрать Огонь себе', cond: p => curseCount(p) >= 1, condText: 'Нужна печать тьмы: проклятая реликвия', run() { run.ending = 'dark'; return 'Ладонь тянется к чёрному пламени. Оно тёплое.'; } }
    ]
  };
}
function beginFinale() {
  evUI = { ev: finalEvent(), rm: curRoom, phase: 'choose', sel: 0, final: true };
  state = 'event';
  Snd.play('boss_intro');
}

// ---------- ЛАВКА УГОЛЬЩИКА (за монеты, полученные в режимах) ----------
const LAVKA = [
  { id: 'scroll', name: 'Свиток удачи', desc: 'Удача +2 в следующем спуске', cost: 12, apply(p) { grantBoon('Свиток удачи', 'Удача +2', { luck: 2 }, 'arcane'); } },
  { id: 'blanket', name: 'Тёплое одеяло', desc: '+30 оберега на старте', cost: 10, apply(p) { p.ward = Math.min(100, p.ward + 30); } },
  { id: 'potions', name: 'Набор лекаря', desc: '+2 зелья и +2 склянки на старте', cost: 14, apply(p) { p.potions = Math.min(p.potionMax, p.potions + 2); p.flasks = Math.min(9, p.flasks + 2); } },
  { id: 'wickmix', name: 'Фитильная смесь', desc: 'Масло тает на 15% медленнее весь спуск', cost: 14, apply(p) { grantBoon('Фитильная смесь', 'Масло тает медленнее на 15%', { oilSave: 0.15 }, 'holy'); } },
  { id: 'keys', name: 'Связка ключей', desc: '+3 ключа на старте', cost: 10, apply(p) { p.keys = Math.min(9, p.keys + 3); } },
  { id: 'oldmap', name: 'Старая карта', desc: 'На каждой глубине видна карта', cost: 16, apply(p) { grantBoon('Старая карта', 'Показывает карту глубины', {}, 'arcane', ['mapAll']); } },
  { id: 'blessing', name: 'Благословение Хранителя', desc: '+20 здоровья и +6% урона на старте', cost: 24, apply(p) { grantBoon('Благословение', '+20 здоровья, урон +6%', { maxHp: 20, dmgPct: 0.06 }, 'holy'); p.hp += 20; } },
  { id: 'lottery', name: 'Реликвия-лотерея', desc: 'Случайная реликвия на старте', cost: 40, apply(p) { addRelic(p, rollRelic('treasure', false)); } }
];
const LAVKA_MAX = 3;
function buyLavka(i) {
  const it = LAVKA[i], d = Save.data;
  const have = d.armed[it.id] || 0;
  if (have >= LAVKA_MAX || d.coins < it.cost) { Snd.play('error'); return false; }
  d.coins -= it.cost; d.armed[it.id] = have + 1; Save.store(); Snd.play('buy');
  return true;
}
function applyArmed() {
  const d = Save.data;
  for (const it of LAVKA) {
    const n = d.armed[it.id] || 0;
    for (let k = 0; k < n; k++) it.apply(player);
    if (n) { run.armedUsed.push(it.id); d.armed[it.id] = 0; }
  }
  recalcPlayer(player);
  player.hp = Math.min(player.maxHp, Math.max(player.hp, player.hp));
}

// ---------- ВЫЖИВАНИЕ ----------
const survFloor = wave => 1 + Math.floor((wave - 1) / 2.5);

function startSurvival() {
  floorNum = 1; run.floorReached = 1;
  const rm = makeArenaRoom();
  grid = new Map([['0,0', rm]]);
  curRoom = rm;
  player.x = CX; player.y = CY + 70;
  Music.setFloor(1); Music.mode = 'calm';
  banner = { text: 'ВЫЖИВАНИЕ', sub: 'Продержись как можно дольше', color: '#e11d48', timer: 3, max: 3 };
  roomTransition = 0.5;
}

function startWave(rm, a) {
  a.wave++; run.wave = a.wave;
  floorNum = survFloor(a.wave);
  Music.setFloor(floorNum);
  run.floorReached = themeIdx(floorNum);
  const boss = a.wave % 5 === 0;
  a.bossWave = boss;
  const entry = { x: player.x, y: player.y };
  if (boss) {
    const bi = a.wave / 5, id = pickBossId(((bi - 1) % MAX_FLOOR) + 1);
    rm.enemies.push(makeBoss(floorNum, id, 0.8 + 0.12 * bi));
    Music.mode = 'boss'; Snd.play('boss_intro');
    banner = { text: `ВОЛНА ${a.wave}`, sub: BOSS_BY_ID[id].name, color: '#e11d48', timer: 2.8, max: 2.8, boss: true };
  } else {
    const budget = (4.2 + a.wave * 1.4 + rnd(0, 1.8)) * (1 + 0.1 * burdenLevel()) * runMod('budget');
    let types = pickEnemyTypes(floorNum, budget);
    if (player.fl.swarm && types.length) types.push(pick(types), pick(types));
    const cap = 6;
    if (types.length > cap) { rm.waves = []; while (types.length > cap) rm.waves.push(types.splice(cap, cap)); }
    spawnEnemyGroup(rm, types, entry);
    Snd.play('spawn');
    banner = { text: `ВОЛНА ${a.wave}`, sub: floorDef(floorNum).name, color: floorDef(floorNum).accent, timer: 2.2, max: 2.2 };
  }
  a.state = 'fight'; a.t2 = 1.2;
}

function waveCleared(rm, a) {
  const p = player;
  a.state = 'rest'; a.t = 5.5;
  run.cleared++;
  Snd.play('door');
  Music.mode = 'calm';
  chargeActive(a.bossWave ? 2 : 1);
  healPlayer(p.maxHp * 0.12);
  p.oil = Math.min(p.oilMax, p.oil + 28);
  const drops = 2 + Math.floor(a.wave / 4);
  for (let i = 0; i < drops; i++) spawnPickup(rm, rollDrop(a.wave > 8), CX + rnd(-160, 160), CY + rnd(-90, 90));
  for (let i = 0; i < 2; i++) spawnPickup(rm, 'wisp', CX + rnd(-100, 100), CY + rnd(-60, 60));
  if (a.bossWave) {
    run.bossKills++;
    const id = run.lastBoss;
    if (id) { Save.data.bossKills[id] = (Save.data.bossKills[id] || 0) + 1; }
    Stats.add('bossKills', 1);
    if (!run.bossHit) Ach.unlock('flawless_boss');
    run.bossHit = false;
    checkHeroUnlocks();
    rm.peds = [];
    const xs = [-130, 0, 130];
    for (let i = 0; i < 3; i++) rm.peds.push(makePed(rollRelic('boss'), CX + xs[i], CY, 0, 'silver', 1));
    a.t = 26;
    showMessage('Босс пал — выбери награду', '#fde68a');
  } else if (a.wave % 3 === 0) {
    rm.peds = [];
    const xs = [-130, 0, 130];
    for (let i = 0; i < 3; i++) rm.peds.push(makePed(rollRelic('treasure'), CX + xs[i], CY, 0, 'silver', 1));
    a.t = 24;
    showMessage('Награда за стойкость — выбери одну', '#fde68a');
  } else showMessage(`Волна ${a.wave} позади`, '#a3e635');
  if (rm.cleared !== true) rm.cleared = true;
}

function updateSurvival(dt) {
  const rm = curRoom, a = rm.arena;
  if (!a) return;
  if (a.state === 'prep') {
    a.t -= dt;
    rm.cleared = false;
    if (a.t <= 0) startWave(rm, a);
  } else if (a.state === 'fight') {
    rm.cleared = false;
    if (rm.enemies.length === 0) {
      if (rm.waves.length) {
        a.t2 -= dt;
        if (a.t2 <= 0) { spawnEnemyGroup(rm, rm.waves.shift(), { x: player.x, y: player.y }); a.t2 = 1.2; Snd.play('spawn'); }
      } else waveCleared(rm, a);
    }
  } else if (a.state === 'rest') {
    a.t -= dt;
    const open = rm.peds.filter(p => !p.taken);
    if (rm.peds.length && !open.length && a.t > 2.2) a.t = 2.2;   // награду взяли — идём дальше
    if (a.t <= 0) { rm.peds = []; a.state = 'prep'; a.t = 1.6; }
  }
}
