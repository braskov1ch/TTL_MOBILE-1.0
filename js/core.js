'use strict';
/* =====================================================================
   ПОСЛЕДНИЙ ФОНАРЬ — CORE
   Холст, константы, утилиты, ввод, сохранение, глобальное состояние
   ===================================================================== */
const cvs = document.getElementById('game');
let ctx = cvs.getContext('2d'); // Renderer target; mobile renders directly into its own viewport.

// ===== ГЕОМЕТРИЯ КОМНАТЫ =====
const HUD_H = 44;                 // высота верхней панели
const WALL = 38;                  // толщина стен
const TILE = 52;                  // размер клетки
const COLS = 17, ROWS = 9;        // размер игровой сетки
const PLAY = { x: WALL, y: HUD_H + WALL, w: COLS * TILE, h: ROWS * TILE };
const W = PLAY.w + WALL * 2;      // 960
const H = HUD_H + PLAY.h + WALL * 2; // 588
cvs.width = W; cvs.height = H;
const CX = PLAY.x + PLAY.w / 2, CY = PLAY.y + PLAY.h / 2;
const DOOR_W = 96;
const MAX_FLOOR = 6;
const VERSION = '2.0';
const COPYRIGHT = '(с) ev1lbr1tan .2026';

const tileX = c => PLAY.x + c * TILE + TILE / 2;
const tileY = r => PLAY.y + r * TILE + TILE / 2;
const tileCol = x => Math.floor((x - PLAY.x) / TILE);
const tileRow = y => Math.floor((y - PLAY.y) / TILE);

// направления: позиция двери на стене
const DIRS = [
  { name: 'u', dx: 0, dy: -1, opp: 'd', x: CX, y: PLAY.y, c: 8, r: 0 },
  { name: 'd', dx: 0, dy: 1, opp: 'u', x: CX, y: PLAY.y + PLAY.h, c: 8, r: ROWS - 1 },
  { name: 'l', dx: -1, dy: 0, opp: 'r', x: PLAY.x, y: CY, c: 0, r: 4 },
  { name: 'r', dx: 1, dy: 0, opp: 'l', x: PLAY.x + PLAY.w, y: CY, c: COLS - 1, r: 4 }
];
const DIR_BY_NAME = {}; for (const d of DIRS) DIR_BY_NAME[d.name] = d;

// Держим игровую логику в исходных 960×588 единицах, масштабируем только отображение.
const mobileInput = {
  active: false, moveX: 0, moveY: 0, aimX: 1, aimY: 0,
  aiming: false, attack: false, skill: false, lastTouch: 0
};
function touchAvailable() {
  const forced = typeof location !== 'undefined' && /(?:\?|&)touch=1(?:&|$)/.test(location.search || '');
  return forced || !!((typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
}
function fitCanvas() {
  const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const touch = touchAvailable();
  // В мобильном режиме основной Canvas только рендерит игровую сцену.
  // Её видимая камера, HUD и управление находятся в отдельном UI.
  if (touch) {
    cvs.style.width = W + 'px';
    cvs.style.height = H + 'px';
    cvs.style.marginTop = '0';
  } else {
    const scale = Math.max(0.1, Math.min((width - 16) / W, (height - 16) / H, 2));
    cvs.style.width = Math.floor(W * scale) + 'px';
    cvs.style.height = Math.floor(H * scale) + 'px';
    cvs.style.marginTop = '0';
  }
  if (document.body && document.body.classList) {
    document.body.classList.toggle('mobile-mode', touch);
    document.body.classList.toggle('mobile-portrait', touch && height > width);
  }
}
window.addEventListener('resize', fitCanvas);
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitCanvas);
fitCanvas();

// ===== УТИЛИТЫ =====
const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const chance = p => Math.random() < p;
const angDiff = (a, b) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function wpick(arr, wfn) {
  let total = 0;
  for (const a of arr) total += wfn(a);
  let r = Math.random() * total;
  for (const a of arr) { r -= wfn(a); if (r <= 0) return a; }
  return arr[arr.length - 1];
}
// Удача сдвигает вероятности событий
function luckChance(base, perLuck = 0.03) {
  const l = (typeof player !== 'undefined' && player) ? player.luck : 0;
  return clamp(base + l * perLuck, 0, 0.95);
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ===== СИДЫ: детерминированная генерация мира =====
function seededRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// На время fn Math.random заменяется детерминированным генератором (мир строится одинаково у всех)
function withSeed(seed, fn) {
  const prev = Math.random;
  Math.random = seededRng(seed);
  try { return fn(); } finally { Math.random = prev; }
}
const SEED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomSeedCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)];
  return s;
}
const normSeed = str => String(str || '').toUpperCase().replace(/[^A-Z0-9А-ЯЁ]/g, '').slice(0, 12);
function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ===== ШРИФТЫ =====
const FONT_SERIF = 'Georgia, "Palatino Linotype", "Times New Roman", serif';
const FONT_MONO = '"Consolas", "Courier New", monospace';
const FONT_SANS = '"Segoe UI", Tahoma, Arial, sans-serif';

// ===== СОСТОЯНИЕ =====
// title | camp | settings | chronicle | relics | help | achievements | bestiary | stats | seed |
// play | pause | dead | win | event | hatter | story
let state = 'title';
let run = null;            // сводка текущего спуска
let floorNum = 1;
let grid = new Map();      // "x,y" -> комната
let curRoom = null;
let player = null;
let shots = [];            // снаряды героя и спутников
let eBullets = [];         // снаряды врагов
let thrown = [];           // летящие склянки
let zones = [];            // зоны на полу: огонь, святилище
let traps = [];            // капканы
let hazards = [];          // телеграфируемые угрозы: круги, лучи, зоны тьмы
let particles = [];
let fxs = [];              // кольца, молнии, вспышки
let pops = [];             // числа урона
let floatText = null;      // подбор реликвии
let banner = null;         // баннер глубины/босса
let message = null;        // короткая подсказка
let shake = 0;
let time = 0;
let roomTransition = 0;
let hurtFlash = 0;         // красная вспышка при уроне

// ===== ВВОД =====
const keys = {};
const mouse = { x: W / 2, y: H / 2, down: false, right: false, active: false };
const shootStack = [];     // стрелки: запасной способ целиться
let lastKeyChar = '';      // символ последней нажатой клавиши (ввод сида)
const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

window.addEventListener('keydown', e => {
  if (ARROWS.includes(e.code) || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  lastKeyChar = e.key || '';
  if (e.repeat && e.code !== 'Backspace') return;
  keys[e.code] = true;
  if (ARROWS.includes(e.code)) {
    const i = shootStack.indexOf(e.code);
    if (i >= 0) shootStack.splice(i, 1);
    shootStack.push(e.code);
  }
  Snd.unlock();
  handleKey(e.code);
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
  const i = shootStack.indexOf(e.code);
  if (i >= 0) shootStack.splice(i, 1);
});
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  shootStack.length = 0;
  mouse.down = false; mouse.right = false;
  mobileInput.moveX = mobileInput.moveY = 0; mobileInput.attack = mobileInput.skill = mobileInput.aiming = false;
  if (state === 'play') state = 'pause';
});
function mouseToCanvas(e) {
  const r = cvs.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
  mouse.active = true;
}
cvs.addEventListener('mousemove', mouseToCanvas);
cvs.addEventListener('mousedown', e => {
  mouseToCanvas(e);
  if (e.button === 0) mouse.down = true;
  if (e.button === 2) mouse.right = true;
  Snd.unlock();
});
window.addEventListener('mouseup', e => {
  if (e.button === 0) mouse.down = false;
  if (e.button === 2) mouse.right = false;
});
cvs.addEventListener('click', e => { if (Date.now() - mobileInput.lastTouch < 700) return; mouseToCanvas(e); handleClick(mouse.x, mouse.y); });
cvs.addEventListener('contextmenu', e => e.preventDefault());

// ===== СОХРАНЕНИЕ =====
const DEFAULT_SAVE = () => ({
  discovered: {}, notes: {}, runs: 0, wins: 0, bestFloor: 0, kills: 0, bestTime: 0, bosses: 0,
  embers: 0, upgrades: {}, heroes: { hunter: true }, wonWith: {}, burdenMax: 0,
  // v2.0
  coins: 0, spent: 0, armed: {}, ach: {}, stats: {}, heroStats: {}, bestiary: {}, bossKills: {},
  endings: {}, daily: {}, survival: { bestWave: 0, bestTime: 0, bestScore: 0, runs: 0 },
  prologue: false, seedsPlayed: 0, ver: '2.0',
  settings: { music: 0.6, sfx: 0.8, bright: 1, shake: 1, numbers: true, burden: 0, lang: '', story: true }
});
const Save = {
  key: 'last_lantern_v1',
  data: DEFAULT_SAVE(),
  load() {
    try {
      const s = localStorage.getItem(this.key);
      if (s) {
        const d = JSON.parse(s), base = DEFAULT_SAVE();
        this.data = Object.assign(base, d);
        this.data.settings = Object.assign(DEFAULT_SAVE().settings, d.settings || {});
        this.data.heroes = Object.assign({ hunter: true }, d.heroes || {});
        this.data.survival = Object.assign(DEFAULT_SAVE().survival, d.survival || {});
        this.data.ver = '2.0';
      }
    } catch (e) { /* ignore */ }
  },
  store() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },
  discover(id) {
    if (this.data.discovered[id]) return false;
    this.data.discovered[id] = true;
    this.store();
    return true;
  },
  // в «чистых» забегах (ежедневный) постоянные улучшения не действуют
  upgrade(id) {
    if (typeof run !== 'undefined' && run && run.pure && run.live) return 0;
    return this.data.upgrades[id] || 0;
  }
};
Save.load();
const cfg = () => Save.data.settings;
