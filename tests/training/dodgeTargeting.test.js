import { it,expect } from 'vitest';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { createRandom } from '../../src/core/random.js';
import { difficultyFor } from '../../src/training/dodge/difficulty.js';
import { dodgeFocusProfile } from '../../src/training/dodge/focus.js';
import { DODGE_ARENA } from '../../src/game3d/spatial.js';
it('aims every shot and area at the character at conjuration, from varied external origins, including salvos',()=>{
 let player={x:0,z:0},game,count=0;const sectors=new Set();game=createTechnicalDodge({level:10,intensity:1.8,rng:createRandom(933),events:{emit(type,event){if(type!=='dodge:spawn')return;const p=game.snapshot().projectiles.find(p=>p.id===event.id);count++;expect(Math.abs(p.caster.x)>DODGE_ARENA.width/2||Math.abs(p.caster.z)>DODGE_ARENA.length/2).toBe(true);expect(Math.hypot(p.caster.x-player.x,p.caster.z-player.z)).toBeGreaterThanOrEqual(9-1e-8);const angle=Math.atan2(p.caster.z-player.z,p.caster.x-player.x);sectors.add(Math.floor((angle+Math.PI)/(Math.PI/4)));if(['circle','ring'].includes(p.shape))expect(p.origin).toEqual(player);else{const dx=player.x-p.origin.x,dz=player.z-p.origin.z;expect(Math.abs(dx*p.direction.z-dz*p.direction.x)).toBeLessThan(1e-8);expect(dx*p.direction.x+dz*p.direction.z).toBeGreaterThan(0);}}}});
 for(let i=1;i<=1800;i++){const previous=player,t=i*.025;player={x:8*Math.sin(t*.45),z:6*Math.sin(t*.5)};game.update(.025,previous,player);}expect(count).toBeGreaterThan(60);expect(sectors.size).toBeGreaterThanOrEqual(6);game.dispose();
});
it('keeps spawn timing autonomous during input-only catchup and continues without any clicks',()=>{
 const p={x:0,z:0},game=createTechnicalDodge({level:10,rng:createRandom(1)});for(let i=0;i<10;i++)game.update(.05,p,p,{allowSpawns:false});expect(game.snapshot()).toMatchObject({shots:0,elapsed:expect.any(Number)});game.update(.01,p,p);expect(game.snapshot().shots).toBe(1);for(let i=0;i<100;i++)game.update(.05,p,p);expect(game.snapshot().shots).toBeGreaterThan(5);game.dispose();
});
it('shows traveling-shot predictions only in the first two levels',()=>{for(let level=1;level<=10;level++)expect(difficultyFor(level).pathHint).toBe(level<=2?'full':'off');});
it('limits each goal drill to its practiced skills and counts resolved dodges separately from contacts',()=>{
 for(const [focus,allowed]of [['micro',['arcane_bolt']],['sidestep',['sun_beam']],['direction',['arcane_bolt','artillery']]]){const game=createTechnicalDodge({level:8,profile:dodgeFocusProfile(8,focus),rng:createRandom(62)}),seen=new Set();let player={x:0,z:0};for(let i=1;i<=1800;i++){const previous=player,t=i*.025;player={x:5*Math.sin(t*.6),z:4*Math.cos(t*.5)};game.update(.025,previous,player);for(const p of game.snapshot().projectiles)seen.add(p.variant);}expect(seen.size).toBeGreaterThan(0);expect([...seen].every(v=>allowed.includes(v))).toBe(true);expect(game.snapshot().focus).toBe(focus);expect(game.snapshot().avoided).toBeGreaterThan(0);game.dispose();}
});
it('keeps prior dodge-v5 evidence separate from three new dodge-v6 samples',async()=>{
 const {recordFixture}=await import('../fixtures/record.js'),{createAttemptRecord}=await import('../../src/persistence/attemptRecord.js'),{calculateDodgeProgress}=await import('../../src/progression/dodgeProgress.js');const records=[];for(const version of ['dodge-v5','dodge-v5','dodge-v5','dodge-v6','dodge-v6','dodge-v6']){const r=recordFixture(`version-${records.length}`);records.push(createAttemptRecord({...r.metrics,rulesetVersion:version},r.score));}expect(calculateDodgeProgress(records.slice(0,5)).rating.referenceConfig).toBe('dodge-v5');const current=calculateDodgeProgress(records);expect(current.rating.referenceConfig).toBe('dodge-v6');expect(current.rating.evidenceByLevel[0].count).toBe(3);expect(current.total).toBe(6);
});
it('keeps random perimeter origins varied near a corner without sacrificing stand-off',async()=>{
 const {chooseCasterOrigin}=await import('../../src/training/dodge/technicalDodge.js'),rng=createRandom(29),player={x:13.8,z:21.8},origins=new Set();let previous=null;for(let i=0;i<256;i++){const origin=chooseCasterOrigin(player,rng,{avoid:previous});expect(Math.hypot(origin.x-player.x,origin.z-player.z)).toBeGreaterThanOrEqual(9-1e-8);origins.add(`${origin.x.toFixed(3)}:${origin.z.toFixed(3)}`);previous=origin;}expect(origins.size).toBeGreaterThan(180);
});
