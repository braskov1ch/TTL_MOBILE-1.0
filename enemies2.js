'use strict';
/* =====================================================================
   ENEMIES2: новые враги v2.0
   Жук · Ползучая рука · Плакальщица · Хорист · Шипокорень · Морозильщик · Бездонник · Мимик
   ===================================================================== */
const inPlay = (x, y, m = 20) => ({ x: clamp(x, PLAY.x + m, PLAY.x + PLAY.w - m), y: clamp(y, PLAY.y + m, PLAY.y + PLAY.h - m) });

Object.assign(ENEMY_DEFS, {
  beetle: {
    name: 'Гробовой жук', r: 13, hp: 70, spd: 92, cost: 1.5, minFloor: 1, weight: 2, strong: true, touch: 9, armor: 0.5,
    init(e) { e.state = 'walk'; e.t = rnd(1.2, 2.4); e.dirA = 0; },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.state === 'walk') { chase(e, e.spd, dt); if (e.t <= 0) { e.state = 'wind'; e.t = 0.45; } }
      else if (e.state === 'wind') { e.dirA = angTo(e, player); if (e.t <= 0) { e.state = 'roll'; e.t = 0.75; } }
      else if (e.state === 'roll') {
        const step = 330 * esp(e) * dt;
        const moved = steer(e, e.dirA, 330, dt);
        if (e.t <= 0 || (step > 0 && moved < step * 0.4)) { e.state = 'rest'; e.t = 0.9; }
      } else if (e.t <= 0) { e.state = 'walk'; e.t = rnd(1.6, 2.8); }
    }
  },
  hand: {
    name: 'Ползучая рука', r: 10, hp: 48, spd: 44, cost: 1.5, minFloor: 2, weight: 1.6, touch: 7,
    init(e) { e.t = rnd(1.2, 2.4); },
    update(e, dt, sdt) {
      chase(e, e.spd, dt);
      e.t -= sdt;
      if (e.t <= 0) {
        e.t = rnd(2.4, 3.2);
        const pt = inPlay(player.x + player.vx * 0.25, player.y + player.vy * 0.25, 30);
        addHazard({ shape: 'circle', x: pt.x, y: pt.y, r: 40, warn: 0.85, life: 0.2, dmg: dmgScale(9), col: 'bone', owner: e });
      }
    }
  },
  weeper: {
    name: 'Плакальщица', r: 13, hp: 80, spd: 52, cost: 2.5, minFloor: 2, weight: 1.8, fly: true, touch: 6,
    init(e) { e.cd = rnd(1.2, 2.2); e.dir = pick([-1, 1]); },
    update(e, dt, sdt) {
      const d = dist(e, player), a = angTo(e, player);
      if (d < 190) steer(e, a + Math.PI, e.spd * 1.2, dt);
      else if (d > 320) steer(e, a, e.spd, dt);
      else steer(e, a + Math.PI / 2 * e.dir, e.spd * 0.6, dt);
      e.cd -= sdt;
      if (e.cd <= 0) {
        e.cd = rnd(2.6, 3.4);
        for (const off of [-0.35, 0.35]) shootBullet(e.x, e.y, a + off, 118, { r: 7, col: 'water', dmg: dmgScale(7), home: 1.5, life: 5.5 });
        Snd.play('weep');
      }
    }
  },
  chorister: {
    name: 'Хорист', r: 12, hp: 62, spd: 62, cost: 2.5, minFloor: 3, weight: 1.4, noElite: true, touch: 6,
    init(e) { e.cd = rnd(1.5, 2.5); e.dir = pick([-1, 1]); },
    update(e, dt, sdt) {
      const d = dist(e, player), a = angTo(e, player);
      if (d < 250) steer(e, a + Math.PI, e.spd * 1.1, dt);
      else steer(e, a + Math.PI / 2 * e.dir, e.spd * 0.4, dt);
      e.cd -= sdt;
      if (e.cd <= 0) {
        e.cd = 3.6;
        let n = 0;
        for (const o of curRoom.enemies) {
          if (o === e || o.dead || o.isBoss || o.spawnT > 0 || o.gold > 0 || dist(e, o) > 205) continue;
          o.fx.haste = Math.max(o.fx.haste, 3.2);
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.06);
          n++;
        }
        fxs.push({ type: 'ring', x: e.x, y: e.y, r0: 6, r1: 205, life: 0.6, max: 0.6, color: '#fde68a' });
        Snd.play('sing');
        if (!n) shootBullet(e.x, e.y, a, 200, { col: 'purple', dmg: dmgScale(7) });
      }
    }
  },
  thornroot: {
    name: 'Шипокорень', r: 16, hp: 110, spd: 0, cost: 2.5, minFloor: 4, weight: 1.6, mass: 0, immobile: true, noElite: true, touch: 9,
    init(e) { e.cd = rnd(1.2, 2); e.face = 0; },
    update(e, dt, sdt) {
      e.face = angTo(e, player);
      e.cd -= sdt;
      if (e.cd <= 0) {
        e.cd = 3.3;
        addHazard({ shape: 'line', x: e.x, y: e.y, ang: e.face, len: 780, w: 34, warn: 0.95, life: 0.3, dmg: dmgScale(10), col: 'green', owner: e });
        if (e.hp < e.maxHp * 0.5) addHazard({ shape: 'line', x: e.x, y: e.y, ang: e.face + 0.5, len: 780, w: 34, warn: 1.1, life: 0.3, dmg: dmgScale(10), col: 'green', owner: e });
        Snd.play('trap');
      }
    }
  },
  frostcaster: {
    name: 'Морозильщик', r: 14, hp: 100, spd: 55, cost: 3, minFloor: 5, weight: 1.6, touch: 7,
    init(e) { e.cd = rnd(1.5, 2.5); e.dir = pick([-1, 1]); },
    update(e, dt, sdt) {
      const d = dist(e, player), a = angTo(e, player);
      if (d < 220) steer(e, a + Math.PI, e.spd * 1.1, dt);
      else if (d > 340) steer(e, a, e.spd, dt);
      else steer(e, a + Math.PI / 2 * e.dir, e.spd * 0.5, dt);
      e.cd -= sdt;
      if (e.cd <= 0) {
        e.cd = 3.1;
        const px = player.x + player.vx * 0.35, py = player.y + player.vy * 0.35;
        for (let k = 0; k < 3; k++) {
          const ang = rnd(0, 6.28), rr = k ? rnd(55, 115) : 0;
          const pt = inPlay(px + Math.cos(ang) * rr, py + Math.sin(ang) * rr, 30);
          addHazard({ shape: 'circle', x: pt.x, y: pt.y, r: 46, warn: 0.9 + k * 0.14, life: 0.25, dmg: dmgScale(9), col: 'ice', slow: true, owner: e });
        }
        Snd.play('bolt');
      }
    }
  },
  abyssal: {
    name: 'Бездонник', r: 15, hp: 125, spd: 86, cost: 3, minFloor: 5, weight: 1.5, fly: true, touch: 10,
    init(e) { e.state = 'walk'; e.t = rnd(1.2, 2); },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.state === 'walk') {
        chase(e, e.spd, dt);
        if (e.t <= 0) {
          e.state = 'vanish'; e.t = 0.5; e.hidden = true;
          addHazard({ shape: 'circle', x: e.x, y: e.y, r: 44, warn: 0.35, life: 3.6, dmg: dmgScale(6), col: 'void', kind: 'lingering' });
          spawnParticles(e.x, e.y, 14, '#6d28d9');
        }
      } else if (e.state === 'vanish' && e.t <= 0) {
        const a = rnd(0, 6.28), pt = inPlay(player.x + Math.cos(a) * 150, player.y + Math.sin(a) * 150, 30);
        e.x = pt.x; e.y = pt.y; e.hidden = false; e.state = 'walk'; e.t = rnd(2.6, 3.6);
        spawnParticles(e.x, e.y, 14, '#6d28d9');
        bulletRing(e.x, e.y, 6, 160, rnd(0, 1), { col: 'shadow', dmg: dmgScale(8) });
      }
    }
  },
  mimic: {
    name: 'Мимик', r: 16, hp: 160, spd: 150, cost: 0, minFloor: 99, weight: 0, noElite: true, touch: 13,
    init(e) { e.state = 'wait'; e.t = 0.7; e.dirA = 0; },
    update(e, dt, sdt) {
      e.t -= sdt;
      if (e.state === 'wait') { chase(e, e.spd * 0.35, dt); if (e.t <= 0) { e.state = 'wind'; e.t = 0.35; } }
      else if (e.state === 'wind') { e.dirA = angTo(e, player); if (e.t <= 0) { e.state = 'lunge'; e.t = 0.5; } }
      else if (e.state === 'lunge') { steer(e, e.dirA, 430, dt); if (e.t <= 0) { e.state = 'rest'; e.t = 0.8; } }
      else if (e.t <= 0) { e.state = 'wait'; e.t = rnd(0.6, 1.2); }
    },
    onDeath(e) {
      for (let i = 0; i < 3; i++) spawnPickup(curRoom, rollDrop(true), e.x, e.y);
      if (chance(luckChance(0.4, 0.03))) curRoom.peds.push(makePed(rollRelic('treasure'), e.x, e.y - 10));
    }
  }
});

// Вес врага в зависимости от темы глубины (F.bias)
function enemyWeight(t) {
  const F = floorDef(floorNum);
  const b = F && F.bias ? (F.bias[t] || 1) : 1;
  return ENEMY_DEFS[t].weight * b;
}
