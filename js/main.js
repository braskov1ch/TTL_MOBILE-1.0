'use strict';
/* =====================================================================
   MAIN: главный цикл
   ===================================================================== */
let lastTime = 0;
let errorShown = 0;

function renderFrame() {
  if (mobileInput.active && typeof updateMobileUI === 'function') {
    updateMobileUI();
    return;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  switch (state) {
    case 'title': renderTitle(); break;
    case 'camp': renderCamp(); break;
    case 'settings': renderSettings(); break;
    case 'chronicle': renderChronicle(); break;
    case 'relics': renderRelics(); break;
    case 'help': renderHelp(); break;
    case 'play': uiButtons = []; renderGame(); break;
    case 'pause': renderPause(); break;
    case 'dead': renderEnd(false); break;
    case 'win': renderEnd(true); break;
    case 'achievements': renderAchievements(); break;
    case 'bestiary': renderBestiary(); break;
    case 'stats': renderStats(); break;
    case 'seed': renderSeedScreen(); break;
    case 'story': renderStory(); break;
    case 'event': uiButtons = []; renderEvent(); break;
    case 'hatter': renderHatter(); break;
  }
  renderToasts();
  if (typeof updateMobileUI === 'function') updateMobileUI();
  const want = state === 'play' ? 'none' : 'default';
  if (cvs.style.cursor !== want) cvs.style.cursor = want;
}

function loop(now) {
  if (!lastTime) lastTime = now;
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  time += dt;
  if (state === 'dead' || state === 'win') endTimer += dt; else endTimer = 0;
  try {
    update(dt);
    renderFrame();
  } catch (err) {
    if (errorShown < 5) { errorShown++; console.error(err); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(120,0,0,0.85)'; ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = '#fff'; ctx.font = `12px ${FONT_SANS}`; ctx.textAlign = 'left';
    ctx.fillText(tr('Ошибка: ') + (err && err.message), 10, H - 11);
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
