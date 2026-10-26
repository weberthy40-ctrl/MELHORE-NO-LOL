import { readonlySnapshot } from '../snapshot.js';
import { safeDelta } from '../movement.js';
import { MOVEMENT_SPEED } from '../movement.js';
import { isInsideArena } from '../../game3d/spatial.js';
import { createRandom } from '../../core/random.js';
import { kitingDifficulty } from './difficulty.js';
export function inAttackRange(player,target,range){return Boolean(isInsideArena(player)&&isInsideArena(target)&&Number.isFinite(range)&&range>0&&Math.hypot(player.x-target.x,player.z-target.z)<=range+1e-10);}
/** Attack intention, cancellation and confirmation are separate, using only active delta. */
export function createKitingPractice({variant='static',level=1,rng=createRandom(),isRunning=()=>true,playerPosition=()=>({x:0,z:0}),events,attemptId='technical',duration=60}={}){
 const config=kitingDifficulty(level,variant);if(![20,60].includes(duration))throw new TypeError('Invalid duration.');
 let state='idle',phase='ready',selected=false,time=0,remaining=0,cooldown=0,sequence=0,lastAction='Pronto',messageTime=0;
 let target={x:-3,z:-3},destination={x:3,z:-3},velocity={x:0,z:0},decision=0,rest=0;
 let accepted=0,shots=0,hits=0,cancellations=0,distance=0,between=0,cycles=0,lastHit=null,histogram=Array(duration===60?6:4).fill(0);
 const running=()=>state==='active'&&isRunning();
 const snapshot=()=>readonlySnapshot({kind:'kiting',state,variant,level,config,selected,phase,cooldown,windupRemaining:remaining,lastAction,elapsed:time,target:{id:'kiting-target',position:target,radius:config.targetRadius},accepted,shots,hits,cancellations,totalDistanceMoved:distance,rhythmOpportunities:Math.max(0,hits-1),rhythmCycles:cycles,histogram,spacing:null});
 function notify(type){events?.emit(`kiting:${type}`,readonlySnapshot({attemptId,attackId:`attack-${sequence}`,time,variant,level}));}
 function cancel(reason){if(phase!=='windup')return false;phase='recovery';remaining=0;cooldown=config.cancelCooldown;cancellations++;lastAction=reason;messageTime=.5;notify('cancelled');return true;}
 function random(){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Invalid kiting RNG.');return n;}
 function moveTarget(dt,player){
  if(variant==='static')return;
  if(variant==='spacing'){
   const dx=player.x-target.x,dz=player.z-target.z,d=Math.hypot(dx,dz),step=Math.min(config.targetSpeed*dt,Math.max(0,d-config.minimumSeparation));
   if(d>0){target.x+=dx/d*step;target.z+=dz/d*step;}return;
  }
  decision-=dt;if(decision<=0){destination={x:(random()-.5)*12,z:-7+random()*10};decision=config.decisionInterval;rest=random()<.2?.3:0;}
  rest=Math.max(0,rest-dt);const dx=destination.x-target.x,dz=destination.z-target.z,d=Math.hypot(dx,dz),speed=rest?0:Math.min(config.targetSpeed,d*2);
  const blend=1-Math.exp(-5*dt);velocity.x+=((d?dx/d*speed:0)-velocity.x)*blend;velocity.z+=((d?dz/d*speed:0)-velocity.z)*blend;
  target.x=Math.max(-7,Math.min(7,target.x+velocity.x*dt));target.z=Math.max(-10,Math.min(6,target.z+velocity.z*dt));
 }
 return {kind:'kiting',snapshot,
 start(){if(state!=='idle')return false;state='active';return true;},
 click(id){if(!running())return false;if(id!=='kiting-target'){selected=false;cancel('Cancelado: seleção removida');return false;}selected=true;
  if(phase!=='ready'||cooldown>1e-10)return false;
  if(!inAttackRange(playerPosition(),target,config.attackRange)){lastAction='Fora de alcance';messageTime=.5;return false;}
  accepted++;sequence++;phase='windup';remaining=config.windupDuration;cooldown=config.attackInterval;lastAction='Preparando ataque';messageTime=0;notify('intention');return true;
 },
 moveCommand(){if(!running())return false;return cancel('Cancelado por movimento');},
 update(delta,previous=playerPosition(),next=playerPosition()){
  if(!running())return;const dt=safeDelta(delta);if(!dt)return;time=Math.min(duration,time+dt);messageTime=Math.max(0,messageTime-dt);
  const moved=Math.hypot(next.x-previous.x,next.z-previous.z);if(Number.isFinite(moved)&&moved<=MOVEMENT_SPEED*dt+1e-7){distance+=moved;if(lastHit!==null)between+=moved;}
  moveTarget(dt,next);cooldown=Math.max(0,cooldown-dt);
  if(phase==='windup'){
   remaining=Math.max(0,remaining-dt);if(remaining<=1e-10){
    if(!selected||!inAttackRange(next,target,config.attackRange))cancel('Cancelado: alvo fora de alcance');
    else{phase='recovery';shots++;hits++;histogram[Math.min(histogram.length-1,Math.floor(time/(duration/histogram.length)))]++;if(lastHit!==null&&between>=config.cycleDistance)cycles++;between=0;lastHit=time;lastAction='Ataque confirmado';messageTime=.15;notify('confirmed');}
   }
  }
  if(phase==='recovery'&&cooldown<=1e-10){phase='ready';cooldown=0;}
  if(!messageTime&&phase!=='windup')lastAction=phase==='ready'?'Pronto':'Recuperando';
 },
 stop(){if(state==='disposed')return;state='stopped';remaining=cooldown=0;phase='inactive';selected=false;},
 dispose(){state='disposed';remaining=cooldown=0;phase='inactive';selected=false;},
 };
}
