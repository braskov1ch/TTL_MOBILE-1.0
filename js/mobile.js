'use strict';
/* Separate, touch-first UI for the mobile build. Core game state/mechanics remain shared. */
(function initMobileInterface() {
  if (typeof PointerEvent === 'undefined' || !touchAvailable()) return;
  const $ = id => document.getElementById(id);
  const host = $('mobile-controls'), playUI = $('mobile-play-ui'), menuUI = $('mobile-menu-ui');
  const menuTitle = $('mobile-menu-title'), menuContent = $('mobile-menu-content');
  const view = $('mobile-view'), surface = view.getContext('2d', {alpha:false});
  const status = $('mobile-status');
  const stick = $('mobile-stick'), stickKnob = $('mobile-stick-knob');
  const attack = $('mobile-attack'), attackKnob = $('mobile-attack-knob');
  const actions = [];
  const activeActions = new Map();
  let stickPointer = null, attackPointer = null, viewPointer = null;
  let lastMode = '', lastMenuSignature = '', lastStatus = '', lastBuildAt = 0;
  let sourceRect = {x:0,y:HUD_H,w:W,h:H-HUD_H};
  let pageFocus = '';
  mobileInput.active = true;
  host.hidden = false;
  fitCanvas();

  const esc = value => String(value === undefined || value === null ? '' : value)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const txt = value => esc(tr(String(value === undefined ? '' : value)));
  function add(label, fn, opts={}) {
    const id = actions.push(fn)-1;
    return `<button type="button" data-mobile-action="${id}" class="${opts.primary?'mobile-primary':opts.tab?'mobile-tab':opts.step?'mobile-step':'mobile-card'}${opts.selected?' selected':''}" ${opts.disabled?'disabled':''}>${opts.card?`<b>${txt(label)}</b>${opts.desc?`<small>${txt(opts.desc)}</small>`:''}`:txt(label)}</button>`;
  }
  const section=(heading,body)=>`<h2 class="mobile-section-title">${txt(heading)}</h2>${body}`;
  const cards=(list,cls='')=>`<div class="mobile-cards ${cls}">${list.join('')}</div>`;
  const info=content=>`<div class="mobile-info-panel">${tr(content)}</div>`;
  function back() {
    if (state === 'story') storyFinish();
    else if (state === 'pause') handleKey('Escape');
    else if (state === 'event' || state === 'hatter') return;
    else if (state === 'camp' || state === 'title') state = 'title';
    else { Save.store(); state = 'title'; }
    lastMenuSignature = '';
  }
  $('mobile-back').addEventListener('click', () => { Snd.unlock(); back(); buildMenu(true); });
  menuContent.addEventListener('click', e => {
    const button = e.target.closest('button[data-mobile-action]');
    if (!button || button.disabled) return;
    const fn = actions[Number(button.dataset.mobileAction)];
    if (!fn) return;
    Snd.unlock(); fn();
    lastMenuSignature = '';
    buildMenu(true);
  });
  // Mobile text input is a real input, not a simulated desktop keyboard.
  menuContent.addEventListener('input',e=>{
    if(e.target.id==='mobile-seed-input') seedInput=normSeed(e.target.value);
  });
  menuContent.addEventListener('keydown',e=>{
    if(e.target.id==='mobile-seed-input') {
      e.stopPropagation();
      if(e.key==='Enter'){e.preventDefault();e.target.blur();seedContinue();buildMenu(true);}
    }
  });

  function resetStick(){stickPointer=null;mobileInput.moveX=mobileInput.moveY=0;stick.classList.remove('is-held');stickKnob.style.transform='translate(-50%,-50%)';}
  function resetAttack(){attackPointer=null;mobileInput.attack=mobileInput.aiming=false;attackKnob.style.transform='translate(0px,0px)';attack.classList.remove('is-held');}
  function resetAll(){resetStick();resetAttack();mobileInput.skill=false;mouse.down=false;viewPointer=null;for(const b of activeActions.values())b.classList.remove('is-held');activeActions.clear();}
  function begin(e){if(e.pointerType==='mouse'&&e.button!==0)return false;e.preventDefault();Snd.unlock();mobileInput.lastTouch=Date.now();return true;}
  function dragStick(e){
    if(e.pointerId!==stickPointer)return;
    const r=stick.getBoundingClientRect(),radius=r.width*.35;
    const dx=(e.clientX-r.left-r.width/2)/radius,dy=(e.clientY-r.top-r.height/2)/radius;
    const len=Math.hypot(dx,dy),gain=len<.13?0:Math.min(1,len);
    mobileInput.moveX=len?dx/len*gain:0;mobileInput.moveY=len?dy/len*gain:0;
    stickKnob.style.transform=`translate(calc(-50% + ${mobileInput.moveX*radius}px),calc(-50% + ${mobileInput.moveY*radius}px))`;
  }
  stick.addEventListener('pointerdown',e=>{if(stickPointer!==null||!begin(e))return;stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);stick.classList.add('is-held');dragStick(e);});
  stick.addEventListener('pointermove',dragStick);
  for(const type of ['pointerup','pointercancel','lostpointercapture']) stick.addEventListener(type,e=>{if(e.pointerId===stickPointer)resetStick();});
  function dragAttack(e){
    if(e.pointerId!==attackPointer)return;
    const r=attack.getBoundingClientRect(),radius=Math.min(r.width,r.height)*.35;
    const dx=(e.clientX-r.left-r.width/2)/radius,dy=(e.clientY-r.top-r.height/2)/radius;
    const len=Math.hypot(dx,dy);mobileInput.aiming=len>.34;
    if(mobileInput.aiming){mobileInput.aimX=dx/len;mobileInput.aimY=dy/len;}
    const gain=len?Math.min(1,len)/len:0;
    attackKnob.style.transform=`translate(calc(${dx*gain*radius}px),calc(${dy*gain*radius}px))`;
  }
  attack.addEventListener('pointerdown',e=>{if(attackPointer!==null||!begin(e))return;attackPointer=e.pointerId;attack.setPointerCapture(e.pointerId);attack.classList.add('is-held');mobileInput.attack=true;mouse.active=false;dragAttack(e);});
  attack.addEventListener('pointermove',dragAttack);
  for(const type of ['pointerup','pointercancel','lostpointercapture']) attack.addEventListener(type,e=>{if(e.pointerId===attackPointer)resetAttack();});
  function bindInstant(el,fn,release){
    el.addEventListener('pointerdown',e=>{
      if(activeActions.has(e.pointerId)||!begin(e))return;
      activeActions.set(e.pointerId,el);el.setPointerCapture(e.pointerId);el.classList.add('is-held');fn();
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{
      if(activeActions.get(e.pointerId)!==el)return;
      activeActions.delete(e.pointerId);el.classList.remove('is-held');if(release)release();
    });
    el.addEventListener('click',e=>e.preventDefault());
  }
  bindInstant($('mobile-skill'),()=>{if(state==='play')mobileInput.skill=true;},()=>{mobileInput.skill=false;});
  bindInstant($('mobile-dash'),()=>{if(state==='play')tryDash(mobileInput.moveX,mobileInput.moveY);});
  bindInstant($('mobile-potion'),()=>{if(state==='play')drinkPotion();});
  bindInstant($('mobile-flask'),()=>{if(state==='play')throwFlask();});
  bindInstant($('mobile-active'),()=>{if(state==='play')useActive();});
  bindInstant($('mobile-pause'),()=>{if(state==='play')handleKey('Escape');});

  // The gameplay viewport uses a player-following camera. Finger location is
  // converted back to the original world coordinates, not desktop CSS pixels.
  function aimAt(e){
    const r=view.getBoundingClientRect();
    mouse.x=sourceRect.x+(e.clientX-r.left)/r.width*sourceRect.w;
    mouse.y=sourceRect.y+(e.clientY-r.top)/r.height*sourceRect.h;
    mouse.active=true;
  }
  view.addEventListener('pointerdown',e=>{if(state!=='play'||viewPointer!==null||!begin(e))return;viewPointer=e.pointerId;view.setPointerCapture(e.pointerId);aimAt(e);mouse.down=true;});
  view.addEventListener('pointermove',e=>{if(e.pointerId===viewPointer){e.preventDefault();aimAt(e);}});
  for(const type of ['pointerup','pointercancel','lostpointercapture']) view.addEventListener(type,e=>{if(e.pointerId!==viewPointer)return;mouse.down=false;viewPointer=null;});

  status.addEventListener('click',e=>{if(e.target.id==='mobile-pause-top' && state==='play'){Snd.unlock();handleKey('Escape');}});
  function syncStatus(){
    if(!player)return;
    const hp=Math.ceil(player.hp),max=player.maxHp,oil=Math.round(player.oil);
    const label=`${hp}/${max}/${oil}/${player.potions}/${player.flasks}/${player.dashCharges}/${floorNum}`;
    if(label===lastStatus)return;
    lastStatus=label;
    const bar=(v,max,cl)=>`<span class="mobile-meter-track"><span class="mobile-meter-fill ${cl}" style="display:block;width:${Math.max(0,Math.min(100,100*v/(max||1)))}%"></span></span>`;
    status.innerHTML=`<div class="mobile-meter"><span class="mobile-meter-label">♥ ${hp}/${max}</span>${bar(Math.max(0,player.hp),max,'')}</div>`+
      `<div class="mobile-meter"><span class="mobile-meter-label">♨ ${oil}%</span>${bar(Math.max(0,player.oil),player.oilMax,'oil')}</div>`+
      `<span class="mobile-counter">✚ ${player.potions}</span><span class="mobile-counter">⌁ ${player.flasks}</span><span class="mobile-counter">ГЛ. ${floorNum} · ➤ ${player.dashCharges}</span><button id="mobile-pause-top" type="button" aria-label="Пауза">Ⅱ</button>`;
  }
  function presentWorld(){
    const r=view.getBoundingClientRect();
    if(r.width<1||r.height<1)return;
    const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    const width=Math.max(1,Math.round(r.width*dpr)),height=Math.max(1,Math.round(r.height*dpr));
    if(view.width!==width||view.height!==height){view.width=width;view.height=height;}
    const ratio=r.width/r.height;
    // Landscape: wide view of the whole arena. Portrait: tighter camera following player.
    let sh=Math.min(H-HUD_H,ratio<1?470:510),sw=sh*ratio;
    if(sw>W){sw=W;sh=sw/ratio;}
    if(sh>H-HUD_H){sh=H-HUD_H;sw=sh*ratio;}
    const px=player?player.x:CX,py=player?player.y:CY;
    const sx=Math.max(0,Math.min(W-sw,px-sw/2));
    const sy=Math.max(HUD_H,Math.min(H-sh,py-sh/2));
    sourceRect={x:sx,y:sy,w:sw,h:sh};
    surface.setTransform(1,0,0,1,0,0);
    surface.imageSmoothingEnabled=true;
    surface.clearRect(0,0,width,height);
    surface.drawImage(cvs,sx,sy,sw,sh,0,0,width,height);
    syncStatus();
  }

  function composeMenu(){
    actions.length=0;
    let heading='',html='',d=Save.data;
    switch(state){
      case 'title':
        heading='ПОСЛЕДНИЙ ФОНАРЬ';
        html=`<div class="mobile-tagline">СПУСК В БЕЗДНУ</div>`+
          info(`Спусков: <b>${d.runs}</b> · Побед: <b>${d.wins}</b> · Углей: <b>${d.embers}</b> · Монет: <b>${d.coins}</b>`)+
          section('В путь',cards(MENU_ITEMS.filter(x=>x.col===0).map(x=>add(x.label,()=>x.act(),{card:true}))))+
          section('Летопись',cards(MENU_ITEMS.filter(x=>x.col===1).map(x=>add(x.label,()=>x.act(),{card:true})),'compact'))+
          section('Игра',cards(MENU_ITEMS.filter(x=>x.col===2).map(x=>add(x.label,()=>x.act(),{card:true})),'compact'))+
          add(LANG==='ru'?'Language: Русский → English':'Language: English → Русский',toggleLang);
        break;
      case 'camp': {
        heading='ЛАГЕРЬ У КОСТРА';
        html=info(`Угли: <b>${d.embers}</b> · Монеты: <b>${d.coins}</b> · ${txt(MODE_NAMES[campMode])}`);
        html+=`<div class="mobile-tabs">${CAMP_TABS.map((t,i)=>add(t,()=>{campTab=i;},{tab:true,selected:campTab===i})).join('')}</div>`;
        if(campTab===0){
          html+=cards(HERO_ORDER.map((id,i)=>{
            const h=HEROES[id],st=heroCardStatus(id),hide=h.secret&&!st.owned;
            const desc=hide?'Секретный герой':st.owned?`${h.title} · ${h.maxHp} HP · ${h.dmg} урона`:st.cond?`${st.text} · ${st.a}/${st.b}`:`Открыть: ${st.cost} углей`;
            return add(hide?'???':h.name,()=>buyHero(i),{card:true,desc,selected:selHero===i});
          }), 'compact');
          const chosen=HEROES[HERO_ORDER[selHero]];
          html+=info(`<b>${txt(chosen.secret&&!d.heroes[chosen.id]?'Неизвестный':chosen.name)}</b><div class="mobile-note">${chosen.secret&&!d.heroes[chosen.id]?'Открой тайного героя, выполнив условие.':txt(chosen.desc)}</div>`);
        } else if(campTab===1){
          html+=cards(CAMP_UPGRADES.map((u,i)=>{
            const lv=d.upgrades[u.id]||0;
            return add(u.name,()=>buyUpgrade(i),{card:true,desc:`${u.desc} · ${lv}/${u.max} · ${lv>=u.max?'МАКС.':u.cost[lv]+' углей'}`});
          }));
          if(d.burdenMax>0)html+=info('Бремя: '+cfg().burden)+'<div class="mobile-tabs">'+add('−',()=>{cfg().burden=Math.max(0,cfg().burden-1);Save.store();},{step:true})+add('+',()=>{cfg().burden=Math.min(d.burdenMax,cfg().burden+1);Save.store();},{step:true})+'</div>';
        } else {
          html+=cards(LAVKA.map((v,i)=>add(v.name,()=>buyLavka(i),{card:true,desc:`${v.desc} · ${v.cost} мон. · запас ${d.armed[v.id]||0}/${LAVKA_MAX}`})));
        }
        if(campMode==='seed')html+=info('Сид: '+esc(seedInput||'—'));
        html+=add('▶ СПУСТИТЬСЯ',startFromCamp,{primary:true,disabled:!d.heroes[HERO_ORDER[selHero]]});
        break;
      }
      case 'settings':
        heading='НАСТРОЙКИ';
        html=SETTINGS_ROWS.map(r=>`<div class="mobile-row"><b>${txt(r.name)}</b><span>${txt(r.get())}</span>`+
          add('−',()=>{r.step(-1);Save.store();},{step:true})+add('+',()=>{r.step(1);Save.store();},{step:true})+'</div>').join('');
        break;
      case 'pause':
        heading='ПАУЗА';
        html=info(`${txt(HEROES[player.hero].name)} · ${txt(MODE_NAMES[run.mode])} · ${Math.ceil(player.hp)}/${player.maxHp} HP · ${txt('Глубина')} ${floorNum}`)+
          add('▶ ПРОДОЛЖИТЬ',()=>pauseAction(0),{primary:true})+
          add(Snd.muted?'Включить звук':'Выключить звук',()=>pauseAction(1))+
          add(run.mode==='survival'?'Завершить выживание':'Покинуть спуск',()=>pauseAction(2));
        break;
      case 'dead':case 'win':
        heading=state==='win'?'ПОБЕДА':'ФОНАРЬ ПОГАС';
        html=run?info(`Герой: <b>${txt(HEROES[run.hero].name)}</b> · ${txt('Режим')}: ${txt(MODE_NAMES[run.mode])}<div class="mobile-note">Глубина: ${run.floorReached} · Убийств: ${run.kills} · Счёт: ${run.score} · +${run.embers} углей</div>`):'';
        html+=add('В ЛАГЕРЬ',()=>{openCamp(run.mode);selHero=Math.max(0,HERO_ORDER.indexOf(run.hero));},{primary:true})+
          add('НАЧАТЬ СНОВА',restartRun)+add('ГЛАВНОЕ МЕНЮ',()=>{state='title';});
        break;
      case 'seed':
        heading='ЗАБЕГ ПО СИДУ';
        html='<div class="mobile-note">Введи код генерации мира (до 12 символов).</div>'+
          `<input class="mobile-input" id="mobile-seed-input" maxlength="12" inputmode="text" autocapitalize="characters" placeholder="КОД СИДА" value="${esc(seedInput)}">`+
          add('СЛУЧАЙНЫЙ СИД',()=>{seedInput=randomSeedCode();})+add('ПРОДОЛЖИТЬ',seedContinue,{primary:true});
        break;
      case 'help':
        heading='КАК ИГРАТЬ';
        html=info('<b>Левый стик</b> — движение. <b>АТАКА</b> — удерживай для автоматического прицеливания, сдвигай палец для ручного.<div class="mobile-note">✦ Умение · ➤ Рывок · ✚ Зелье · ⌁ Склянка · ✧ Артефакт.<br>Касайся игрового поля для точного прицеливания. Верхняя панель отображает здоровье и масло.</div>')+
          info('Береги масло фонаря. Во тьме тени становятся опаснее. На телефонах рекомендуется горизонтальная ориентация.');
        break;
      case 'relics': {
        heading='РЕЛИКВИИ';
        html=info(`Открыто ${RELICS.filter(r=>d.discovered[r.id]).length} из ${RELICS.length}`);
        html+=cards(RELICS.map((r,i)=>add(d.discovered[r.id]?r.name:'???',()=>{codexSel=i;},{card:true,selected:codexSel===i,desc:d.discovered[r.id]?r.school:'Не найдено'})),'compact');
        const r=RELICS[codexSel];if(r&&d.discovered[r.id])html+=info(`<b>${txt(r.name)}</b><div class="mobile-note">${txt(r.desc)}</div>`);
        break;
      }
      case 'chronicle': {
        heading='ХРОНИКИ';
        html=info(`Найдено ${NOTES.filter(n=>d.notes[n.id]).length} из ${NOTES.length}`)+
          cards(NOTES.map((n,i)=>add(d.notes[n.id]?n.title:'???',()=>{chronSel=i;},{card:true,selected:chronSel===i})),'compact');
        const n=NOTES[chronSel];if(n&&d.notes[n.id])html+=info(`<b>${txt(n.title)}</b><div class="mobile-note">${txt(n.text)}</div>`);
        break;
      }
      case 'bestiary': {
        heading='БЕСТИАРИЙ';
        html=info(`Узнано: ${bestiaryCount()} / ${BESTIARY_ALL.length}`)+cards(BESTIARY_ALL.map((id,i)=>{
          const known=bestiaryKnown(id),boss=!!BOSS_BY_ID[id],def=boss?BOSS_BY_ID[id]:ENEMY_DEFS[id];
          return add(known?def.name:'???',()=>{bestSel=i;},{card:true,selected:bestSel===i,desc:known?`Убито: ${(d.bestiary[id]||{}).kills||0}`:'Не изучен'});
        }),'compact');
        const id=BESTIARY_ALL[bestSel];if(id&&bestiaryKnown(id)){
          const boss=!!BOSS_BY_ID[id],def=boss?BOSS_BY_ID[id]:ENEMY_DEFS[id];
          html+=info(`<b>${txt(def.name)}</b><div class="mobile-note">${txt((boss?BOSS_LORE:ENEMY_LORE)[id])}</div><div class="mobile-note">HP: ${def.hp}</div>`);
        }
        break;
      }
      case 'achievements':
        heading='ДОСТИЖЕНИЯ';
        html=info(`${Ach.count()} / ${ACHIEVEMENTS.length}`)+cards(ACHIEVEMENTS.map(a=>{
          const got=!!d.ach[a.id],hide=a.hidden&&!got;
          return `<div class="mobile-info-panel"><b>${got?'✓ ':''}${txt(hide?'???':a.name)}</b><div class="mobile-note">${txt(hide?'Секретное достижение':a.desc)}</div></div>`;
        }),'compact');
        break;
      case 'stats': {
        heading='СТАТИСТИКА';
        const stats=[['Спусков',d.runs],['Побед',d.wins],['Глубина',d.bestFloor],['Убито врагов',d.kills],['Побеждено боссов',d.bosses],['Угли',d.embers],['Монеты',d.coins],['Волна выживания',d.survival.bestWave]];
        html=stats.map(([k,v])=>`<div class="mobile-row"><b>${txt(k)}</b><span>${esc(v)}</span></div>`).join('');
        break;
      }
      case 'story': {
        heading='ИСТОРИЯ';
        const page=storyUI&&storyUI.pages[storyUI.i];
        html=page?info(`<b>${txt(page.title)}</b><div class="mobile-note">${txt(page.text)}</div>`):'';
        html+=add('ДАЛЬШЕ',()=>{if(storyUI){storyUI.t=9999;storyAdvance();}},{primary:true})+add('ПРОПУСТИТЬ',storyFinish);
        break;
      }
      case 'event': {
        const ev=evUI&&evUI.ev;
        heading=ev?ev.title:'СОБЫТИЕ';
        html=ev?info(txt(ev.text)):'';
        if(ev&&evUI.phase==='choose')html+=cards(ev.choices.map((c,i)=>{
          const label=typeof c.label==='function'?c.label(evUI):c.label;
          return add(label,()=>eventChoose(i),{card:true,desc:c.sub?c.sub(evUI):'',disabled:!eventChoiceAvailable(evUI,c)});
        }));
        else {if(evUI&&evUI.result)html+=info(`<b>${txt('Результат')}</b><div class="mobile-note">${txt(evUI.result)}</div>`);html+=add('ПРОДОЛЖИТЬ',closeEvent,{primary:true});}
        break;
      }
      case 'hatter': {
        heading='ШЛЯПНИК';const S=Hat.s;
        html=S?info(txt(S.line)):'';
        if(S){
          if(S.phase==='intro'||S.phase==='result'){
            if(!S.h.done)html+=add(`ИГРАТЬ ЗА ${S.h.fee} СЕРЕБРА`,hatterPlay,{primary:true,disabled:player.silver<S.h.fee});
            html+=add('УЙТИ',hatterLeave);
          } else if(S.phase==='pick')html+=cards(S.hats.map((h,i)=>add('Шляпа '+(i+1),()=>hatterPick(h.slot),{card:true})));
          else html+=info('Следи за шляпами…');
        }
        break;
      }
      default:heading='THE LAST LANTERN';html=add('В ГЛАВНОЕ МЕНЮ',()=>{state='title';});
    }
    return {heading,html};
  }
  function signature(){
    const d=Save.data;
    return [state,LANG,campTab,selHero,codexSel,chronSel,bestSel,d.embers,d.coins,
      Object.keys(d.heroes).filter(k=>d.heroes[k]).join(','),JSON.stringify(d.upgrades),
      JSON.stringify(d.armed),cfg().music,cfg().sfx,cfg().shake,cfg().bright,
      cfg().numbers,cfg().story,seedInput,
      storyUI&&storyUI.i,evUI&&evUI.phase,evUI&&evUI.sel,Hat.s&&Hat.s.phase,
      endTimer>=.6,run&&run.kills].join('|');
  }
  function buildMenu(force=false){
    if(state==='play')return;
    const sig=signature();if(!force&&sig===lastMenuSignature)return;
    lastMenuSignature=sig;
    const oldScroll=menuContent.scrollTop;
    const {heading,html}=composeMenu();
    menuTitle.textContent=tr(heading);menuContent.innerHTML=html;
    if(lastMode===state)menuContent.scrollTop=oldScroll;
    else menuContent.scrollTop=0;
    $('mobile-back').hidden=state==='title'||state==='event'||state==='hatter';
  }
  window.updateMobileUI=function updateMobileUI(){
    if(state==='play'){
      if(lastMode!=='play'){playUI.hidden=false;menuUI.hidden=true;resetAll();lastStatus='';}
      lastMode='play';presentWorld();return;
    }
    if(lastMode==='play'){resetAll();lastStatus='';}
    playUI.hidden=true;menuUI.hidden=false;
    // Hatter / event screen phases can change as the game loop progresses.
    const now=Date.now();
    if(lastMode!==state||now-lastBuildAt>130){buildMenu(lastMode!==state);lastBuildAt=now;}
    lastMode=state;
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden){resetAll();if(state==='play')handleKey('Escape');}});
  window.addEventListener('pagehide',resetAll);
  window.updateMobileUI();
})();
