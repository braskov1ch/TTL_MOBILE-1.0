'use strict';
/* =====================================================================
   META: статистика, достижения, бестиарий, модификаторы дня, счёт
   ===================================================================== */
const Stats = {
  add(key, n = 1) {
    const s = Save.data.stats;
    s[key] = (s[key] || 0) + n;
    if (run && run.s) run.s[key] = (run.s[key] || 0) + n;
  },
  get(key) { return Save.data.stats[key] || 0; },
  hero(id, key, n = 1) {
    const h = Save.data.heroStats[id] || (Save.data.heroStats[id] = { runs: 0, wins: 0, kills: 0, bestFloor: 0, time: 0, deaths: 0 });
    h[key] = (h[key] || 0) + n;
  },
  heroMax(id, key, v) {
    const h = Save.data.heroStats[id] || (Save.data.heroStats[id] = { runs: 0, wins: 0, kills: 0, bestFloor: 0, time: 0, deaths: 0 });
    h[key] = Math.max(h[key] || 0, v);
  }
};

// ---------- БЕСТИАРИЙ ----------
const ENEMY_LORE = {
  bat: 'Летучие мыши Склепа давно забыли свет и охотятся на звук шагов. Чем громче бежишь — тем их больше.',
  ghoul: 'Бывший крестьянин. Он помнит только голод и дорогу к дому, которого больше нет.',
  archer: 'Лучник Хранителей. Стрелы кончились — теперь он стреляет костями собственных товарищей.',
  hound: 'Гончая тьмы идёт по следу масла из фонаря. Кусает без звука, воет только после.',
  leaper: 'Могильный прыгун сидит в земле неделями и вылетает из неё, едва услышит шаг.',
  spider: 'Паук-сторож плетёт сети на проходах: не чтобы ловить добычу, а чтобы услышать, когда её нет.',
  sporepod: 'Споровик — цветок, решивший жить в чужом черепе. Лопается, когда его тревожат.',
  flesh: 'Комок плоти, не помнящий, чем был. Делится при ударе — и, кажется, радуется.',
  worm: 'Червь тянется на запах свежей земли. Выныривает, чтобы выплюнуть всё, что проглотил за век.',
  gargoyle: 'Горгулья не живёт и не умирает. Она смотрит. Если ты в поле её взгляда — она стреляет.',
  necro: 'Последний ученик Хора, что остался дослушать погребальную песнь. Он поднимает слуг, чтобы не петь в одиночку.',
  servant: 'Костяной слуга не помнит, кому служит. Но служит исправно.',
  knight: 'Проклятый рыцарь носит щит, которым когда-то закрывал короля. Закрыть теперь некого.',
  golem: 'Мясной голем сшит из тех, кто опоздал на спасение. В груди — одно большое сердце, бьющееся на всех.',
  shade: 'Тень боится света: в нём она слабеет, а во тьме бессмертна. Выманивай её на огонь.',
  leech: 'Светоед тянется к фонарям, как мотылёк. Но не из любви, а ради масла внутри.',
  cultist: 'Культист Безымянного. Верит, что тьма — это мать, а свет — болезнь.',
  beetle: 'Гробовой жук носит панцирь из могильных плит. Простой удар скользит по нему — нужна кислота или топор.',
  hand: 'Из земли тянется рука, помнящая, как хватать. Подползает, пока не ухватит за ногу.',
  weeper: 'Плакальщица оплакивает каждого, кто входит. Её слёзы находят тебя, даже если ты за углом.',
  chorister: 'Хорист поёт — и всё вокруг становится быстрее и крепче. Пой, пока можешь. Лучше — замолчи его.',
  thornroot: 'Шипокорень стреляет корнями по прямой — и всегда целится заранее. Не стой на линии.',
  frostcaster: 'Морозильщик когда-то был алхимиком, пока холод не стал его единственным экспериментом.',
  abyssal: 'Бездонник исчезает там, где ступил, и возвращается рядом. После него на полу остаётся пустота.',
  mimic: 'Не каждый ларец — награда. Мимик умеет ждать, пока ты не вложишь ключ.'
};
const BOSS_LORE = {
  warden: 'Привратник стоял у врат Склепа с тех пор, как закрыли последний гроб. Он не злой — он просто не умеет пускать.',
  drowned: 'Мать-Утопленница унесла в воду целый храм — и до сих пор считает, что спасла от огня.',
  reaper: 'Костяной Жнец не берёт — он просто собирает то, что давно упало. Коса у него ещё с первого урожая.',
  bloom: 'Цветок вырос на месте костра Хранителей. Он питается светом и хочет ещё.',
  sarcophagus: 'В ледяном саркофаге кто-то считает до тысячи. Дойдёт — крышка откроется навсегда.',
  nameless: 'Безымянный пел первым. И, не получив ответа, стал Тьмой. Имя его забыто — но не навсегда.',
  gravedigger: 'Могильщик закопал каждого, кто пришёл сюда после Хора. Теперь копает под тех, кто пока жив.',
  bellringer: 'Звонарь тянет канат по звонарной привычке. Кого оплакивает колокол — он давно не помнит.',
  collector: 'Собиратель костей строит из мёртвых мёртвых побольше. Ему всегда не хватает одного ребра.',
  thornqueen: 'Королева Шипов правила садом, пока сад не стал править ею. Корона растёт, а не носится.',
  blizzard: 'Вьюга — это то, что осталось от женщины, не дождавшейся тепла. Ждать она больше не умеет.',
  keeper: 'Первый Хранитель, не уберёгший Огонь. Его меч ещё помнит жар, а щит — тяжесть вины.'
};
// порядок и список карточек бестиария
const BESTIARY_ENEMIES = ['bat', 'ghoul', 'archer', 'hound', 'leaper', 'spider', 'beetle', 'hand', 'sporepod', 'flesh', 'weeper', 'leech', 'cultist',
  'worm', 'gargoyle', 'necro', 'servant', 'shade', 'chorister', 'knight', 'golem', 'thornroot', 'frostcaster', 'abyssal', 'mimic'];
const BESTIARY_BOSSES = ['warden', 'gravedigger', 'drowned', 'bellringer', 'reaper', 'collector', 'bloom', 'thornqueen', 'sarcophagus', 'blizzard', 'nameless', 'keeper'];
const BESTIARY_ALL = BESTIARY_ENEMIES.concat(BESTIARY_BOSSES);

function bestiaryEntry(id) { return Save.data.bestiary[id] || (Save.data.bestiary[id] = { seen: 0, kills: 0 }); }
function noteSeen(e) {
  const k = e.isBoss ? e.type : e.type;
  if (!BESTIARY_ALL.includes(k) || e._seenLogged) return;
  e._seenLogged = true;
  bestiaryEntry(k).seen++;
}
function noteKill(e) {
  const k = e.type;
  if (!BESTIARY_ALL.includes(k)) return;
  const b = bestiaryEntry(k);
  const first = b.kills === 0;
  b.kills++;
  if (first) {
    Save.store();
    if (typeof pushToast === 'function') pushToast({ title: 'Бестиарий', text: e.name, color: '#a3e635', kind: 'bestiary' });
  }
}
const bestiaryKnown = id => ((Save.data.bestiary[id] || {}).kills || 0) > 0;
const bestiaryCount = () => BESTIARY_ALL.filter(bestiaryKnown).length;

// ---------- МОДИФИКАТОРЫ ДНЯ ----------
const DAILY_MODS = [
  { id: 'blood', name: 'Кровавая луна', desc: 'Враги бьют на 25% сильнее, зато трофеев на 50% больше', modv: { enemyDmg: 1.25, drops: 1.5 } },
  { id: 'night', name: 'Долгая ночь', desc: 'Мир темнее, но масло тает на 20% медленнее', modv: { dark: 0.1, oilDrain: 0.8 } },
  { id: 'glass', name: 'Хрустальные души', desc: 'Здоровье героя −30%, урон +30%', modv: { heroHp: 0.7, heroDmg: 1.3 } },
  { id: 'swarm', name: 'Полчища', desc: 'Врагов больше на 30%, но каждый слабее на 15%', modv: { budget: 1.3, enemyHp: 0.85 } },
  { id: 'giants', name: 'Великаны', desc: 'Враги здоровее на 25%, но медленнее на 10%', modv: { enemyHp: 1.25, enemySpd: 0.9 } },
  { id: 'elite', name: 'Час избранных', desc: 'Элитных врагов гораздо больше, награды щедрее', modv: { elite: 0.08, drops: 1.3 } }
];

// ---------- СЧЁТ ----------
function calcScore(r) {
  if (r.mode === 'survival') return Math.round(r.wave * 500 + r.kills * 10 + r.time * 2 + r.bossKills * 400);
  const sc = r.floorReached * 1000 + r.bossKills * 600 + r.kills * 8 + r.collected.length * 20 + (r.won ? 6000 + Math.max(0, 1800 - r.time) * 3 : 0) - r.hits * 15;
  return Math.max(0, Math.round(sc));
}

// ---------- ДОСТИЖЕНИЯ ----------
const ACHIEVEMENTS = [
  // путь
  { id: 'first_blood', name: 'Первая кровь', desc: 'Убей первого врага', reward: 5, test: () => Save.data.kills + (run ? run.kills : 0) >= 1 },
  { id: 'kills100', name: 'Сотня', desc: 'Убей 100 врагов', reward: 10, test: () => Save.data.kills + (run ? run.kills : 0) >= 100 },
  { id: 'kills1000', name: 'Тысяча теней', desc: 'Убей 1000 врагов', reward: 40, test: () => Save.data.kills + (run ? run.kills : 0) >= 1000 },
  { id: 'depth3', name: 'Всё глубже', desc: 'Дойди до глубины 3', reward: 10, test: () => Save.data.bestFloor >= 3 || (run && run.mode !== 'survival' && run.floorReached >= 3) },
  { id: 'depth6', name: 'Дно', desc: 'Дойди до последней глубины', reward: 25, test: () => Save.data.bestFloor >= 6 || (run && run.mode !== 'survival' && run.floorReached >= 6) },
  { id: 'win1', name: 'Огонь зажжён', desc: 'Победи Безымянного', reward: 50, test: () => Save.data.wins >= 1 },
  { id: 'win3', name: 'Хранитель огня', desc: 'Одержи 3 победы', reward: 60, test: () => Save.data.wins >= 3 },
  { id: 'win_heroes', name: 'Каждому своё', desc: 'Победи четырьмя разными героями', reward: 80, test: () => Object.keys(Save.data.wonWith).length >= 4 },
  { id: 'burden1', name: 'Под бременем', desc: 'Победи с Бременем 1 или выше', reward: 40, test: () => Save.data.burdenMax >= 2 },
  { id: 'burden3', name: 'Неподъёмное', desc: 'Победи с Бременем 3', reward: 120, test: () => Save.data.burdenMax >= 3 && (Save.data.stats.burden3win || 0) >= 1 },
  { id: 'speedrun', name: 'Стремительный', desc: 'Победи быстрее чем за 25 минут', reward: 60, test: () => Save.data.bestTime > 0 && Save.data.bestTime <= 1500 },
  { id: 'boss1', name: 'Первый хозяин', desc: 'Победи любого босса', reward: 10, test: () => Save.data.bosses + (run ? run.bossKills : 0) >= 1 },
  { id: 'boss10', name: 'Охотник на боссов', desc: 'Победи 10 боссов', reward: 40, test: () => Save.data.bosses + (run ? run.bossKills : 0) >= 10 },
  { id: 'boss30', name: 'Гроза хозяев', desc: 'Победи 30 боссов', reward: 100, test: () => Save.data.bosses + (run ? run.bossKills : 0) >= 30 },
  { id: 'boss_all', name: 'Все хозяева', desc: 'Победи каждого из 12 боссов', reward: 120, test: () => BESTIARY_BOSSES.every(id => (Save.data.bossKills[id] || 0) >= 1) },
  { id: 'flawless_boss', name: 'Безупречный', desc: 'Победи босса, не получив ни одного удара', reward: 50 },
  { id: 'flawless_floor', name: 'Без единой царапины', desc: 'Пройди глубину целиком, не получив урона', reward: 60 },
  // коллекция
  { id: 'relics25', name: 'Коллекционер', desc: 'Открой 25 реликвий', reward: 15, test: () => Object.keys(Save.data.discovered).filter(k => !k.startsWith('boon_')).length >= 25 },
  { id: 'relics60', name: 'Хранитель реликвий', desc: 'Открой 60 реликвий', reward: 50, test: () => Object.keys(Save.data.discovered).filter(k => !k.startsWith('boon_')).length >= 60 },
  { id: 'relics_all', name: 'Всё найдено', desc: 'Открой все реликвии', reward: 150, test: () => RELICS.every(r => Save.data.discovered[r.id]) },
  { id: 'oath1', name: 'Обет', desc: 'Принеси обет любой школе', reward: 15, test: () => run && player && Object.keys(player.oaths).length >= 1 },
  { id: 'oath3', name: 'Трижды клятвенный', desc: 'Дай три обета за один спуск', reward: 70, test: () => run && player && Object.keys(player.oaths).length >= 3 },
  { id: 'curse1', name: 'Сделка', desc: 'Прими проклятую реликвию', reward: 15, test: () => (Save.data.stats.curses || 0) >= 1 },
  { id: 'curse3', name: 'Одержимый', desc: 'Носи три проклятия одновременно', reward: 60, test: () => run && player && curseCount(player) >= 3 },
  { id: 'notes12', name: 'Читатель', desc: 'Прочти 12 записей Хроник', reward: 20, test: () => Object.keys(Save.data.notes).length >= 12 },
  { id: 'notes_all', name: 'Летописец', desc: 'Прочти все записи Хроник', reward: 80, test: () => NOTES.every(n => Save.data.notes[n.id]) },
  { id: 'bestiary_half', name: 'Знаток', desc: 'Узнай половину бестиария', reward: 25, test: () => bestiaryCount() >= Math.ceil(BESTIARY_ALL.length / 2) },
  { id: 'bestiary_all', name: 'Бестиарий полон', desc: 'Узнай всех существ', reward: 100, test: () => bestiaryCount() >= BESTIARY_ALL.length },
  // режимы
  { id: 'survive10', name: 'Десять волн', desc: 'Переживи 10 волн в режиме «Выживание»', reward: 25, test: () => Save.data.survival.bestWave >= 10 },
  { id: 'survive20', name: 'Двадцать волн', desc: 'Переживи 20 волн', reward: 60, test: () => Save.data.survival.bestWave >= 20 },
  { id: 'survive30', name: 'Несокрушимый', desc: 'Переживи 30 волн', reward: 120, test: () => Save.data.survival.bestWave >= 30 },
  { id: 'daily1', name: 'Вызов дня', desc: 'Закончи ежедневный забег', reward: 15, test: () => Object.keys(Save.data.daily).length >= 1 },
  { id: 'daily7', name: 'Постоянство', desc: 'Сыграй ежедневный забег в 7 разных дней', reward: 70, test: () => Object.keys(Save.data.daily).length >= 7 },
  { id: 'seed1', name: 'Сид-мастер', desc: 'Сыграй с собственным сидом', reward: 10, test: () => Save.data.seedsPlayed >= 1 },
  // события и тайны
  { id: 'secret1', name: 'Тайный ход', desc: 'Найди тайную комнату', reward: 10, test: () => Stats.get('secrets') >= 1 },
  { id: 'secret10', name: 'Следопыт', desc: 'Найди 10 тайных комнат', reward: 40, test: () => Stats.get('secrets') >= 10 },
  { id: 'event5', name: 'Развилки', desc: 'Встреть 5 событий', reward: 15, test: () => Stats.get('events') >= 5 },
  { id: 'event_all', name: 'Все дороги', desc: 'Увидь все события хотя бы раз', reward: 80, test: () => EVENTS.every(e => ((Save.data.evSeen || {})[e.id] || 0) >= 1) },
  { id: 'hatter_play', name: 'Сыграем?', desc: 'Сыграй со Шляпником', reward: 10, test: () => Stats.get('hatterPlays') >= 1 },
  { id: 'hatter_win', name: 'Улыбка фортуны', desc: 'Обыграй Шляпника', reward: 20, test: () => Stats.get('hatterWins') >= 1 },
  { id: 'hatter_knife', name: 'Шрам на память', desc: 'Получи нож от Шляпника 3 раза', reward: 20, test: () => Stats.get('hatterKnife') >= 3 },
  { id: 'hatter_all', name: 'Шляпа долой', desc: 'Выиграй у Шляпника все три раунда', reward: 60 },
  { id: 'mimic', name: 'Не всё золото', desc: 'Победи мимика', reward: 15, test: () => ((Save.data.bestiary.mimic || {}).kills || 0) >= 1 },
  // умения героев
  { id: 'madness', name: 'Хаос', desc: 'Пусть враги убьют друг друга 10 раз', reward: 30, test: () => Stats.get('madKills') >= 10 },
  { id: 'gold20', name: 'Золотая лихорадка', desc: 'Разбей 20 золотых статуй', reward: 30, test: () => Stats.get('statuesBroken') >= 20 },
  { id: 'rot100', name: 'Гниль', desc: 'Наложи гниение 100 раз', reward: 25, test: () => Stats.get('rots') >= 100 },
  { id: 'blind30', name: 'Тёмная птица', desc: 'Ослепи 30 врагов', reward: 25, test: () => Stats.get('blinded') >= 30 },
  { id: 'exec10', name: 'Приговор', desc: 'Казни 10 врагов', reward: 25, test: () => Stats.get('executions') >= 10 },
  { id: 'parry25', name: 'Отражение', desc: 'Отрази 25 ударов щитом', reward: 25, test: () => Stats.get('parries') >= 25 },
  { id: 'echo10', name: 'Эхо', desc: 'Вызови кровавое эхо 10 раз', reward: 20, test: () => Stats.get('echoes') >= 10 },
  // прочее
  { id: 'spent5000', name: 'Транжира', desc: 'Потрать в лагере 5000 углей', reward: 100, test: () => (Save.data.spent || 0) >= 5000 },
  { id: 'rich', name: 'Богач', desc: 'Держи 500 серебра одновременно', reward: 20, test: () => run && player && player.silver >= 500 },
  { id: 'darkness', name: 'Во тьме', desc: 'Проведи в темноте с пустым фонарём 60 секунд', reward: 25, test: () => Stats.get('darkTime') >= 60 },
  { id: 'die1', name: 'Первая смерть', desc: 'Погибни. Это нормально', reward: 5, test: () => Stats.get('deaths') >= 1 },
  { id: 'die25', name: 'Упорство', desc: 'Погибни 25 раз и продолжай', reward: 30, test: () => Stats.get('deaths') >= 25 },
  { id: 'heroes_all', name: 'Полный отряд', desc: 'Открой всех героев', reward: 120, test: () => HERO_ORDER.every(h => Save.data.heroes[h]) },
  { id: 'hero_necromancer', name: 'Должник смерти', desc: 'Открой Некроманта', reward: 20, hint: 'Убей 10 боссов' },
  { id: 'hero_fallen', name: 'Золото — единственная истина', desc: 'Открой Падшего Алхимика', reward: 20, hint: 'Потрать 5000 углей' },
  { id: 'hero_reaper', name: 'Жатва', desc: 'Открой Жнеца', reward: 30, hidden: true, hint: 'Победи Костяного Жнеца три раза' },
  { id: 'end_light', name: 'Огонь', desc: 'Завершите игру: зажгите Огонь', reward: 40 },
  { id: 'end_name', name: 'Имя', desc: 'Верни Безымянному имя (прочти 20 записей)', reward: 100, hidden: true },
  { id: 'end_dark', name: 'Тьма', desc: 'Забери пламя себе', reward: 60, hidden: true }
];
const ACH_BY_ID = {}; for (const a of ACHIEVEMENTS) ACH_BY_ID[a.id] = a;

let toasts = [];
function pushToast(t) { toasts.push(Object.assign({ life: 4.2, max: 4.2 }, t)); if (toasts.length > 5) toasts.shift(); }

const Ach = {
  timer: 0,
  has(id) { return !!Save.data.ach[id]; },
  unlock(id) {
    const a = ACH_BY_ID[id];
    if (!a || Save.data.ach[id]) return false;
    Save.data.ach[id] = Date.now();
    if (a.reward) Save.data.embers += a.reward;
    Save.store();
    pushToast({ title: 'Достижение', text: a.name, sub: `+${a.reward} углей`, color: '#fbbf24', kind: 'ach' });
    Snd.play('charge');
    return true;
  },
  // периодическая проверка накопительных достижений
  check() {
    for (const a of ACHIEVEMENTS) {
      if (a.test && !Save.data.ach[a.id]) { let ok = false; try { ok = !!a.test(); } catch (e) { ok = false; } if (ok) this.unlock(a.id); }
    }
  },
  tick(dt) { this.timer -= dt; if (this.timer <= 0) { this.timer = 1.2; this.check(); } },
  count() { return ACHIEVEMENTS.filter(a => Save.data.ach[a.id]).length; }
};

function updateToasts(dt) {
  for (let i = toasts.length - 1; i >= 0; i--) { toasts[i].life -= dt; if (toasts[i].life <= 0) toasts.splice(i, 1); }
}
