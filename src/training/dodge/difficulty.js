import { VARIANTS } from './projectiles.js';
import { DODGE_MOVEMENT_SPEED } from '../movement.js';
const fullWeights=Object.freeze({arcane_bolt:2,heavy_lance:1.6,needle_burst:1.8,meteor_rain:1.4,sun_beam:1.4,artillery:1.3,flame_circle:1.3,cage:.65});
/** One movement speed preserves muscle memory; difficulty comes from threat timing and patterns. */
export const DIFFICULTIES=Object.freeze([
 [1,1.7,2,.05,6],[2,1.35,3,.1,5],[3,1.05,4,.2,4.5],
 [4,.8,5,.4,3.5],[5,.58,7,.6,2.5],[6,.4,9,.8,1.8],
 [7,.28,11,.9,1.2],[8,.21,12,.95,.9],[9,.16,14,1,.7],[10,.12,16,1,.6],
].map(([level,interval,capacity,comboChance,peakCooldown])=>Object.freeze({
 level,interval:level<=2?interval:interval*.9,capacity:level<=2?capacity:capacity+1,comboChance,peakCooldown:level<=2?peakCooldown:peakCooldown*.92,rulesetVersion:'dodge-v7',playerSpeed:DODGE_MOVEMENT_SPEED,
 comboDelay:Math.max(.1,.32-level*.022),comboSize:level>=9?3:level>=6?2:1,
 pathHint:level<=2?'full':'off',hintDuration:level<=2?5:0,
 horizon:2.2,reaction:.16,speedFactor:(.72+(level-1)*.14)*(level<=2?1:1.06),warningFactor:level<=3?1.35:1,
 weights:level===1?Object.freeze({arcane_bolt:3,artillery:1}):level===2?Object.freeze({arcane_bolt:3,artillery:1,flame_circle:1}):level===3?Object.freeze({arcane_bolt:2,heavy_lance:1.5,artillery:1.6,flame_circle:1.5,sun_beam:1.4}):fullWeights,
})));
export function difficultyFor(level=1){return DIFFICULTIES.find(p=>p.level===level)??DIFFICULTIES[0];}
export function validateDifficulty(p){
 if(!p||!Number.isInteger(p.level)||p.level<1||p.level>10||!Number.isFinite(p.interval)||p.interval<.06||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>20||!Number.isFinite(p.comboChance)||p.comboChance<0||p.comboChance>1||!Number.isFinite(p.comboDelay)||p.comboDelay<.07||!Number.isFinite(p.peakCooldown)||p.peakCooldown<.35||!Number.isFinite(p.horizon)||p.horizon<=0||p.horizon>3||!Number.isFinite(p.reaction)||p.reaction<0||!Number.isFinite(p.playerSpeed)||p.playerSpeed<=0||p.playerSpeed>20||!p.weights||!Object.keys(p.weights).length||Object.entries(p.weights).some(([id,w])=>!VARIANTS[id]||!Number.isFinite(w)||w<=0))throw new TypeError('Invalid difficulty profile.');
 return p;
}
