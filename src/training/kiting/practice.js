import { createEnemyCombat } from './enemyCombat.js';
import { readonlySnapshot } from '../snapshot.js';
import { safeDelta,MOVEMENT_SPEED } from '../movement.js';
import { ARENA,isInsideArena } from '../../game3d/spatial.js';
import { createRandom } from '../../core/random.js';
import { kitingDifficulty } from './difficulty.js';
export function inAttackRange(player,target,range){return Boolean(isInsideArena(player)&&isInsideArena(target)&&Number.isFinite(range)&&range>0&&Math.hypot(player.x-target.x,player.z-target.z)<=range+1e-10);}
/** Manual attacks select one eligible enemy. The locked target cannot change during a windup. */
export function createKitingPractice({variant='static',level=1,rng=createRandom(),isRunning=()=>true,playerPosition=()=>({x:0,z:0}),events,attemptId='technical',duration=60,damageEnabled=true}={}){
 const config=kitingDifficulty(level,variant);if(![20,60].includes(duration))throw new TypeError('Invalid duration.');
 const waves=['waves','combat'].includes(variant),combat=variant==='combat'?createEnemyCombat({config,events,attemptId,damageEnabled}):null;
 let state='idle',phase='ready',selectedId=null,lockedId=null,time=0,remaining=0,cooldown=0,sequence=0,lastAction='Pronto',messageTime=0;
 let enemySequence=config.targetCount,kills=0,desiredPopulation=1,nextSpawn=Infinity,pressureAt=config.spawnInterval??Infinity;
 const enemies=Array.from({length:config.targetCount},(_,i)=>{const angle=-Math.PI*.75+i*Math.PI*2/config.targetCount;return {enemyKind:'melee',health:config.maxHealth??3,maxHealth:config.maxHealth??3,pressureArmed:false,id:i?`kiting-target-${i+1}`:'kiting-target',position:i?{x:Math.sin(angle)*Math.sqrt(18),z:Math.cos(angle)*Math.sqrt(18)}:{x:-3,z:-3},destination:{x:3,z:-3},velocity:{x:0,z:0},decision:0,rest:0};});
 let accepted=0,shots=0,hits=0,cancellations=0,distance=0,between=0,cycles=0,lastHit=null,lastAttack=null,histogram=Array(duration===60?6:4).fill(0);
 const running=()=>state==='active'&&isRunning();
 const targetData=e=>({id:e.id,enemyKind:e.enemyKind??'melee',attackPhase:e.attackPhase??'ready',attackRemaining:e.attackRemaining??0,position:e.position,radius:config.targetRadius,health:e.health,maxHealth:e.maxHealth});
 const snapshot=()=>readonlySnapshot({kind:'kiting',...(combat?.snapshot()??{}),state,variant,level,config,selected:Boolean(selectedId),selectedTargetId:selectedId,phase,cooldown,windupRemaining:remaining,lastAction,elapsed:time,target:targetData(enemies.find(e=>e.id===(lockedId??selectedId))??enemies[0]??{id:'none',position:playerPosition(),health:0,maxHealth:config.maxHealth??3}),targets:enemies.map(targetData),lastAttack,kills,wave:Math.max(1,kills+1),accepted,shots,hits,cancellations,totalDistanceMoved:distance,rhythmOpportunities:Math.max(0,hits-1),rhythmCycles:cycles,histogram,spacing:null});
 function notify(type,enemy){events?.emit(`kiting:${type}`,readonlySnapshot({attemptId,attackId:`attack-${sequence}`,time,variant,level,targetId:enemy?.id??lockedId,position:enemy?{...enemy.position}:undefined}));}
 function cancel(reason){if(phase!=='windup')return false;phase='recovery';remaining=0;cooldown=config.cancelCooldown;cancellations++;lastAction=reason;messageTime=.5;notify('cancelled');lockedId=null;return true;}
 function random(){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Invalid kiting RNG.');return n;}
 function spawnEnemy(){
  const player=playerPosition();let position;for(let i=0;i<24;i++){const angle=random()*Math.PI*2,radius=6+random()*2;const p={x:Math.max(-12,Math.min(12,player.x+Math.sin(angle)*radius)),z:Math.max(-18,Math.min(18,player.z+Math.cos(angle)*radius))};if(Math.hypot(p.x-player.x,p.z-player.z)>=4&&!enemies.some(e=>Math.hypot(e.position.x-p.x,e.position.z-p.z)<1.5)){position=p;break;}}
  if(!position)return false;const enemyKind=variant==='combat'&&level>=3&&((enemySequence+1)%3===0||level>=6&&(enemySequence+1)%2===0)?'ranged':'melee';enemies.push({id:`wave-enemy-${++enemySequence}`,enemyKind,position,health:config.maxHealth,maxHealth:config.maxHealth,pressureArmed:false,destination:{...position},velocity:{x:0,z:0},decision:0,rest:0});return true;
 }
 function manageWaves(){if(!waves)return;
  if(level>=4&&time>=pressureAt){desiredPopulation=Math.min(config.maxTargets,desiredPopulation+1);nextSpawn=Math.min(nextSpawn,time);pressureAt=time+config.spawnInterval;}
  if(enemies.length<desiredPopulation&&time>=nextSpawn){spawnEnemy();nextSpawn=time+.6;}
 }
 function moveEnemies(dt,player){
  if(variant==='static')return;
  const positions=enemies.map(e=>({...e.position}));
  for(const [index,e]of enemies.entries()){
   const target=e.position;if(combat&&e.attackPhase==='windup')continue;
   if(['spacing','waves','combat'].includes(variant)){
    let dx=player.x-target.x,dz=player.z-target.z;const distance=Math.hypot(dx,dz),approach=Math.max(0,distance-(e.enemyKind==='ranged'?4.6:config.minimumSeparation));
    dx=distance?dx/distance:0;dz=distance?dz/distance:0;
    for(const [j,other]of positions.entries()){if(j===index)continue;const sx=target.x-other.x,sz=target.z-other.z,d=Math.hypot(sx,sz);if(d>1e-6&&d<1.6){const repel=(1.6-d)/1.6*2;dx+=sx/d*repel;dz+=sz/d*repel;}}
    const norm=Math.hypot(dx,dz),step=Math.min(config.targetSpeed*dt,approach);if(norm&&step>0){target.x+=dx/norm*step;target.z+=dz/norm*step;}
   }else{
    e.decision-=dt;if(e.decision<=0){e.destination={x:(random()-.5)*12,z:-7+random()*10};e.decision=config.decisionInterval;e.rest=random()<.2?.3:0;}
    e.rest=Math.max(0,e.rest-dt);const dx=e.destination.x-target.x,dz=e.destination.z-target.z,d=Math.hypot(dx,dz),speed=e.rest?0:Math.min(config.targetSpeed,d*2),blend=1-Math.exp(-5*dt);
    e.velocity.x+=((d?dx/d*speed:0)-e.velocity.x)*blend;e.velocity.z+=((d?dz/d*speed:0)-e.velocity.z)*blend;target.x+=e.velocity.x*dt;target.z+=e.velocity.z*dt;
   }
   const side=waves?ARENA.bounds.maxX-1:8;
   target.x=Math.max(-side,Math.min(side,target.x));target.z=Math.max(-18,Math.min(18,target.z));
  }
 }
 return {kind:'kiting',snapshot,
 start(){if(state!=='idle')return false;state='active';return true;},
 click(aim){
  if(!running()||phase!=='ready'||cooldown>1e-10)return false;
  const player=playerPosition(),eligible=enemies.filter(e=>inAttackRange(player,e.position,config.attackRange));
  let enemy;if(typeof aim==='string')enemy=eligible.find(e=>e.id===aim);
  else{const point=aim&&[aim.x,aim.z].every(Number.isFinite)?aim:player;enemy=eligible.reduce((best,e)=>!best||Math.hypot(e.position.x-point.x,e.position.z-point.z)<Math.hypot(best.position.x-point.x,best.position.z-point.z)?e:best,null);}
  if(!enemy){lastAction='Nenhum inimigo no alcance';messageTime=.5;return false;}
  selectedId=lockedId=enemy.id;accepted++;sequence++;phase='windup';remaining=config.windupDuration;cooldown=config.attackInterval;lastAction='Preparando ataque';messageTime=0;notify('intention',enemy);return true;
 },
 moveCommand(){if(!running())return false;return cancel('Cancelado por movimento');},
 update(delta,previous=playerPosition(),next=playerPosition()){
  if(!running())return;const dt=safeDelta(delta);if(!dt)return;time+=dt;messageTime=Math.max(0,messageTime-dt);
  const moved=Math.hypot(next.x-previous.x,next.z-previous.z);if(Number.isFinite(moved)&&moved<=(config.playerSpeed??MOVEMENT_SPEED)*dt+1e-7){distance+=moved;if(lastHit!==null)between+=moved;}
  manageWaves();moveEnemies(dt,next);cooldown=Math.max(0,cooldown-dt);if(combat?.update(dt,enemies,previous,next)){state='defeated';phase='inactive';remaining=0;selectedId=lockedId=null;lastAction='Derrota';return;}
  if(phase==='windup'){
   remaining=Math.max(0,remaining-dt);if(remaining<=1e-10){const enemy=enemies.find(e=>e.id===lockedId);
    if(!enemy||!inAttackRange(next,enemy.position,config.attackRange))cancel('Cancelado: alvo fora de alcance');
    else{phase='recovery';shots++;hits++;histogram[Math.min(histogram.length-1,Math.floor(time/(duration/histogram.length)))]++;if(lastHit!==null&&between>=config.cycleDistance)cycles++;between=0;lastHit=time;lastAction='Ataque confirmado';messageTime=.15;lastAttack={id:sequence,targetId:enemy.id,at:time,from:{...next},to:{...enemy.position}};notify('confirmed',enemy);if(waves){enemy.health=Math.max(0,enemy.health-1);if(enemy.health===0){kills++;enemies.splice(enemies.indexOf(enemy),1);selectedId=null;desiredPopulation=Math.min(config.maxTargets,1+kills);nextSpawn=time+.45;}else if(level>=3&&enemy.health<=1&&!enemy.pressureArmed){enemy.pressureArmed=true;desiredPopulation=Math.min(config.maxTargets,desiredPopulation+1);nextSpawn=Math.min(nextSpawn,time+.3);}}lockedId=null;}
   }
  }
  if(phase==='recovery'&&cooldown<=1e-10){phase='ready';cooldown=0;}
  if(!messageTime&&phase!=='windup')lastAction=phase==='ready'?'Pronto':'Recuperando';
 },
 stop(){if(state==='disposed')return;state='stopped';combat?.stop();remaining=cooldown=0;phase='inactive';selectedId=lockedId=null;},
 dispose(){state='disposed';combat?.stop();remaining=cooldown=0;phase='inactive';selectedId=lockedId=null;},
 };
}
