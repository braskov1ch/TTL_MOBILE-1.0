'use strict';
/* =====================================================================
   BOSSES2: альтернативные хозяева глубин v2.0
   Могильщик · Звонарь · Собиратель костей · Королева Шипов · Вьюга · Первый Хранитель
   ===================================================================== */
const phaseOf2 = e => e.hp < e.maxHp * 0.5 ? 2 : 1;
const edgePt = (x, y) => inPlay(x, y, 40);

BOSS_DEFS.push(
  // ---------------- МОГИЛЬЩИК (глубина 1) ----------------
  {
    id: 'gravedigger', name: 'Могильщик', sub: 'Каждая могила рано или поздно пригодится', r: 34, hp: 880, spd: 72, armor: 0.1,
    init(e) { e.state = 'chase'; e.t = 2; e.spot = null; },
    update(e, dt, sdt) {
      e.phase = phaseOf2(e);
      e.t -= sdt;
      if (e.state === 'chase') {
        steer(e, angTo(e, player), e.spd * (e.phase === 2 ? 1.25 : 1), dt);
        if (e.t <= 0) {
          const opts = ['throw', 'dig', dist(e, player) < 260 ? 'swing' : 'throw'];
          if (e.phase === 2) opts.push('hands', 'dig');
          e.state = pick(opts);
          if (e.state === 'throw') e.t = 0.55;
          else if (e.state === 'dig') {
            e.t = 1.05; e.hidden = true;
            e.spot = edgePt(player.x + player.vx * 0.3, player.y + player.vy * 0.3);
            addHazard({ shape: 'circle', x: e.spot.x, y: e.spot.y, r: 64, warn: 1.0, life: 0.22, dmg: bd(1.6), col: 'earth', owner: e });
            spawnParticles(e.x, e.y, 16, '#78350f'); Snd.play('poop');
          } else if (e.state === 'swing') {
            e.t = 0.62; e.aimA = angTo(e, player);
            addHazard({ shape: 'circle', x: e.x + Math.cos(e.aimA) * 66, y: e.y + Math.sin(e.aimA) * 66, r: 84, warn: 0.6, life: 0.18, dmg: bd(1.4), col: 'bone', owner: e });
          } else if (e.state === 'hands') {
            e.t = 0.7; Snd.play('use');
          }
        }
      } else if (e.state === 'throw') {
        if (e.t <= 0) {
          const a = angTo(e, player), n = e.phase === 2 ? 5 : 3;
          for (let i = 0; i < n; i++) shootBullet(e.x, e.y, a + (i - (n - 1) / 2) * 0.24, 190, { r: 9, col: 'earth', dmg: bd() });
          Snd.play('hit'); e.state = 'chase'; e.t = 1.7;
        }
      } else if (e.state === 'dig') {
        if (e.spot) { const k = Math.min(1, dt * 7); e.x += (e.spot.x - e.x) * k; e.y += (e.spot.y - e.y) * k; }
        if (Math.random() < dt * 30) spawnParticles(e.x, e.y + 8, 1, '#78350f');
        if (e.t <= 0) {
          e.hidden = false; if (e.spot) { e.x = e.spot.x; e.y = e.spot.y; }
          shake = Math.max(shake, 10); Snd.play('stomp');
          bulletRing(e.x, e.y, e.phase === 2 ? 12 : 8, 190, rnd(0, 1), { dmg: bd(), col: 'earth' });
          e.state = 'chase'; e.t = 1.6;
        }
      } else if (e.state === 'swing') {
        if (e.t <= 0) { e.state = 'chase'; e.t = 1.3; shake = Math.max(shake, 6); Snd.play('stomp'); }
      } else if (e.state === 'hands') {
        if (e.t <= 0) {
          const alive = bossMinions(e, 'hand');
          for (let i = alive; i < 3; i++) spawnMinion(e, 'hand', e.x + rnd(-90, 90), e.y + rnd(40, 100), 'Рука из могилы');
          e.state = 'chase'; e.t = 1.5;
        }
      }
    }
  },
  // ---------------- ЗВОНАРЬ (глубина 2) ----------------
  {
    id: 'bellringer', name: 'Звонарь', sub: 'Колокол всегда звонит по кому-то', r: 38, hp: 1050, spd: 44,
    init(e) { e.state = 'idle'; e.t = 1.6; e.n = 0; e.swing = 0; e.fireT = 0; e.curt = 0; e.dirA = 0; },
    update(e, dt, sdt) {
      e.phase = phaseOf2(e);
      e.t -= sdt;
      e.swing += sdt * (e.state === 'rings' ? 5 : 2);
      if (e.state === 'idle') {
        steer(e, angTo(e, player), e.spd, dt);
        if (e.t <= 0) {
          const opts = ['rings', 'curtain'];
          if (e.phase === 2) opts.push('charge', 'choir');
          e.state = pick(opts);
          if (e.state === 'rings') { e.n = e.phase === 2 ? 4 : 3; e.t = 0.5; }
          else if (e.state === 'curtain') { e.t = 3.2; e.curt = 0; e.fireT = 0; }
          else if (e.state === 'charge') { e.t = 0.75; }
          else { e.t = 0.6; }
        }
      } else if (e.state === 'rings') {
        if (e.n > 0 && e.t <= 0) {
          e.n--; e.t = 0.85;
          const gap = angTo(e, player) + (e.n % 2 ? 0.5 : -0.5), cnt = 22;
          for (let i = 0; i < cnt; i++) {
            const a = (i / cnt) * Math.PI * 2;
            if (Math.abs(angDiff(a, gap)) < 0.34) continue;
            shootBullet(e.x, e.y, a, 138, { dmg: bd(), col: 'water', r: 7 });
          }
          Snd.bell(196, 0.16); shake = Math.max(shake, 5);
        }
        if (e.n <= 0 && e.t <= 0) { e.state = 'idle'; e.t = 1.5; }
      } else if (e.state === 'curtain') {
        e.curt += sdt;
        const ty = PLAY.y + 64, tx = CX + Math.sin(e.curt * 1.9) * 330;
        e.x += (tx - e.x) * Math.min(1, dt * 3); e.y += (ty - e.y) * Math.min(1, dt * 3);
        e.fireT -= sdt;
        if (e.fireT <= 0) {
          e.fireT = 0.17;
          shootBullet(e.x, e.y + 30, Math.PI / 2 + rnd(-0.1, 0.1), 195, { dmg: bd(), col: 'water', r: 7 });
          if (e.phase === 2) { shootBullet(e.x - 40, e.y + 30, Math.PI / 2, 175, { dmg: bd(), col: 'water', r: 6 }); shootBullet(e.x + 40, e.y + 30, Math.PI / 2, 175, { dmg: bd(), col: 'water', r: 6 }); }
        }
        if (e.t <= 0) { e.state = 'idle'; e.t = 1.4; }
      } else if (e.state === 'charge') {
        if (e.t > 0) e.dirA = angTo(e, player);
        else {
          const sp = 560 * esp(e) * dt;
          e.x += Math.cos(e.dirA) * sp; e.y += Math.sin(e.dirA) * sp;
          const hit = e.x < PLAY.x + e.r + 2 || e.x > PLAY.x + PLAY.w - e.r - 2 || e.y < PLAY.y + e.r + 2 || e.y > PLAY.y + PLAY.h - e.r - 2;
          e.x = clamp(e.x, PLAY.x + e.r, PLAY.x + PLAY.w - e.r); e.y = clamp(e.y, PLAY.y + e.r, PLAY.y + PLAY.h - e.r);
          e.chg = (e.chg || 0) + dt;
          if (hit || e.chg > 1.6) {
            e.chg = 0; e.state = 'idle'; e.t = 1.5; shake = Math.max(shake, 10);
            Snd.bell(130, 0.2); bulletRing(e.x, e.y, 14, 165, rnd(0, 1), { dmg: bd(), col: 'water' });
          }
        }
      } else if (e.state === 'choir') {
        if (e.t <= 0) {
          const alive = bossMinions(e, 'chorister');
          for (let i = alive; i < 2; i++) spawnMinion(e, 'chorister', i ? PLAY.x + 60 : PLAY.x + PLAY.w - 60, rnd(PLAY.y + 90, PLAY.y + PLAY.h - 90), 'Певчий');
          Snd.bell(262, 0.12); e.state = 'idle'; e.t = 1.8;
        }
      }
    }
  },
  // ---------------- СОБИРАТЕЛЬ КОСТЕЙ (глубина 3) ----------------
  {
    id: 'collector', name: 'Собиратель костей', sub: 'У каждой кости найдётся своё место', r: 36, hp: 1300, spd: 56, armor: 0.15,
    init(e) { e.state = 'idle'; e.t = 1.5; e.n = 0; e.ang = 0; e.fireT = 0; e.rain = 0; },
    update(e, dt, sdt) {
      e.phase = phaseOf2(e);
      e.t -= sdt;
      e.ang += sdt * (e.state === 'wheel' ? 6 : 1.4);
      if (e.state === 'idle') {
        const d = dist(e, player), a = angTo(e, player);
        if (d < 170) steer(e, a + Math.PI, e.spd, dt); else if (d > 300) steer(e, a, e.spd, dt); else steer(e, a + Math.PI / 2, e.spd * 0.5, dt);
        if (e.t <= 0) {
          const opts = ['boom', 'wheel', 'summon'];
          if (e.phase === 2) opts.push('rain', 'boom');
          e.state = pick(opts);
          if (e.state === 'boom') { e.n = e.phase === 2 ? 3 : 2; e.t = 0.5; }
          else if (e.state === 'wheel') { e.t = 3.3; e.fireT = 0; e.sp = rnd(0, 6); }
          else if (e.state === 'summon') { e.t = 0.7; }
          else if (e.state === 'rain') { e.t = 0.6; e.n = 1; }
        }
      } else if (e.state === 'boom') {
        if (e.n > 0 && e.t <= 0) {
          e.n--; e.t = 1.0;
          const a = angTo(e, player);
          for (const off of [-0.32, 0, 0.32]) shootBullet(e.x, e.y, a + off, 270, { dmg: bd(), col: 'bone', r: 8, flip: 0.85, life: 3 });
          Snd.play('bolt');
        }
        if (e.n <= 0 && e.t <= 0) { e.state = 'idle'; e.t = 1.3; }
      } else if (e.state === 'wheel') {
        steer(e, angTo(e, player), 30, dt);
        e.fireT -= sdt;
        if (e.fireT <= 0) {
          e.fireT = 0.09; e.sp += 0.33 + Math.sin(e.t * 2) * 0.1;
          for (let i = 0; i < 3; i++) shootBullet(e.x, e.y, e.sp + i * Math.PI * 2 / 3, 150, { dmg: bd(), col: 'bone', r: 5 });
        }
        if (e.t <= 0) { e.state = 'idle'; e.t = 1.4; }
      } else if (e.state === 'summon') {
        if (e.t <= 0) {
          const alive = bossMinions(e, 'archer');
          for (let i = alive; i < (e.phase === 2 ? 3 : 2); i++) spawnMinion(e, 'archer', e.x + rnd(-80, 80), e.y + rnd(40, 90), 'Костяной помощник');
          e.state = 'idle'; e.t = 1.6;
        }
      } else if (e.state === 'rain') {
        if (e.n > 0 && e.t <= 0) {
          e.n--;
          for (let i = 0; i < 7; i++) {
            const a = rnd(0, 6.28), rr = i ? rnd(40, 180) : 0, pt = edgePt(player.x + Math.cos(a) * rr, player.y + Math.sin(a) * rr);
            addHazard({ shape: 'circle', x: pt.x, y: pt.y, r: 50, warn: 0.85 + i * 0.13, life: 0.2, dmg: bd(1.2), col: 'bone', owner: e });
          }
          e.t = 2.0; Snd.play('use');
        }
        if (e.n <= 0 && e.t <= 0) { e.state = 'idle'; e.t = 1.4; }
      }
    }
  },
  // ---------------- КОРОЛЕВА ШИПОВ (глубина 4) ----------------
  {
    id: 'thornqueen', name: 'Королева Шипов', sub: 'Корона растёт прямо из черепа', r: 38, hp: 1550, spd: 50,
    init(e) { e.state = 'idle'; e.t = 1.6; e.n = 0; e.ang = 0; e.fireT = 0; e.dirA = 0; },
    update(e, dt, sdt) {
      e.phase = phaseOf2(e);
      e.t -= sdt;
      if (e.state === 'idle') {
        steer(e, angTo(e, player), e.spd, dt);
        if (e.t <= 0) {
          const opts = ['roots', 'thorns', 'bloom'];
          if (e.phase === 2) opts.push('lash', 'roots');
          e.state = pick(opts);
          if (e.state === 'roots') { e.t = 0.5; }
          else if (e.state === 'thorns') { e.t = 2.7; e.fireT = 0; }
          else if (e.state === 'bloom') { e.t = 0.7; }
          else if (e.state === 'lash') { e.t = 0.7; }
        }
      } else if (e.state === 'roots') {
        if (e.t <= 0) {
          const px = player.x, py = player.y;
          addHazard({ shape: 'line', x: PLAY.x, y: py, ang: 0, len: PLAY.w, w: 42, warn: 1.05, life: 0.3, dmg: bd(1.2), col: 'green', owner: e });
          addHazard({ shape: 'line', x: px, y: PLAY.y, ang: Math.PI / 2, len: PLAY.h, w: 42, warn: 1.05, life: 0.3, dmg: bd(1.2), col: 'green', owner: e });
          if (e.phase === 2) {
            const sx = px > CX ? -1 : 1;
            addHazard({ shape: 'line', x: PLAY.x, y: clamp(py + 130 * sx, PLAY.y, PLAY.y + PLAY.h), ang: 0, len: PLAY.w, w: 42, warn: 1.3, life: 0.3, dmg: bd(1.2), col: 'green', owner: e });
            addHazard({ shape: 'line', x: clamp(px + 150 * sx, PLAY.x, PLAY.x + PLAY.w), y: PLAY.y, ang: Math.PI / 2, len: PLAY.h, w: 42, warn: 1.3, life: 0.3, dmg: bd(1.2), col: 'green', owner: e });
          }
          Snd.play('trap'); e.state = 'idle'; e.t = 2.1;
        }
      } else if (e.state === 'thorns') {
        e.fireT -= sdt;
        if (e.fireT <= 0) {
          e.fireT = 0.12; e.ang += 0.4;
          const arms = e.phase === 2 ? 3 : 2;
          for (let i = 0; i < arms; i++) shootBullet(e.x, e.y, e.ang + i * Math.PI * 2 / arms, 172, { dmg: bd(), col: 'green', r: 5 });
        }
        if (e.t <= 0) { e.state = 'idle'; e.t = 1.5; }
      } else if (e.state === 'bloom') {
        if (e.t <= 0) {
          const alive = bossMinions(e, 'sporepod');
          for (let i = alive; i < 3; i++) spawnMinion(e, 'sporepod', e.x + rnd(-80, 80), e.y + rnd(30, 80), 'Бутон');
          bulletRing(e.x, e.y, 10, 150, rnd(0, 1), { dmg: bd(), col: 'red' });
          e.state = 'idle'; e.t = 1.8;
        }
      } else if (e.state === 'lash') {
        if (e.t > 0) e.dirA = angTo(e, player);
        else {
          const sp = 480 * esp(e) * dt;
          e.x += Math.cos(e.dirA) * sp; e.y += Math.sin(e.dirA) * sp;
          const hit = e.x < PLAY.x + e.r + 2 || e.x > PLAY.x + PLAY.w - e.r - 2 || e.y < PLAY.y + e.r + 2 || e.y > PLAY.y + PLAY.h - e.r - 2;
          e.x = clamp(e.x, PLAY.x + e.r, PLAY.x + PLAY.w - e.r); e.y = clamp(e.y, PLAY.y + e.r, PLAY.y + PLAY.h - e.r);
          e.chg = (e.chg || 0) + dt;
          if (hit || e.chg > 1.2) { e.chg = 0; e.state = 'idle'; e.t = 1.6; shake = Math.max(shake, 9); Snd.play('stomp'); bulletRing(e.x, e.y, 12, 175, rnd(0, 1), { dmg: bd(), col: 'green' }); }
        }
      }
    }
  },
  // ---------------- ВЬЮГА (глубина 5) ----------------
  {
    id: 'blizzard', name: 'Вьюга', sub: 'Белая тишина перед концом', r: 36, hp: 1850, spd: 60,
    init(e) { e.state = 'idle'; e.t = 1.5; e.n = 0; e.fireT = 0; },
    update(e, dt, sdt) {
      e.phase = phaseOf2(e);
      e.t -= sdt;
      if (e.state === 'idle') {
        steer(e, angTo(e, player) + Math.sin(time * 1.5) * 0.8, e.spd, dt);
        if (e.t <= 0) {
          const opts = ['blink', 'freeze', 'gale'];
          if (e.phase === 2) opts.push('spears', 'blink');
          e.state = pick(opts);
          if (e.state === 'blink') { e.n = e.phase === 2 ? 4 : 3; e.t = 0.1; }
          else if (e.state === 'freeze') { e.t = 0.6; }
          else if (e.state === 'gale') { e.t = 2.6; e.fireT = 0; }
          else if (e.state === 'spears') { e.t = 0.6; }
        }
      } else if (e.state === 'blink') {
        if (e.n > 0 && e.t <= 0) {
          e.n--;
          spawnParticles(e.x, e.y, 14, '#bae6fd');
          for (let tries = 0; tries < 12; tries++) {
            const pt = edgePt(rnd(PLAY.x + 60, PLAY.x + PLAY.w - 60), rnd(PLAY.y + 60, PLAY.y + PLAY.h - 60));
            if (Math.hypot(pt.x - player.x, pt.y - player.y) > 220) { e.x = pt.x; e.y = pt.y; break; }
          }
          spawnParticles(e.x, e.y, 14, '#bae6fd'); Snd.play('shield');
          const a = angTo(e, player), cnt = e.phase === 2 ? 9 : 7;
          for (let i = 0; i < cnt; i++) shootBullet(e.x, e.y, a + (i - (cnt - 1) / 2) * 0.16, 235, { dmg: bd(), col: 'ice', r: 6 });
          e.t = 0.62;
        }
        if (e.n <= 0 && e.t <= 0) { e.state = 'idle'; e.t = 1.4; }
      } else if (e.state === 'freeze') {
        if (e.t <= 0) {
          addHazard({ shape: 'circle', x: player.x, y: player.y, r: 58, warn: 1.0, life: 0.25, dmg: bd(), col: 'ice', slow: true, owner: e });
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + rnd(0, 0.5), pt = edgePt(player.x + Math.cos(a) * 140, player.y + Math.sin(a) * 140);
            addHazard({ shape: 'circle', x: pt.x, y: pt.y, r: 54, warn: 1.1 + i * 0.1, life: 0.25, dmg: bd(), col: 'ice', slow: true, owner: e });
          }
          Snd.play('use'); e.state = 'idle'; e.t = 2.2;
        }
      } else if (e.state === 'gale') {
        const a = angTo(e, player);
        player.kx += Math.cos(a) * 520 * dt; player.ky += Math.sin(a) * 520 * dt;
        e.fireT -= sdt;
        if (e.fireT <= 0) { e.fireT = 0.65; bulletRing(e.x, e.y, 12, 150, rnd(0, 1), { dmg: bd(), col: 'ice' }); }
        if (Math.random() < dt * 50) particles.push({ x: e.x + rnd(-200, 200), y: e.y + rnd(-120, 120), vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, r: 2, color: '#e0f2fe', life: 0.5, maxLife: 0.5 });
        if (e.t <= 0) { e.state = 'idle'; e.t = 1.5; }
      } else if (e.state === 'spears') {
        if (e.t <= 0) {
          for (let i = 0; i < 6; i++) {
            const x = PLAY.x + 50 + ((i + rnd(0, 1)) / 6) * (PLAY.w - 100);
            addHazard({ shape: 'line', x, y: PLAY.y, ang: Math.PI / 2, len: PLAY.h, w: 40, warn: 0.95 + i * 0.1, life: 0.3, dmg: bd(1.2), col: 'ice', slow: true, owner: e });
          }
          for (let i = 0; i < 3; i++) addHazard({ shape: 'line', x: PLAY.x, y: PLAY.y + 60 + i * ((PLAY.h - 120) / 2), ang: 0, len: PLAY.w, w: 36, warn: 1.5 + i * 0.1, life: 0.3, dmg: bd(1.2), col: 'ice', slow: true, owner: e });
          Snd.play('use'); e.state = 'idle'; e.t = 2.6;
        }
      }
    }
  },
  // ---------------- ПЕРВЫЙ ХРАНИТЕЛЬ (глубина 6, альтернативный финал) ----------------
  {
    id: 'keeper', name: 'Первый Хранитель', sub: 'Тот, кто не уберёг Огонь', r: 40, hp: 3300, spd: 62, armor: 0.1,
    init(e) { e.state = 'gap'; e.t = 1.4; e.n = 0; e.say = null; e.dirA = 0; e.fireT = 0; e.last = ''; e.marks = []; },
    update(e, dt, sdt) {
      e.phase = e.hp < e.maxHp * 0.33 ? 3 : e.hp < e.maxHp * 0.66 ? 2 : 1;
      if (e.say) { e.say.t -= dt; if (e.say.t <= 0) e.say = null; }
      const rate = e.phase === 3 ? 1.4 : e.phase === 2 ? 1.18 : 1;
      e.t -= sdt;
      if (e.state !== 'guard') e.armor = 0.1;
      if (e.state === 'gap') {
        steer(e, angTo(e, player), e.spd * rate, dt);
        if (e.t <= 0) {
          let opts = e.phase === 1 ? ['slash', 'flame'] : e.phase === 2 ? ['slash', 'flame', 'guard', 'pillars'] : ['slash', 'flame', 'guard', 'pillars', 'slash'];
          opts = opts.filter(o => o !== e.last);
          e.state = pick(opts); e.last = e.state;
          const says = { slash: 'ДЕРЖИ СТРОЙ', flame: 'ОГОНЬ ПАЛИТ', guard: 'Я — ЩИТ', pillars: 'СГОРИ, КАК СГОРЕЛ Я' };
          e.say = { txt: says[e.state], t: 1.6 };
          if (e.state === 'slash') { e.n = e.phase === 3 ? 4 : 3; e.t = 0.1; e.sub2 = 'aim'; }
          else if (e.state === 'flame') { e.n = e.phase === 3 ? 4 : 3; e.t = 0.4; }
          else if (e.state === 'guard') { e.t = 2.3; Snd.play('shield'); }
          else if (e.state === 'pillars') { e.t = 0.6; }
          Snd.play('boss_intro');
        }
      } else if (e.state === 'slash') {
        if (e.n > 0) {
          if (e.sub2 === 'aim') {
            if (e.t <= 0) {
              e.dirA = angTo(e, player);
              addHazard({ shape: 'line', x: e.x, y: e.y, ang: e.dirA, len: 190, w: 76, warn: 0.5 / rate, life: 0.15, dmg: bd(1.5), col: 'fire', owner: e });
              e.sub2 = 'dash'; e.t = 0.5 / rate;
            }
          } else if (e.t <= 0) {
            e.x += Math.cos(e.dirA) * 150; e.y += Math.sin(e.dirA) * 150;
            const pt = edgePt(e.x, e.y); e.x = pt.x; e.y = pt.y;
            spawnParticles(e.x, e.y, 14, '#fb923c'); Snd.play('swing');
            e.n--; e.sub2 = 'aim'; e.t = 0.18;
          }
        } else { e.state = 'gap'; e.t = 1.1 / rate; }
      } else if (e.state === 'flame') {
        if (e.n > 0 && e.t <= 0) {
          e.n--; e.t = 0.7 / rate;
          const a = angTo(e, player), cnt = 9;
          for (let i = 0; i < cnt; i++) shootBullet(e.x, e.y, a + (i - (cnt - 1) / 2) * 0.17, 215, { dmg: bd(), col: 'fire', r: 6 });
          Snd.play('hit'); shake = Math.max(shake, 4);
        }
        if (e.n <= 0 && e.t <= 0) { e.state = 'gap'; e.t = 1.0 / rate; }
      } else if (e.state === 'guard') {
        e.armor = 0.75;
        if (e.t <= 0) {
          e.armor = 0.1; bulletRing(e.x, e.y, 16, 170, rnd(0, 1), { dmg: bd(), col: 'fire' });
          shake = Math.max(shake, 9); Snd.play('stomp'); e.state = 'gap'; e.t = 1.2 / rate;
        }
      } else if (e.state === 'pillars') {
        if (e.t <= 0) {
          for (let i = 0; i < 6; i++) {
            const a = rnd(0, 6.28), rr = i ? rnd(40, 190) : 0, pt = edgePt(player.x + Math.cos(a) * rr, player.y + Math.sin(a) * rr);
            addHazard({ shape: 'circle', x: pt.x, y: pt.y, r: 46, warn: 0.9 + i * 0.1, life: 2.6, dmg: bd(0.8), col: 'fire', kind: 'lingering', owner: e });
          }
          Snd.play('use'); e.state = 'gap'; e.t = 1.8 / rate;
        }
      }
    }
  }
);
for (const d of BOSS_DEFS) if (d) BOSS_BY_ID[d.id] = d;
BOSS_POOL = [null, ['warden', 'gravedigger'], ['drowned', 'bellringer'], ['reaper', 'collector'], ['bloom', 'thornqueen'], ['sarcophagus', 'blizzard'], ['nameless', 'keeper']];
