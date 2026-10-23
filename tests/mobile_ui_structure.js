'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const path=require('node:path'),root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/style.css'),'utf8');
const js=fs.readFileSync(path.join(root,'js/mobile.js'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate DOM ID');
for(const id of ['mobile-view','mobile-menu-content','mobile-status','mobile-stick','mobile-attack','mobile-skill','mobile-dash','mobile-potion','mobile-flask','mobile-active'])
  assert(ids.includes(id),'Missing mobile element '+id);
assert(css.includes('.mobile-layout')&&css.includes('.mobile-arena'),'Missing independent mobile layout');
assert(css.includes('body.mobile-mode #game'),'Desktop canvas should be hidden on mobile');
assert(js.includes('renderGame(true)')&&!js.includes('surface.drawImage(cvs'),'Mobile must render the world directly');
assert(js.includes('camera.update')&&js.includes('sourceRect'),'Missing adaptive camera');
assert(js.includes('HERO_ORDER.map')&&js.includes('SETTINGS_ROWS.map'),'Missing mobile camp/settings');
for(const [,script] of html.matchAll(/<script src="([^"]+\.js)"/g)){
 const code=fs.readFileSync(path.join(root,script),'utf8');
 new vm.Script(code,{filename:script});
}
console.log('Dedicated mobile layout and syntax OK');
