'use strict';
/* =====================================================================
   DUNGEON: глубины, комнаты, планировки, препятствия, коллизии
   Символы: . пусто | R руины/колонна | P урна (разбивается) | X пропасть | S шипы | F жаровня
   ===================================================================== */
const FLOORS = [
  null,
  { name: 'СКЛЕП', sub: 'Тишина тех, кто не ушёл', floor: ['#2a2c35', '#1d1f27', '#101218'], wall: '#16171d', wall2: '#272a35', accent: '#8b9bb4', dark: 0.78, theme: 'crypt' },
  { name: 'ЗАТОПЛЕННЫЙ ХРАМ', sub: 'Колокола под водой', floor: ['#1b3036', '#13232a', '#0a1519'], wall: '#0f1f24', wall2: '#1d3a42', accent: '#5eead4', dark: 0.80, theme: 'temple' },
  { name: 'ОССУАРИЙ', sub: 'Счёт мёртвых', floor: ['#3a3226', '#2a2419', '#17130d'], wall: '#221d14', wall2: '#41382a', accent: '#d6c9a3', dark: 0.82, theme: 'ossuary' },
  { name: 'БАГРОВЫЙ САД', sub: 'Цветы без солнца', floor: ['#341a24', '#240f18', '#12060b'], wall: '#240f17', wall2: '#47202f', accent: '#fb7185', dark: 0.83, theme: 'garden' },
  { name: 'ЛЕДЯНОЙ НЕКРОПОЛЬ', sub: 'Холод, который ждёт', floor: ['#243241', '#182330', '#0b121b'], wall: '#121c28', wall2: '#2a3f56', accent: '#a5d8ff', dark: 0.84, theme: 'necropolis' },
  { name: 'БЕЗДНА', sub: 'Дно, которого нет', floor: ['#1e1228', '#150b1d', '#08040d'], wall: '#120a1a', wall2: '#2a1740', accent: '#a78bfa', dark: 0.88, theme: 'abyss' }
];

// Альтернативные облики глубин: на каждой из 1–5 в спуске выпадает один из двух
const FLOOR_ALTS = {
  1: { id: 'chapel', name: 'ЗАБРОШЕННАЯ ЧАСОВНЯ', sub: 'Свечи горят без рук', floor: ['#2f2a2c', '#211c1f', '#111011'], wall: '#1e1819', wall2: '#352a2b', accent: '#fcd34d', dark: 0.75, theme: 'chapel',
    bias: { archer: 1.5, beetle: 1.7, ghoul: 0.8, bat: 0.9 } },
  2: { id: 'plague', name: 'ЧУМНЫЕ КАТАКОМБЫ', sub: 'Воздух, которым нельзя дышать', floor: ['#2b3320', '#1e2516', '#10140a'], wall: '#161c0f', wall2: '#2c3a1d', accent: '#a3e635', dark: 0.80, theme: 'plague',
    bias: { spider: 2, sporepod: 2.3, flesh: 1.7, hand: 1.4, weeper: 0.7, leech: 0.6 } },
  3: { id: 'foundry', name: 'ЗАБЫТАЯ ЛИТЕЙНАЯ', sub: 'Горн остыл, но жар остался', floor: ['#3a2b24', '#2a1d18', '#150e0b'], wall: '#251512', wall2: '#4b2c1f', accent: '#fb923c', dark: 0.79, theme: 'foundry', pit: 'lava',
    bias: { gargoyle: 2.2, hound: 1.6, cultist: 1.3, worm: 0.5, bat: 0.7 } },
  4: { id: 'scriptorium', name: 'СКРИПТОРИЙ', sub: 'Книги, которые читают тебя', floor: ['#2e2a3a', '#211e2d', '#110f18'], wall: '#18141f', wall2: '#2f2842', accent: '#c4b5fd', dark: 0.83, theme: 'scriptorium',
    bias: { cultist: 2.2, necro: 2, weeper: 2, chorister: 2, shade: 1.5, golem: 0.6 } },
  5: { id: 'grotto', name: 'КРИСТАЛЬНЫЕ ГРОТЫ', sub: 'Лёд, что помнит свет', floor: ['#1f3a3f', '#142a2f', '#0a181b'], wall: '#0f2024', wall2: '#1f444c', accent: '#67e8f9', dark: 0.84, theme: 'grotto',
    bias: { frostcaster: 2.2, abyssal: 1.4, thornroot: 0.4, knight: 1.4, golem: 1.4 } }
};
const themeIdx = n => ((Math.max(1, n) - 1) % MAX_FLOOR) + 1;
// Определение глубины n с учётом выпавшего варианта
function floorDef(n) {
  const i = themeIdx(n), alt = FLOOR_ALTS[i];
  if (alt && run) {
    if (!run.fv) run.fv = {};
    if (run.fv[n] === undefined) run.fv[n] = (hashStr((run.seedStr || 'x') + 'fv' + n) % 2) === 1;
    if (run.fv[n]) return alt;
  }
  return FLOORS[i];
}

const EMPTY_LAYOUT = Array(ROWS).fill('.'.repeat(COLS));

const NORMAL_LAYOUTS = [
  EMPTY_LAYOUT,
  ['.................', '.................', '..RR.........RR..', '..R...........R..', '.................', '..R...........R..', '..RR.........RR..', '.................', '.................'],
  ['.................', '.................', '...R.........R...', '.................', '.......RRR.......', '.................', '...R.........R...', '.................', '.................'],
  ['.................', '.................', '.....XXXXXXX.....', '.....X.....X.....', '.....X..P..X.....', '.....X.....X.....', '.....XXXXXXX.....', '.................', '.................'],
  ['.................', '..P...........P..', '.................', '......P...P......', '.................', '......P...P......', '.................', '..P...........P..', '.................'],
  ['.................', '.................', '..S.....R.....S..', '.................', '...R.S.....S.R...', '.................', '..S.....R.....S..', '.................', '.................'],
  ['.................', '...RRRR.....RRRR.', '.................', '.................', '..RR.........RR..', '.................', '.................', '.RRRR.....RRRR...', '.................'],
  ['.................', '.................', '..R..R..R..R..R..', '.................', '..R..R..R..R..R..', '.................', '..R..R..R..R..R..', '.................', '.................'],
  ['.................', '.................', '.......X.X.......', '.......X.X.......', '.................', '.......X.X.......', '.......X.X.......', '.................', '.................'],
  ['.................', '.RRR.........RRR.', '.R.............R.', '.................', '.......X.X.......', '.................', '.R.............R.', '.RRR.........RRR.', '.................'],
  ['.................', '.................', '...S.S.S.S.S.S...', '.................', '...S.S.S.S.S.S...', '.................', '...S.S.S.S.S.S...', '.................', '.................'],
  ['.................', '.................', '.................', '......XXXXX......', '......X...X......', '......XXXXX......', '.................', '.................', '.................'],
  ['.................', '.................', '.....P.....P.....', '.................', '.......RRR.......', '.................', '.....P.....P.....', '.................', '.................'],
  ['.................', '.R...............', '..R.............R', '...R...........R.', '.................', '.R.............R.', '..............R..', '.............R...', '.................'],
  ['.................', '..P.R.......R.P..', '.................', '.R.............R.', '.......S.S.......', '.R.............R.', '.................', '..P.R.......R.P..', '.................'],
  // с жаровнями (источники света)
  ['.................', '.F.............F.', '.................', '.................', '.................', '.................', '.................', '.F.............F.', '.................'],
  ['.................', '.................', '..R....F.F....R..', '.................', '.................', '.................', '..R....F.F....R..', '.................', '.................'],
  ['.................', '.................', '.................', '.......P.P.......', '......PFRFP......', '.......P.P.......', '.................', '.................', '.................'],
  ['.................', '.F.............F.', '..P...........P..', '.................', '.......SSS.......', '.................', '..P...........P..', '.F.............F.', '.................'],
  // v2.0: урны, скамьи, жёлоба
  ['.................', '..P.P.P.P.P.P.P..', '.................', '.................', '.P.............P.', '.................', '.................', '..P.P.P.P.P.P.P..', '.................'],
  ['.................', '.R.R.R.....R.R.R.', '.................', '.................', '.......P.P.......', '.................', '.................', '.R.R.R.....R.R.R.', '.................'],
  ['.................', '.................', '.XXXXXX...XXXXXX.', '.................', '.................', '.................', '.XXXXXX...XXXXXX.', '.................', '.................'],
  ['.................', '.F.............F.', '.P.R.........R.P.', '.................', '.................', '.................', '.P.R.........R.P.', '.F.............F.', '.................']
];
const DARK_LAYOUTS = NORMAL_LAYOUTS.filter(L => !L.some(r => r.includes('F')));
const BOSS_LAYOUTS = [NORMAL_LAYOUTS[0], NORMAL_LAYOUTS[0], NORMAL_LAYOUTS[15], NORMAL_LAYOUTS[1]];

const roomKey = (gx, gy) => `${gx},${gy}`;

function makeRoom(gx, gy, type) {
  return {
    gx, gy, type, doors: {}, cleared: false, visited: false, populated: false,
    enemies: [], tiles: null, pickups: [], peds: [], splatters: [], spawnCells: [],
    waves: [], waveDelay: 0, stair: null, portal: null, dist: 0, rune: {}
  };
}

function connectRooms(a, b, d, opts = {}) {
  a.doors[d.name] = { to: roomKey(b.gx, b.gy), locked: !!opts.locked, hidden: !!opts.hidden, reveal: 0 };
  b.doors[d.opp] = { to: roomKey(a.gx, a.gy), locked: !!opts.locked, hidden: !!opts.hidden, reveal: 0 };
}

// ---------- ГЕНЕРАЦИЯ ГЛУБИНЫ ----------
function tryGenerate(num) {
  const target = clamp(Math.round(6 + num * 1.3 + rnd(0, 2)), 7, 14);
  const cells = new Map();
  const start = makeRoom(0, 0, 'start');
  cells.set('0,0', start);
  let guard = 0;
  while (cells.size < target && guard++ < 600) {
    const par = pick([...cells.values()]);
    const d = pick(DIRS);
    const nx = par.gx + d.dx, ny = par.gy + d.dy;
    if (Math.abs(nx) > 4 || Math.abs(ny) > 3) continue;
    const k = roomKey(nx, ny);
    if (cells.has(k)) continue;
    let n = 0;
    for (const dd of DIRS) if (cells.has(roomKey(nx + dd.dx, ny + dd.dy))) n++;
    if (n !== 1) continue;
    const rm = makeRoom(nx, ny, 'normal');
    cells.set(k, rm);
    connectRooms(par, rm, d);
  }
  if (cells.size < target) return null;

  const q = [start]; start.dist = 0;
  const seen = new Set(['0,0']);
  while (q.length) {
    const r = q.shift();
    for (const dn in r.doors) {
      const nr = cells.get(r.doors[dn].to);
      if (!seen.has(roomKey(nr.gx, nr.gy))) { seen.add(roomKey(nr.gx, nr.gy)); nr.dist = r.dist + 1; q.push(nr); }
    }
  }

  const dead = [...cells.values()].filter(r => r.type === 'normal' && Object.keys(r.doors).length === 1);
  if (dead.length < 3) return null;
  dead.sort((a, b) => b.dist - a.dist);
  const boss = dead[0];
  boss.type = 'boss';
  const rest = shuffle(dead.slice(1));
  rest[0].type = 'treasure';
  rest[1].type = 'shop';
  if (rest[2] && num >= 2 && chance(0.8)) rest[2].type = 'shrine';
  const treasure = rest[0];

  // секретная комната: пустая клетка с >=2 соседями-обычными комнатами
  const cand = new Map();
  for (const rm of cells.values()) {
    if (rm.type !== 'normal' && rm.type !== 'start') continue;
    for (const d of DIRS) {
      const nx = rm.gx + d.dx, ny = rm.gy + d.dy, k = roomKey(nx, ny);
      if (cells.has(k) || Math.abs(nx) > 4 || Math.abs(ny) > 3) continue;
      if (!cand.has(k)) cand.set(k, { gx: nx, gy: ny, nb: [] });
      cand.get(k).nb.push({ rm, d });
    }
  }
  let best = [...cand.values()].filter(c => c.nb.length >= 2);
  if (!best.length) best = [...cand.values()].filter(c => c.nb.length >= 1 && c.nb.some(n => n.rm.type === 'normal'));
  if (best.length) {
    const mx = Math.max(...best.map(c => c.nb.length));
    const c = pick(best.filter(c => c.nb.length === mx));
    const sr = makeRoom(c.gx, c.gy, 'secret');
    cells.set(roomKey(c.gx, c.gy), sr);
    for (const n of c.nb) connectRooms(n.rm, sr, n.d, { hidden: true });
  }

  // комнаты-развилки и испытания (v2.0)
  const pool = shuffle([...cells.values()].filter(r => r.type === 'normal' && r.dist >= 2));
  if (pool.length && chance(num === 1 ? 0.7 : 0.92)) pool.pop().type = 'event';
  if (pool.length && num >= 2 && chance(0.72)) {
    const tr = pool.pop();
    tr.type = 'trial'; tr.trialKind = pick(['dark', 'siege', 'hunt']);
  }
  const normals = [...cells.values()].filter(r => r.type === 'normal');
  if (num >= 2) {
    for (const dn in treasure.doors) {
      const d = DIR_BY_NAME[dn];
      treasure.doors[dn].locked = true;
      cells.get(treasure.doors[dn].to).doors[d.opp].locked = true;
    }
    if (normals.length) pick(normals).keyDrop = true;
  }
  if (normals.length) pick(normals).noteDrop = true;
  return cells;
}

function generateFloor(num) {
  let cells = null;
  for (let i = 0; i < 80 && !cells; i++) cells = tryGenerate(num);
  if (cells) {
    const types = [...cells.values()].map(r => r.type);
    if (types.filter(t => t === 'boss').length !== 1) cells = null;
  }
  if (!cells) {
    cells = new Map();
    const chain = ['start', 'normal', 'normal', 'treasure', 'normal', 'shop', 'boss'];
    let prev = null;
    chain.forEach((type, i) => {
      const rm = makeRoom(i, 0, type);
      cells.set(roomKey(i, 0), rm);
      if (prev) connectRooms(prev, rm, DIR_BY_NAME.r);
      prev = rm;
    });
  }
  grid = cells;
  const start = grid.get('0,0');
  start.cleared = true; start.visited = true;
  populateRoom(start, { x: CX, y: CY });
  return start;
}

// ---------- ТАЙЛЫ ----------
function tileAt(rm, c, r) {
  if (!rm || !rm.tiles || c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
  return rm.tiles[r][c];
}
function tileAtPos(rm, x, y) { return tileAt(rm, tileCol(x), tileRow(y)); }

function emptyTiles() {
  const t = [];
  for (let r = 0; r < ROWS; r++) t.push(new Array(COLS).fill(null));
  return t;
}

function applyLayout(rm, layout, flipH, flipV) {
  rm.tiles = emptyTiles();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const sr = flipV ? ROWS - 1 - r : r, sc = flipH ? COLS - 1 - c : c;
      const ch = layout[sr][sc];
      if (ch === '.' || !ch) continue;
      rm.tiles[r][c] = { t: ch, hp: ch === 'P' ? 2 : 1, v: Math.floor(Math.random() * 4), crack: Math.random() > 0.5, shake: 0 };
    }
  }
}

function analyzeLayout(rm) {
  const seen = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const doorCells = [];
  for (const dn in rm.doors) { const d = DIR_BY_NAME[dn]; doorCells.push({ c: d.c, r: d.r }); }
  if (!doorCells.length) doorCells.push({ c: 8, r: 4 });
  const blocked = (c, r) => { const t = rm.tiles[r][c]; return !!t && t.t !== 'S'; };
  for (const dc of doorCells) if (blocked(dc.c, dc.r)) return false;
  const stack = [doorCells[0]];
  seen[doorCells[0].r][doorCells[0].c] = true;
  while (stack.length) {
    const { c, r } = stack.pop();
    for (const d of DIRS) {
      const nc = c + d.dx, nr = r + d.dy;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || seen[nr][nc] || blocked(nc, nr)) continue;
      seen[nr][nc] = true;
      stack.push({ c: nc, r: nr });
    }
  }
  for (const dc of doorCells) if (!seen[dc.r][dc.c]) return false;
  rm.spawnCells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!seen[r][c]) continue;
      const t = rm.tiles[r][c];
      if (t && t.t === 'S') continue;
      if (doorCells.some(dc => Math.abs(dc.c - c) + Math.abs(dc.r - r) <= 2)) continue;
      rm.spawnCells.push({ c, r });
    }
  }
  return rm.spawnCells.length > 3;
}

function buildTiles(rm, layouts) {
  for (let i = 0; i < 12; i++) {
    applyLayout(rm, pick(layouts), chance(0.5), chance(0.5));
    if (analyzeLayout(rm)) return;
  }
  applyLayout(rm, EMPTY_LAYOUT, false, false);
  analyzeLayout(rm);
}

// Разрушение препятствия (бомб больше нет — работают склянки, парирование, ярость)
function destroyTile(rm, c, r) {
  const t = tileAt(rm, c, r);
  if (!t || t.t === 'X' || t.t === 'S' || t.t === 'F') return;
  const x = tileX(c), y = tileY(r);
  spawnParticles(x, y, t.t === 'P' ? 10 : 12, t.t === 'P' ? '#a16207' : '#94a3b8');
  rm.tiles[r][c] = null;
  Snd.play(t.t === 'P' ? 'poop' : 'hit');
  if (t.t === 'P') {
    if (chance(luckChance(0.62, 0.02))) spawnPickup(rm, rollDrop(), x, y);
    if (chance(luckChance(0.14, 0.01))) spawnPickup(rm, rollDrop(), x + rnd(-8, 8), y + rnd(-8, 8));
  }
}
function hitUrn(rm, c, r) {
  const t = tileAt(rm, c, r);
  if (!t || t.t !== 'P') return;
  t.hp -= 1;
  t.shake = 0.15;
  spawnParticles(tileX(c), tileY(r), 4, '#a16207');
  Snd.play('poop');
  if (t.hp <= 0) destroyTile(rm, c, r);
}
function clearTilesNear(rm, x, y, radius) {
  if (!rm.tiles) return;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (rm.tiles[r][c] && Math.hypot(tileX(c) - x, tileY(r) - y) < radius) rm.tiles[r][c] = null;
    }
  }
}

// ---------- ДВИЖЕНИЕ С КОЛЛИЗИЯМИ ----------
function moveWithCollisions(ent, nx, ny) {
  nx = clamp(nx, PLAY.x + ent.r, PLAY.x + PLAY.w - ent.r);
  ny = clamp(ny, PLAY.y + ent.r, PLAY.y + PLAY.h - ent.r);
  if (!ent.fly && curRoom && curRoom.tiles) {
    for (let pass = 0; pass < 2; pass++) {
      const c0 = tileCol(nx), r0 = tileRow(ny);
      for (let r = r0 - 1; r <= r0 + 1; r++) {
        for (let c = c0 - 1; c <= c0 + 1; c++) {
          const t = tileAt(curRoom, c, r);
          if (!t || t.t === 'S') continue;
          const x0 = PLAY.x + c * TILE + 1, y0 = PLAY.y + r * TILE + 1, x1 = x0 + TILE - 2, y1 = y0 + TILE - 2;
          const px = clamp(nx, x0, x1), py = clamp(ny, y0, y1);
          const dx = nx - px, dy = ny - py, d2 = dx * dx + dy * dy;
          if (d2 < ent.r * ent.r) {
            if (d2 > 1e-6) {
              const d = Math.sqrt(d2), push = ent.r - d;
              nx += dx / d * push; ny += dy / d * push;
            } else {
              const l = nx - x0, rr = x1 - nx, tp = ny - y0, bt = y1 - ny, m = Math.min(l, rr, tp, bt);
              if (m === l) nx = x0 - ent.r; else if (m === rr) nx = x1 + ent.r; else if (m === tp) ny = y0 - ent.r; else ny = y1 + ent.r;
            }
          }
        }
      }
    }
    nx = clamp(nx, PLAY.x + ent.r, PLAY.x + PLAY.w - ent.r);
    ny = clamp(ny, PLAY.y + ent.r, PLAY.y + PLAY.h - ent.r);
  }
  ent.x = nx; ent.y = ny;
}

// ---------- ЗАСЕЛЕНИЕ КОМНАТ ----------
const ENEMY_BUDGET = floor => (3.9 + floor * 1.4 + rnd(0, 2.6)) * (1 + 0.1 * burdenLevel()) * runMod('budget');

function pickEnemyTypes(floor, budget) {
  const avail = Object.keys(ENEMY_DEFS).filter(t => ENEMY_DEFS[t].minFloor <= floor && ENEMY_DEFS[t].weight > 0);
  const list = [];
  let tries = 0;
  while (budget > 0.4 && list.length < 9 && tries++ < 40) {
    const t = wpick(avail, k => enemyWeight(k));
    const c = ENEMY_DEFS[t].cost;
    if (c <= budget + 0.6 || !list.length) {
      list.push(t); budget -= c;
      if (ENEMY_DEFS[t].pack && budget > 0) { list.push(t); budget -= c * 0.6; }
    }
  }
  return list;
}

function enemySpawnPoint(rm, entry) {
  const cells = rm.spawnCells;
  if (!cells.length) return { x: CX + rnd(-100, 100), y: CY + rnd(-80, 80) };
  for (let minD = 230; minD >= 0; minD -= 70) {
    const ok = shuffle(cells.slice()).find(cl => {
      const x = tileX(cl.c), y = tileY(cl.r);
      if (Math.hypot(x - entry.x, y - entry.y) < minD) return false;
      for (const e of rm.enemies) if (Math.hypot(e.x - x, e.y - y) < 60) return false;
      return true;
    });
    if (ok) return { x: tileX(ok.c) + rnd(-10, 10), y: tileY(ok.r) + rnd(-10, 10) };
  }
  const cl = pick(cells);
  return { x: tileX(cl.c), y: tileY(cl.r) };
}

function spawnEnemyGroup(rm, types, entry, opts = {}) {
  for (const t of types) {
    const def = ENEMY_DEFS[t];
    const pt = enemySpawnPoint(rm, entry);
    const elite = opts.elite || (floorNum >= 3 && !def.noElite && chance(0.06 + floorNum * 0.012 + burdenLevel() * 0.04 + runMod('elite', 0)));
    rm.enemies.push(makeEnemy(t, pt.x, pt.y, floorNum, { elite }));
  }
}

function makePed(relic, x, y, price = 0, cur = 'silver', group = 0) {
  return { kind: 'relic', x, y, r: 18, item: relic, price, cur, taken: false, lock: 0.6, group, warn: 0 };
}
function makePickupPed(pk, x, y, price) {
  return { kind: 'pickup', pk, x, y, r: 16, price, cur: 'silver', taken: false, lock: 0.6, group: 0, warn: 0 };
}

function populateRoom(rm, entry) {
  rm.populated = true;
  rm.enemies = [];
  switch (rm.type) {
    case 'normal': {
      buildTiles(rm, NORMAL_LAYOUTS);
      let types = pickEnemyTypes(floorNum, ENEMY_BUDGET(floorNum));
      if (player && player.fl.swarm && types.length) types.push(pick(types), pick(types));
      if (types.length >= 4 && chance(0.35)) {
        const half = Math.ceil(types.length / 2);
        rm.waves = [types.slice(half)];
        types = types.slice(0, half);
      }
      spawnEnemyGroup(rm, types, entry);
      if (rm.keyDrop) spawnPickup(rm, 'key', CX + rnd(-30, 30), CY + rnd(-20, 20));
      if (rm.noteDrop || chance(0.05)) spawnPickup(rm, 'note', CX + rnd(-60, 60), CY + rnd(-40, 40));
      break;
    }
    case 'boss': {
      buildTiles(rm, BOSS_LAYOUTS);
      rm.enemies.push(makeBoss(floorNum, rm.bossId));
      break;
    }
    case 'event': {
      buildTiles(rm, [EMPTY_LAYOUT, NORMAL_LAYOUTS[1], NORMAL_LAYOUTS[2], NORMAL_LAYOUTS[14]]);
      rm.event = chooseEvent(floorNum);
      rm.cleared = true;
      break;
    }
    case 'trial': {
      const kind = rm.trialKind || 'siege';
      rm.trial = { kind };
      if (kind === 'dark') {
        buildTiles(rm, DARK_LAYOUTS);
        const n = 3 + (floorNum >= 4 ? 1 : 0) + (burdenLevel() > 1 ? 1 : 0);
        const types = []; for (let i = 0; i < n; i++) types.push('shade');
        types.push('bat', 'bat');
        spawnEnemyGroup(rm, types, entry);
      } else if (kind === 'siege') {
        buildTiles(rm, NORMAL_LAYOUTS);
        const b = ENEMY_BUDGET(floorNum) * 0.78;
        spawnEnemyGroup(rm, pickEnemyTypes(floorNum, b), entry);
        rm.waves = [pickEnemyTypes(floorNum, b), pickEnemyTypes(floorNum, b * 1.1)];
      } else {
        buildTiles(rm, NORMAL_LAYOUTS);
        const pool = Object.keys(ENEMY_DEFS).filter(k => ENEMY_DEFS[k].minFloor <= floorNum && ENEMY_DEFS[k].weight > 0 && !ENEMY_DEFS[k].noElite && !ENEMY_DEFS[k].immobile && ENEMY_DEFS[k].cost >= 1.5);
        const lead = pick(pool);
        spawnEnemyGroup(rm, [lead], entry, { elite: true });
        const big = rm.enemies[rm.enemies.length - 1];
        if (big) { big.hp *= 1.5; big.maxHp = big.hp; big.name = ENEMY_DEFS[lead].name; }
        spawnEnemyGroup(rm, pickEnemyTypes(floorNum, ENEMY_BUDGET(floorNum) * 0.45), entry);
      }
      break;
    }
    case 'treasure': {
      buildTiles(rm, [EMPTY_LAYOUT]);
      const n = 1 + Save.upgrade('memory');
      const picked = [];
      for (let i = 0; i < n; i++) picked.push(rollRelic('treasure', null, picked));
      const gap = 120, x0 = CX - (n - 1) * gap / 2;
      picked.forEach((it, i) => rm.peds.push(makePed(it, x0 + i * gap, CY, 0, 'silver', n > 1 ? 1 : 0)));
      rm.cleared = true;
      break;
    }
    case 'shop': {
      buildTiles(rm, [EMPTY_LAYOUT]);
      const xs = [-208, -104, 0, 104, 208];
      const a = rollRelic('shop', false);
      const b = chance(0.35) ? rollRelic('shop', true) : rollRelic('shop', false, [a]);
      rm.peds.push(makePed(a, CX + xs[0], CY, relicPrice(a)));
      rm.peds.push(makePed(b, CX + xs[1], CY, relicPrice(b)));
      rm.peds.push(makePickupPed('potion', CX + xs[2], CY, 18));
      rm.peds.push(makePickupPed('flask', CX + xs[3], CY, 12));
      rm.peds.push(makePickupPed('key', CX + xs[4], CY, 15));
      rm.cleared = true;
      break;
    }
    case 'shrine': {
      buildTiles(rm, [EMPTY_LAYOUT]);
      rm.shrine = { x: CX, y: CY, r: 30, used: false };
      rm.cleared = true;
      break;
    }
    case 'secret': {
      buildTiles(rm, [EMPTY_LAYOUT]);
      if (chance(0.45)) rm.peds.push(makePed(rollRelic('secret'), CX, CY));
      else {
        const n = rndInt(4, 6);
        for (let i = 0; i < n; i++) spawnPickup(rm, rollDrop(true), CX + rnd(-110, 110), CY + rnd(-60, 60));
        spawnPickup(rm, 'chest', CX, CY - 40);
      }
      if (chance(0.7)) spawnPickup(rm, 'note', CX + 120, CY + 40);
      if (chance(0.34)) rm.hatter = { x: CX - 190, y: CY - 10, rounds: 0, fee: 1, done: false, met: false };
      rm.cleared = true;
      break;
    }
    case 'altar': {
      buildTiles(rm, [EMPTY_LAYOUT]);
      const xs = [-130, 0, 130];
      for (let i = 0; i < 3; i++) {
        const it = rollRelic('altar', false);
        const cost = Math.round(player.maxHp * (it.q >= 4 ? 0.28 : 0.18) / 5) * 5;
        rm.peds.push(makePed(it, CX + xs[i], CY, cost, 'blood'));
      }
      rm.cleared = true;
      break;
    }
    default: { // start
      buildTiles(rm, [EMPTY_LAYOUT]);
      rm.cleared = true;
    }
  }
  if (rm.enemies.length === 0 && rm.waves.length === 0) rm.cleared = true;
}

// Алтарь крови (вне основной сетки)
function makeAltarRoom(backRoom) {
  const rm = makeRoom(99, 99, 'altar');
  rm.doors = {};
  rm.backRoom = backRoom;
  populateRoom(rm, { x: CX, y: CY });
  rm.visited = true;
  rm.portal = { x: CX, y: PLAY.y + PLAY.h - 60, r: 22, kind: 'back', target: backRoom };
  return rm;
}

// Арена режима «Выживание»: одна комната без дверей
const ARENA_LAYOUTS = [
  EMPTY_LAYOUT,
  ['.................', '.................', '...R.........R...', '.................', '.......F.F.......', '.................', '...R.........R...', '.................', '.................'],
  ['.................', '..P...........P..', '.................', '.....R.....R.....', '.................', '.....R.....R.....', '.................', '..P...........P..', '.................'],
  ['.................', '.F.............F.', '.................', '.......RRR.......', '.................', '.......RRR.......', '.................', '.F.............F.', '.................'],
  ['.................', '.................', '.R.....P.P.....R.', '.................', '.......F.F.......', '.................', '.R.....P.P.....R.', '.................', '.................']
];
function makeArenaRoom() {
  const rm = makeRoom(0, 0, 'arena');
  rm.populated = true;
  rm.cleared = false;
  rm.visited = true;
  applyLayout(rm, pick(ARENA_LAYOUTS), chance(0.5), chance(0.5));
  if (!analyzeLayout(rm)) { applyLayout(rm, EMPTY_LAYOUT, false, false); analyzeLayout(rm); }
  rm.arena = { wave: 0, state: 'prep', t: 3.2, kills0: 0 };
  return rm;
}
