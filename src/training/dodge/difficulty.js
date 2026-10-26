import { VARIANTS } from './projectiles.js';
const weights=Object.freeze({arcane_bolt:3,sun_beam:1.3,artillery:1.6,flame_circle:1.6,cage:1});
export const DIFFICULTIES=Object.freeze([
  [1,1.1,3,.12,5], [2,1,3,.18,4.5], [3,.86,4,.28,3.7],
  [4,.7,5,.45,3], [5,.57,6,.58,2.5], [6,.45,7,.7,2],
  [7,.35,8,.8,1.6], [8,.28,8,.87,1.3], [9,.23,9,.93,1.1], [10,.19,10,.97,.9],
].map(([level,interval,capacity,comboChance,peakCooldown])=>Object.freeze({level,interval,capacity,comboChance,peakCooldown,comboDelay:Math.max(.14,.34-level*.02),comboSize:level>=7?2:1,pathHint:level<=3?'full':level<=6?'brief':'off',hintDuration:level<=3?5:Math.max(0,.75-level*.1),horizon:2.2,reaction:.18,weights:level>=7?Object.freeze({...weights,arcane_bolt:5+(level-7)*.5,sun_beam:1.8,cage:.7}):weights})));
export function difficultyFor(level=1){return DIFFICULTIES.find(p=>p.level===level)??DIFFICULTIES[0];}
export function validateDifficulty(p){
  if(!p||!Number.isInteger(p.level)||p.level<1||p.level>10||!Number.isFinite(p.interval)||p.interval<.16||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>10||!Number.isFinite(p.comboChance)||p.comboChance<0||p.comboChance>1||!Number.isFinite(p.comboDelay)||p.comboDelay<.12||!Number.isFinite(p.peakCooldown)||p.peakCooldown<.8||!Number.isFinite(p.horizon)||p.horizon<=0||p.horizon>3||!Number.isFinite(p.reaction)||p.reaction<0||!p.weights||!Object.keys(p.weights).length||Object.entries(p.weights).some(([id,w])=>!VARIANTS[id]||!Number.isFinite(w)||w<=0))throw new TypeError('Invalid difficulty profile.');
  return p;
}
