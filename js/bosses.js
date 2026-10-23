'use strict';
/* =====================================================================
   BOSSES: шесть хозяев глубин с собственными паттернами и фазами
   ===================================================================== */
const bd = (k = 1) => Math.round(dmgScale(10) * k);

function bossMinions(e, type) {
  return curRoom.enemies.filter(k => k.owner === e && !k.dead && k.type === type).length;
}
function spawnMinion(e, type, x, y, name) {
  const k = makeEnemy(type, x, y, e.floor, { owner: e, noSpawn: true });
  k.spawnT = 0.5;
  if (name) k.name = name;
  curRoom.enemies.push(k);
  Snd.play('spawn');
  return k;
}

// ---- общий прыжок-«раздавливание» ----
function startJump(e, dur) {
  e.jumping = true; e.jt = 0; e.jdur = dur;
  e.sx = e.x; e.sy = e.y;
  e.tx = clamp(player.x, PLAY.x + e.r, PLAY.x + PLAY.w - e.r);
  e.ty = clamp(player.y, PLAY.y + e.r, PLAY.y + PLAY.h - e.r);
}
function updateJump(e, sdt) {
  e.jt += sdt / e.jdur;
  const k = Math.min(1, e.jt);
  const ease = k * k * (3 - 2 * k);
  e.x = e.sx + (e.tx - e.sx) * ease;
  e.y = e.sy + (e.ty - e.sy) * ease;
  e.jumpH = Math.sin(k * Math.PI) * 120;
  e.untouchable = k > 0.12 && k < 0.9;
  if (e.jt >= 1) {
    e.jumping = false; e.jumpH = 0; e.untouchable = false;
    e.x = e.tx; e.y = e.ty;
    shake = Math.max(shake, 11);
    Snd.play('stomp');
    fxs.push({ type: 'ring', x: e.x, y: e.y, r0: 10, r1: e.r * 1.9, life: 0.35, max: 0.35, color: '#e7e5e4' });
    spawnParticles(e.x, e.y, 22, '#78716c');
    if (Math.hypot(player.x - e.x, player.y - e.y) < e.r + 22 && !player.fly && player.dashing <= 0) hurtPlayer(bd(1.6), e);
    return true;
  }
  return false;
}

const BOSS_DEFS = [null,
  // ---------------- 1. КОСТЯНОЙ ПРИВРАТНИК ----------------
  {
    id: 'warden', name: 'Костяной Привратник', sub: 'Врата склепа не откроются без боя', r: 36, hp: 800, spd: 76, armor: 0.1,
    init(e) { e.state = 'chase'; e.t = 2.2; e.shootT = 1.6; },
    update(e, dt, sdt) {
      e.phase = e.hp < e.maxHp * 0.5 ? 2 : 1;
      if (e.jumping) {
        if (updateJump(e, sdt)) {
          bulletRing(e.x, e.y, e.phase === 2 ? 12 : 8, 195, rnd(0, 1), { dmg: bd(), col: 'bone' });
          e.t = e.phase === 2 ? 1.3 : 2.2;
        }
        return;
      }
      steer(e, angTo(e, player), e.spd * (e.phase === 2 ? 1.35 : 1), dt);
      e.t -= sdt;
      if (e.t <= 0) startJump(e, e.phase === 2 ? 0.6 : 0.8);
      if (e.phase === 2) {
        e.shootT -= sdt;
        if (e.shootT <= 0) {
          e.shootT = 1.6;
          const a = angTo(e, player);
          for (const off of [-0.3, 0, 0.3]) shootBullet(e.x, e.y, a + off, 240, { dmg: bd(), r: 7, col: 'bone' });
        }
      }
    }
  },
  // ---------------- 2. МАТЬ-УТОПЛЕННИЦА ----------------
  {
    id: 'drowned', name: 'Мать-Утопленница', sub: 'Вода помнит каждое имя', r: 40, hp: 1000, spd: 54,
    init(e) { e.state = 'move'; e.t = 2.2; e.shootT = 1.2; e.rot = 0; },
    update(e, dt, sdt) {
      e.phase = e.hp < e.maxHp * 0.5 ? 2 : 1;
      e.t -= sdt;
      e.rot += sdt * (e.state === 'spin' || e.state === 'bounce' ? 9 : 1.5);
      if (e.state === 'move') {
        steer(e, angTo(e, player), e.spd, dt);
        e.shootT -= sdt;
        if (e.shootT <= 0) {
          e.shootT = 2.2;
          const a = angTo(e, player);
          for (let i = -3; i <= 3; i++) shootBullet(e.x, e.y, a + i * 0.2, 105, { dmg: bd(), r: 11, col: 'water' });
        }
        if (e.t <= 0) {
          if (e.phase === 2 && chance(0.5)) { e.state = 'bounce'; e.t = 4; e.fireT = 0; const a = angTo(e, player); e.vx = Math.cos(a) * 300; e.vy = Math.sin(a) * 300; }
          else { e.state = 'spin'; e.t = 3; e.fireT = 0.2; }
        }
      } else if (e.state === 'spin') {
        e.fireT -= sdt;
        if (e.fireT <= 0) {
          e.fireT = 0.85;
          const n = 16, gap = angTo(e, player);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            if (Math.abs(angDiff(a, gap)) < 0.42) continue;
            shootBullet(e.x, e.y, a, 155, { dmg: bd(), col: 'water' });
          }
        }
        if (e.t <= 0) { e.state = 'move'; e.t = 2.6; }
      } else if (e.state === 'bounce') {
        const m = esp(e);
        e.x += e.vx * m * dt; e.y += e.vy * m * dt;
        if (e.x < PLAY.x + e.r) { e.x = PLAY.x + e.r; e.vx = Math.abs(e.vx); shake = Math.max(shake, 5); }
        if (e.x > PLAY.x + PLAY.w - e.r) { e.x = PLAY.x + PLAY.w - e.r; e.vx = -Math.abs(e.vx); shake = Math.max(shake, 5); }
        if (e.y < PLAY.y + e.r) { e.y = PLAY.y + e.r; e.vy = Math.abs(e.vy); shake = Math.max(shake, 5); }
        if (e.y > PLAY.y + PLAY.h - e.r) { e.y = PLAY.y + PLAY.h - e.r; e.vy = -Math.abs(e.vy); shake = Math.max(shake, 5); }
        e.fireT -= sdt;
        if (e.fireT <= 0) { e.fireT = 0.45; bulletRing(e.x, e.y, 5, 145, e.rot, { dmg: bd(), col: 'water' }); }
        if (e.t <= 0) { e.state = 'move'; e.t = 2.2; }
      }
    }
  },
  // ---------------- 3. КОСТЯНОЙ ЖНЕЦ ----------------
  {
    id: 'reaper', name: 'Костяной Жнец', sub: 'Урожай мёртвых не кончается', r: 34, hp: 1250, spd: 58,
    init(e) { e.state = 'idle'; e.t = 1.3; e.dirA = 0; e.ang = 0; e.fireT = 0; },
    update(e, dt, sdt) {
      e.phase = e.hp < e.maxHp * 0.5 ? 2 : 1;
      e.t -= sdt;
      if (e.state === 'idle') {
        steer(e, angTo(e, player), e.spd, dt);
        if (!e.fired && e.t < 0.6) {
          e.fired = true;
          const a = angTo(e, player);
          for (const off of [-0.35, 0, 0.35]) shootBullet(e.x, e.y, a + off, 220, { dmg: bd(), col: 'shadow' });
        }
        if (e.t <= 0) {
          e.fired = false;
          if (e.phase === 2 && chance(0.5)) { e.state = 'spin'; e.t = 2.8; e.fireT = 0; }
          else { e.state = 'aim'; e.t = 0.75; }
        }
      } else if (e.state === 'aim') {
        e.dirA = angTo(e, player);
        if (e.t <= 0) { e.state = 'dash'; e.t = 2; Snd.play('use'); }
      } else if (e.state === 'dash') {
        const sp = 580 * esp(e) * dt;
        e.x += Math.cos(e.dirA) * sp; e.y += Math.sin(e.dirA) * sp;
        const hitWall = e.x < PLAY.x + e.r + 2 || e.x > PLAY.x + PLAY.w - e.r - 2 || e.y < PLAY.y + e.r + 2 || e.y > PLAY.y + PLAY.h - e.r - 2;
        e.x = clamp(e.x, PLAY.x + e.r, PLAY.x + PLAY.w - e.r);
        e.y = clamp(e.y, PLAY.y + e.r, PLAY.y + PLAY.h - e.r);
        if (Math.random() < dt * 40) spawnParticles(e.x, e.y, 1, '#a8a29e');
        if (hitWall || e.t <= 0) {
          e.state = 'stun'; e.t = 1.1;
          shake = Math.max(shake, 10); Snd.play('stomp');
          bulletRing(e.x, e.y, e.phase === 2 ? 14 : 10, 195, rnd(0, 1), { dmg: bd(), col: 'bone' });
        }
      } else if (e.state === 'stun') {
        if (e.t <= 0) { e.state = 'idle'; e.t = 1.0; }
      } else if (e.state === 'spin') {
        steer(e, angTo(e, player), 40, dt);
        e.fireT -= sdt;
        if (e.fireT <= 0) {
          e.fireT = 0.1; e.ang += 0.5;
          shootBullet(e.x, e.y, e.ang, 180, { dmg: bd(), col: 'shadow' });
          shootBullet(e.x, e.y, e.ang + Math.PI, 180, { dmg: bd(), col: 'shadow' });
        }
        if (e.t <= 0) { e.state = 'stun'; e.t = 0.9; }
      }
    }
  },
  // ---------------- 4. ПОЖИРАЮЩИЙ ЦВЕТОК ----------------
  {
    id: 'bloom', name: 'Пожирающий Цветок', sub: 'Он питается светом', r: 38, hp: 1500, spd: 60,
    init(e) { e.state = 'roam'; e.t = 2.2; e.shootT = 0.8; e.dir = 1; e.face = 0; },
    update(e, dt, sdt) {
      e.phase = e.hp < e.maxHp * 0.5 ? 2 : 1;
      e.t -= sdt;
      e.face += angDiff(angTo(e, player), e.face) * Math.min(1, dt * 4);
      if (e.state === 'roam') {
        const d = dist(e, player), a = angTo(e, player);
        if (d < 190) steer(e, a + Math.PI, e.spd, dt);
        else if (d > 300) steer(e, a, e.spd, dt);
        else steer(e, a + Math.PI / 2 * e.dir, e.spd * 0.8, dt);
        e.shootT -= sdt;
        if (e.shootT <= 0) {
          e.shootT = e.phase === 2 ? 0.9 : 1.2;
          for (const off of [-0.25, 0, 0.25]) shootBullet(e.x, e.y, e.face + off, 225, { dmg: bd(), col: 'green' });
        }
        if (e.t <= 0) {
          e.state = 'suck'; e.t = 2.4;
          if (e.phase === 2 && bossMinions(e, 'sporepod') < 3) { spawnMinion(e, 'sporepod', e.x - 60, e.y); spawnMinion(e, 'sporepod', e.x + 60, e.y); }
          Snd.play('use');
        }
      } else if (e.state === 'suck') {
        const a = angTo(player, e);
        player.kx += Math.cos(a) * 780 * dt; player.ky += Math.sin(a) * 780 * dt;
        player.oil = Math.max(0, player.oil - 6 * dt);       // цветок пьёт свет фонаря
        if (Math.random() < dt * 40) {
          const ang = rnd(0, 6.28), rr = rnd(90, 200);
          particles.push({ x: e.x + Math.cos(ang) * rr, y: e.y + Math.sin(ang) * rr, vx: -Math.cos(ang) * rr * 2.2, vy: -Math.sin(ang) * rr * 2.2, r: 2.5, color: '#fbbf24', life: 0.45, maxLife: 0.45 });
        }
        if (e.t <= 0) {
          e.state = 'blast'; e.t = 0.5;
          shake = Math.max(shake, 9); Snd.play('hit');
          const n = e.phase === 2 ? 13 : 9;
          for (let i = 0; i < n; i++) shootBullet(e.x, e.y, e.face + (i - (n - 1) / 2) * 0.13, 245, { dmg: bd(), r: 7, col: 'red' });
          bulletRing(e.x, e.y, 10, 125, rnd(0, 1), { dmg: bd(), col: 'green' });
        }
      } else if (e.state === 'blast') {
        if (e.t <= 0) { e.state = 'roam'; e.t = 3.4; e.dir = pick([-1, 1]); }
      }
    }
  },
  // ---------------- 5. ЛЕДЯНОЙ САРКОФАГ ----------------
  {
    id: 'sarcophagus', name: 'Ледяной Саркофаг', sub: 'Крышка отходит сама', r: 42, hp: 1800, spd: 48, armor: 0.2,
    init(e) { e.state = 'idle'; e.t = 1.6; e.volley = 0; e.doorOpen = 0; },
    update(e, dt, sdt) {
      e.phase = e.hp < e.maxHp * 0.5 ? 2 : 1;
      if (e.doorOpen > 0) e.doorOpen -= dt;
      if (e.jumping) {
        if (updateJump(e, sdt)) { bulletRing(e.x, e.y, e.phase === 2 ? 16 : 12, 180, rnd(0, 1), { dmg: bd(), col: 'ice' }); e.state = 'idle'; e.t = 1.4; }
        return;
      }
      e.t -= sdt;
      if (e.state === 'idle') {
        steer(e, angTo(e, player), e.spd, dt);
        if (e.t <= 0) {
          e.state = pick(['volley', 'door', 'stomp']);
          if (e.state === 'volley') { e.volley = e.phase === 2 ? 4 : 3; e.t = 0.2; }
          else if (e.state === 'door') { e.t = 0.9; e.doorOpen = 1.6; Snd.play('door'); }
          else { e.state = 'idle'; e.t = 9; startJump(e, e.phase === 2 ? 0.65 : 0.85); }
        }
      } else if (e.state === 'volley') {
        if (e.t <= 0) {
          e.t = 0.45; e.volley--;
          const a = angTo(e, player);
          for (let i = -2; i <= 2; i++) shootBullet(e.x, e.y, a + i * 0.2, 235, { dmg: bd(), col: 'ice', r: 6 });
          Snd.play('bolt');
          if (e.volley <= 0) { e.state = 'idle'; e.t = 1.5; }
        }
      } else if (e.state === 'door') {
        if (e.t <= 0) {
          const alive = bossMinions(e, 'hound');
          const want = e.phase === 2 ? 3 : 2;
          for (let i = alive; i < want; i++) spawnMinion(e, 'hound', e.x + rnd(-50, 50), e.y + 60, 'Ледяная гончая');
          bulletRing(e.x, e.y, 10, 135, rnd(0, 1), { dmg: bd(), col: 'ice' });
          e.state = 'idle'; e.t = 1.8;
        }
      }
    }
  },
  // ---------------- 6. БЕЗЫМЯННЫЙ ----------------
  {
    id: 'nameless', name: 'БЕЗЫМЯННЫЙ', sub: 'Тот, кто пел первым', r: 48, hp: 3400, spd: 38,
    init(e) { e.state = 'gap'; e.t = 1.5; e.marks = []; e.last = ''; e.say = null; e.driftT = 0; e.fireT = 0; e.volleys = 0; e.ang = 0; },
    update(e, dt, sdt) {
      e.phase = e.hp < e.maxHp * 0.33 ? 3 : e.hp < e.maxHp * 0.66 ? 2 : 1;
      if (e.say) { e.say.t -= dt; if (e.say.t <= 0) e.say = null; }
      const rate = e.phase === 3 ? 1.4 : e.phase === 2 ? 1.15 : 1;
      e.driftT += sdt;
      const tx = CX + Math.sin(e.driftT * 0.6) * 220, ty = CY - 50 + Math.cos(e.driftT * 0.45) * 60;
      e.x += (tx - e.x) * Math.min(1, dt * 1.2); e.y += (ty - e.y) * Math.min(1, dt * 1.2);

      for (let i = e.marks.length - 1; i >= 0; i--) {   // падающие когти тьмы
        const m = e.marks[i];
        m.t -= sdt;
        if (m.t <= 0) {
          shake = Math.max(shake, 12); Snd.play('stomp');
          fxs.push({ type: 'ring', x: m.x, y: m.y, r0: 8, r1: 64, life: 0.35, max: 0.35, color: '#a78bfa' });
          spawnParticles(m.x, m.y, 18, '#4c1d95');
          bulletRing(m.x, m.y, e.phase === 3 ? 12 : 8, 175, rnd(0, 1), { dmg: bd(), col: 'shadow' });
          if (Math.hypot(player.x - m.x, player.y - m.y) < 60 + player.r * 0.5 && !player.fly && player.dashing <= 0) hurtPlayer(bd(1.7), m);
          e.marks.splice(i, 1);
        }
      }

      e.t -= sdt;
      if (e.state === 'gap') {
        if (e.t <= 0) {
          let opts = e.phase === 1 ? ['claws', 'wail'] : e.phase === 2 ? ['claws', 'wail', 'spiral', 'brood'] : ['claws', 'wail', 'spiral', 'brood', 'claws'];
          opts = opts.filter(o => o !== e.last);
          e.state = pick(opts); e.last = e.state;
          const says = { claws: 'ТЬМА ВЕЧНА', wail: 'Я ПЕЛ ПЕРВЫМ', spiral: 'ГДЕ ТВОЙ ОГОНЬ?', brood: 'ВСТАНЬТЕ, ДЕТИ' };
          e.say = { txt: says[e.state], t: 1.8 };
          if (e.state === 'claws') { e.n = e.phase === 3 ? 5 : 3; e.t = 0.1; }
          else if (e.state === 'wail') { e.volleys = e.phase === 3 ? 5 : 3; e.t = 0.4; }
          else if (e.state === 'spiral') { e.t = 3.2; e.fireT = 0; }
          else { e.t = 0.6; }
          Snd.play('boss_intro');
        }
      } else if (e.state === 'claws') {
        if (e.n > 0 && e.t <= 0) {
          e.n--; e.t = 0.5 / rate;
          const px = e.n % 2 ? player.x + player.vx * 0.4 : player.x;
          const py = e.n % 2 ? player.y + player.vy * 0.4 : player.y;
          e.marks.push({ x: clamp(px, PLAY.x + 40, PLAY.x + PLAY.w - 40), y: clamp(py, PLAY.y + 40, PLAY.y + PLAY.h - 40), t: 0.95 / rate, max: 0.95 / rate });
          Snd.play('spawn');
        }
        if (e.n <= 0 && e.marks.length === 0) { e.state = 'gap'; e.t = 1.2 / rate; }
      } else if (e.state === 'wail') {
        if (e.volleys > 0 && e.t <= 0) {
          e.volleys--; e.t = 0.6 / rate;
          const a = angTo(e, player), n = e.phase === 3 ? 9 : 7;
          for (let i = 0; i < n; i++) shootBullet(e.x, e.y + 20, a + (i - (n - 1) / 2) * 0.17, 225, { dmg: bd(), r: 6, col: 'purple' });
          Snd.play('hit'); shake = Math.max(shake, 4);
        }
        if (e.volleys <= 0 && e.t <= 0) { e.state = 'gap'; e.t = 1.1 / rate; }
      } else if (e.state === 'spiral') {
        e.fireT -= sdt;
        if (e.fireT <= 0) {
          e.fireT = 0.11 / (e.phase === 3 ? 1.3 : 1); e.ang += 0.42;
          const arms = e.phase === 3 ? 3 : 2;
          for (let i = 0; i < arms; i++) shootBullet(e.x, e.y + 10, e.ang + i * Math.PI * 2 / arms, 165, { dmg: bd(), col: 'shadow' });
        }
        if (e.t <= 0) { e.state = 'gap'; e.t = 1.4 / rate; }
      } else if (e.state === 'brood') {
        if (e.t <= 0) {
          const alive = bossMinions(e, 'hound');
          const want = e.phase === 3 ? 3 : 2;
          for (let i = alive; i < want; i++) spawnMinion(e, 'hound', i % 2 ? PLAY.x + 50 : PLAY.x + PLAY.w - 50, rnd(PLAY.y + 80, PLAY.y + PLAY.h - 80), 'Порождение тьмы');
          bulletRing(e.x, e.y, 10, 155, rnd(0, 1), { dmg: bd(), col: 'shadow' });
          e.state = 'gap'; e.t = 1.8 / rate;
        }
      }
    }
  }
];

const BOSS_BY_ID = {};
for (const d of BOSS_DEFS) if (d) BOSS_BY_ID[d.id] = d;

// На каждой глубине может встретиться один из нескольких боссов (пулы заполняются в bosses2.js)
let BOSS_POOL = [null, ['warden'], ['drowned'], ['reaper'], ['bloom'], ['sarcophagus'], ['nameless']];
const BOSS_WEIGHT = { nameless: 3, keeper: 1 };

function pickBossId(floor) {
  const pool = BOSS_POOL[((Math.max(1, floor) - 1) % MAX_FLOOR) + 1];
  return wpick(pool, i => BOSS_WEIGHT[i] || 1);
}

function makeBoss(floor, forceId, hpMul = 1) {
  const d = BOSS_BY_ID[forceId || pickBossId(floor)];
  const hp = d.hp * (1 + 0.15 * burdenLevel()) * runMod('enemyHp') * hpMul;
  const e = {
    isBoss: true, type: d.id, def: d, name: d.name, sub: d.sub, x: CX, y: CY - 30, r: d.r,
    hp, maxHp: hp, spd: d.spd, fly: true, touch: dmgScale(14), mass: 0,
    spawnT: 1.4, fx: newFx(), kx: 0, ky: 0, hitFlash: 0, t: 0, state: '',
    floor, phase: 1, dead: false, untouchable: false, hidden: false, phased: false, jumping: false, jumpH: 0, noElite: true,
    armor: d.armor || 0, gold: 0, rotS: { n: 0, t: 0, tick: 0 }, affix: null
  };
  d.init(e);
  return e;
}
