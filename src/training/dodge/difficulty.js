const weights=Object.freeze({fast:1,slow:1,hook_linear:1,aoe_zone:1});
export const DIFFICULTIES=Object.freeze([
  [1,1.1,3,.12,5], [2,1,3,.18,4.8], [3,.9,4,.24,4.5],
  [4,.8,4,.32,4], [5,.7,5,.40,3.6], [6,.60,5,.48,3.2],
  [7,.51,6,.56,2.8], [8,.43,6,.64,2.5], [9,.35,7,.72,2.2], [10,.28,8,.8,1.8],
].map(([level,interval,capacity,comboChance,peakCooldown])=>Object.freeze({level,interval,capacity,comboChance,peakCooldown,comboDelay:.3,horizon:1.2,reaction:.18,weights})));
export function difficultyFor(level=1){return DIFFICULTIES.find(p=>p.level===level)??DIFFICULTIES[0];}
export function validateDifficulty(p){
  if(!p||!Number.isInteger(p.level)||p.level<1||p.level>10||!Number.isFinite(p.interval)||p.interval<.25||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>8||!Number.isFinite(p.comboChance)||p.comboChance<0||p.comboChance>1||!Number.isFinite(p.comboDelay)||p.comboDelay<.15||!Number.isFinite(p.peakCooldown)||p.peakCooldown<1||!Number.isFinite(p.horizon)||p.horizon<=0||p.horizon>3||!Number.isFinite(p.reaction)||p.reaction<0||!['fast','slow','hook_linear','aoe_zone'].every(id=>Number.isFinite(p.weights?.[id])&&p.weights[id]>0))throw new TypeError('Invalid difficulty profile.');
  return p;
}
