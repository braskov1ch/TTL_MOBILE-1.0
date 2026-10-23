'use strict';
// Fast CI smoke checks. The full historical regression suite is stored in the original game archive.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
const styles=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(m=>m[1]);
assert(scripts.length>=20,'Missing game scripts');
assert(scripts.includes('js/mobile.js'),'Missing touch controls');
for(const p of [...scripts,...styles]){
 assert(!p.startsWith('/')&&!p.includes('..'),'Invalid path '+p);
 assert(fs.existsSync(path.join(ROOT,p)),'File missing '+p);
}
for(const p of scripts)new vm.Script(fs.readFileSync(path.join(ROOT,p),'utf8'),{filename:p});
console.log('Asset paths and syntax OK');
function graphics(){
 return new Proxy({},{get(o,k){
  if(k in o)return o[k];
  if(k==='measureText')return s=>({width:String(s).length*7});
  if(k==='createRadialGradient'||k==='createLinearGradient')return ()=>({addColorStop(){}});
  return ()=>undefined;
 },set(o,k,v){o[k]=v;return true;}});
}
function canvas(){return {width:0,height:0,style:{},getContext:()=>graphics(),getBoundingClientRect:()=>({left:0,top:0,width:960,height:588}),addEventListener(){}};}
const cases={
 doors:fs.readFileSync(path.join(__dirname,'doors.js'),'utf8'),
 smoke:"Save.data.prologue=true;cfg().story=false;startRun('hunter');CIassert(state==='play','game start');for(let i=0;i<3;i++)updatePlayer(1/60);CIassert(player.hp>0,'player hp');",
 mechanics:"Save.data.prologue=true;cfg().story=false;startRun('hunter');const before=player.x;mobileInput.active=true;mobileInput.moveX=1;for(let i=0;i<7;i++)updatePlayer(1/60);CIassert(player.x>before,'player movement');",
 v2:"CIassert(Object.keys(HEROES).length===9,'heroes');CIassert(Object.keys(ENEMY_DEFS).length===25,'enemies');CIassert(Object.keys(BOSS_BY_ID).length===12,'bosses');",
 i18n:"CIassert(typeof tr==='function','translation function');CIassert(Object.keys(EN).length>100,'translation dictionary');setLang('en');CIassert(typeof tr('Последний Фонарь')==='string','translation');",
 mobile:"Save.data.prologue=true;cfg().story=false;startRun('hunter');CIassert(state==='play','start');mobileInput.active=true;mouse.active=false;const x0=player.x;mobileInput.moveX=1;for(let i=0;i<7;i++)updatePlayer(1/60);CIassert(player.x>x0,'stick');mobileInput.moveX=mobileInput.moveY=0;mobileInput.attack=true;mobileInput.aimX=0;mobileInput.aimY=-1;mobileInput.aiming=true;updatePlayer(1/60);CIassert(Math.abs(player.aimAng+Math.PI/2)<0.01,'aim');CIassert(player.attacking,'attack');mobileInput.attack=false;mobileInput.aiming=false;mouse.active=false;mouse.down=false;const d=player.dashCharges;tryDash(0,1);CIassert(player.dashCharges===d-1,'dash');mobileInput.skill=true;player.dashing=0;player.skillCd=0;updatePlayer(1/60);CIassert(player.skillHeld,'skill held');mobileInput.skill=false;updatePlayer(1/60);CIassert(!player.skillHeld,'skill release');",
 balance:"for(const h of Object.values(HEROES))CIassert(h.maxHp>0&&h.dmg>0&&h.speed>0,'hero stats');for(const e of Object.values(ENEMY_DEFS))CIassert(e.hp>0&&e.r>0,'enemy stats');"
};
function one(name){
 const data={};
 const s={console,Math,Date,JSON,Object,Array,Set,Map,Number,String,Proxy,RegExp,Error,isNaN,parseInt,parseFloat,setTimeout,clearTimeout,
  performance:{now:()=>Date.now()},
  document:{getElementById:()=>canvas(),createElement:()=>canvas(),documentElement:{},title:''},
  localStorage:{getItem:k=>k in data?data[k]:null,setItem:(k,v)=>{data[k]=String(v)},removeItem:k=>{delete data[k]}},
  innerWidth:1280,innerHeight:720,addEventListener(){},requestAnimationFrame(){},require,__dirname
 };
 s.window=s;vm.createContext(s);
 for(const p of scripts)vm.runInContext(fs.readFileSync(path.join(ROOT,p),'utf8'),s,{filename:p});
 vm.runInContext("function CIassert(ok,msg){if(!ok)throw new Error(msg)};"+cases[name],s,{filename:'suite-'+name});
 console.log(name+' OK');
}
const mode=process.argv[2]||'all';
const selected=mode==='all'?['smoke','mechanics','v2','i18n','mobile','doors']:mode==='assets'?[]:[mode];
if(selected.some(k=>!(k in cases))){console.error('Unknown suite '+mode);process.exit(2)}
let failed=false;for(const name of selected){try{one(name)}catch(e){failed=true;console.error(name+' FAILED',e.stack||e)}}
if(failed)process.exitCode=1;
