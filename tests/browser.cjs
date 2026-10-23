'use strict';
const {chromium}=require('playwright'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file===root+path.sep)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/?touch=1`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu'],...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
try{
 const page=await browser.newPage({hasTouch:true,locale:'ru-RU',viewport:{width:844,height:390}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(url);await page.waitForTimeout(200);
 await page.evaluate(()=>{Save.data.prologue=true;cfg().story=false;startRun('hunter');});await page.waitForTimeout(200);
 for(const [width,height] of [[844,390],[740,320],[390,844],[320,568],[1024,768]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const rects=await page.evaluate(()=>['mobile-view','mobile-status','mobile-stick','mobile-attack','mobile-skill','mobile-potion','mobile-dash','mobile-active'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const r of rects){assert(r.x>=-1&&r.y>=-1&&r.x+r.w<=width+1&&r.y+r.h<=height+1,`${r.id} outside ${width}x${height}`);if(r.id.startsWith('mobile-')&&!['mobile-view','mobile-status'].includes(r.id))assert(r.w>=44&&r.h>=44,`${r.id} too small: ${r.w}x${r.h}`);}
  if(process.env.QA_SCREENSHOTS){fs.mkdirSync(process.env.QA_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.QA_SCREENSHOTS,`play-${width}x${height}.png`)});}
 }
 await page.setViewportSize({width:844,height:390});
 const session=await page.context().newCDPSession(page);
 const stick=await page.locator('#mobile-stick').boundingBox(),attack=await page.locator('#mobile-attack').boundingBox();
 const points=[{id:1,x:stick.x+stick.width*.8,y:stick.y+stick.height/2},{id:2,x:attack.x+attack.width/2,y:attack.y+attack.height/2}];
 const x0=await page.evaluate(()=>player.x);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await page.waitForTimeout(120);
 assert(await page.evaluate(()=>mobileInput.moveX>0&&mobileInput.attack&&player.x>0),'Simultaneous move + attack');assert(await page.evaluate(()=>player.x)>x0,'Physical touch moves hero');
 await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.waitForTimeout(50);assert(await page.evaluate(()=>mobileInput.moveX===0&&!mobileInput.attack),'Touch cancellation resets input');
 await page.locator('#mobile-map-button').click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>state),'pause');assert(await page.locator('#mobile-map').isVisible());await page.locator('#mobile-back').click();await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>state),'play');
 await page.evaluate(()=>{state='seed';updateMobileUI();});const input=page.locator('#mobile-seed-input');await input.fill('ABC123');await page.waitForTimeout(350);assert(await input.evaluate(el=>document.activeElement===el),'Seed input retains focus');assert.equal(await page.evaluate(()=>seedInput),'ABC123');
 for(const screen of ['title','camp','settings','help','relics','chronicle','bestiary','achievements','stats','pause','dead','win']){await page.evaluate(screen=>{state=screen;updateMobileUI();},screen);assert(await page.locator('#mobile-menu-title').innerText(),screen+' title');}
 await page.evaluate(()=>{curRoom.event=EVENTS[0];curRoom.evDone=false;startEvent(curRoom);updateMobileUI();});assert.equal(await page.evaluate(()=>state),'event');assert(await page.locator('#mobile-menu-content button').count()>0);
 await page.evaluate(()=>{curRoom.hatter={x:CX,y:CY,fee:1,rounds:0,done:false};player.silver=10;openHatter(curRoom);hatterPlay();updateMobileUI();});await page.waitForTimeout(150);assert(await page.locator('#mobile-hat-table').isVisible(),'Hatter animation surface');
 await page.evaluate(()=>{state='play';updateMobileUI();mobileInput.moveX=1;mobileInput.attack=true;window.dispatchEvent(new Event('blur'));});assert(await page.evaluate(()=>state==='pause'&&mobileInput.moveX===0&&!mobileInput.attack),'Background resets and pauses');
 for(const hero of await page.evaluate(()=>HERO_ORDER)){await page.evaluate(id=>{startRun(id);mobileInput.attack=true;mobileInput.skill=true;},hero);await page.waitForTimeout(70);await page.evaluate(()=>{mobileInput.attack=false;mobileInput.skill=false;});}
 assert.deepEqual(errors,[],'Browser runtime errors');
 // Desktop continues to use its original renderer.
 const desktop=await browser.newPage({viewport:{width:1280,height:720}});desktop.on('pageerror',e=>errors.push(e.message));await desktop.goto(url.replace('?touch=1',''));await desktop.evaluate(()=>{Save.data.prologue=true;cfg().story=false;startRun('hunter');});await desktop.waitForTimeout(150);assert.equal(await desktop.evaluate(()=>mobileInput.active),false);assert.deepEqual(errors,[]);
 console.log('Browser OK: 5 viewport sizes, real multi-touch, cancellation, map/pause, seed focus, 12 menus, event, Hatter, blur and desktop.');
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
