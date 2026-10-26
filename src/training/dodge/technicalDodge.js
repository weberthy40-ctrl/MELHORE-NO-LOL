import { hasEscape } from './fairness.js';
import { difficultyFor,validateDifficulty } from './difficulty.js';
import { ARENA } from '../../game3d/spatial.js';
import { createProjectiles,PLAYER_RADIUS,VARIANTS } from './projectiles.js';
import { createSelector,createRandom } from './random.js';
export const ATTACK_ORIGIN=Object.freeze({x:0,z:-16});
export function createTechnicalDodge({rng=createRandom(),level=1,profile=difficultyFor(level),interval=profile.interval,capacity=profile.capacity,events,attemptId=null,mode='technical',isRunning=()=>true,canSpawn=()=>true}={}) {
  validateDifficulty(profile);
  const options=Object.freeze({...profile,weights:Object.freeze({...profile.weights})});
  if(!Number.isFinite(interval)||interval<0.25)throw new TypeError('Invalid attack interval.');
  let clock=0,shots=0,impacts=0,disposed=false,combo=null,sinceCombo=Infinity,attempts=0,rejected=0,peak=0,combinations=0;
  const select=createSelector({rng,weights:options.weights});
  const projectiles=createProjectiles({capacity,isRunning,onEvent(event){if(event.type==='impact')impacts++;events?.emit(`dodge:${event.type}`,Object.freeze({...event,attemptId,mode,level:options.level}));}});
  return {snapshot:()=>Object.freeze({level:options.level,shots,impacts,attempts,rejected,peak,combinations,projectiles:projectiles.snapshot()}),
    update(dt,previousPlayer,player){
      if(disposed||!Number.isFinite(dt)||dt<=0)return;
      projectiles.update(dt,previousPlayer,player);if(!isRunning()||!canSpawn())return;clock+=dt;sinceCombo+=dt;
      if(combo!==null)combo-=dt;
      const isCombo=combo!==null&&combo<=0;
      if(isCombo||clock>=interval){
        if(isCombo)combo=null;else clock=0;
        attempts++;
        if(projectiles.snapshot().length>=capacity){rejected++;return;}const angle=Math.atan2(player.x-ATTACK_ORIGIN.x,player.z-ATTACK_ORIGIN.z)+(rng()-.5)*.4;
        const variant=select();let origin=ATTACK_ORIGIN;
        if(variant==='aoe_zone') {
          origin=chooseAreaOrigin(player,projectiles.snapshot(),rng);
          if(!origin){rejected++;return;}
        }
        const direction={x:Math.sin(angle),z:Math.cos(angle)},config=VARIANTS[variant];
        const candidate={position:origin,direction,variant,...config,age:0,distance:0};
        const active=projectiles.snapshot();
        if(!hasEscape(player,[...active,candidate],options)){rejected++;return;}
        const id=projectiles.spawn({origin,direction,variant});
        if(id){shots++;peak=Math.max(peak,active.length+1);if(active.length)combinations++;}
        if(isCombo)sinceCombo=0;
        else if(combo===null&&sinceCombo>=options.peakCooldown&&rng()<options.comboChance)combo=options.comboDelay;
      }
    },dispose(){if(disposed)return;disposed=true;projectiles.clear();}};
}

/** Bounded candidate generation: area is active at birth, outside reaction margin. */
export function chooseAreaOrigin(player,active,rng,{attempts=8,reaction=.35}={}) {
  if(![player?.x,player?.z,reaction].every(Number.isFinite)||reaction<0||!Number.isInteger(attempts)||attempts<1||attempts>64||!Array.isArray(active))throw new TypeError('Invalid area admission parameters.');
  const radius=VARIANTS.aoe_zone.radius,margin=radius+PLAYER_RADIUS+7*reaction;
  for(let i=0;i<attempts;i++) {
    const x=rng(),z=rng();if(![x,z].every(n=>Number.isFinite(n)&&n>=0&&n<1))throw new TypeError('Invalid RNG.');
    const candidate={x:(x-.5)*(ARENA.width-2*radius),z:(z-.5)*(ARENA.length-2*radius)};
    if(Math.hypot(candidate.x-player.x,candidate.z-player.z)<=margin)continue;
    if(active.some(p=>p.variant==='aoe_zone'&&Math.hypot(p.position.x-candidate.x,p.position.z-candidate.z)<2*radius+PLAYER_RADIUS))continue;
    return candidate;
  }
  return null;
}
