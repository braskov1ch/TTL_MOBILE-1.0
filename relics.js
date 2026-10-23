'use strict';
/* =====================================================================
   RELICS: реликвии (пассивные), артефакты (активные), обеты, пулы
   mods:  dmgPct atkPct range projSpeed speed luck crit critDmg maxHp light
          dashCharges dashCd potionMax knock projExtra size oilSave famMul
          oilMax enemyDmg potionPct shopMul armorPierce        (v2.0)
   flags: homing pierce spectral bounce slow poison burn fear blast split chain
          rear side flight lifesteal regen holy block aura mapAll compass
          execute thorns dashFire lastStand oilKill potionPlus wardRegen
          corrode rot madhit blind midas emberdrop                  (v2.0)
          killHeal greed rotRoom swarm beggar fuel                  (проклятия)
   curse: true — сильная реликвия с ценой
   ===================================================================== */
const SCHOOLS = {
  fire:   { name: 'Пламя',  color: '#f97316' },
  frost:  { name: 'Иней',   color: '#7dd3fc' },
  venom:  { name: 'Яд',     color: '#84cc16' },
  shadow: { name: 'Тень',   color: '#a78bfa' },
  holy:   { name: 'Свет',   color: '#fde68a' },
  blood:  { name: 'Кровь',  color: '#e11d48' },
  iron:   { name: 'Железо', color: '#cbd5e1' },
  spirit: { name: 'Дух',    color: '#5eead4' },
  arcane: { name: 'Тайное', color: '#f0abfc' }
};

const RELICS = [];
const RELIC_BY_ID = {};
const BASE_POOLS = ['treasure', 'shop', 'boss', 'secret'];

function defRelic(o) {
  o.pools = o.pools || BASE_POOLS;
  o.q = o.q || 2;
  o.tier = o.tier || 0;
  o.mods = o.mods || {};
  o.flags = o.flags || [];
  o.color = SCHOOLS[o.school].color;
  o.curse = !!o.curse;
  if (o.curse && !o.pools.includes('curse')) o.pools = o.pools.concat(['curse']);
  RELICS.push(o);
  RELIC_BY_ID[o.id] = o;
  return o;
}
const ALTAR = BASE_POOLS.concat(['altar']);

// ---------- ЖЕЛЕЗО ----------
defRelic({ id: 'whetstone', name: 'Точильный брусок', school: 'iron', q: 1, desc: 'Урон +14%', mods: { dmgPct: 0.14 } });
defRelic({ id: 'gauntlet', name: 'Латная перчатка', school: 'iron', q: 2, desc: 'Урон +10%, удары отбрасывают врагов', mods: { dmgPct: 0.10, knock: 1 } });
defRelic({ id: 'hammerhead', name: 'Боёк молота', school: 'iron', q: 3, tier: 1, desc: 'Урон +30%, атаки медленнее на 10%', mods: { dmgPct: 0.30, atkPct: -0.10 }, pools: ALTAR });
defRelic({ id: 'chainmail', name: 'Кольчуга', school: 'iron', q: 1, desc: '+20 здоровья и +10 оберега', mods: { maxHp: 20 }, onPickup(p) { p.hp += 20; p.ward += 10; } });
defRelic({ id: 'spurs', name: 'Подкованные сапоги', school: 'iron', q: 1, desc: 'Скорость +16', mods: { speed: 16 } });
defRelic({ id: 'anvilshard', name: 'Осколок наковальни', school: 'iron', q: 2, desc: 'Шанс критического удара +8%, критический урон +25%', mods: { crit: 0.08, critDmg: 0.25 } });
defRelic({ id: 'thorncrown', name: 'Терновый обруч', school: 'iron', q: 3, tier: 1, desc: 'Обидчики получают 20 урона. +10 здоровья', flags: ['thorns'], mods: { maxHp: 10 }, pools: ALTAR, onPickup(p) { p.hp += 10; } });

// ---------- ПЛАМЯ ----------
defRelic({ id: 'ember', name: 'Уголёк', school: 'fire', q: 2, desc: 'Удары поджигают врагов', flags: ['burn'] });
defRelic({ id: 'pyreheart', name: 'Сердце костра', school: 'fire', q: 3, tier: 1, desc: 'Урон +12%, удары поджигают', mods: { dmgPct: 0.12 }, flags: ['burn'], pools: ALTAR });
defRelic({ id: 'phoenixash', name: 'Пепел феникса', school: 'fire', q: 3, tier: 1, desc: 'После зачистки комнаты лечит 10. +10 здоровья', flags: ['regen'], mods: { maxHp: 10 }, onPickup(p) { p.hp += 10; } });
defRelic({ id: 'blastpowder', name: 'Пороховая смесь', school: 'fire', q: 3, desc: 'Удары иногда взрываются', flags: ['blast'] });
defRelic({ id: 'scorchsoles', name: 'Обугленные подошвы', school: 'fire', q: 2, tier: 1, desc: 'Рывок оставляет за собой огонь', flags: ['dashFire'] });
defRelic({ id: 'smoldercloak', name: 'Тлеющий плащ', school: 'fire', q: 3, tier: 2, desc: 'Враги вблизи обжигаются', flags: ['aura'] });

// ---------- ИНЕЙ ----------
defRelic({ id: 'rime', name: 'Иней', school: 'frost', q: 1, desc: 'Удары замедляют врагов', flags: ['slow'] });
defRelic({ id: 'icicle', name: 'Ледяная игла', school: 'frost', q: 2, desc: 'Снаряды и удары пробивают насквозь', flags: ['pierce'], mods: { dmgPct: 0.04 } });
defRelic({ id: 'frozentear', name: 'Замёрзшая слеза', school: 'frost', q: 2, desc: 'Атаки быстрее на 15%, удары замедляют', mods: { atkPct: 0.15 }, flags: ['slow'] });
defRelic({ id: 'wintercloak', name: 'Зимний плащ', school: 'frost', q: 2, tier: 1, desc: '+25 оберега, скорость +8', mods: { speed: 8 }, onPickup(p) { p.ward += 25; } });
defRelic({ id: 'shardprism', name: 'Ледяная призма', school: 'frost', q: 3, tier: 1, desc: 'Снаряды разлетаются осколками', flags: ['split'] });

// ---------- ЯД ----------
defRelic({ id: 'nightshade', name: 'Паслён', school: 'venom', q: 2, desc: 'Удары отравляют врагов', flags: ['poison'] });
defRelic({ id: 'sporepouch', name: 'Мешочек спор', school: 'venom', q: 2, desc: 'Удары отравляют, удача +1', flags: ['poison'], mods: { luck: 1 } });
defRelic({ id: 'viperfang', name: 'Клык гадюки', school: 'venom', q: 3, tier: 1, desc: 'Шанс крита +10%, удары отравляют', mods: { crit: 0.10 }, flags: ['poison'], pools: ALTAR });
defRelic({ id: 'toadidol', name: 'Идол жабы', school: 'venom', q: 1, desc: '+15 здоровья и немного удачи', mods: { maxHp: 15, luck: 1 }, onPickup(p) { p.hp += 15; } });

// ---------- ТЕНЬ ----------
defRelic({ id: 'shadecloak', name: 'Плащ теней', school: 'shadow', q: 3, tier: 1, desc: '18% шанс полностью избежать удара', flags: ['block'] });
defRelic({ id: 'ravenfeather', name: 'Вороново перо', school: 'shadow', q: 2, desc: 'Скорость +14, ещё один рывок', mods: { speed: 14, dashCharges: 1 } });
defRelic({ id: 'umbrallens', name: 'Теневая линза', school: 'shadow', q: 3, tier: 1, desc: 'Снаряды проходят сквозь стены и препятствия', flags: ['spectral'] });
defRelic({ id: 'nightmask', name: 'Маска кошмара', school: 'shadow', q: 2, desc: 'Враги иногда в ужасе бегут', flags: ['fear'] });
defRelic({ id: 'hunterseye', name: 'Глаз ночного охотника', school: 'shadow', q: 3, tier: 1, desc: 'Снаряды ищут врагов, крит +5%', flags: ['homing'], mods: { crit: 0.05 } });
defRelic({ id: 'voidstep', name: 'Шаг сквозь тьму', school: 'shadow', q: 3, tier: 2, desc: 'Ещё один рывок, перезарядка рывка быстрее', mods: { dashCharges: 1, dashCd: -0.25 } });

// ---------- СВЕТ ----------
defRelic({ id: 'holywater', name: 'Святая вода', school: 'holy', q: 1, desc: '+25 оберега', onPickup(p) { p.ward += 25; } });
defRelic({ id: 'candlestub', name: 'Огарок свечи', school: 'holy', q: 1, desc: 'Свет фонаря шире', mods: { light: 50 } });
defRelic({ id: 'saintrelic', name: 'Мощи святого', school: 'holy', q: 4, tier: 3, desc: 'Оберег восстанавливается при входе в каждую комнату', flags: ['holy'], pools: ALTAR });
defRelic({ id: 'censer', name: 'Кадило', school: 'holy', q: 2, tier: 1, desc: 'После зачистки комнаты даёт +8 оберега, свет шире', flags: ['wardRegen'], mods: { light: 30 } });
defRelic({ id: 'sunstone', name: 'Солнечный камень', school: 'holy', q: 3, tier: 2, desc: 'Свет фонаря намного шире, крит +6%', mods: { light: 80, crit: 0.06 } });

// ---------- КРОВЬ ----------
defRelic({ id: 'leechjar', name: 'Банка с пиявками', school: 'blood', q: 3, tier: 1, desc: 'Часть нанесённого урона возвращается здоровьем', flags: ['lifesteal'], pools: ALTAR });
defRelic({ id: 'bloodchalice', name: 'Чаша крови', school: 'blood', q: 2, desc: '+25 здоровья и лечение на 25', mods: { maxHp: 25 }, onPickup(p) { p.hp += 25; } });
defRelic({ id: 'sacrificeknife', name: 'Жертвенный нож', school: 'blood', q: 3, tier: 1, desc: 'Урон +26%, но −10 здоровья', mods: { dmgPct: 0.26, maxHp: -10 }, pools: ALTAR });
defRelic({ id: 'redthread', name: 'Красная нить', school: 'blood', q: 2, desc: 'Удача +2', mods: { luck: 2 } });
defRelic({ id: 'heartroot', name: 'Корень сердца', school: 'blood', q: 3, tier: 2, desc: '+35% урона, пока здоровья меньше 40%', flags: ['lastStand'], pools: ALTAR });

// ---------- ДУХ (спутники) ----------
defRelic({ id: 'wisplamp', name: 'Блуждающий огонёк', school: 'spirit', q: 2, desc: 'Парит вокруг, бьёт врагов и ловит снаряды', fam: 'wisp' });
defRelic({ id: 'hound', name: 'Могильный пёс', school: 'spirit', q: 2, desc: 'Верный призрак кусает врагов', fam: 'hound' });
defRelic({ id: 'raven', name: 'Ворон-вестник', school: 'spirit', q: 3, tier: 1, desc: 'Стреляет вместе с вами', fam: 'raven' });
defRelic({ id: 'bonecat', name: 'Костяная кошка', school: 'spirit', q: 3, tier: 1, desc: 'Сама охотится на врагов', fam: 'cat' });
defRelic({ id: 'spiritring', name: 'Кольцо духов', school: 'spirit', q: 3, tier: 2, desc: '+15 оберега, спутники бьют вдвое сильнее', mods: { famMul: 1 }, onPickup(p) { p.ward += 15; } });

// ---------- ТАЙНОЕ / ПРИПАСЫ ----------
defRelic({ id: 'flaskbelt', name: 'Пояс склянок', school: 'arcane', q: 1, desc: '+3 зажигательные склянки, +1 слот зелья', mods: { potionMax: 1 }, onPickup(p) { p.flasks = Math.min(9, p.flasks + 3); } });
defRelic({ id: 'wick', name: 'Серебряный фитиль', school: 'arcane', q: 2, desc: 'Масло в фонаре тратится на 25% медленнее', mods: { oilSave: 0.25 } });
defRelic({ id: 'scavbag', name: 'Мародёрская сумка', school: 'arcane', q: 1, desc: '+25 серебра', onPickup(p) { p.silver = Math.min(999, p.silver + 25); } });
defRelic({ id: 'keyring', name: 'Связка ржавых ключей', school: 'arcane', q: 1, desc: '+3 ключа', onPickup(p) { p.keys = Math.min(9, p.keys + 3); } });
defRelic({ id: 'map', name: 'Карта катакомб', school: 'arcane', q: 1, desc: 'Показывает карту глубины', flags: ['mapAll'] });
defRelic({ id: 'spyglass', name: 'Подзорная труба', school: 'arcane', q: 1, desc: 'Показывает особые комнаты', flags: ['compass'] });
defRelic({ id: 'apothecary', name: 'Набор аптекаря', school: 'arcane', q: 2, desc: '+1 слот зелья, зелья лечат на 30% сильнее', mods: { potionMax: 1 }, flags: ['potionPlus'] });
defRelic({ id: 'soullamp', name: 'Фонарь душ', school: 'arcane', q: 3, tier: 1, desc: 'Каждое убийство пополняет масло в фонаре', flags: ['oilKill'] });
defRelic({ id: 'ricochet', name: 'Рикошетная дробь', school: 'arcane', q: 2, desc: 'Снаряды отскакивают от стен', flags: ['bounce'], mods: { range: 40 } });
defRelic({ id: 'twinbolts', name: 'Парные заряды', school: 'arcane', q: 3, tier: 1, desc: 'Ещё один снаряд за выстрел (или шире удар), атаки на 10% медленнее', mods: { projExtra: 1, atkPct: -0.10 } });
defRelic({ id: 'stormsigil', name: 'Грозовой знак', school: 'arcane', q: 3, tier: 1, desc: 'Удары бьют молнией по соседним врагам', flags: ['chain'] });
defRelic({ id: 'echocharm', name: 'Эхо-амулет', school: 'arcane', q: 2, tier: 1, desc: 'Атаки повторяются в противоположную сторону', flags: ['rear'] });
defRelic({ id: 'flankcharm', name: 'Боковой амулет', school: 'arcane', q: 3, tier: 1, desc: 'Атаки уходят и в стороны', flags: ['side'], mods: { atkPct: -0.05 } });
defRelic({ id: 'reapermark', name: 'Метка жнеца', school: 'arcane', q: 4, tier: 2, desc: 'Обычные враги с малым здоровьем умирают от любого удара', flags: ['execute'], pools: ALTAR });
defRelic({ id: 'phantomwings', name: 'Крылья призрака', school: 'arcane', q: 3, tier: 1, desc: 'Парение: проход над ямами и препятствиями', flags: ['flight'] });
defRelic({ id: 'elderseal', name: 'Старший знак', school: 'arcane', q: 4, tier: 3, desc: 'Все характеристики немного выше', mods: { dmgPct: 0.10, atkPct: 0.08, speed: 10, luck: 1, range: 40 }, pools: ALTAR });
defRelic({ id: 'cursedcoin', name: 'Проклятая монета', school: 'arcane', q: 3, tier: 2, desc: 'Удача +3, +30 серебра, но −10 здоровья', mods: { luck: 3, maxHp: -10 }, pools: ALTAR, onPickup(p) { p.silver = Math.min(999, p.silver + 30); } });
defRelic({ id: 'swiftwind', name: 'Ветер перемен', school: 'arcane', q: 2, desc: 'Атаки быстрее на 12%, скорость +8', mods: { atkPct: 0.12, speed: 8 } });
defRelic({ id: 'farsight', name: 'Дальний прицел', school: 'arcane', q: 1, desc: 'Дальность +70, снаряды летят быстрее', mods: { range: 70, projSpeed: 60 } });
defRelic({ id: 'engraverlens', name: 'Лупа гравёра', school: 'arcane', q: 2, desc: 'Урон +8%, снаряды и удары крупнее', mods: { dmgPct: 0.08, size: 0.25, range: 30 } });
defRelic({ id: 'lastlight', name: 'Последний свет', school: 'holy', q: 4, tier: 3, desc: 'Свет шире, урон +12%, убийства пополняют масло', mods: { light: 100, dmgPct: 0.12 }, flags: ['oilKill'] });

// ---------- НОВЫЕ РЕЛИКВИИ v2.0 ----------
defRelic({ id: 'acidvial', name: 'Склянка кислоты', school: 'venom', q: 2, desc: 'Удары разъедают броню: враги получают на 22% больше урона', flags: ['corrode'] });
defRelic({ id: 'rotbell', name: 'Гнилой колокольчик', school: 'venom', q: 2, desc: 'Удары накладывают гниение (до 3 раз)', flags: ['rot'] });
defRelic({ id: 'madtincture', name: 'Настойка безумия', school: 'arcane', q: 3, tier: 1, desc: 'Удары иногда сводят врагов с ума: они дерутся друг с другом', flags: ['madhit'] });
defRelic({ id: 'crowfeather', name: 'Вороново зерно', school: 'shadow', q: 2, desc: 'Удары иногда слепят врагов', flags: ['blind'] });
defRelic({ id: 'goldtooth', name: 'Золотой зуб', school: 'arcane', q: 3, tier: 1, desc: 'Удары иногда обращают врага в золотую статую: серебро с неё щедрее', flags: ['midas'] });
defRelic({ id: 'emberbag', name: 'Мешочек углей', school: 'fire', q: 2, desc: 'Из врагов иногда выпадают угли: они достанутся в конце спуска', flags: ['emberdrop'] });
defRelic({ id: 'armorbreaker', name: 'Бронебойный наконечник', school: 'iron', q: 2, desc: 'Удары игнорируют 35% брони', mods: { armorPierce: 0.35, dmgPct: 0.05 } });

// ---------- ПРОКЛЯТЫЕ РЕЛИКВИИ: сильные, но с ценой ----------
defRelic({ id: 'madbell', name: 'Колокол безумия', school: 'shadow', q: 3, curse: true, desc: 'Урон +60%, но свет фонаря сужен', mods: { dmgPct: 0.60, light: -90 } });
defRelic({ id: 'bloodwick', name: 'Кровавый фитиль', school: 'blood', q: 3, curse: true, desc: 'Каждое убийство лечит 2 здоровья, но максимум масла −35', flags: ['killHeal'], mods: { oilMax: -35 } });
defRelic({ id: 'abyssdeal', name: 'Договор с Бездной', school: 'arcane', q: 3, curse: true, desc: 'Ещё один рывок, скорость +28, но враги бьют на 20% сильнее', mods: { dashCharges: 1, speed: 28, enemyDmg: 0.20 } });
defRelic({ id: 'blackheart', name: 'Чёрное сердце', school: 'blood', q: 3, curse: true, desc: 'Здоровье +45, но зелья лечат вдвое слабее', mods: { maxHp: 45, potionPct: -0.5 }, onPickup(p) { p.hp += 45; } });
defRelic({ id: 'greedmirror', name: 'Зеркало жадности', school: 'arcane', q: 3, curse: true, desc: 'Серебра выпадает вдвое больше, но торговец берёт на 60% дороже', flags: ['greed'], mods: { shopMul: 0.6 } });
defRelic({ id: 'shackles', name: 'Тяжёлые кандалы', school: 'iron', q: 3, curse: true, desc: 'Урон +45%, но скорость −34', mods: { dmgPct: 0.45, speed: -34 } });
defRelic({ id: 'frostvow', name: 'Зимняя клятва', school: 'frost', q: 3, curse: true, desc: 'Атаки быстрее на 30%, но здоровье −25', mods: { atkPct: 0.30, maxHp: -25 } });
defRelic({ id: 'wickedeye', name: 'Недремлющее око', school: 'shadow', q: 3, curse: true, desc: 'Крит +14%, критический урон +40%, но масло тает на 45% быстрее', mods: { crit: 0.14, critDmg: 0.40, oilSave: -0.45 } });
defRelic({ id: 'hollowcrown', name: 'Пустая корона', school: 'holy', q: 3, curse: true, desc: 'Оберег +60, но здоровье −30', mods: { maxHp: -30 }, onPickup(p) { p.ward = Math.min(100, p.ward + 60); } });
defRelic({ id: 'rotheart', name: 'Гнилое сердце', school: 'venom', q: 3, curse: true, desc: 'Урон +25%, удары отравляют, но каждая новая комната отнимает 4 здоровья', flags: ['poison', 'rotRoom'], mods: { dmgPct: 0.25 } });
defRelic({ id: 'voidcall', name: 'Зов Бездны', school: 'shadow', q: 3, curse: true, desc: 'В комнатах больше врагов, зато трофеев на 60% больше', flags: ['swarm'] });
defRelic({ id: 'beggarcrown', name: 'Корона нищего', school: 'arcane', q: 3, curse: true, desc: 'В лавке всё вдвое дешевле, но серебро больше не выпадает', flags: ['beggar'], mods: { shopMul: -0.5 } });
defRelic({ id: 'hungryflame', name: 'Голодный огонь', school: 'fire', q: 3, curse: true, desc: 'Урон +35%, удары жгут, но каждая атака стоит каплю масла', flags: ['burn', 'fuel'], mods: { dmgPct: 0.35 } });
defRelic({ id: 'oblivioncup', name: 'Чаша забвения', school: 'spirit', q: 3, curse: true, desc: 'Спутники бьют втрое сильнее, но удача −2', mods: { famMul: 2, luck: -2 } });
defRelic({ id: 'vampfang', name: 'Клык вампира', school: 'blood', q: 3, curse: true, desc: 'Вампиризм вдвое сильнее, но здоровье −20', flags: ['lifesteal', 'lifesteal'], mods: { maxHp: -20 } });

// ---------- АРТЕФАКТЫ (Е) — заряжаются за зачищенные комнаты ----------
defRelic({ id: 'elixir', name: 'Эликсир тихого часа', school: 'holy', q: 2, desc: 'Лечит 45 здоровья', active: { max: 4, use(p) { return healPlayer(45) || (Snd.play('error'), false); } } });
defRelic({ id: 'thunderflask', name: 'Громовая склянка', school: 'fire', q: 3, desc: 'Раскалывается громом: 55 урона всем врагам в комнате', active: { max: 4, use(p) { damageAllEnemies(55); shake = 14; Snd.play('burst'); fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 10, r1: 700, life: 0.5, max: 0.5, color: '#fb923c' }); return true; } } });
defRelic({ id: 'hourglass', name: 'Песочные часы', school: 'frost', q: 2, desc: 'Останавливает врагов на 4 секунды и стирает снаряды', active: { max: 3, use(p) { for (const e of curRoom.enemies) { if (!e.isBoss) e.fx.stun = 4; else e.fx.slow = 4; } eBullets.length = 0; fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 10, r1: 600, life: 0.6, max: 0.6, color: '#7dd3fc' }); Snd.play('charge'); return true; } } });
defRelic({ id: 'runedice', name: 'Рунные кости', school: 'arcane', q: 3, desc: 'Меняет реликвии на алтарях и в лавке комнаты', active: { max: 3, use(p) { return rerollPeds() || (Snd.play('error'), false); } } });
defRelic({ id: 'warhorn', name: 'Боевой рог', school: 'iron', q: 2, desc: 'Ударная волна: отбрасывает врагов, стирает снаряды', active: { max: 2, use(p) { shockwave(p.x, p.y, 260, 60, 460); return true; } } });
defRelic({ id: 'shroud', name: 'Саван', school: 'shadow', q: 3, desc: 'Неуязвимость на 4 секунды', active: { max: 4, use(p) { p.iframes = Math.max(p.iframes, 4); p.ghostFx = 4; Snd.play('shield'); return true; } } });
defRelic({ id: 'mirrorshard', name: 'Осколок зеркала', school: 'shadow', q: 3, desc: 'Переносит в случайную комнату глубины', active: { max: 2, use(p) { return teleportRandom(); } } });
defRelic({ id: 'fallingstars', name: 'Падающие звёзды', school: 'holy', q: 3, desc: 'Залп снарядов по кругу с двойным уроном', active: { max: 3, use(p) { fireRadial(18, 2); return true; } } });
defRelic({ id: 'maddraught', name: 'Склянка безумия', school: 'arcane', q: 3, desc: 'Все враги в комнате впадают в безумие и дерутся друг с другом 5 секунд', active: { max: 4, use(p) { let n = 0; for (const e of curRoom.enemies) { if (e.dead) continue; if (e.isBoss) e.fx.slow = Math.max(e.fx.slow, 3); else { e.fx.mad = 5; n++; } } fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 10, r1: 560, life: 0.6, max: 0.6, color: '#f472b6' }); Snd.play('charge'); return n > 0 || (Snd.play('error'), false); } } });
defRelic({ id: 'midashand', name: 'Рука Мидаса', school: 'arcane', q: 3, tier: 1, desc: 'Обращает всех обычных врагов в комнате в золотые статуи на 4 секунды', active: { max: 5, use(p) { let n = 0; for (const e of curRoom.enemies) { if (e.dead || e.isBoss) continue; makeStatue(e, 4); n++; } fxs.push({ type: 'ring', x: p.x, y: p.y, r0: 10, r1: 560, life: 0.6, max: 0.6, color: '#fbbf24' }); Snd.play('coin'); return n > 0 || (Snd.play('error'), false); } } });
defRelic({ id: 'marauderbag', name: 'Сумка мародёра', school: 'arcane', q: 2, desc: '+1 ключ, +2 склянки, +10 серебра', active: { max: 2, use(p) { p.keys = Math.min(9, p.keys + 1); p.flasks = Math.min(9, p.flasks + 2); p.silver = Math.min(999, p.silver + 10); Snd.play('pickup'); return true; } } });

// ---------- ОБЕТЫ: 3 реликвии одной школы ----------
const OATHS = [
  { id: 'fire', school: 'fire', need: 3, name: 'ОБЕТ ПЛАМЕНИ', desc: 'Огонь признал тебя: урон +12%, удары жгут сильнее', mods: { dmgPct: 0.12 }, flags: ['burn'] },
  { id: 'frost', school: 'frost', need: 3, name: 'ОБЕТ ИНЕЯ', desc: 'Стужа в крови: атаки быстрее на 10%, враги вязнут', mods: { atkPct: 0.10 }, flags: ['slow'] },
  { id: 'venom', school: 'venom', need: 3, name: 'ОБЕТ ЯДА', desc: 'Яд в каждом ударе: урон +8%, удача +1', mods: { dmgPct: 0.08, luck: 1 }, flags: ['poison'] },
  { id: 'shadow', school: 'shadow', need: 3, name: 'ОБЕТ ТЕНИ', desc: 'Тень идёт за тобой: ещё один рывок, скорость +10', mods: { dashCharges: 1, speed: 10 } },
  { id: 'holy', school: 'holy', need: 3, name: 'ОБЕТ СВЕТА', desc: 'Свет принял тебя: +20 оберега, +10 здоровья, свет шире', mods: { maxHp: 10, light: 40 }, gain(p) { p.ward += 20; p.hp += 10; } },
  { id: 'blood', school: 'blood', need: 3, name: 'ОБЕТ КРОВИ', desc: 'Кровь сильнее страха: часть урона возвращается здоровьем', mods: { maxHp: 10 }, flags: ['lifesteal'], gain(p) { p.hp += 10; } },
  { id: 'iron', school: 'iron', need: 3, name: 'ОБЕТ ЖЕЛЕЗА', desc: 'Ты стал как сталь: урон +15%, удары отбрасывают', mods: { dmgPct: 0.15, knock: 1 } },
  { id: 'spirit', school: 'spirit', need: 3, name: 'ОБЕТ ДУХОВ', desc: 'Духи служат тебе: спутники бьют вдвое сильнее, +20 оберега', mods: { famMul: 1 }, gain(p) { p.ward += 20; } }
];

// ---------- ПУЛЫ ----------
function relicUnlocked(it) { return it.tier <= Save.upgrade('archive'); }
function poolFor(name) { return RELICS.filter(it => it.pools.includes(name) && relicUnlocked(it)); }

const RELIC_WEIGHT_BY_Q = { 1: 3, 2: 4, 3: 3, 4: 1.3 };

// Случайная реликвия из пула, не повторяя виденные в спуске
function rollRelic(pool, activeOnly = null, exclude = null) {
  const seen = run ? run.seen : new Set();
  let list = poolFor(pool);
  if (activeOnly === true) list = list.filter(it => it.active);
  else if (activeOnly === false) list = list.filter(it => !it.active);
  let fresh = list.filter(it => !seen.has(it.id) && !(exclude && exclude.includes(it)));
  if (!fresh.length) fresh = list.filter(it => !(exclude && exclude.includes(it)));
  if (!fresh.length) fresh = RELICS.filter(it => !it.active && relicUnlocked(it));
  const it = wpick(fresh, i => (RELIC_WEIGHT_BY_Q[i.q] || 2) * (i.active ? 0.55 : 1) * (i.curse ? 0.5 : 1));
  if (run) run.seen.add(it.id);
  return it;
}

function relicPrice(it) {
  const base = { 1: 15, 2: 25, 3: 38, 4: 55 }[it.q] || 25;
  return Math.max(1, Math.round((it.active ? base + 8 : base) * shopMulNow()));
}
function shopMulNow() { return (typeof player !== 'undefined' && player) ? clamp(1 + (player.shopMul || 0), 0.3, 3) : 1; }
const curseCount = p => p.relics.filter(r => r.curse).length;
