import { attackPosition,attackTrajectory,trajectoryTouches,PLAYER_RADIUS } from './geometry.js';
export { PLAYER_RADIUS };
const freezePath=e=>Object.freeze({...e,from:Object.freeze({...e.from}),to:Object.freeze({...e.to}),playerFrom:Object.freeze({...e.playerFrom}),playerTo:Object.freeze({...e.playerTo})});
// The older variants remain valid for stored contexts and independent technical fixtures.
export const VARIANTS=Object.freeze({
 fast:Object.freeze({id:'fast',speed:14,radius:.22,ttl:6,range:60,color:0xffd285}),
 hook_linear:Object.freeze({id:'hook_linear',speed:10,radius:.32,ttl:6,range:45,color:0x92d8f3}),
 aoe_zone:Object.freeze({id:'aoe_zone',speed:0,radius:2,ttl:3,range:0,color:0xc689f3,shape:'circle'}),
 slow:Object.freeze({id:'slow',speed:7,radius:.4,ttl:8,range:50,color:0xe89bdd}),
 arcane_bolt:Object.freeze({id:'arcane_bolt',label:'Disparo arcano',shape:'bolt',speed:25,radius:.5,windup:.65,ttl:5,range:100,color:0x43e5ff}),
 sun_beam:Object.freeze({id:'sun_beam',label:'Feixe solar',shape:'beam',speed:0,radius:.9,windup:1.15,ttl:.22,range:0,length:85,color:0xffd558}),
 artillery:Object.freeze({id:'artillery',label:'Bombardeio astral',shape:'circle',speed:0,radius:2.1,windup:1,ttl:.24,range:0,color:0x75a5ff}),
 flame_circle:Object.freeze({id:'flame_circle',label:'Pilar de fogo',shape:'circle',speed:0,radius:2.5,windup:1.15,ttl:.35,range:0,color:0xff9446}),
 cage:Object.freeze({id:'cage',label:'Gaiola sombria',shape:'ring',speed:0,radius:3.2,wallWidth:.22,windup:1.2,ttl:2.2,range:0,color:0xc58aff}),
});
export function createAttackData({origin,direction,variant='fast',config=VARIANTS[variant],caster=null}={}){
 const shape=config?.shape??VARIANTS[variant]?.shape??'bolt',windup=config?.windup??0,length=config?.length??0,wallWidth=config?.wallWidth??.22;
 if(!VARIANTS[variant]||!config||!['bolt','beam','circle','ring'].includes(shape)||![origin?.x,origin?.z,direction?.x,direction?.z,config.speed,config.radius,config.ttl,config.range,windup,length,wallWidth].every(Number.isFinite)||config.speed<0||config.range<0||config.radius<=0||config.ttl<=0||windup<0||windup>5||wallWidth<0||(shape==='bolt'&&(config.speed<=0||config.range<=0))||(shape!=='bolt'&&config.speed!==0)||(shape==='beam'&&(length<=0||length>200))||(caster&&![caster.x,caster.z].every(Number.isFinite)))throw new TypeError('Invalid projectile configuration.');
 const norm=Math.hypot(direction.x,direction.z);if(norm===0)throw new TypeError('Projectile direction is zero.');
 return {variant,shape,position:{...origin},origin:{...origin},caster:caster?{...caster}:null,direction:{x:direction.x/norm,z:direction.z/norm},speed:config.speed,radius:config.radius,ttl:windup+Math.min(config.ttl,shape==='bolt'?config.range/config.speed:Infinity),range:config.range,windup,length,wallWidth,pathHint:config.pathHint??'full',hintDuration:config.hintDuration??5,age:0,distance:0};
}
export function createProjectiles({capacity=8,isRunning=()=>true,onEvent=()=>{}}={}) {
 if(!Number.isInteger(capacity)||capacity<1||capacity>100)throw new TypeError('Invalid projectile capacity.');
 const active=new Map();let sequence=0;
 const snapshot=()=>Object.freeze([...active.values()].map(p=>Object.freeze({...p,phase:p.age+1e-9<p.windup?'warning':'active',position:Object.freeze({...p.position}),origin:Object.freeze({...p.origin}),caster:p.caster?Object.freeze({...p.caster}):null,direction:Object.freeze({...p.direction})})));
 function remove(p,reason){active.delete(p.id);onEvent(Object.freeze({type:'removed',id:p.id,variant:p.variant,reason}));}
 return {snapshot,spawn(options={}){
  const p=createAttackData(options);if(active.size>=capacity)return null;p.id=`projectile-${++sequence}`;active.set(p.id,p);onEvent(Object.freeze({type:'spawn',id:p.id,variant:p.variant}));
  if(p.windup>0&&options.aim){const to=['beam','bolt'].includes(p.shape)?{x:p.origin.x+p.direction.x*(p.length||p.range),z:p.origin.z+p.direction.z*(p.length||p.range)}:{...p.origin};onEvent(freezePath({type:'warning',id:p.id,variant:p.variant,shape:p.shape==='bolt'?'beam':p.shape,wallWidth:p.wallWidth,radius:p.radius,from:{...p.origin},to,playerFrom:{...options.aim},playerTo:{...options.aim}}));}return p.id;
 },update(dt,previousPlayer,player){
  if(!Number.isFinite(dt)||dt<=0)return;if(![previousPlayer?.x,previousPlayer?.z,player?.x,player?.z].every(Number.isFinite))throw new TypeError('Invalid player position.');
  for(const p of [...active.values()]){if(!isRunning())break;
   const endAge=Math.min(p.age+dt,p.ttl),fraction=(endAge-p.age)/dt,playerEnd={x:previousPlayer.x+(player.x-previousPlayer.x)*fraction,z:previousPlayer.z+(player.z-previousPlayer.z)*fraction};
   const trajectory=attackTrajectory(p,p.age,endAge,previousPlayer,playerEnd);p.age=endAge;p.position=attackPosition(p,p.age);p.distance=p.speed*Math.max(0,p.age-p.windup);
   if(trajectory){onEvent(freezePath({type:'trajectory',id:p.id,variant:p.variant,...trajectory}));if(trajectoryTouches(trajectory)){onEvent(Object.freeze({type:'impact',id:p.id,variant:p.variant}));remove(p,'impact');continue;}}
   if(p.age>=p.ttl)remove(p,'expired');
  }
 },clear(){for(const p of [...active.values()])remove(p,'disposed');}};
}
