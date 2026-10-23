'use strict';
/* =====================================================================
   MOBILE: виртуальные стики и кнопки без изменения геймплейной логики.
   Pointer Events позволяют идти, прицеливаться и использовать умение
   несколькими пальцами одновременно. В desktop-режиме модуль неактивен.
   ===================================================================== */
(function initMobileControls() {
  if (typeof PointerEvent === 'undefined' || !touchAvailable()) return;
  const host = document.getElementById('mobile-controls');
  if (!host) return;
  const id = name => document.getElementById('mobile-' + name);
  const stick = id('stick'), stickKnob = id('stick-knob');
  const attack = id('attack'), attackKnob = id('attack-knob');
  const playUI = id('play-ui'), menuUI = id('menu-ui'), seedUI = id('seed-ui'), seedField = id('seed-field');
  const status = id('status');
  const held = new Map();
  let stickPointer = null, attackPointer = null, gamePointer = null;
  let lastMode = '';
  mobileInput.active = true;
  host.hidden = false;
  fitCanvas();

  function resetStick() {
    stickPointer = null;
    mobileInput.moveX = mobileInput.moveY = 0;
    stick.classList.remove('is-held');
    stickKnob.style.transform = 'translate(-50%, -50%)';
  }
  function resetAttack() {
    attackPointer = null;
    mobileInput.attack = mobileInput.aiming = false;
    if (!mouse.down) mouse.active = false;
    attack.classList.remove('is-held');
    attackKnob.style.transform = 'translate(-50%, -50%)';
  }
  function resetAll() {
    resetStick(); resetAttack();
    mobileInput.skill = false;
    for (const button of held.values()) button.classList.remove('is-held');
    held.clear();
    mouse.down = mouse.right = false;
    if (gamePointer !== null) gamePointer = null;
  }
  function begin(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return false;
    e.preventDefault();
    Snd.unlock();
    mobileInput.lastTouch = Date.now();
    return true;
  }
  function moveStick(e) {
    if (e.pointerId !== stickPointer) return;
    const r = stick.getBoundingClientRect();
    const radius = r.width * 0.38;
    const dx = (e.clientX - (r.left + r.width / 2)) / radius;
    const dy = (e.clientY - (r.top + r.height / 2)) / radius;
    const len = Math.hypot(dx, dy);
    const gain = len < 0.13 ? 0 : Math.min(1, len);
    mobileInput.moveX = len ? dx / len * gain : 0;
    mobileInput.moveY = len ? dy / len * gain : 0;
    stickKnob.style.transform = `translate(calc(-50% + ${mobileInput.moveX * radius}px), calc(-50% + ${mobileInput.moveY * radius}px))`;
  }
  stick.addEventListener('pointerdown', e => {
    if (stickPointer !== null || !begin(e)) return;
    stickPointer = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    stick.classList.add('is-held');
    moveStick(e);
  });
  stick.addEventListener('pointermove', moveStick);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stick.addEventListener(name, e => { if (e.pointerId === stickPointer) resetStick(); });
  }

  function moveAttack(e) {
    if (e.pointerId !== attackPointer) return;
    const r = attack.getBoundingClientRect();
    const radius = r.width * 0.33;
    const dx = (e.clientX - (r.left + r.width / 2)) / radius;
    const dy = (e.clientY - (r.top + r.height / 2)) / radius;
    const len = Math.hypot(dx, dy);
    mobileInput.aiming = len > 0.34;
    if (mobileInput.aiming) {
      mobileInput.aimX = dx / len;
      mobileInput.aimY = dy / len;
    }
    const k = len ? Math.min(1, len) / len : 0;
    attackKnob.style.transform = `translate(calc(-50% + ${dx * k * radius}px), calc(-50% + ${dy * k * radius}px))`;
  }
  attack.addEventListener('pointerdown', e => {
    if (attackPointer !== null || !begin(e)) return;
    attackPointer = e.pointerId;
    attack.setPointerCapture(e.pointerId);
    attack.classList.add('is-held');
    mobileInput.attack = true;
    mouse.active = false;
    moveAttack(e);
  });
  attack.addEventListener('pointermove', moveAttack);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    attack.addEventListener(name, e => { if (e.pointerId === attackPointer) resetAttack(); });
  }

  function instantAction(element, fn, release) {
    element.addEventListener('pointerdown', e => {
      if (held.has(e.pointerId) || !begin(e)) return;
      held.set(e.pointerId, element);
      element.setPointerCapture(e.pointerId);
      element.classList.add('is-held');
      fn();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      element.addEventListener(name, e => {
        if (held.get(e.pointerId) !== element) return;
        held.delete(e.pointerId);
        element.classList.remove('is-held');
        if (release) release();
      });
    }
    // Pointer-events, not click, own the action: don't trigger twice.
    element.addEventListener('click', e => e.preventDefault());
  }
  instantAction(id('skill'), () => { if (state === 'play') mobileInput.skill = true; }, () => { mobileInput.skill = false; });
  instantAction(id('dash'), () => { if (state === 'play') tryDash(mobileInput.moveX, mobileInput.moveY); });
  instantAction(id('potion'), () => { if (state === 'play') drinkPotion(); });
  instantAction(id('flask'), () => { if (state === 'play') throwFlask(); });
  instantAction(id('active'), () => { if (state === 'play') useActive(); });
  instantAction(id('pause'), () => { if (state === 'play') handleKey('Escape'); });
  for (const b of menuUI.querySelectorAll('[data-mobile-key]')) {
    instantAction(b, () => { handleKey(b.dataset.mobileKey); });
  }

  // Касания самого Canvas: выбор пункта меню, наведение и стрельба по врагу.
  cvs.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || gamePointer !== null || !begin(e)) return;
    gamePointer = e.pointerId;
    cvs.setPointerCapture(e.pointerId);
    mouseToCanvas(e);
    if (state === 'play') mouse.down = true;
  });
  cvs.addEventListener('pointermove', e => {
    if (e.pointerId === gamePointer) { e.preventDefault(); mouseToCanvas(e); }
  });
  cvs.addEventListener('pointerup', e => {
    if (e.pointerId !== gamePointer) return;
    e.preventDefault(); mobileInput.lastTouch = Date.now();
    mouseToCanvas(e);
    if (state !== 'play') handleClick(mouse.x, mouse.y);
    mouse.down = false;
    gamePointer = null;
  });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    cvs.addEventListener(name, e => {
      if (e.pointerId === gamePointer) { gamePointer = null; mouse.down = false; }
    });
  }

  seedField.addEventListener('input', () => {
    seedInput = normSeed(seedField.value);
    if (seedField.value !== seedInput) seedField.value = seedInput;
  });
  seedField.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); seedField.blur(); seedContinue(); }
  });
  seedField.addEventListener('pointerdown', e => e.stopPropagation());

  // Скрываем управление вместе с игрой при сворачивании вкладки.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { resetAll(); if (state === 'play') handleKey('Escape'); }
  });
  window.addEventListener('pagehide', resetAll);

  window.updateMobileUI = function updateMobileUI() {
    const mode = state === 'play' ? 'play' : state;
    if (mode === 'play' && player) {
      const label = `❤ ${Math.ceil(player.hp)}/${player.maxHp}  ·  🪔 ${Math.round(player.oil)}%  ·  ✚ ${player.potions}  ·  ✦ ${player.flasks}`;
      if (status.textContent !== label) status.textContent = label;
    }
    if (mode === lastMode) return;
    if (lastMode === 'play' && mode !== 'play') resetAll();
    playUI.hidden = mode !== 'play';
    menuUI.hidden = mode === 'play';
    id('start').hidden = mode !== 'camp';
    seedUI.hidden = mode !== 'seed';
    if (mode === 'seed') seedField.value = seedInput;
    else if (document.activeElement === seedField) seedField.blur();
    lastMode = mode;
  };
  window.updateMobileUI();
})();
