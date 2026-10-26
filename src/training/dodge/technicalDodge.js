import { hasEscape } from './fairness.js';
import { difficultyFor,validateDifficulty } from './difficulty.js';
import { ARENA } from '../../game3d/spatial.js';
import { createProjectiles,createAttackData,PLAYER_RADIUS,VARIANTS } from './projectiles.js';
import { createSelector,createRandom } from './random.js';
import { DODGE_MOVEMENT_SPEED } from '../movement.js';
export function createTechnicalDodge({rng=createRandom(),level=1,profile=difficultyFor(level),interval=profile.interval,capacity=profile.capacity,events,attemptId=null,mode='technical',isRunning=()=>true,canSpawn=()=>true}={}) {
  validateDifficulty(profile);
  const options=Object.freeze({...profile,weights:Object.freeze({...profile.weights})});
  if(!Number.isFinite(interval)||interval<0.25)throw new TypeError('Invalid attack interval.');
  let elapsed=0,clock=0,shots=0,impacts=0,disposed=false,combo=null,sinceCombo=Infinity,attempts=0,rejected=0,peak=0,combinations=0;
  const select=createSelector({rng,weights:options.weights});
  const projectiles=createProjectiles({capacity,isRunning,onEvent(event){if(event.type==='impact')impacts++;events?.emit(`dodge:${event.type}`,Object.freeze({...event,attemptId,mode,level:options.level}));}});
  return {snapshot:()=>Object.freeze({level:options.level,elapsed,shots,impacts,attempts,rejected,peak,combinations,projectiles:projectiles.snapshot()}),
    update(dt,previousPlayer,player){
      if(disposed||!isRunning()||!Number.isFinite(dt)||dt<=0)return;elapsed+=dt;
      projectiles.update(dt,previousPlayer,player);if(!isRunning()||!canSpawn())return;clock+=dt;sinceCombo+=dt;
      if(combo!==null)combo-=dt;
      const isCombo=combo!==null&&combo<=0;
      if(isCombo||clock>=interval){
        if(isCombo)combo=null;else clock=0;
        attempts++;
        if(projectiles.snapshot().length>=capacity){rejected++;return;}
        const variant=select(),base=VARIANTS[variant],caster=chooseCasterOrigin(player,rng);
        const vx=Math.max(-DODGE_MOVEMENT_SPEED,Math.min(DODGE_MOVEMENT_SPEED,(player.x-previousPlayer.x)/dt)),vz=Math.max(-DODGE_MOVEMENT_SPEED,Math.min(DODGE_MOVEMENT_SPEED,(player.z-previousPlayer.z)/dt));
        const lead=(options.level-1)*.018,ground=['circle','ring'].includes(base.shape);
        const aim={x:Math.max(ARENA.bounds.minX+.5,Math.min(ARENA.bounds.maxX-.5,player.x+vx*lead+(rng()-.5)*(ground?1.6:.3))),z:Math.max(ARENA.bounds.minZ+.5,Math.min(ARENA.bounds.maxZ-.5,player.z+vz*lead+(rng()-.5)*(ground?1.6:.3)))};
        const angle=Math.atan2(aim.x-caster.x,aim.z-caster.z),direction={x:Math.sin(angle),z:Math.cos(angle)},origin=ground?aim:caster;
        const config={...base,speed:base.speed*(1+(options.level-1)*.03),windup:Math.max(base.shape==='bolt'?.48:.8,(base.windup??.9)-(options.level-1)*.02)};
        const launch={origin,direction,variant,config,caster,aim:player},candidate=createAttackData(launch),active=projectiles.snapshot();
        if(!hasEscape(player,[...active,candidate],options)){rejected++;return;}
        const id=projectiles.spawn(launch);
        if(id){shots++;peak=Math.max(peak,active.length+1);if(active.length)combinations++;}
        if(isCombo)sinceCombo=0;
        else if(combo===null&&sinceCombo>=options.peakCooldown&&rng()<options.comboChance)combo=options.comboDelay;
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
export function chooseCasterOrigin(player,rng,{minDistance=9,attempts=16}={}){
 if(![player?.x,player?.z,minDistance].every(Number.isFinite)||minDistance<4||minDistance>20||!Number.isInteger(attempts)||attempts<1||attempts>64)throw new TypeError('Invalid caster origin.');
 const xEdge=ARENA.width/2+2.8,zEdge=ARENA.length/2+2.8;
 for(let i=0;i<attempts;i++){const r=rng();if(!Number.isFinite(r)||r<0||r>=1)throw new TypeError('Invalid origin RNG.');const a=r*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a),tx=Math.abs(dx)<1e-9?Infinity:((dx>0?xEdge:-xEdge)-player.x)/dx,tz=Math.abs(dz)<1e-9?Infinity:((dz>0?zEdge:-zEdge)-player.z)/dz,t=Math.min(tx,tz);if(t>=minDistance)return {x:player.x+dx*t,z:player.z+dz*t};}
 const corners=[{x:-xEdge,z:-zEdge},{x:xEdge,z:-zEdge},{x:-xEdge,z:zEdge},{x:xEdge,z:zEdge}];return corners.sort((a,b)=>Math.hypot(b.x-player.x,b.z-player.z)-Math.hypot(a.x-player.x,a.z-player.z))[0];
}
