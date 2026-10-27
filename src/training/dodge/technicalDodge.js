import { hasEscape } from './fairness.js';
import { difficultyFor,validateDifficulty } from './difficulty.js';
import { ARENA } from '../../game3d/spatial.js';
import { createProjectiles,createAttackData,PLAYER_RADIUS,VARIANTS } from './projectiles.js';
import { createSelector,createRandom } from './random.js';
import { DODGE_MOVEMENT_SPEED } from '../movement.js';
export function createTechnicalDodge({rng=createRandom(),level=1,profile=difficultyFor(level),interval=profile.interval,capacity=profile.capacity,events,attemptId=null,mode='technical',isRunning=()=>true,canSpawn=()=>true}={}) {
  validateDifficulty(profile);
  const options=Object.freeze({...profile,weights:Object.freeze({...profile.weights})});
  if(!Number.isFinite(interval)||interval<.1)throw new TypeError('Invalid attack interval.');
  let elapsed=0,clock=0,shots=0,impacts=0,disposed=false,combo=null,comboRemaining=0,lastCaster=null,sinceCombo=Infinity,attempts=0,rejected=0,peak=0,combinations=0;
  const select=createSelector({rng,weights:options.weights});
  const projectiles=createProjectiles({capacity,isRunning,onEvent(event){if(event.type==='impact')impacts++;events?.emit(`dodge:${event.type}`,Object.freeze({...event,attemptId,mode,level:options.level}));}});
  return {snapshot:()=>Object.freeze({level:options.level,playerSpeed:options.playerSpeed??DODGE_MOVEMENT_SPEED,elapsed,shots,impacts,attempts,rejected,peak,combinations,projectiles:projectiles.snapshot()}),
    update(dt,previousPlayer,player){
      if(disposed||!isRunning()||!Number.isFinite(dt)||dt<=0)return;elapsed+=dt;
      projectiles.update(dt,previousPlayer,player);if(!isRunning()||!canSpawn())return;clock+=dt;sinceCombo+=dt;
      if(combo!==null)combo-=dt;
      const isCombo=combo!==null&&combo<=0;
      if(isCombo||clock>=interval){
        if(isCombo){comboRemaining--;combo=comboRemaining>0?options.comboDelay:null;}else clock=0;
        attempts++;
        if(projectiles.snapshot().length>=capacity){rejected++;return;}
        const variant=select(),base=VARIANTS[variant],caster=chooseCasterOrigin(player,rng,{avoid:isCombo?lastCaster:null});
        const vx=Math.max(-(options.playerSpeed??DODGE_MOVEMENT_SPEED),Math.min(options.playerSpeed??DODGE_MOVEMENT_SPEED,(player.x-previousPlayer.x)/dt)),vz=Math.max(-(options.playerSpeed??DODGE_MOVEMENT_SPEED),Math.min(options.playerSpeed??DODGE_MOVEMENT_SPEED,(player.z-previousPlayer.z)/dt));
        const ground=['circle','ring'].includes(base.shape),anticipation=(options.level-1)/9,lead=anticipation*(ground?.24:Math.min(.75,Math.hypot(player.x-caster.x,player.z-caster.z)/(base.speed||20)));
        const aim={x:Math.max(ARENA.bounds.minX+.5,Math.min(ARENA.bounds.maxX-.5,player.x+vx*lead+(rng()-.5)*(ground?base.radius*1.5:.2))),z:Math.max(ARENA.bounds.minZ+.5,Math.min(ARENA.bounds.maxZ-.5,player.z+vz*lead+(rng()-.5)*(ground?base.radius*1.5:.2)))};
        const angle=Math.atan2(aim.x-caster.x,aim.z-caster.z),direction={x:Math.sin(angle),z:Math.cos(angle)},origin=ground?aim:caster;
        const config={...base,speed:base.speed*(1+(options.level-1)*.075),pathHint:options.pathHint??'full',hintDuration:options.hintDuration??5,windup:Math.max(base.shape==='bolt'?.2:.78,(base.windup??1)-(options.level-1)*(base.shape==='bolt'?.017:.03))};
        const launch={origin,direction,variant,config,caster,aim:player},candidate=createAttackData(launch),active=projectiles.snapshot();
        if(!hasEscape(player,[...active,candidate],options)){rejected++;return;}
        const id=projectiles.spawn(launch);
        if(id){lastCaster=caster;shots++;peak=Math.max(peak,active.length+1);if(active.length)combinations++;}
        if(!isCombo&&combo===null&&sinceCombo>=options.peakCooldown&&rng()<options.comboChance){comboRemaining=options.comboSize??1;combo=options.comboDelay;sinceCombo=0;}
      }
    },dispose(){if(disposed)return;disposed=true;projectiles.clear();}};
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
 const xEdge=ARENA.width/2+2.8,zEdge=ARENA.length/2+2.8;
 for(let i=0;i<attempts;i++){const r=rng();if(!Number.isFinite(r)||r<0||r>=1)throw new TypeError('Invalid origin RNG.');const a=r*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a),tx=Math.abs(dx)<1e-9?Infinity:((dx>0?xEdge:-xEdge)-player.x)/dx,tz=Math.abs(dz)<1e-9?Infinity:((dz>0?zEdge:-zEdge)-player.z)/dz,t=Math.min(tx,tz);if(t>=minDistance&&!(Math.abs(player.x+dx*t)<2.5&&Math.abs(Math.abs(player.z+dz*t)-22)<2.5)&&(!avoid||((avoid.x-player.x)*dx+(avoid.z-player.z)*dz)/Math.max(.01,Math.hypot(avoid.x-player.x,avoid.z-player.z))<.25))return {x:player.x+dx*t,z:player.z+dz*t};}
 const corners=[{x:-xEdge,z:-zEdge},{x:xEdge,z:-zEdge},{x:-xEdge,z:zEdge},{x:xEdge,z:zEdge}];return corners.sort((a,b)=>Math.hypot(b.x-player.x,b.z-player.z)-Math.hypot(a.x-player.x,a.z-player.z))[0];
}
