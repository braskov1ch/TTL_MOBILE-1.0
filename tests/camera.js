'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s={W:960,H:588,HUD_H:44,CX:480,CY:316,Math,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,k)=>a+(b-a)*k};
vm.createContext(s);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/mobile_camera.js'),'utf8')+';globalThis.camera=new MobileCamera()',s);
const c=s.camera, room={};
for(const [width,height] of [[390,570],[320,380],[590,280],[1200,650],[120,600]]){
 c.reset();
 for(const [x,y] of [[38,82],[922,550],[480,316]]){
  const r=c.update(width,height,{x,y,aimAng:0},room,1);
  assert(r.x>=0&&r.y>=44&&r.x+r.w<=960.0001&&r.y+r.h<=588.0001,'World bounds');
  assert(Math.abs(r.w/r.h-width/height)<1e-9,'No stretch');
 }
}
c.reset();let a=c.update(390,600,{x:350,y:300},room,0);let b=c.update(390,600,{x:600,y:300},room,.016);
assert(b.x>a.x&&b.x<600-b.w/2+36,'Smoothed follow');
let d=c.update(390,600,{x:100,y:300},{},.032);assert.equal(d.x,0,'Room transition snaps');
console.log('Camera: aspect ratios, bounds, smoothing and room transitions OK');
