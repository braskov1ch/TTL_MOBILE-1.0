// Executed inside the shared game VM by tests/run.js.
Save.data.prologue=true;cfg().story=false;
for(const direction of DIRS){
 for(const input of ['touch','keyboard']){
  startRun('hunter');
  const origin=curRoom;
  const target={doors:{[direction.opp]:{locked:false}}};
  grid.set('door-test-target',target);
  origin.doors={[direction.name]:{to:'door-test-target',locked:false,hidden:false}};
  origin.cleared=true;
  player.x=direction.dx<0?PLAY.x+player.r:direction.dx>0?PLAY.x+PLAY.w-player.r:CX;
  player.y=direction.dy<0?PLAY.y+player.r:direction.dy>0?PLAY.y+PLAY.h-player.r:CY;
  for(const k in keys)keys[k]=false;
  mobileInput.active=input==='touch';mobileInput.moveX=mobileInput.moveY=0;
  let entered=null;
  const originalEnter=enterRoomObj;
  enterRoomObj=(room,x,y)=>{entered={room,x,y};};
  try{
   checkDoors();CIassert(!entered,'No automatic door entry while idle');
   if(input==='touch'){mobileInput.moveX=direction.dx;mobileInput.moveY=direction.dy;}
   else keys[{u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD'}[direction.name]]=true;
   origin.cleared=false;checkDoors();CIassert(!entered,'Combat door remains closed');origin.cleared=true;
   origin.doors[direction.name].hidden=true;checkDoors();CIassert(!entered,'Hidden door remains closed');origin.doors[direction.name].hidden=false;
   origin.doors[direction.name].locked=true;target.doors[direction.opp].locked=true;player.keys=0;
   checkDoors();CIassert(!entered&&origin.doors[direction.name].locked,'Locked door needs key');
   player.keys=1;checkDoors();CIassert(player.keys===0&&!origin.doors[direction.name].locked&&!target.doors[direction.opp].locked,'Unlock both sides once');
   checkDoors();CIassert(entered&&entered.room===target,'Enter '+direction.name+' using '+input);
   CIassert(entered.x>=PLAY.x+player.r&&entered.x<=PLAY.x+PLAY.w-player.r&&entered.y>=PLAY.y+player.r&&entered.y<=PLAY.y+PLAY.h-player.r,'Spawn within target bounds');
   CIassert(player.keys===0,'Key not spent twice');
   if(input==='touch'){
    entered=null;mobileInput.moveX=-direction.dx;mobileInput.moveY=-direction.dy;checkDoors();CIassert(!entered,'Moving away does not enter');
    mobileInput.moveX=direction.dx*.1;mobileInput.moveY=direction.dy*.1;checkDoors();CIassert(!entered,'Stick dead zone does not enter');
    mobileInput.moveX=direction.dx;mobileInput.moveY=direction.dy;mobileInput.active=false;checkDoors();CIassert(!entered,'Inactive touch ignored');
   }
  }finally{enterRoomObj=originalEnter;}
 }
}
