'use strict';
/* =====================================================================
   UI2: достижения, бестиарий, статистика, ввод сида, сюжетные вставки,
        события-развилки, Шляпник, всплывающие уведомления
   ===================================================================== */
let achPage = 0, bestSel = 0, bestPage = 0, seedInput = '';

// ---------- УВЕДОМЛЕНИЯ ----------
function renderToasts() {
  let yy = HUD_H + 8, my = H - 100;
  for (const t of toasts) {
    const a = clamp(Math.min(t.life / 0.4, (t.max - t.life) / 0.25), 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    if (t.kind === 'mini') {
      centerText(t.title, W / 2, my, `bold 12px ${FONT_SANS}`, t.color); my -= 16;
    } else {
      const w = 232, h = 44, x = W - 124 - w - 8 + (1 - a) * 30;
      ctx.fillStyle = 'rgba(8,6,12,0.92)'; ctx.fillRect(x, yy, w, h);
      ctx.strokeStyle = t.color; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, yy + 0.5, w - 1, h - 1);
      leftText(t.title, x + 10, yy + 13, `bold 10px ${FONT_SANS}`, t.color);
      leftText(t.text, x + 10, yy + 29, `bold 13px ${FONT_SERIF}`, '#f1e3b8');
      if (t.sub) rightText(t.sub, x + w - 8, yy + 13, `10px ${FONT_SANS}`, '#8a8494');
      yy += h + 6;
    }
    ctx.restore();
  }
}

// ---------- ДОСТИЖЕНИЯ ----------
const ACH_PAGE = 20;
function renderAchievements() {
  uiButtons = [];
  drawMenuBackdrop();
  const total = ACHIEVEMENTS.length, got = Ach.count(), pages = Math.ceil(total / ACH_PAGE);
  centerText('ДОСТИЖЕНИЯ', W / 2, 48, `bold 28px ${FONT_SERIF}`, '#f1e3b8', 10, 6);
  centerText(`Получено: ${got} из ${total}`, W / 2, 76, `12px ${FONT_SANS}`, '#8a8494');
  ctx.fillStyle = '#1e1b26'; ctx.fillRect(W / 2 - 150, 86, 300, 5); ctx.fillStyle = '#fbbf24'; ctx.fillRect(W / 2 - 150, 86, 300 * got / total, 5);
  ACHIEVEMENTS.slice(achPage * ACH_PAGE, achPage * ACH_PAGE + ACH_PAGE).forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 36 + col * 450, y = 100 + row * 41, w = 438, h = 37;
    const done = !!Save.data.ach[a.id], hidden = a.hidden && !done;
    ctx.fillStyle = done ? 'rgba(214,162,58,0.1)' : 'rgba(10,8,16,0.8)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = done ? '#8a7240' : '#2e2a36'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = done ? '#fbbf24' : '#2a2632'; ctx.beginPath(); ctx.arc(x + 20, y + h / 2, 11, 0, 7); ctx.fill();
    if (done) { ctx.strokeStyle = '#3b2a05'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 14, y + h / 2); ctx.lineTo(x + 19, y + h / 2 + 5); ctx.lineTo(x + 27, y + h / 2 - 5); ctx.stroke(); }
    else centerText(hidden ? '?' : '·', x + 20, y + h / 2, `bold 14px ${FONT_SERIF}`, '#4a4452');
    leftText(hidden ? '???' : a.name, x + 40, y + 12, `bold 13px ${FONT_SERIF}`, done ? '#f1e3b8' : '#8a8494');
    leftText(hidden ? 'Секретное достижение' : a.desc, x + 40, y + 27, `10px ${FONT_SANS}`, done ? '#b8b2a4' : '#5b5666');
    rightText(done ? 'получено' : `+${a.reward} углей`, x + w - 10, y + 18, `10px ${FONT_SANS}`, done ? '#86efac' : '#7a6a3a');
  });
  drawButton('‹', W / 2 - 110, H - 56, 40, 32, () => { achPage = (achPage + pages - 1) % pages; Snd.play('select'); }, false);
  centerText(`${achPage + 1} / ${pages}`, W / 2, H - 40, `bold 13px ${FONT_SERIF}`, '#d6a23a');
  drawButton('›', W / 2 + 70, H - 56, 40, 32, () => { achPage = (achPage + 1) % pages; Snd.play('select'); }, false);
  drawButton('Назад', 40, H - 56, 110, 34, () => { state = 'title'; Snd.play('select'); }, false);
}

// ---------- БЕСТИАРИЙ ----------
const BEST_PAGE = 24, BEST_COLS = 8;
const DUMMY_PLAYER = { x: 120, y: 60, vx: 0, vy: 0, r: 14, oil: 100, light: 0, oilMax: 100, fl: {}, aim: { x: 1, y: 0 }, aimAng: 0, hp: 100, maxHp: 100, iframes: 0 };
const bestDummies = {};
function bestiaryDummy(id) {
  if (bestDummies[id]) return bestDummies[id];
  const saved = floorNum;
  let e;
  if (BOSS_BY_ID[id]) e = makeBoss(1, id, 1);
  else e = makeEnemy(id, 0, 0, 1, { noSpawn: true });
  e.spawnT = 0; e.x = 0; e.y = 0;
  floorNum = saved;
  return (bestDummies[id] = e);
}
function drawBestiaryArt(id, cx, cy, size, silhouette) {
  const e = bestiaryDummy(id), isBoss = !!e.isBoss;
  const sc = size / (isBoss ? e.r * 3 : Math.max(28, e.r * 2.4));
  const sp = player;
  player = DUMMY_PLAYER;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
  if (silhouette) ctx.filter = 'brightness(0) opacity(0.5)';
  e.x = 0; e.y = 0; e.state = e.state || ''; e.cd = 5; e.t = 5;
  try { (isBoss ? BOSS_ART : ENEMY_ART)[id](e); } catch (err) { /* рисование карточки не критично */ }
  ctx.restore();
  player = sp;
}
function renderBestiary() {
  uiButtons = [];
  drawMenuBackdrop();
  const total = BESTIARY_ALL.length, pages = Math.ceil(total / BEST_PAGE);
  centerText('БЕСТИАРИЙ', W / 2, 44, `bold 28px ${FONT_SERIF}`, '#f1e3b8', 10, 6);
  centerText(`Узнано: ${bestiaryCount()} из ${total} · существа открываются после первого убийства`, W / 2, 70, `12px ${FONT_SANS}`, '#8a8494');
  const cw = 104, ch = 92, gx = 6, x0 = (W - (BEST_COLS * cw + (BEST_COLS - 1) * gx)) / 2, y0 = 84;
  const list = BESTIARY_ALL.slice(bestPage * BEST_PAGE, bestPage * BEST_PAGE + BEST_PAGE);
  list.forEach((id, i) => {
    const x = x0 + (i % BEST_COLS) * (cw + gx), y = y0 + Math.floor(i / BEST_COLS) * (ch + gx);
    const known = bestiaryKnown(id), idx = bestPage * BEST_PAGE + i, sel = bestSel === idx, boss = !!BOSS_BY_ID[id];
    const b = { x, y, w: cw, h: ch, action: () => { bestSel = idx; Snd.play('select'); } };
    uiButtons.push(b);
    ctx.fillStyle = sel ? 'rgba(214,162,58,0.14)' : 'rgba(10,8,16,0.8)'; ctx.fillRect(x, y, cw, ch);
    ctx.strokeStyle = sel ? '#d6a23a' : (hovered(b) ? '#8a7240' : (boss ? '#5b1830' : '#2e2a36')); ctx.lineWidth = sel ? 2 : 1.2; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, cw - 4, ch - 26); ctx.clip();
    drawBestiaryArt(id, x + cw / 2, y + 36, 54, !known);
    ctx.restore();
    if (!known) centerText('?', x + cw / 2, y + 36, `bold 24px ${FONT_SERIF}`, '#4a4452');
    const nm = tr(known ? (boss ? BOSS_BY_ID[id].name : ENEMY_DEFS[id].name) : '???');
    centerText(nm.length > 15 ? nm.slice(0, 14) + '…' : nm, x + cw / 2, y + ch - 20, `bold 10px ${FONT_SERIF}`, known ? (boss ? '#fda4af' : '#e7e5e4') : '#4a4452');
    centerText(known ? `убито: ${(Save.data.bestiary[id] || {}).kills || 0}` : 'не убит', x + cw / 2, y + ch - 7, `9px ${FONT_SANS}`, '#6b6676');
    if (hovered(b)) bestSel = idx;
  });
  // подробности
  const id = BESTIARY_ALL[bestSel], known = bestiaryKnown(id), boss = !!BOSS_BY_ID[id];
  const px = 36, py = 84 + 3 * (ch + gx) + 4, pw = W - 72, ph = H - py - 66;
  ctx.fillStyle = 'rgba(10,8,16,0.88)'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = known ? (boss ? '#9f1239' : '#6b6676') : '#2e2a36'; ctx.lineWidth = 1.4; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  if (known) {
    const d = boss ? BOSS_BY_ID[id] : ENEMY_DEFS[id];
    ctx.save(); ctx.beginPath(); ctx.rect(px + 4, py + 4, 100, ph - 8); ctx.clip(); drawBestiaryArt(id, px + 54, py + ph / 2, 74, false); ctx.restore();
    leftText(d.name, px + 118, py + 20, `bold 19px ${FONT_SERIF}`, boss ? '#fda4af' : '#f1e3b8');
    if (boss && d.sub) leftText(d.sub, px + 118, py + 40, `italic 12px ${FONT_SERIF}`, '#8a8494');
    const kills = (Save.data.bestiary[id] || {}).kills || 0;
    wrapText(boss ? BOSS_LORE[id] : ENEMY_LORE[id], px + 118, py + (boss ? 62 : 48), pw - 360, 17, `13px ${FONT_SERIF}`, '#d6cfb4');
    const rx = px + pw - 12;
    rightText(`Здоровье: ${d.hp}`, rx, py + 18, `12px ${FONT_SANS}`, '#fca5a5');
    if (!boss) rightText(`Появляется с глубины ${d.minFloor >= 99 ? '—' : d.minFloor}`, rx, py + 36, `12px ${FONT_SANS}`, '#a5b4fc');
    else rightText(`Хозяин глубины ${BOSS_POOL.findIndex(p => p && p.includes(id))}`, rx, py + 36, `12px ${FONT_SANS}`, '#a5b4fc');
    rightText(`Убито: ${kills}`, rx, py + 54, `bold 12px ${FONT_SANS}`, '#fde68a');
    if (d.armor) rightText(`Броня: ${Math.round(d.armor * 100)}%`, rx, py + 72, `12px ${FONT_SANS}`, '#cbd5e1');
    if (!boss && d.fly) rightText('Летает', rx, py + (d.armor ? 90 : 72), `12px ${FONT_SANS}`, '#7dd3fc');
  } else centerText('Убей это существо, чтобы узнать о нём больше', px + pw / 2, py + ph / 2, `italic 14px ${FONT_SERIF}`, '#6b6676');
  drawButton('‹', W / 2 - 110, H - 56, 40, 32, () => { bestPage = (bestPage + pages - 1) % pages; bestSel = bestPage * BEST_PAGE; Snd.play('select'); }, false);
  centerText(`${bestPage + 1} / ${pages}`, W / 2, H - 40, `bold 13px ${FONT_SERIF}`, '#d6a23a');
  drawButton('›', W / 2 + 70, H - 56, 40, 32, () => { bestPage = (bestPage + 1) % pages; bestSel = bestPage * BEST_PAGE; Snd.play('select'); }, false);
  drawButton('Назад', 40, H - 56, 110, 34, () => { state = 'title'; Snd.play('select'); }, false);
}

// ---------- СТАТИСТИКА ----------
const fmtHours = sec => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h ? `${h} ч ${m} мин` : `${m} мин`; };
function renderStats() {
  uiButtons = [];
  drawMenuBackdrop();
  const d = Save.data, S = d.stats, n = k => Math.round(S[k] || 0);
  centerText('СТАТИСТИКА', W / 2, 46, `bold 28px ${FONT_SERIF}`, '#f1e3b8', 10, 6);
  const colA = [
    ['Спусков', d.runs], ['Побед', d.wins], ['Смертей', n('deaths')], ['Убито врагов', d.kills], ['Боссов побеждено', d.bosses],
    ['Время в игре', fmtHours(n('playTime'))], ['Нанесено урона', n('damageDealt')], ['Получено урона', n('damageTaken')],
    ['Рывков', n('dashes')], ['Атак', n('attacks')], ['Выпито зелий', n('potions')], ['Серебра собрано', n('silverGot')],
    ['Комнат зачищено', n('roomsCleared')], ['Тайных комнат', n('secrets')], ['Событий', n('events')], ['Испытаний', n('trials')]
  ];
  const colB = [
    ['Реликвий открыто', `${RELICS.filter(r => d.discovered[r.id]).length} / ${RELICS.length}`], ['Записей прочитано', `${Object.keys(d.notes).length} / ${NOTES.length}`],
    ['Бестиарий', `${bestiaryCount()} / ${BESTIARY_ALL.length}`], ['Достижения', `${Ach.count()} / ${ACHIEVEMENTS.length}`], ['Проклятий принято', n('curses')],
    ['Отражено щитом', n('parries')], ['Казней', n('executions')], ['Статуй разбито', n('statuesBroken')], ['Врагов ослеплено', n('blinded')],
    ['Гниений наложено', n('rots')], ['Кровавых эх', n('echoes')], ['Убито безумием', n('madKills')],
    ['Шляпник: игр', n('hatterPlays')], ['Шляпник: побед', n('hatterWins')], ['Шляпник: ножей', n('hatterKnife')], ['Лучшая победа', d.bestTime ? fmtTime(d.bestTime) : '—']
  ];
  const draw = (rows, x, y0) => rows.forEach(([k, v], i) => {
    leftText(k, x, y0 + i * 21, `12px ${FONT_SANS}`, '#8a8494');
    rightText(String(v), x + 270, y0 + i * 21, `bold 12px ${FONT_SANS}`, '#f1f5f9');
  });
  draw(colA, 44, 80); draw(colB, 360, 80);
  // режимы
  const sv = d.survival, days = Object.keys(d.daily), bestDaily = days.reduce((m, k) => Math.max(m, d.daily[k].score), 0);
  leftText('РЕЖИМЫ', 678, 80, `bold 13px ${FONT_SERIF}`, '#d6a23a');
  [['Выживание: лучшая волна', sv.bestWave], ['Выживание: лучший счёт', sv.bestScore], ['Выживание: забегов', sv.runs], ['Ежедневных дней', days.length], ['Лучший счёт дня', bestDaily],
   ['Концовка «Огонь»', (d.endings.light || 0)], ['Концовка «Имя»', (d.endings.name || 0)], ['Концовка «Тьма»', (d.endings.dark || 0)]].forEach(([k, v], i) => {
    leftText(k, 678, 106 + i * 21, `12px ${FONT_SANS}`, '#8a8494'); rightText(String(v), 916, 106 + i * 21, `bold 12px ${FONT_SANS}`, '#f1f5f9');
  });
  // герои
  leftText('ГЕРОИ', 44, 430, `bold 13px ${FONT_SERIF}`, '#d6a23a');
  const hs = d.heroStats;
  HERO_ORDER.forEach((id, i) => {
    const x = 44 + (i % 3) * 296, y = 450 + Math.floor(i / 3) * 21, s = hs[id] || {};
    const secret = HEROES[id].secret && !d.heroes[id];
    leftText(secret ? '???' : HEROES[id].name, x, y, `bold 11px ${FONT_SERIF}`, d.heroes[id] ? '#e7e5e4' : '#4a4452');
    rightText(secret ? '' : `${s.runs || 0} спусков · ${s.wins || 0} побед · гл. ${s.bestFloor || 0}`, x + 280, y, `10px ${FONT_SANS}`, '#8a8494');
  });
  drawButton('Назад', 40, H - 56, 110, 34, () => { state = 'title'; Snd.play('select'); }, false);
}

// ---------- ВВОД СИДА ----------
function renderSeedScreen() {
  uiButtons = [];
  drawMenuBackdrop();
  centerText('СВОЙ СИД', W / 2, 90, `bold 30px ${FONT_SERIF}`, '#f1e3b8', 10, 6);
  wrapText('Сид определяет карту, врагов, события и награды. Поделись кодом — и другой игрок увидит те же комнаты. Пустое поле — случайный сид.', W / 2, 140, 640, 20, `italic 14px ${FONT_SERIF}`, '#b8b2a4', 'center');
  const bw = 420, bx = W / 2 - bw / 2, by = 214;
  ctx.fillStyle = 'rgba(10,8,16,0.9)'; ctx.fillRect(bx, by, bw, 56);
  ctx.strokeStyle = '#d6a23a'; ctx.lineWidth = 2; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 55);
  const blink = Math.floor(time * 2) % 2 === 0 ? '▏' : ' ';
  centerText((seedInput || '') + blink, W / 2, by + 29, `bold 28px ${FONT_MONO}`, '#fbbf24', 8, 3);
  centerText(`${seedInput.length}/12 символов`, W / 2, by + 74, `11px ${FONT_SANS}`, '#6b6676');
  drawButton('Случайный (Tab)', W / 2 - 220, 330, 210, 40, () => { seedInput = randomSeedCode(); Snd.play('select'); }, false);
  drawButton('Вставить', W / 2 + 10, 330, 210, 40, () => { try { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { seedInput = normSeed(t); }); } catch (e) { /* буфер недоступен */ } }, false);
  drawButton('Продолжить (Enter)', W / 2 - 220, 384, 440, 46, () => seedContinue(), false, '#fbbf24', `bold 17px ${FONT_SERIF}`);
  drawButton('Назад', 40, H - 56, 110, 34, () => { state = 'title'; Snd.play('select'); }, false);
  centerText('Печатай латиницей, кириллицей или цифрами · Backspace — стереть', W / 2, H - 38, `11px ${FONT_SANS}`, '#5b5666');
}
function seedContinue() {
  if (!seedInput) seedInput = randomSeedCode();
  Snd.play('confirm');
  openCamp('seed');
}
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('paste', e => {
    if (state !== 'seed') return;
    const t = (e.clipboardData && e.clipboardData.getData('text')) || '';
    seedInput = normSeed(seedInput + t);
  });
}

// ---------- СЮЖЕТ ----------
const SCENE_PAL = {
  prologue: ['#1b0f1d', '#3b1720', '#f59e0b'], stairs: ['#07060d', '#1c1830', '#fbbf24'], water: ['#04131a', '#0d3a44', '#5eead4'],
  bones: ['#120f0a', '#3a3224', '#e7e1c8'], garden: ['#12050a', '#3a0f1f', '#fb7185'], ice: ['#050e16', '#17314a', '#bae6fd'],
  abyss: ['#020104', '#1a0b2e', '#a78bfa'], light: ['#1a1206', '#5c3a0a', '#fde68a'], name: ['#04050d', '#1a1840', '#c4b5fd'], dark: ['#040104', '#2a0610', '#e11d48']
};
function drawStoryScene(scene, t) {
  const pal = SCENE_PAL[scene] || SCENE_PAL.stairs, acc = pal[2];
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.save();
  const cx = W / 2, cy = 230;
  switch (scene) {
    case 'prologue': { // силуэт города, окна гаснут
      ctx.fillStyle = '#0a0508';
      for (let i = 0; i < 16; i++) { const x = i * 62 - 10, h = 90 + ((i * 53) % 90); ctx.fillRect(x, 330 - h, 50, h + 160); ctx.beginPath(); ctx.moveTo(x - 2, 330 - h); ctx.lineTo(x + 25, 330 - h - 30); ctx.lineTo(x + 52, 330 - h); ctx.fill(); }
      for (let i = 0; i < 16; i++) for (let k = 0; k < 4; k++) { const lit = Math.sin(t * 0.8 + i * 1.7 + k) > 0.4 - Math.min(0.9, t * 0.08); if (lit) { ctx.fillStyle = 'rgba(251,191,36,0.75)'; ctx.fillRect(i * 62 + 10 + (k % 2) * 18, 270 - ((i * 53) % 90) + Math.floor(k / 2) * 26, 8, 12); } }
      glow(cx, 300, 80, acc, 0.35 + Math.sin(t * 5) * 0.08);
      break;
    }
    case 'stairs': { // лестница вниз
      for (let i = 0; i < 10; i++) {
        const k = i / 10, w = lerp(560, 70, k), y = lerp(430, 190, k), h = lerp(46, 10, k);
        ctx.fillStyle = `rgba(${40 - i * 3},${34 - i * 3},${60 - i * 4},1)`; ctx.fillRect(cx - w / 2, y, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(cx - w / 2, y, w, 2);
      }
      glow(cx, 360, 150, acc, 0.4 + Math.sin(t * 6) * 0.06);
      ctx.fillStyle = acc; ctx.beginPath(); ctx.ellipse(cx, 372, 9, 12, 0, 0, 7); ctx.fill();
      break;
    }
    case 'water': { // подводные колокола
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(94,234,212,${0.1 + i * 0.03})`; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 100 + i * 60 + Math.sin(x * 0.02 + t * 1.5 + i) * 10); ctx.stroke(); }
      const sw = Math.sin(t * 1.4) * 0.15;
      ctx.save(); ctx.translate(cx, 150); ctx.rotate(sw); ctx.fillStyle = '#0a2a30'; ctx.strokeStyle = acc; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-60, 70, -78, 140); ctx.lineTo(78, 140); ctx.quadraticCurveTo(60, 70, 26, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(167,243,208,0.35)'; ctx.beginPath(); ctx.arc((i * 97) % W, H - ((t * 40 + i * 53) % H), 2 + (i % 3), 0, 7); ctx.fill(); }
      break;
    }
    case 'bones': { // ряды черепов и рёбер
      for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) {
        const x = 40 + i * 78 + (r % 2) * 38, y = 140 + r * 66; ctx.fillStyle = `rgba(231,225,200,${0.18 + r * 0.05})`; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(10,8,4,0.9)'; ctx.beginPath(); ctx.arc(x - 6, y - 2, 4, 0, 7); ctx.arc(x + 6, y - 2, 4, 0, 7); ctx.fill(); ctx.fillRect(x - 3, y + 6, 6, 8);
      }
      glow(cx, 220, 160, acc, 0.12);
      break;
    }
    case 'garden': { // лианы и лепестки
      ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) { ctx.strokeStyle = `rgba(80,${20 + i * 5},40,0.8)`; ctx.lineWidth = 6; ctx.beginPath(); const x0 = i * 120; ctx.moveTo(x0, H); ctx.bezierCurveTo(x0 + 60 + Math.sin(t + i) * 24, 400, x0 - 40, 260, x0 + 30 + Math.cos(t * 0.8 + i) * 20, 80); ctx.stroke(); }
      for (let i = 0; i < 14; i++) { const x = (i * 83 + t * 18) % W, y = (i * 61 + t * 30) % H; ctx.fillStyle = 'rgba(251,113,133,0.55)'; ctx.beginPath(); ctx.ellipse(x, y, 7, 3, t + i, 0, 7); ctx.fill(); }
      glow(cx, 240, 120, acc, 0.22);
      break;
    }
    case 'ice': { // кристаллы и снег
      for (let i = 0; i < 9; i++) { const x = 40 + i * 106, h = 100 + ((i * 37) % 120); ctx.fillStyle = `rgba(186,230,253,${0.16 + (i % 3) * 0.06})`; ctx.beginPath(); ctx.moveTo(x - 30, 430); ctx.lineTo(x, 430 - h); ctx.lineTo(x + 30, 430); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(224,242,254,0.5)'; ctx.lineWidth = 2; ctx.stroke(); }
      for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(240,249,255,0.7)'; ctx.fillRect((i * 71 + t * 12 * (1 + i % 3)) % W, (i * 43 + t * 40) % H, 2, 2); }
      break;
    }
    case 'abyss': { // кольца бездны и далёкий огонёк
      for (let i = 0; i < 8; i++) { ctx.strokeStyle = `rgba(167,139,250,${0.5 - i * 0.05})`; ctx.lineWidth = 2 + (i % 2); ctx.beginPath(); ctx.ellipse(cx, 240, 40 + i * 54 + Math.sin(t * 1.4 - i) * 6, 14 + i * 20, 0, 0, 7); ctx.stroke(); }
      glow(cx, 240, 70, '#000', 0.9);
      glow(cx, 232, 40, acc, 0.2 + Math.sin(t * 3) * 0.05);
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(cx, 236, 3, 0, 7); ctx.fill();
      break;
    }
    case 'light': { // Огонь разгорается
      const k = Math.min(1, 0.3 + t * 0.06);
      glow(cx, 280, 340 * k, acc, 0.55);
      for (let i = 0; i < 40; i++) { const a = i * 2.4 + t * 0.5, r = 60 + ((t * 30 + i * 23) % 260); ctx.fillStyle = `rgba(253,230,138,${0.7 - r / 400})`; ctx.fillRect(cx + Math.cos(a) * r, 280 + Math.sin(a) * r * 0.7, 2, 2); }
      const g = ctx.createRadialGradient(cx, 300, 2, cx, 300, 60 * k + Math.sin(t * 12) * 3); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, '#fbbf24'); g.addColorStop(1, 'rgba(234,88,12,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 50 * k, 340); ctx.quadraticCurveTo(cx - 60 * k, 260, cx, 190 - 30 * k); ctx.quadraticCurveTo(cx + 60 * k, 260, cx + 50 * k, 340); ctx.closePath(); ctx.fill();
      break;
    }
    case 'name': { // волны голоса и имя
      for (let i = 0; i < 9; i++) { ctx.strokeStyle = `rgba(196,181,253,${0.55 - i * 0.055})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, 250, ((t * 70 + i * 36) % 340), 0, 7); ctx.stroke(); }
      const letters = 'А Л Ь М А Р';
      ctx.save(); ctx.globalAlpha = Math.min(1, t * 0.35); ctx.font = `bold 54px ${FONT_SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ede9fe'; ctx.shadowColor = acc; ctx.shadowBlur = 24; ctx.fillText(tr(letters), cx, 250); ctx.restore();
      break;
    }
    case 'dark': { // чёрный огонь
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + t * 0.4; ctx.strokeStyle = `rgba(225,29,72,${0.5})`; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 60, 270 + Math.sin(a) * 40); ctx.quadraticCurveTo(cx + Math.cos(a + 0.5) * 150, 270 + Math.sin(a + 0.5) * 100, cx + Math.cos(a + 0.2) * 230, 270 + Math.sin(a + 0.2) * 150); ctx.stroke(); }
      glow(cx, 270, 90, '#000', 1);
      glow(cx, 270, 60 + Math.sin(t * 5) * 4, acc, 0.35);
      ctx.fillStyle = '#05010a'; ctx.beginPath(); ctx.arc(cx, 270, 46, 0, 7); ctx.fill();
      break;
    }
  }
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
function renderStory() {
  uiButtons = [];
  const S = storyUI;
  if (!S) { state = run && run.live ? 'play' : 'title'; return; }
  const page = S.pages[S.i];
  drawStoryScene(page.scene, S.t);
  // нижняя панель с текстом
  const py = H - 220;
  const g = ctx.createLinearGradient(0, py, 0, H); g.addColorStop(0, 'rgba(3,2,6,0)'); g.addColorStop(0.25, 'rgba(3,2,6,0.9)'); g.addColorStop(1, 'rgba(3,2,6,0.97)');
  ctx.fillStyle = g; ctx.fillRect(0, py, W, H - py);
  centerText(page.title, W / 2, py + 62, `bold 24px ${FONT_SERIF}`, '#f1e3b8', 12, 4);
  const full = tr(page.text), n = Math.min(full.length, Math.floor(S.t * STORY_CPS));
  wrapText(full.slice(0, n), W / 2, py + 100, 760, 26, `italic 17px ${FONT_SERIF}`, '#e7e1d0', 'center');
  for (let i = 0; i < S.pages.length; i++) { ctx.fillStyle = i === S.i ? '#d6a23a' : '#3a3542'; ctx.fillRect(W / 2 - S.pages.length * 8 + i * 16, H - 40, 10, 4); }
  const done = n >= full.length;
  if (done) centerText(Math.floor(time * 2) % 2 ? 'Enter — дальше' : '', W / 2, H - 22, `11px ${FONT_SANS}`, '#8a8494');
  rightText('Esc — пропустить', W - 30, H - 22, `10px ${FONT_SANS}`, '#4a4452');
}

// ---------- СОБЫТИЯ-РАЗВИЛКИ ----------
function drawEventArt(art, cx, cy) {
  ctx.save(); ctx.translate(cx, cy);
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 78); g.addColorStop(0, 'rgba(46,38,64,0.95)'); g.addColorStop(1, 'rgba(8,6,14,0.95)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 76, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8a7240'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(214,162,58,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.stroke();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const dark = '#1a1522', stone = '#59526a';
  switch (art) {
    case 'well': ctx.fillStyle = stone; ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 10, 38, 16, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.ellipse(0, 8, 28, 10, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(94,234,212,0.6)'; ctx.lineWidth = 1.6; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(0, 8, 8 + ((time * 14 + i * 9) % 18), 3 + ((time * 5 + i * 3) % 7), 0, 0, 7); ctx.stroke(); } ctx.strokeStyle = '#6b5a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-34, 6); ctx.lineTo(-34, -34); ctx.lineTo(34, -34); ctx.lineTo(34, 6); ctx.stroke(); break;
    case 'figure': ctx.fillStyle = '#2a2438'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 48); ctx.quadraticCurveTo(-34, -6, -14, -26); ctx.quadraticCurveTo(0, -38, 14, -26); ctx.quadraticCurveTo(34, -6, 30, 48); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.ellipse(0, -18, 12, 14, 0, 0, 7); ctx.fill(); glowEyes(0, -18, 5, 1.8, '#fbbf24'); glow(34, 20, 22, '#fbbf24', 0.5); ctx.fillStyle = '#fbbf24'; ctx.fillRect(31, 14, 6, 9); break;
    case 'altar': ctx.fillStyle = stone; ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.fillRect(-38, 6, 76, 30); ctx.strokeRect(-38, 6, 76, 30); ctx.fillRect(-30, -6, 60, 12); ctx.strokeRect(-30, -6, 60, 12); glow(0, -22, 30, '#e11d48', 0.55 + Math.sin(time * 5) * 0.1); ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, -22, 14, 7, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(0, -22, 4, 0, 7); ctx.fill(); break;
    case 'mirror': ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 7; ctx.fillStyle = '#0a1620'; ctx.beginPath(); ctx.ellipse(0, 0, 32, 50, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(186,230,253,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(10, 20); ctx.stroke(); glowEyes(0, -4, 8, 3, '#7dd3fc'); break;
    case 'scroll': ctx.fillStyle = '#e7d9b0'; ctx.strokeStyle = '#4a3a1a'; ctx.lineWidth = 2.6; ctx.fillRect(-34, -30, 68, 60); ctx.strokeRect(-34, -30, 68, 60); ctx.fillStyle = '#c9b47a'; ctx.beginPath(); ctx.ellipse(-34, 0, 6, 30, 0, 0, 7); ctx.ellipse(34, 0, 6, 30, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(74,58,26,0.7)'; ctx.lineWidth = 1.8; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-24, -20 + i * 11); ctx.lineTo(24 - (i % 2) * 10, -20 + i * 11); ctx.stroke(); } break;
    case 'chest': ctx.fillStyle = '#5a3a1c'; ctx.strokeStyle = '#1c0e04'; ctx.lineWidth = 3; ctx.fillRect(-38, -4, 76, 38); ctx.strokeRect(-38, -4, 76, 38); ctx.fillStyle = '#6e4723'; ctx.beginPath(); ctx.moveTo(-38, -4); ctx.quadraticCurveTo(0, -48, 38, -4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d6a23a'; ctx.fillRect(-7, -6, 14, 18); ctx.fillRect(-38, 8, 76, 5); ctx.fillStyle = '#e11d48'; ctx.fillRect(-4, 2, 8, 8); break;
    case 'dice': for (const [x, y, r] of [[-16, 6, -0.3], [18, -4, 0.4]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = '#f4eed8'; ctx.strokeStyle = '#241d10'; ctx.lineWidth = 3; ctx.fillRect(-18, -18, 36, 36); ctx.strokeRect(-18, -18, 36, 36); ctx.fillStyle = '#1a1408'; for (const [dx, dy] of (x < 0 ? [[-8, -8], [8, 8], [0, 0]] : [[-8, -8], [8, -8], [-8, 8], [8, 8]])) { ctx.beginPath(); ctx.arc(dx, dy, 3.4, 0, 7); ctx.fill(); } ctx.restore(); } break;
    case 'bell': ctx.save(); ctx.rotate(Math.sin(time * 2.4) * 0.14); ctx.fillStyle = '#d6a23a'; ctx.strokeStyle = '#2a1a02'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -40); ctx.quadraticCurveTo(-34, -6, -42, 28); ctx.lineTo(42, 28); ctx.quadraticCurveTo(34, -6, 12, -40); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a1a02'; ctx.beginPath(); ctx.arc(0, 32, 7, 0, 7); ctx.fill(); ctx.restore(); break;
    case 'fountain': ctx.fillStyle = stone; ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 24, 42, 14, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.ellipse(0, 22, 32, 9, 0, 0, 7); ctx.fill(); ctx.strokeStyle = stone; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, -22); ctx.stroke(); ctx.strokeStyle = '#be123c'; ctx.lineWidth = 3; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(s * 22, -34, s * 28, 14); ctx.stroke(); } break;
    case 'child': ctx.fillStyle = '#d6cfb4'; ctx.strokeStyle = '#2a2414'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-14, 46); ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(14, 46); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12, 12, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1408'; ctx.beginPath(); ctx.arc(-4, -12, 1.6, 0, 7); ctx.arc(4, -12, 1.6, 0, 7); ctx.fill(); glow(24, 6, 22, '#fbbf24', 0.6); ctx.fillStyle = '#fef3c7'; ctx.fillRect(21, 8, 6, 14); ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.ellipse(24, 4, 3, 6 + Math.sin(time * 9), 0, 0, 7); ctx.fill(); break;
    case 'anvil': ctx.fillStyle = '#4b5563'; ctx.strokeStyle = '#0b0f17'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, -12); ctx.lineTo(40, -12); ctx.lineTo(24, 2); ctx.lineTo(18, 8); ctx.lineTo(22, 30); ctx.lineTo(-22, 30); ctx.lineTo(-18, 8); ctx.lineTo(-24, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); glow(0, -12, 28, '#fb923c', 0.35); ctx.fillStyle = '#fb923c'; ctx.fillRect(-12, -16, 24, 4); break;
    case 'fire': glow(0, 10, 70, '#f59e0b', 0.55); { const f = 1 + Math.sin(time * 10) * 0.08; const gg = ctx.createRadialGradient(0, 14, 2, 0, 14, 44 * f); gg.addColorStop(0, '#fffbe0'); gg.addColorStop(0.4, '#fbbf24'); gg.addColorStop(0.8, '#ea580c'); gg.addColorStop(1, 'rgba(127,29,29,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-26, 34); ctx.quadraticCurveTo(-34, -6, 0, -50 * f); ctx.quadraticCurveTo(34, -6, 26, 34); ctx.closePath(); ctx.fill(); } break;
    default: break;
  }
  ctx.restore();
}
function renderEvent() {
  uiButtons = [];
  renderGame();
  ctx.fillStyle = 'rgba(4,3,8,0.84)'; ctx.fillRect(0, HUD_H, W, H - HUD_H);
  const inst = evUI;
  if (!inst) { state = 'play'; return; }
  const ev = inst.ev, px = 90, py = HUD_H + 18, pw = W - 180, ph = H - HUD_H - 36;
  ctx.fillStyle = 'rgba(14,11,22,0.96)'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = ev.final ? '#fbbf24' : '#8a7240'; ctx.lineWidth = 2; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.strokeStyle = 'rgba(214,162,58,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(px + 7.5, py + 7.5, pw - 15, ph - 15);
  drawEventArt(ev.art, px + 110, py + 108);
  const tx = px + 220, tw = pw - 250;
  leftText(ev.title, tx, py + 40, `bold ${ev.final ? 26 : 24}px ${FONT_SERIF}`, ev.final ? '#fbbf24' : '#f1e3b8');
  ctx.strokeStyle = '#8a6d3b'; ctx.beginPath(); ctx.moveTo(tx, py + 56); ctx.lineTo(tx + tw, py + 56); ctx.stroke();
  wrapText(ev.text, tx, py + 84, tw, 22, `italic 15px ${FONT_SERIF}`, '#e7d9b0');
  if (inst.phase === 'choose') {
    ev.choices.forEach((c, i) => {
      const lab = typeof c.label === 'function' ? c.label(inst) : c.label, ok = eventChoiceAvailable(inst, c);
      const y = py + 232 + i * 56, x = px + 40, w = pw - 80, h = 46;
      const b = { x, y, w, h, action: () => { inst.sel = i; eventChoose(i); } };
      uiButtons.push(b);
      const hot = inst.sel === i || hovered(b);
      ctx.fillStyle = !ok ? 'rgba(10,8,16,0.6)' : hot ? 'rgba(214,162,58,0.16)' : 'rgba(12,10,18,0.85)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = !ok ? '#2e2a36' : hot ? '#d6a23a' : '#4a4452'; ctx.lineWidth = hot && ok ? 2 : 1.2; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      leftText(`${i + 1}.`, x + 14, y + h / 2, `bold 15px ${FONT_SERIF}`, ok ? '#d6a23a' : '#4a4452');
      const sub = c.sub ? c.sub(inst) : '';
      leftText(lab, x + 40, y + (ok && !sub ? h / 2 : h / 2 - 8), `bold 15px ${FONT_SERIF}`, !ok ? '#5b5666' : hot ? '#fff7e0' : '#d6d3d1');
      if (sub) leftText(sub, x + 40, y + h / 2 + 11, `11px ${FONT_SANS}`, '#fb7185');
      if (!ok && c.condText) leftText(c.condText, x + 40, y + h / 2 + 11, `11px ${FONT_SANS}`, '#a14a4a');
    });
    centerText('W/S — выбор · Enter или 1–4 — решить', W / 2, H - 24, `11px ${FONT_SANS}`, '#5b5666');
  } else {
    ctx.fillStyle = 'rgba(214,162,58,0.06)'; ctx.fillRect(px + 40, py + 220, pw - 80, 150);
    ctx.strokeStyle = 'rgba(214,162,58,0.3)'; ctx.strokeRect(px + 40.5, py + 220.5, pw - 81, 149);
    const label = typeof ev.choices[inst.chosen].label === 'function' ? ev.choices[inst.chosen].label(inst) : ev.choices[inst.chosen].label;
    leftText('› ' + tr(label), px + 56, py + 244, `bold 13px ${FONT_SERIF}`, '#a8845a');
    wrapText(inst.result, px + 56, py + 282, pw - 112, 24, `italic 17px ${FONT_SERIF}`, '#f1e3b8');
    drawButton(ev.final ? 'Завершить' : 'Продолжить (Enter)', W / 2 - 130, py + ph - 70, 260, 44, () => closeEvent(), true, '#fbbf24');
  }
}

// ---------- ШЛЯПНИК ----------
function drawTopHat(x, y, lift, hot) {
  const dy = -lift * 52;
  ctx.save(); ctx.translate(x, y + dy);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 36 - dy, 38, 8, 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(-26, 0, 26, 0); g.addColorStop(0, '#2b2438'); g.addColorStop(0.5, '#3c3350'); g.addColorStop(1, '#16121f');
  ctx.fillStyle = g; ctx.strokeStyle = hot ? '#fbbf24' : '#000'; ctx.lineWidth = hot ? 3 : 2.2;
  ctx.fillRect(-24, -36, 48, 56); ctx.strokeRect(-24, -36, 48, 56);
  ctx.beginPath(); ctx.ellipse(0, 20, 40, 10, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7c3aed'; ctx.fillRect(-24, 2, 48, 8);
  ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.ellipse(0, -36, 24, 6, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function renderHatter() {
  uiButtons = [];
  renderGame();
  const S = Hat.s;
  if (!S) { state = 'play'; return; }
  ctx.fillStyle = 'rgba(4,3,8,0.88)'; ctx.fillRect(0, HUD_H, W, H - HUD_H);
  const h = S.h;
  // стол
  const tx = 150, ty = 218, tw = W - 300, th = 216;
  const fg = ctx.createLinearGradient(0, ty, 0, ty + th); fg.addColorStop(0, '#2a0f1c'); fg.addColorStop(1, '#14060d');
  ctx.fillStyle = fg; ctx.fillRect(tx, ty, tw, th);
  ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 3; ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
  ctx.strokeStyle = 'rgba(214,162,58,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(tx + 8.5, ty + 8.5, tw - 17, th - 17);
  // Шляпник
  ctx.save(); ctx.translate(250, 160); ctx.scale(1.9, 1.9);
  drawHatter({ hatter: { x: 0, y: 0, done: false } }, true);
  ctx.restore();
  // реплика
  const bx = 330, by = HUD_H + 40, bw = 520;
  ctx.fillStyle = 'rgba(12,8,18,0.92)'; ctx.fillRect(bx, by, bw, 62);
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 61);
  wrapText(S.line, bx + bw / 2, by + 24, bw - 30, 20, `italic 15px ${FONT_SERIF}`, '#ddd6fe', 'center');
  // шляпы и шарик
  const lifted = S.phase === 'show' || S.phase === 'reveal';
  for (const ht of S.hats) {
    const slot = ht.slot;
    if (S.phase !== 'intro' && S.phase !== 'result' && S.phase !== 'knife') {
      if (ht.id === S.ballHat && (S.phase === 'show' || S.phase === 'reveal' || S.phase === 'shuffle' || S.phase === 'pick')) {
        // шарик под шляпой — виден, пока шляпа поднята
        const vis = lifted ? 1 : 0;
        if (vis) { ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ht.x, ht.y + 26, 10, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(ht.x - 3, ht.y + 22, 3, 0, 7); ctx.fill(); }
      }
    }
    const hot = S.phase === 'pick' && S.sel === slot;
    if (S.phase === 'pick') uiButtons.push({ x: ht.x - 40, y: ht.y - 40, w: 80, h: 80, action: () => { S.sel = slot; hatterPick(slot); } });
    drawTopHat(ht.x, ht.y, ht.lift, hot);
    if (S.phase === 'reveal' && ht.id === S.picked) { ctx.strokeStyle = S.win ? '#86efac' : '#fca5a5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ht.x, ht.y - ht.lift * 52 - 4, 46, 0, 7); ctx.stroke(); }
  }
  // нижняя панель: ставка, серебро, кнопки
  drawPickupSprite('silver', W - 168, HUD_H + 20, 1);
  leftText(`${player.silver}`, W - 154, HUD_H + 20, `bold 15px ${FONT_SANS}`, '#e5e7eb');
  leftText(`Раунд ${Math.min(3, h.rounds + (S.phase === 'intro' || S.phase === 'result' ? 1 : 0))} из 3`, 160, ty + th + 22, `bold 13px ${FONT_SERIF}`, '#a78bfa');
  const fee = h.fee;
  if (S.phase === 'intro' || S.phase === 'result') {
    if (S.phase === 'result') {
      centerText(S.win ? `Победа! ${S.reward}` : 'Не угадал…', W / 2, ty + th + 22, `bold 15px ${FONT_SERIF}`, S.win ? '#86efac' : '#fca5a5');
    }
    const canPlay = !h.done && player.silver >= fee;
    if (!h.done) drawButton(`Играть за ${fee} сер. (Enter)`, W / 2 - 250, H - 90, 250, 44, () => hatterPlay(), true, '#fbbf24', `bold 15px ${FONT_SERIF}`, !canPlay);
    drawButton(h.done ? 'Попрощаться' : 'Уйти (Esc)', W / 2 + (h.done ? -110 : 20), H - 90, h.done ? 220 : 230, 44, () => hatterLeave(), h.done, '#d6a23a', `bold 15px ${FONT_SERIF}`);
    if (!h.done && !canPlay) centerText('Не хватает серебра', W / 2 - 125, H - 104, `11px ${FONT_SANS}`, '#fca5a5');
  } else if (S.phase === 'pick') centerText('Где шарик? A/D + Enter, клавиши 1–3 или щелчок мышью', W / 2, ty + th + 22, `bold 14px ${FONT_SERIF}`, '#fde68a');
  else if (S.phase === 'shuffle') centerText('Следи за шляпой…', W / 2, ty + th + 22, `italic 14px ${FONT_SERIF}`, '#a78bfa');
  // нож
  if (S.phase === 'knife' && S.knife > 0) {
    const k = clamp(S.knife / 0.45, 0, 1);
    const sx = 250, sy = 170, ex = player.x, ey = clamp(player.y, HUD_H + 60, H - 40);
    const kx = lerp(sx, ex, k), ky = lerp(sy, ey, k), a = Math.atan2(ey - sy, ex - sx);
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(a + k * 6.28 * 2);
    ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(22, 0); ctx.lineTo(-14, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3a1e'; ctx.fillRect(-26, -3, 12, 6); ctx.restore();
    if (S.knife > 0.45) { ctx.fillStyle = `rgba(185,28,28,${Math.max(0, 0.6 - (S.knife - 0.45))})`; ctx.fillRect(0, HUD_H, W, H - HUD_H); centerText('ЧИРК!', W / 2, H / 2, `bold 52px ${FONT_SERIF}`, '#fecaca', 16, 6); }
  }
}

// ---------- ВВОД ДЛЯ ЭКРАНОВ ui2 ----------
function handleKey2(code) {
  switch (state) {
    case 'achievements': {
      const pages = Math.ceil(ACHIEVEMENTS.length / ACH_PAGE), h = horizDelta(code);
      if (h) { achPage = (achPage + h + pages) % pages; Snd.play('select'); }
      else if (code === 'Escape' || code === 'Enter') state = 'title';
      break;
    }
    case 'bestiary': {
      const pages = Math.ceil(BESTIARY_ALL.length / BEST_PAGE), h = horizDelta(code), v = navDelta(code);
      if (h) bestSel = clamp(bestSel + h, 0, BESTIARY_ALL.length - 1);
      else if (v) bestSel = clamp(bestSel + v * BEST_COLS, 0, BESTIARY_ALL.length - 1);
      else if (code === 'Escape' || code === 'Enter') state = 'title';
      bestPage = Math.floor(bestSel / BEST_PAGE);
      if (h || v) Snd.play('select');
      break;
    }
    case 'stats':
      if (code === 'Escape' || code === 'Enter') state = 'title';
      break;
    case 'seed': {
      if (code === 'Escape') { state = 'title'; break; }
      if (code === 'Enter' || code === 'NumpadEnter') { seedContinue(); break; }
      if (code === 'Tab') { seedInput = randomSeedCode(); Snd.play('select'); break; }
      if (code === 'Backspace') { seedInput = seedInput.slice(0, -1); Snd.play('select'); break; }
      const ch = lastKeyChar;
      if (ch && ch.length === 1 && /[A-Za-z0-9А-Яа-яЁё]/.test(ch) && seedInput.length < 12) { seedInput = normSeed(seedInput + ch); Snd.play('select'); }
      break;
    }
    case 'story':
      if (code === 'Escape') storyFinish();
      else if (isConfirm(code)) storyAdvance();
      break;
    case 'event': {
      const inst = evUI;
      if (!inst) { state = 'play'; break; }
      if (inst.phase === 'choose') {
        const n = inst.ev.choices.length, v = navDelta(code);
        if (v) { inst.sel = (inst.sel + v + n) % n; Snd.play('select'); }
        else if (code === 'Enter' || code === 'Space' || code === 'NumpadEnter') eventChoose(inst.sel);
        else if (/^Digit[1-9]$/.test(code) && +code.slice(5) <= n) eventChoose(+code.slice(5) - 1);
      } else if (isConfirm(code)) closeEvent();
      break;
    }
    case 'hatter': {
      const S = Hat.s;
      if (!S) { state = 'play'; break; }
      if (S.phase === 'intro' || S.phase === 'result') {
        if (code === 'Escape') hatterLeave();
        else if (isConfirm(code)) { if (S.h.done) hatterLeave(); else hatterPlay(); }
      } else if (S.phase === 'pick') {
        const h = horizDelta(code);
        if (h) { S.sel = clamp(S.sel + h, 0, 2); Snd.play('select'); }
        else if (code === 'Enter' || code === 'Space') hatterPick(S.sel);
        else if (code === 'Digit1' || code === 'Digit2' || code === 'Digit3') hatterPick(+code.slice(5) - 1);
      }
      break;
    }
  }
}
