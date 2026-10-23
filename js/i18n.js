'use strict';
/* =====================================================================
   I18N: русский (оригинал) и английский. Весь текст в игре написан по-русски и
   переводится в момент отрисовки функцией tr() через словарь EN и шаблоны EN_PAT.
   Словарь английских строк лежит в js/i18n_en.js.
   ===================================================================== */
let LANG = 'ru';
const EN = {};                 // точные соответствия: русская строка -> английская
const EN_PAT = [];             // шаблоны с подстановкой: [RegExp, английский шаблон, длина русского текста]
let _patDirty = false;
const TR_MISS = new Set();     // непереведённые строки (для тестов покрытия)
const _trCache = new Map();
const CYR = /[А-Яа-яЁё]/;

function trAdd(map) { Object.assign(EN, map); }
// '{}' в русском шаблоне — любая подстрока; в английском {} подставляет захваты по порядку, {1},{2} — по номеру
function trPat(ru, en) {
  const esc = ru.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\}/g, '(.+?)');
  EN_PAT.push([new RegExp('^' + esc + '$'), en, ru.length]);
  _patDirty = true;
}
function tr(s) {
  if (LANG === 'ru' || typeof s !== 'string' || s.length === 0) return s;
  const hit = EN[s];
  if (hit !== undefined) return hit;
  if (!CYR.test(s)) return s;
  const c = _trCache.get(s);
  if (c !== undefined) return c;
  if (_patDirty) { EN_PAT.sort((a, b) => b[2] - a[2]); _patDirty = false; } // сначала самые конкретные шаблоны
  for (let i = 0; i < EN_PAT.length; i++) {
    const m = EN_PAT[i][0].exec(s);
    if (!m) continue;
    let n = 0;
    const out = EN_PAT[i][1].replace(/\{(\d*)\}/g, (_, k) => {
      const v = m[k ? +k : ++n];
      return v === undefined ? '' : (CYR.test(v) ? tr(v) : v);
    });
    if (_trCache.size > 600) _trCache.clear();
    _trCache.set(s, out);
    return out;
  }
  TR_MISS.add(s);
  return s;
}
// многострочные подсказки и т. п. переводятся построчно
const trl = arr => arr.map(tr);

function detectLang() {
  try {
    const l = (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) || 'ru';
    return /^ru|^uk|^be/i.test(l) ? 'ru' : 'en';
  } catch (e) { return 'ru'; }
}
function setLang(l) {
  LANG = l === 'en' ? 'en' : 'ru';
  _trCache.clear();
  try {
    cfg().lang = LANG;
    if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = LANG;
    if (typeof document !== 'undefined') document.title = LANG === 'en' ? 'The Last Lantern — descent into the Abyss' : 'Последний Фонарь — спуск в Бездну';
  } catch (e) { /* ignore */ }
  Save.store();
}
(function initLang() {
  const l = cfg().lang || detectLang();
  LANG = l === 'en' ? 'en' : 'ru';
  try { if (typeof document !== 'undefined') { if (document.documentElement) document.documentElement.lang = LANG; document.title = LANG === 'en' ? 'The Last Lantern — descent into the Abyss' : 'Последний Фонарь — спуск в Бездну'; } } catch (e) { /* ignore */ }
})();
