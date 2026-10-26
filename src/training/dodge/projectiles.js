import { sweptCircle } from './collision.js';
export const PLAYER_RADIUS=0.45;
export const VARIANTS=Object.freeze({
  fast:Object.freeze({id:'fast',speed:14,radius:0.22,ttl:6,range:60,color:0xffd285}),
  hook_linear:Object.freeze({id:'hook_linear',speed:10,radius:0.32,ttl:6,range:45,color:0x92d8f3}),
  aoe_zone:Object.freeze({id:'aoe_zone',speed:0,radius:2,ttl:3,range:0,color:0xc689f3}),
  slow:Object.freeze({id:'slow',speed:7,radius:0.4,ttl:8,range:50,color:0xe89bdd}),
});
export function createProjectiles({capacity=8,isRunning=()=>true,onEvent=()=>{}}={}) {
  if(!Number.isInteger(capacity)||capacity<1||capacity>100)throw new TypeError('Invalid projectile capacity.');
  const active=new Map();let sequence=0;
  const snapshot=()=>Object.freeze([...active.values()].map(p=>Object.freeze({...p,position:Object.freeze({...p.position}),origin:Object.freeze({...p.origin}),direction:Object.freeze({...p.direction})})));
  function remove(p,reason){active.delete(p.id);onEvent(Object.freeze({type:'removed',id:p.id,variant:p.variant,reason}));}
  return {snapshot,spawn({origin,direction,variant='fast',config=VARIANTS[variant]}={}){
    if(!VARIANTS[variant]||!config||![origin?.x,origin?.z,direction?.x,direction?.z,config.speed,config.radius,config.ttl,config.range].every(Number.isFinite)||config.speed<0||config.range<0||(variant==='aoe_zone'&&config.speed!==0)||(variant!=='aoe_zone'&&(config.speed<=0||config.range<=0))||config.radius<=0||config.ttl<=0)throw new TypeError('Invalid projectile configuration.');
    const length=Math.hypot(direction.x,direction.z);if(length===0)throw new TypeError('Projectile direction is zero.');
    if(active.size>=capacity)return null;
    const p={id:`projectile-${++sequence}`,variant,position:{...origin},origin:{...origin},direction:{x:direction.x/length,z:direction.z/length},speed:config.speed,radius:config.radius,ttl:config.ttl,range:config.range,age:0,distance:0};active.set(p.id,p);
    onEvent(Object.freeze({type:'spawn',id:p.id,variant}));return p.id;
  },update(dt,previousPlayer,player){
    if(!Number.isFinite(dt)||dt<=0)return;
    if(![previousPlayer?.x,previousPlayer?.z,player?.x,player?.z].every(Number.isFinite))throw new TypeError('Invalid player position.');
    for(const p of [...active.values()]){
      if(!isRunning())break;
      const duration=Math.min(dt,p.ttl-p.age,p.variant==='aoe_zone'?Infinity:(p.range-p.distance)/p.speed),fraction=duration/dt;
      const next={x:p.position.x+p.direction.x*p.speed*duration,z:p.position.z+p.direction.z*p.speed*duration};
      const playerEnd={x:previousPlayer.x+(player.x-previousPlayer.x)*fraction,z:previousPlayer.z+(player.z-previousPlayer.z)*fraction};
      onEvent(Object.freeze({type:'trajectory',id:p.id,variant:p.variant,radius:p.radius,from:Object.freeze({...p.position}),to:Object.freeze({...next}),playerFrom:Object.freeze({...previousPlayer}),playerTo:Object.freeze({...playerEnd})}));
      const impact=sweptCircle({x:p.position.x-previousPlayer.x,z:p.position.z-previousPlayer.z},{x:next.x-playerEnd.x,z:next.z-playerEnd.z},PLAYER_RADIUS+p.radius);
      p.position=next;p.age+=duration;p.distance+=p.speed*duration;
      if(impact!==null){onEvent(Object.freeze({type:'impact',id:p.id,variant:p.variant}));remove(p,'impact');}
      else if(p.age>=p.ttl||(p.variant!=='aoe_zone'&&p.distance>=p.range))remove(p,'expired');
    }
  },clear(){for(const p of [...active.values()])remove(p,'disposed');}};
}
