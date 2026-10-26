const weights=Object.freeze({fast:1,slow:1,hook_linear:1,aoe_zone:1});
export const DIFFICULTIES=Object.freeze([
  [1,2.4,2,.08,7], [2,2.2,2,.12,6.8], [3,2,3,.17,6.6],
  [4,1.85,3,.23,6.4], [5,1.7,3,.29,6.2], [6,1.55,4,.35,6],
  [7,1.4,4,.42,5.8], [8,1.25,4,.49,5.6], [9,1.1,5,.56,5.4], [10,1,5,.62,5.2],
].map(([level,interval,capacity,comboChance,peakCooldown])=>Object.freeze({level,interval,capacity,comboChance,peakCooldown,comboDelay:.3,horizon:1.2,reaction:.18,weights})));
export function difficultyFor(level=1){return DIFFICULTIES.find(p=>p.level===level)??DIFFICULTIES[0];}
export function validateDifficulty(p){
  if(!p||!Number.isInteger(p.level)||p.level<1||p.level>10||!Number.isFinite(p.interval)||p.interval<.25||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>8||!Number.isFinite(p.comboChance)||p.comboChance<0||p.comboChance>1||!Number.isFinite(p.comboDelay)||p.comboDelay<.15||!Number.isFinite(p.peakCooldown)||p.peakCooldown<1||!Number.isFinite(p.horizon)||p.horizon<=0||p.horizon>3||!Number.isFinite(p.reaction)||p.reaction<0||!['fast','slow','hook_linear','aoe_zone'].every(id=>Number.isFinite(p.weights?.[id])&&p.weights[id]>0))throw new TypeError('Invalid difficulty profile.');
  return p;
}
