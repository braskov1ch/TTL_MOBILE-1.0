'use strict';
/* =====================================================================
   EVENTS: события-развилки (текст с выбором) и Шляпник-наперсточник
   ===================================================================== */
let eventSeq = 0;
// «Дар» — безымянная реликвия-бонус, которую событие выдаёт напрямую
function grantBoon(name, desc, mods, school = 'blood', flags = []) {
  const id = 'boon_' + (++eventSeq);
  const it = { id, name, desc, school, color: SCHOOLS[school].color, mods: mods || {}, flags: flags.slice(), q: 1, tier: 0, pools: [], curse: false, boon: true };
  RELIC_BY_ID[id] = it;
  addRelic(player, it);
  return it;
}
const Ev = {
  pending: null,
  heal(n) { const p = player; p.hp = Math.min(p.maxHp, p.hp + n); spawnParticles(p.x, p.y, 10, '#fca5a5'); Snd.play('potion'); },
  hurt(n) {
    const p = player; n = Math.round(n);
    const w = Math.min(p.ward, n); p.ward -= w; p.hp = Math.max(1, p.hp - (n - w));
    hurtFlash = 0.4; shake = Math.max(shake, 5); Snd.play('hurt'); Stats.add('damageTaken', n);
  },
  oil(n) { player.oil = clamp(player.oil + n, 0, player.oilMax); },
  silver(n) { player.silver = clamp(player.silver + n, 0, 999); if (n > 0) Snd.play('silver'); },
  keys(n) { player.keys = clamp(player.keys + n, 0, 9); },
  potions(n) { player.potions = clamp(player.potions + n, 0, player.potionMax); },
  flasks(n) { player.flasks = clamp(player.flasks + n, 0, 9); },
  ward(n) { player.ward = clamp(player.ward + n, 0, 100); },
  maxHp(n) {
    const p = player;
    if (n < 0) p.debt = (p.debt || 0) - n; else p.debt = Math.max(0, (p.debt || 0) - n);
    recalcPlayer(p);
    if (n > 0) p.hp += n;
    p.hp = clamp(p.hp, 1, p.maxHp);
  },
  relic(pool, activeOnly = false) {
    const it = rollRelic(pool, activeOnly ? true : false);
    addRelic(player, it); Snd.play('relic');
    floatText = { title: it.name, desc: it.desc, color: it.color, relic: it, timer: 4, max: 4, active: !!it.active };
    return it;
  },
  curse(exclude) {
    const have = player.relics.map(r => r.id);
    let list = RELICS.filter(r => r.curse && !have.includes(r.id));
    if (!list.length) list = RELICS.filter(r => r.curse);
    const it = pick(list);
    addRelic(player, it); Snd.play('blood');
    floatText = { title: it.name, desc: it.desc, color: '#e11d48', relic: it, timer: 4.5, max: 4.5 };
    Stats.add('curses', 1);
    return it;
  },
  removeCurse() {
    const p = player, c = p.relics.filter(r => r.curse).pop();
    if (!c) return null;
    p.relics.splice(p.relics.indexOf(c), 1);
    recalcPlayer(p);
    spawnParticles(p.x, p.y, 20, '#fde68a'); Snd.play('sanctum');
    return c;
  },
  ambush(spec) { this.pending = this.pending || {}; this.pending.ambush = spec || {}; },
  reveal() { for (const r of grid.values()) r.revealed = true; run.mapAll = true; Snd.play('unlock'); },
  note() { readNote(); },
  luckBoon(n, name) { return grantBoon(name || (n > 0 ? 'Лёгкая рука' : 'Тяжёлый взгляд'), n > 0 ? `Удача +${n}` : `Удача −${-n}`, { luck: n }); }
};

const hasCurse = p => p.relics.some(r => r.curse);
const EVENTS = [
  {
    id: 'well', art: 'well', floors: [1, 6], title: 'Шепчущий колодец',
    text: 'В центре комнаты — колодец без воды. Из глубины кто-то зовёт тебя по имени: «Масло… отдай немного масла… и я заплачу сполна».',
    choices: [
      { label: 'Вылить масло в колодец (−40 масла)', cond: p => p.oil >= 45, condText: 'Мало масла', run(p) { p.oil -= 40; const it = Ev.relic('treasure'); return `Колодец глотает масло и отвечает щедро: «${it.name}».`; } },
      { label: 'Бросить серебро (10)', cond: p => p.silver >= 10, condText: 'Мало серебра', run(p) { Ev.silver(-10); if (chance(luckChance(0.5, 0.04))) { Ev.luckBoon(1, 'Монета на удачу'); return 'Звон монеты затихает… и что-то тёплое ложится в ладонь. Удача +1.'; } return 'Эхо вернуло лишь пустой звон. Монета пропала.'; } },
      { label: 'Выпить из колодца', run(p) { if (chance(luckChance(0.55, 0.03))) { Ev.heal(p.maxHp * 0.4); return 'Вода оказалась чистой и холодной. Раны затянулись.'; } Ev.hurt(12); return 'Вода оказалась кровью. Горло горит. −12 здоровья.'; } },
      { label: 'Уйти', run() { return 'Ты отвернулся. Шёпот стих, будто и не звал.'; } }
    ]
  },
  {
    id: 'prisoner', art: 'figure', floors: [1, 5], title: 'Узник',
    text: 'За ржавой решёткой сидит человек в лохмотьях. «Ключ… у тебя есть ключ. Выпусти меня — я отплачу. Я клянусь».',
    choices: [
      { label: 'Отдать ключ (−1 ключ)', cond: p => p.keys >= 1, condText: 'Нет ключа', run(p) {
        Ev.keys(-1); const r = Math.random();
        if (r < 0.55) { const it = Ev.relic('shop'); return `Узник кланяется до земли и протягивает: «${it.name}». «Это всё, что у меня осталось».`; }
        if (r < 0.8) { Ev.ambush({ mul: 0.8, types: ['cultist', 'cultist'] }); return 'Едва щёлкнул замок, как узник выпрямился. Из его рукава блеснул кинжал. «Спасибо, Хранитель. Свет — это ложь».'; }
        Ev.silver(25); Ev.heal(15); return 'Он обнимает тебя, оставляет горсть серебра и растворяется в темноте, шепча благодарности.'; } },
      { label: 'Расправиться с узником', run() { Ev.silver(18); Ev.luckBoon(-1, 'Грех'); return 'Тишина после удара тяжелее, чем сам удар. +18 серебра, но удача −1.'; } },
      { label: 'Поговорить через решётку', run() { Ev.note(); return 'Он рассказывает то, что помнит. Ты записываешь.'; } },
      { label: 'Уйти', run() { return 'Мольбы затихают за спиной.'; } }
    ]
  },
  {
    id: 'forgotten_altar', art: 'altar', floors: [1, 6], title: 'Алтарь забытого бога',
    text: 'Каменный алтарь, на котором нет ни имени, ни символа. Он ждёт приношения — а какого, не сказано.',
    choices: [
      { label: 'Принести кровь (−12 максимума здоровья)', cond: p => p.maxHp > 55, condText: 'Слишком мало жизни', run(p) { Ev.maxHp(-12); Snd.play('blood'); const it = Ev.relic('altar'); return `Алтарь пьёт и дарит: «${it.name}».`; } },
      { label: 'Помолиться', run(p) {
        const r = Math.random();
        if (r < 0.5) { Ev.ward(30); Ev.oil(30); Ev.heal(20); return 'Тепло разливается по телу. Забытый бог всё же помнит о тебе.'; }
        if (r < 0.85) return 'Ничего не происходит. Только тишина — слишком внимательная.';
        const it = Ev.curse(); return `Бог ответил — но не так, как ты просил. Тебе достаётся «${it.name}».`; } },
      { label: 'Осквернить алтарь', run() { const it = Ev.curse(); Ev.ambush({ mul: 0.7 }); return `Камень трескается. Из трещины — «${it.name}» и множество глаз.`; } },
      { label: 'Уйти', run() { return 'Ты не стал искушать забытое.'; } }
    ]
  },
  {
    id: 'wounded_merchant', art: 'figure', floors: [1, 5], title: 'Раненый торговец',
    text: 'У стены сидит торговец, прижимая руки к боку. Его повозка перевёрнута, товар растащили. «Если у тебя есть зелье… я никогда не забуду».',
    choices: [
      { label: 'Отдать зелье (−1 зелье)', cond: p => p.potions >= 1, condText: 'Нет зелий', run(p) { Ev.potions(-1); const it = Ev.relic('shop'); Ev.silver(15); return `Он дрожащими руками достаёт из-под плаща «${it.name}» и горсть серебра. «Берите. Без вас я бы не дожил».`; } },
      { label: 'Обобрать раненого', run() { Ev.silver(30); Ev.luckBoon(-1, 'Проклятие торговца'); return '+30 серебра. Он смотрит на тебя без злобы, и это хуже проклятий. Удача −1.'; } },
      { label: 'Пройти мимо', run() { return 'Ты не оборачиваешься.'; } }
    ]
  },
  {
    id: 'mirror', art: 'mirror', floors: [2, 6], title: 'Чёрное зеркало',
    text: 'Высокое зеркало в раме из чёрного дерева. Отражение запаздывает на полвздоха. А иногда — опережает.',
    choices: [
      { label: 'Коснуться отражения', run() { if (chance(0.5)) { Ev.luckBoon(2, 'Благосклонное отражение'); return 'Отражение улыбается и кладёт ладонь на стекло. Удача +2.'; } Ev.hurt(15); return 'Рука из зеркала хватает тебя за запястье. −15 здоровья.'; } },
      { label: 'Заглянуть в глубину', run() { Ev.reveal(); return 'В зеркале проступают коридоры. Ты запоминаешь каждый. Карта глубины открыта.'; } },
      { label: 'Разбить зеркало', run() { Ev.silver(45); Ev.luckBoon(-1, 'Осколки'); Ev.ambush({ mul: 0.7, types: ['shade', 'shade'] }); return 'Осколки звенят… и поднимаются тенями. +45 серебра из рамы, удача −1.'; } },
      { label: 'Отвернуться', run() { return 'Некоторые отражения лучше не тревожить.'; } }
    ]
  },
  {
    id: 'scroll_pit', art: 'scroll', floors: [1, 6], title: 'Яма со свитками',
    text: 'Яма, до краёв набитая свитками. Одни рассыпаются в пыль от дыхания, другие шепчут, пока ты проходишь мимо.',
    choices: [
      { label: 'Прочесть свитки (−8 здоровья)', run() { Ev.hurt(8); Ev.note(); grantBoon('Знание', 'Шанс крита +4%', { crit: 0.04 }, 'arcane'); return 'Буквы въедаются в зрачки. Ты запоминаешь больше, чем хотел. Крит +4%.'; } },
      { label: 'Сжечь свитки', run() { Ev.oil(35); return 'Пламя вспыхивает ярко. Масло в фонаре пополнено.'; } },
      { label: 'Уйти', run() { return 'Шёпот провожает тебя до двери.'; } }
    ]
  },
  {
    id: 'stranger', art: 'figure', floors: [1, 5], title: 'Странник у костра',
    text: 'У крошечного костерка сидит человек с котомкой. Он кивает на свободное место. Кажется, он ждал именно тебя.',
    choices: [
      { label: 'Разделить ужин', run(p) { Ev.heal(p.maxHp * 0.3); if (chance(0.6)) Ev.note(); return 'Хлеб чёрствый, но тёплый. Он рассказывает о том, что осталось наверху.'; } },
      { label: 'Расспросить о путях', run() { Ev.reveal(); return 'Он чертит пальцем по пыли весь план этажа. Карта открыта.'; } },
      { label: 'Прогнать', run() { Ev.silver(-12); return 'Он поднимается молча. Потом, уходя, «случайно» задевает твой кошель. −12 серебра.'; } }
    ]
  },
  {
    id: 'sealed_chest', art: 'chest', floors: [1, 6], title: 'Запечатанный ларец',
    text: 'Ларец с тремя печатями. Чёрный воск потрескался, но держится. Внутри что-то перекатывается.',
    choices: [
      { label: 'Открыть ключом (−1 ключ)', cond: p => p.keys >= 1, condText: 'Нет ключа', run() { Ev.keys(-1); const it = Ev.relic('treasure'); return `Замок щёлкает. Внутри — «${it.name}».`; } },
      { label: 'Взломать силой (−10 здоровья)', run() { Ev.hurt(10); if (chance(0.6)) { const it = Ev.relic('treasure'); return `Печати лопаются, оставив ожог. Внутри — «${it.name}».`; } Ev.silver(20); Ev.flasks(2); return 'Печати лопаются. Внутри только серебро и две склянки.'; } },
      { label: 'Не трогать', run() { return 'Что запечатано — то запечатано не зря.'; } }
    ]
  },
  {
    id: 'dice_spirit', art: 'dice', floors: [2, 6], title: 'Дух-игрок',
    text: 'Бледный призрак бренчит костями в черепе. «Сыграем, путник? Ставка — серебро. Мёртвым оно ни к чему, а вот игра…»',
    choices: [
      { label: 'Поставить 10 серебра', cond: p => p.silver >= 10, condText: 'Мало серебра', run() { if (chance(luckChance(0.47, 0.03))) { Ev.silver(10); return 'Кости выпали в твою пользу. +10 серебра.'; } Ev.silver(-10); return 'Призрак хохочет. −10 серебра.'; } },
      { label: 'Поставить 25 серебра', cond: p => p.silver >= 25, condText: 'Мало серебра', run() { if (chance(luckChance(0.45, 0.03))) { Ev.silver(25); return 'Кости выпали в твою пользу. +25 серебра.'; } Ev.silver(-25); return 'Призрак хохочет. −25 серебра.'; } },
      { label: 'Поставить всё', cond: p => p.silver >= 8, condText: 'Мало серебра', run(p) { const all = p.silver; if (chance(luckChance(0.4, 0.03))) { Ev.silver(Math.round(all * 1.5)); return `Невероятно! Банк твой: +${Math.round(all * 1.5)} серебра.`; } Ev.silver(-all); return 'Призрак забирает всё до монеты. Потом, смутившись, возвращает одну.'; } },
      { label: 'Отказаться', run() { return 'Призрак пожимает плечами: «Игра подождёт».'; } }
    ]
  },
  {
    id: 'bell', art: 'bell', floors: [2, 6], title: 'Одинокий колокол',
    text: 'Колокол без звонаря висит посреди зала. Верёвка раскачивается сама. На стене выбито: «Позвони — и ответят».',
    choices: [
      { label: 'Позвонить', run() { Ev.ambush({ mul: 1.15, reward: 'relic' }); Snd.bell(196, 0.2); return 'Гул прокатывается по этажу. Из темноты выходят те, кто его слышал.'; } },
      { label: 'Заглушить колокол', run() { Ev.ward(15); return 'Ты обматываешь язык колокола тряпкой. Тишина становится твоей защитой.'; } },
      { label: 'Уйти', run() { return 'Колокол качнулся и замер.'; } }
    ]
  },
  {
    id: 'shade_bargain', art: 'figure', floors: [3, 6], title: 'Сделка с тенью',
    text: 'Твоя собственная тень отделяется от пола и склоняется к тебе. «Я могу взять немного удачи. Или дать. Всё имеет цену».',
    choices: [
      { label: 'Продать удачу (−2) за 80 серебра', run() { Ev.luckBoon(-2, 'Проданная удача'); Ev.silver(80); return 'Тень растворяется, оставив тяжёлый кошель. Удача −2.'; } },
      { label: 'Купить удачу (+2) за 40 серебра', cond: p => p.silver >= 40, condText: 'Мало серебра', run() { Ev.silver(-40); Ev.luckBoon(2, 'Купленная удача'); return 'Тень кивает. Что-то светлое пробегает по спине. Удача +2.'; } },
      { label: 'Отказаться', run() { return 'Тень возвращается на место, чуть недовольная.'; } }
    ]
  },
  {
    id: 'blood_fountain', art: 'fountain', floors: [2, 6], title: 'Кровавый фонтан',
    text: 'Фонтан бьёт тёмно-красным. Пар над ним пахнет железом и мёдом. Края исписаны мелкими словами: «Пей — и живи. Живи — и плати».',
    choices: [
      { label: 'Напиться (−10 максимума, полное исцеление)', cond: p => p.maxHp > 50, condText: 'Слишком мало жизни', run(p) { Ev.maxHp(-10); p.hp = p.maxHp; Snd.play('potion'); return 'Жизнь возвращается, но чуть меньше, чем была.'; } },
      { label: 'Омыть оружие', run() { grantBoon('Кровавое лезвие', 'Урон +9%', { dmgPct: 0.09 }, 'blood'); return 'Металл темнеет и становится злее. Урон +9%.'; } },
      { label: 'Уйти', run() { return 'Ты не пьёшь. Красное не гаснет в глазах.'; } }
    ]
  },
  {
    id: 'lost_child', art: 'child', floors: [1, 5], title: 'Потерянный ребёнок',
    text: 'Посреди зала стоит ребёнок с огарком свечи. «Моя свеча гаснет… можно взять немного твоего огня? Я так долго здесь одна».',
    choices: [
      { label: 'Поделиться маслом (−20)', cond: p => p.oil >= 25, condText: 'Мало масла', run(p) { p.oil -= 20; Ev.ward(30); Ev.heal(15); return 'Свеча вспыхивает. Девочка рисует на стене фонарь и растворяется. На рисунке — тёплый свет.'; } },
      { label: 'Обнять', run() { if (hasCurse(player)) { const c = Ev.removeCurse(); return `Объятие длится долго. Когда ты разжимаешь руки, «${c.name}» исчезает.`; } Ev.heal(25); return 'Она прижимается к тебе, и на мгновение мир становится тихим. +25 здоровья.'; } },
      { label: 'Прогнать', run() { Ev.ambush({ mul: 0.6, types: ['shade'] }); return 'Её глаза гаснут. Из тёмного угла выходит что-то, что давно ждало.'; } }
    ]
  },
  {
    id: 'anvil', art: 'anvil', floors: [2, 6], title: 'Брошенная наковальня',
    text: 'Кузнец давно умер, но горн ещё тлеет. Рядом — молот, уголь и стопка заготовок. Наковальня зовёт.',
    choices: [
      { label: 'Заточить оружие (25 серебра)', cond: p => p.silver >= 25, condText: 'Мало серебра', run() { Ev.silver(-25); grantBoon('Свежая заточка', 'Урон +10%', { dmgPct: 0.10 }, 'iron'); return 'Искры летят. Урон +10%.'; } },
      { label: 'Закалить броню (25 серебра)', cond: p => p.silver >= 25, condText: 'Мало серебра', run() { Ev.silver(-25); Ev.ward(30); grantBoon('Закалка', '+10 здоровья', { maxHp: 10 }, 'iron'); player.hp += 10; return 'Металл звенит чисто. +10 здоровья и оберег.'; } },
      { label: 'Взять боёк молота', run() { const it = RELIC_BY_ID.hammerhead; addRelic(player, it); Snd.play('relic'); floatText = { title: it.name, desc: it.desc, color: it.color, relic: it, timer: 4, max: 4 }; return 'Тяжёлый, зато честный. Ты забираешь его.'; } },
      { label: 'Уйти', run() { return 'Горн остывает за твоей спиной.'; } }
    ]
  },
  {
    id: 'choir_echo', art: 'bell', floors: [2, 6], title: 'Эхо хора',
    text: 'Стены поют. Тихо, на сотни голосов, одну и ту же строку. Тебе кажется, что без твоего голоса она не заканчивается.',
    choices: [
      { label: 'Подпеть', run() { player.oil = player.oilMax; Ev.ward(30); Ev.ambush({ mul: 0.8 }); return 'Фонарь вспыхивает ярче. Но песню услышали не только стены.'; } },
      { label: 'Записать мелодию', run() { Ev.note(); grantBoon('Мотив', 'Атаки быстрее на 6%', { atkPct: 0.06 }, 'holy'); return 'Ты насвистываешь на ходу. Бой идёт в такт. Атаки быстрее на 6%.'; } },
      { label: 'Заткнуть уши', run() { Ev.heal(10); return 'Тишина в ушах. Почти покой.'; } }
    ]
  },
  {
    id: 'abyss_altar', art: 'altar', floors: [3, 6], title: 'Алтарь Бездны',
    text: 'Чёрный камень шепчет предложения. Ничего не скрывает: каждая сила здесь имеет цену, и цена написана рядом.',
    prep(ev) { ev.deals = [pick(RELICS.filter(r => r.curse)), pick(RELICS.filter(r => r.curse))]; },
    choices: [
      { label: ev => `Принять «${ev.deals[0].name}»`, sub: ev => ev.deals[0].desc, run(p, ev) { addRelic(p, ev.deals[0]); Snd.play('blood'); Stats.add('curses', 1); return ev.deals[0].desc; } },
      { label: ev => `Принять «${ev.deals[1].name}»`, sub: ev => ev.deals[1].desc, run(p, ev) { if (ev.deals[1] === ev.deals[0]) return Ev.curse().desc; addRelic(p, ev.deals[1]); Snd.play('blood'); Stats.add('curses', 1); return ev.deals[1].desc; } },
      { label: 'Отвергнуть дар', run() { Ev.ward(20); return 'Камень вздыхает. Что-то вроде уважения.'; } }
    ]
  },
  {
    id: 'confessor', art: 'figure', floors: [2, 6], title: 'Исповедник', need: hasCurse,
    text: 'В нише сидит человек в сером. «Я чувствую на тебе тяжесть, — говорит он. — Могу снять. Но не даром».',
    choices: [
      { label: 'Исповедаться (−30 серебра)', cond: p => p.silver >= 30, condText: 'Мало серебра', run() { Ev.silver(-30); const c = Ev.removeCurse(); Ev.heal(15); return c ? `Он шепчет слова, и «${c.name}» рассыпается прахом.` : 'Он ничего не нашёл.'; } },
      { label: 'Заплатить жизнью (−15 максимума)', cond: p => p.maxHp > 50, condText: 'Слишком мало жизни', run() { Ev.maxHp(-15); const c = Ev.removeCurse(); return c ? `Он берёт плату кровью. «${c.name}» исчезает.` : 'Он ничего не нашёл.'; } },
      { label: 'Оставить как есть', run() { return 'Некоторые тяжести — это сила.'; } }
    ]
  },
  {
    id: 'keepers_cache', art: 'chest', floors: [3, 6], title: 'Тайник Хранителей',
    text: 'Покинутая каморка. На полке лежат три свёртка, перевязанные красной нитью. Один из них, видимо, для тебя.',
    choices: [
      { label: 'Карту', run() { Ev.reveal(); return 'Старая, но точная. Весь этаж открыт.'; } },
      { label: 'Эликсиры', run() { Ev.potions(2); Ev.flasks(2); return 'Два зелья и две склянки.'; } },
      { label: 'Связку ключей', run() { Ev.keys(3); Ev.silver(15); return 'Три ключа и немного серебра.'; } }
    ]
  }
];
const EVENT_BY_ID = {}; for (const e of EVENTS) EVENT_BY_ID[e.id] = e;

function chooseEvent(floor) {
  const seen = (run && run.seenEv) || (run ? (run.seenEv = []) : []);
  let list = EVENTS.filter(e => floor >= e.floors[0] && floor <= e.floors[1] && (!e.need || (player && e.need(player))) && !seen.includes(e.id));
  if (!list.length) list = EVENTS.filter(e => floor >= e.floors[0] && floor <= e.floors[1] && (!e.need || (player && e.need(player))));
  if (!list.length) list = [EVENTS[0]];
  const ev = pick(list);
  seen.push(ev.id);
  return ev;
}

// ---------- запуск и разрешение события ----------
let evUI = null;
function startEvent(rm) {
  const ev = rm.event;
  if (!ev || rm.evDone) return;
  const inst = { ev, rm, phase: 'choose', sel: 0, result: '', deals: null };
  if (ev.prep) ev.prep(inst);
  Ev.pending = null;
  evUI = inst;
  state = 'event';
  Snd.play('note');
  Stats.add('events', 1);
  if (run) run.events = (run.events || 0) + 1;
  const sv = Save.data;
  sv.evSeen = sv.evSeen || {};
  sv.evSeen[ev.id] = (sv.evSeen[ev.id] || 0) + 1;
  Save.store();
}
function eventChoiceAvailable(inst, c) { return !c.cond || c.cond(player); }
function eventChoose(i) {
  const inst = evUI;
  if (!inst || inst.phase !== 'choose') return;
  const c = inst.ev.choices[i];
  if (!c || !eventChoiceAvailable(inst, c)) { Snd.play('error'); return; }
  Snd.play('confirm');
  inst.result = c.run(player, inst);
  inst.phase = 'result';
  inst.chosen = i;
}
function closeEvent() {
  const inst = evUI;
  if (!inst) return;
  if (inst.final) { // финальный выбор → концовка
    evUI = null;
    startStory(endingPages(run.ending || 'light', run.finalBoss), () => endRun(true));
    return;
  }
  const rm = inst.rm;
  rm.evDone = true;
  evUI = null;
  state = 'play';
  const pend = Ev.pending; Ev.pending = null;
  if (pend && pend.ambush) {
    const spec = pend.ambush;
    const types = spec.types || pickEnemyTypes(floorNum, ENEMY_BUDGET(floorNum) * (spec.mul || 0.9));
    rm.cleared = false;
    rm.ambushReward = spec.reward || null;
    spawnEnemyGroup(rm, types, { x: player.x, y: player.y });
    Snd.play('spawn');
    showMessage('Засада!', '#fca5a5');
  }
  if (player.hp <= 0) player.hp = 1;
  recalcPlayer(player);
}

// ====================== ШЛЯПНИК-НАПЕРСТОЧНИК ======================
const HATTER_LINES = {
  intro: ['Ах, гость! Сыграем в старую игру?', 'Тссс… Шляпа — это целый мир. Угадаешь, где шарик?', 'Одна монетка — и судьба улыбнётся. Или я.'],
  win: ['О! Везёт же… Ну, сегодня я добрый.', 'Хм. Как? Признаю — признаю!', 'Улыбка не сходит с его лица, но глаза темнеют.'],
  lose: ['Ха-ха-ха! Нож — это тоже подарок.', 'Не туда, не туда… Держи на память.', 'Улыбнись, гость. Это всего лишь царапина.'],
  bye: ['Ну всё, мне пора. Шляпы сами себя не прячут.', 'Мы ещё встретимся. Я всегда улыбаюсь последним.']
};
const Hat = { s: null };
const hatSlotX = i => CX + (i - 1) * 118;
function openHatter(rm) {
  const h = rm.hatter;
  if (!h || h.done) return;
  h.met = true;
  Hat.s = { rm, h, phase: 'intro', t: 0, sel: 1, ballHat: 0, hats: [0, 1, 2].map(i => ({ id: i, slot: i, x: hatSlotX(i), y: CY + 30, lift: 0 })), swaps: [], swapI: 0, swapT: 0, picked: -1, win: false, line: pick(HATTER_LINES.intro), reward: '', knife: 0, left: false };
  state = 'hatter';
  Snd.play('note');
}
function hatterPlay() {
  const S = Hat.s, p = player, h = S.h;
  if (p.silver < h.fee) { showMessage('Не хватает серебра для игры', '#fca5a5'); Snd.play('error'); return; }
  p.silver -= h.fee; Snd.play('buy');
  S.ballHat = rndInt(0, 2);
  S.hats.forEach((ht, i) => { ht.slot = i; ht.x = hatSlotX(i); ht.lift = 0; });
  const n = 5 + h.rounds * 3 + rndInt(0, 2);
  S.swaps = [];
  let last = -1;
  for (let i = 0; i < n; i++) {
    let a = rndInt(0, 2), b = rndInt(0, 2), g = 0;
    while ((a === b || a + b === last) && g++ < 20) { a = rndInt(0, 2); b = rndInt(0, 2); }
    S.swaps.push([a, b]); last = a + b;
  }
  S.swapI = 0; S.swapT = 0; S.swapDur = Math.max(0.17, 0.36 - h.rounds * 0.07);
  S.phase = 'show'; S.t = 0; S.picked = -1;
  Stats.add('hatterPlays', 1);
}
function hatterPick(slot) {
  const S = Hat.s;
  if (!S || S.phase !== 'pick') return;
  const hat = S.hats.find(ht => ht.slot === slot);
  S.picked = hat.id;
  S.win = hat.id === S.ballHat;
  S.phase = 'reveal'; S.t = 0;
  Snd.play(S.win ? 'charge' : 'error');
}
function hatterResolve() {
  const S = Hat.s, p = player, h = S.h;
  h.rounds++;
  S.winsInRow = S.win ? (S.winsInRow || 0) + 1 : 0;
  if (S.win) {
    Stats.add('hatterWins', 1);
    S.line = pick(HATTER_LINES.win);
    const r = Math.random();
    if (r < 0.4) { const it = Ev.relic('secret'); S.reward = `Реликвия: ${it.name}`; }
    else if (r < 0.58) { grantBoon('Улыбка удачи', '+12 здоровья', { maxHp: 12 }, 'blood'); p.hp += 12; S.reward = '+12 к максимуму здоровья'; }
    else if (r < 0.73) { Ev.keys(2); Ev.potions(1); S.reward = '2 ключа и зелье'; }
    else if (r < 0.88) { run.bonusEmbers = (run.bonusEmbers || 0) + 6; S.reward = '+6 углей по окончании спуска'; }
    else { Ev.luckBoon(1, 'Улыбка фортуны'); S.reward = 'Удача +1'; }
  } else {
    Stats.add('hatterKnife', 1);
    S.line = pick(HATTER_LINES.lose);
    const dmg = dmgScale(14) * (1 + h.rounds * 0.15);
    S.knife = 0.001; S.knifeDmg = dmg;
    S.reward = '';
  }
  h.fee = Math.min(3, h.fee + rndInt(1, 2));
  if (h.rounds >= 3) h.done = true;
  S.phase = S.win ? 'result' : 'knife'; S.t = 0;
}
function hatterLeave() {
  const S = Hat.s;
  if (!S) return;
  S.h.cd = 1.6;
  if (S.h.rounds >= 3 && S.winsInRow >= 3) Ach.unlock('hatter_all');
  if (S.h.done) { S.rm.hatter = null; spawnParticles(S.h.x, S.h.y, 24, '#a78bfa'); Snd.play('unlock'); }
  Hat.s = null;
  state = 'play';
}
function updateHatter(dt) {
  const S = Hat.s;
  if (!S) return;
  S.t += dt;
  if (S.phase === 'show') {
    S.hats.forEach(ht => { ht.lift = S.t < 0.35 ? S.t / 0.35 : S.t < 1.1 ? 1 : Math.max(0, 1 - (S.t - 1.1) / 0.3); });
    if (S.t >= 1.4) { S.phase = 'shuffle'; S.t = 0; S.hats.forEach(ht => ht.lift = 0); }
  } else if (S.phase === 'shuffle') {
    const sw = S.swaps[S.swapI];
    if (!sw) { S.phase = 'pick'; S.t = 0; return; }
    S.swapT += dt;
    const k = Math.min(1, S.swapT / S.swapDur), e = k * k * (3 - 2 * k);
    const ha = S.hats.find(ht => ht.slot === sw[0]), hb = S.hats.find(ht => ht.slot === sw[1]);
    ha.x = lerp(hatSlotX(sw[0]), hatSlotX(sw[1]), e); hb.x = lerp(hatSlotX(sw[1]), hatSlotX(sw[0]), e);
    ha.y = CY + 30 - Math.sin(k * Math.PI) * 22; hb.y = CY + 30 + Math.sin(k * Math.PI) * 22;
    if (k >= 1) {
      ha.slot = sw[1]; hb.slot = sw[0]; ha.x = hatSlotX(ha.slot); hb.x = hatSlotX(hb.slot); ha.y = hb.y = CY + 30;
      S.swapI++; S.swapT = 0;
      Snd.play('select');
    }
  } else if (S.phase === 'reveal') {
    S.hats.forEach(ht => ht.lift = Math.min(1, S.t / 0.3) * (ht.id === S.ballHat || ht.id === S.picked ? 1 : 0.7));
    if (S.t >= 1.5) hatterResolve();
  } else if (S.phase === 'knife') {
    if (S.knife > 0) {
      S.knife += dt;
      if (S.knife > 0.45 && !S.hit) {
        S.hit = true;
        Ev.hurt(S.knifeDmg);
        hurtFlash = 0.8;
        spawnParticles(player.x, player.y, 16, '#b91c1c');
      }
      if (S.knife > 1.5) { S.hit = false; S.knife = 0; S.phase = 'result'; S.t = 0; }
    }
  }
}
