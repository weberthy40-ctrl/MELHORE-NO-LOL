import { VARIANTS } from './projectiles.js';
const weights=Object.freeze({arcane_bolt:3,sun_beam:1.3,artillery:1.6,flame_circle:1.6,cage:1});
export const DIFFICULTIES=Object.freeze([
  [1,.95,4,.2,4.5], [2,.85,4,.3,3.9], [3,.72,5,.4,3.3],
  [4,.58,6,.55,2.7], [5,.46,7,.7,2.1], [6,.36,8,.8,1.6],
  [7,.28,10,.9,1.2], [8,.22,11,.95,1], [9,.17,12,.98,.8], [10,.13,14,1,.65],
].map(([level,interval,capacity,comboChance,peakCooldown])=>Object.freeze({level,interval,capacity,comboChance,peakCooldown,rulesetVersion:'competitive-v4',playerSpeed:3.85+(level-1)*.055,comboDelay:Math.max(.1,.3-level*.02),comboSize:level>=9?3:level>=6?2:1,pathHint:level<=3?'full':level<=6?'brief':'off',hintDuration:level<=3?5:Math.max(0,.75-level*.1),horizon:2.2,reaction:.16,weights:level>=7?Object.freeze({...weights,arcane_bolt:5+(level-7)*.5,sun_beam:1.8,cage:.7}):weights})));
export function difficultyFor(level=1){return DIFFICULTIES.find(p=>p.level===level)??DIFFICULTIES[0];}
export function validateDifficulty(p){
  if(!p||!Number.isInteger(p.level)||p.level<1||p.level>10||!Number.isFinite(p.interval)||p.interval<.1||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>14||!Number.isFinite(p.comboChance)||p.comboChance<0||p.comboChance>1||!Number.isFinite(p.comboDelay)||p.comboDelay<.09||!Number.isFinite(p.peakCooldown)||p.peakCooldown<.6||!Number.isFinite(p.horizon)||p.horizon<=0||p.horizon>3||!Number.isFinite(p.reaction)||p.reaction<0||!Number.isFinite(p.playerSpeed)||p.playerSpeed<=0||p.playerSpeed>20||!p.weights||!Object.keys(p.weights).length||Object.entries(p.weights).some(([id,w])=>!VARIANTS[id]||!Number.isFinite(w)||w<=0))throw new TypeError('Invalid difficulty profile.');
  return p;
}
