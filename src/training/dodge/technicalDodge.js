import { hasEscape } from './fairness.js';
import { difficultyFor,validateDifficulty } from './difficulty.js';
import { ARENA,DODGE_ARENA } from '../../game3d/spatial.js';
import { createProjectiles,createAttackData,PLAYER_RADIUS,VARIANTS } from './projectiles.js';
import { createSelector,createRandom } from './random.js';
import { DODGE_MOVEMENT_SPEED } from '../movement.js';
import { trajectoryTouches } from './geometry.js';
import { createPressureDirector } from './pressure.js';
export function createTechnicalDodge({rng=createRandom(),level=1,profile=difficultyFor(level),interval=profile.interval,capacity=profile.capacity,events,attemptId=null,mode='technical',intensity=1,adaptive=false,isRunning=()=>true,canSpawn=()=>true}={}){
 validateDifficulty(profile);
 if(!Number.isFinite(interval)||interval<.06||!Number.isInteger(capacity)||capacity<1||capacity>20)throw new TypeError('Invalid attack cadence or capacity.');
 const options=Object.freeze({...profile,weights:Object.freeze({...profile.weights})}),director=createPressureDirector({intensity,adaptive}),qualified=new Set(),select=createSelector({rng,weights:options.weights});
 let elapsed=0,clock=0,shots=0,impacts=0,disposed=false,sinceCombo=Infinity,attempts=0,rejected=0,peak=0,combinations=0,avoided=0,distanceMoved=0,lastCaster=null,pending=[],patterns=new Set();
 const limit=()=>Math.min(20,Math.ceil(capacity*Math.sqrt(director.snapshot().current)));
 const projectiles=createProjectiles({capacity:20,isRunning,onEvent(event){
  if(['warning','trajectory'].includes(event.type)&&trajectoryTouches(event,.5))qualified.add(event.id);
  if(event.type==='impact'){impacts++;director.observe(false,elapsed);qualified.delete(event.id);}
  if(event.type==='removed'){if(event.reason==='expired'&&qualified.has(event.id)){avoided++;director.observe(true,elapsed);}qualified.delete(event.id);}
  events?.emit(`dodge:${event.type}`,Object.freeze({...event,attemptId,mode,level:options.level}));
 }});
 function launch(job,player){
  attempts++;const active=projectiles.snapshot(),pressure=director.snapshot().current;if(active.length>=limit()){rejected++;return null;}
  const variant=job.variant&&Object.hasOwn(options.weights,job.variant)?job.variant:select(),base=VARIANTS[variant],caster=chooseCasterOrigin(player,rng,{avoid:lastCaster}),ground=['circle','ring'].includes(base.shape),speed=base.speed*(options.speedFactor??1)*Math.sqrt(pressure),distance=Math.hypot(player.x-caster.x,player.z-caster.z);
  if(distance<9){rejected++;return null;}
  // Capture the character's position at conjuration, never the cursor, destination or velocity.
  const aim={x:player.x,z:player.z},angle=Math.atan2(aim.x-caster.x,aim.z-caster.z),direction={x:Math.sin(angle),z:Math.cos(angle)},origin=ground?aim:caster;
  const config={...base,speed,pathHint:options.pathHint,hintDuration:options.hintDuration,pattern:job.pattern??'single',length:base.shape==='beam'?Math.max(base.length,distance+6):base.length,windup:Math.max(base.shape==='bolt'?.2:.78,((base.windup??1)-(options.level-1)*(base.shape==='bolt'?.017:.03))*(options.warningFactor??1))};
  const data={origin,direction,variant,config,caster,aim:player},candidate=createAttackData(data);
  if(!hasEscape(player,[...active,candidate],options)){rejected++;return null;}
  const id=projectiles.spawn(data);if(!id)return null;shots++;lastCaster=caster;peak=Math.max(peak,active.length+1);if(active.length)combinations++;patterns.add(job.pattern??'single');return {caster,aim};
 }
 return {kind:'dodge',snapshot:()=>Object.freeze({kind:'dodge',level:options.level,rulesetVersion:options.rulesetVersion,playerSpeed:options.playerSpeed,elapsed,shots,impacts,attempts,rejected,peak,combinations,avoided,distanceMoved,focus:options.focus??'mixed',capacity:limit(),pressure:director.snapshot(),patterns:Object.freeze([...patterns]),projectiles:projectiles.snapshot()}),
 update(dt,previous,player,{allowSpawns=true}={}){
  if(disposed||!isRunning()||!Number.isFinite(dt)||dt<=0)return;elapsed+=dt;const moved=Math.hypot(player.x-previous.x,player.z-previous.z);if(moved<=options.playerSpeed*dt+1e-6)distanceMoved+=moved;projectiles.update(dt,previous,player);if(!isRunning()||!canSpawn())return;clock+=dt;sinceCombo+=dt;if(!allowSpawns)return;
  if(pending.length&&elapsed>=pending[0].at){launch(pending.shift(),player);return;}
  const pressure=director.snapshot().current;if(clock<interval/pressure)return;clock=0;
  const combo=!pending.length&&sinceCombo>=options.peakCooldown/Math.sqrt(pressure)&&rng()<options.comboChance,candidates=Object.hasOwn(options.weights,'cage')?['crossfire','barrage','ground']:['crossfire','barrage'],pattern=combo?(options.level>=7?candidates[Math.floor(rng()*candidates.length)]:'crossfire'):'single',variant=pattern==='barrage'?'arcane_bolt':pattern==='ground'?['flame_circle','cage','artillery'][Math.floor(rng()*3)]:undefined,result=launch({pattern,variant},player);
  if(combo&&result){sinceCombo=0;pending=Array.from({length:options.comboSize??1},(_,i)=>({at:elapsed+(i+1)*options.comboDelay/Math.sqrt(pressure),pattern,variant:pattern==='barrage'||pattern==='ground'?'arcane_bolt':undefined}));}
 },dispose(){if(disposed)return;disposed=true;pending=[];projectiles.clear();qualified.clear();}};
}

/** Bounded candidate generation: area is active at birth, outside reaction margin. */
export function chooseAreaOrigin(player,active,rng,{attempts=8,reaction=.35}={}) {
  if(![player?.x,player?.z,reaction].every(Number.isFinite)||reaction<0||!Number.isInteger(attempts)||attempts<1||attempts>64||!Array.isArray(active))throw new TypeError('Invalid area admission parameters.');
  const radius=VARIANTS.aoe_zone.radius,margin=radius+PLAYER_RADIUS+DODGE_MOVEMENT_SPEED*reaction;
  for(let i=0;i<attempts;i++) {
    const x=rng(),z=rng();if(![x,z].every(n=>Number.isFinite(n)&&n>=0&&n<1))throw new TypeError('Invalid RNG.');
    const candidate={x:(x-.5)*(ARENA.width-2*radius),z:(z-.5)*(ARENA.length-2*radius)};
    if(Math.hypot(candidate.x-player.x,candidate.z-player.z)<=margin)continue;
    if(active.some(p=>p.variant==='aoe_zone'&&Math.hypot(p.position.x-candidate.x,p.position.z-candidate.z)<2*radius+PLAYER_RADIUS))continue;
    return candidate;
  }
  return null;
}

/** Spawns around the player, including the edges of the lane, never at point-blank range. */
export function chooseProjectileOrigin(player,rng,{minDistance=7.5,maxDistance=11.5,attempts=12,followPlayer=false}={}){
 if(![player?.x,player?.z,minDistance,maxDistance].every(Number.isFinite)||minDistance<3||maxDistance<minDistance||!Number.isInteger(attempts)||attempts<1||attempts>64)throw new TypeError('Invalid origin parameters.');
 for(let i=0;i<attempts;i++){
  const a=rng(),r=rng();if(![a,r].every(n=>Number.isFinite(n)&&n>=0&&n<1))throw new TypeError('Invalid origin RNG.');
  const angle=a*Math.PI*2,d=minDistance+(maxDistance-minDistance)*r,candidate={x:player.x+Math.sin(angle)*d,z:player.z+Math.cos(angle)*d};
  if(followPlayer||Math.abs(candidate.x)<=ARENA.width/2-.5&&Math.abs(candidate.z)<=ARENA.length/2-.5)return candidate;
 }
 return null;
}

/** Random perimeter casters always stay outside the playable rectangle and away from the player. */
export function chooseCasterOrigin(player,rng,{minDistance=9,attempts=16,avoid=null}={}){
 if(![player?.x,player?.z,minDistance].every(Number.isFinite)||minDistance<4||minDistance>20||!Number.isInteger(attempts)||attempts<1||attempts>64)throw new TypeError('Invalid caster origin.');
 const xEdge=DODGE_ARENA.width/2+2.8,zEdge=DODGE_ARENA.length/2+2.8;
 for(let i=0;i<attempts;i++){const r=rng();if(!Number.isFinite(r)||r<0||r>=1)throw new TypeError('Invalid origin RNG.');const a=r*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a),tx=Math.abs(dx)<1e-9?Infinity:((dx>0?xEdge:-xEdge)-player.x)/dx,tz=Math.abs(dz)<1e-9?Infinity:((dz>0?zEdge:-zEdge)-player.z)/dz,t=Math.min(tx,tz);if(t>=minDistance&&!(Math.abs(player.x+dx*t)<2.5&&Math.abs(Math.abs(player.z+dz*t)-(DODGE_ARENA.length/2+4))<2.5)&&(!avoid||((avoid.x-player.x)*dx+(avoid.z-player.z)*dz)/Math.max(.01,Math.hypot(avoid.x-player.x,avoid.z-player.z))<(i<attempts/2?.25:.9)))return {x:player.x+dx*t,z:player.z+dz*t};}
 const corners=[{x:-xEdge,z:-zEdge},{x:xEdge,z:-zEdge},{x:-xEdge,z:zEdge},{x:xEdge,z:zEdge}];return corners.sort((a,b)=>Math.hypot(b.x-player.x,b.z-player.z)-Math.hypot(a.x-player.x,a.z-player.z))[0];
}
