import { MAX_DODGE_LEVEL,DODGE_RULESET } from './constants.js';
import { VARIANTS } from './projectiles.js';
import { DODGE_MOVEMENT_SPEED } from '../movement.js';
const stages=[
 {level:1,interval:.88,capacity:3,combo:0,peak:5},
 {level:5,interval:.54,capacity:5,combo:.12,peak:3.8},
 {level:10,interval:.27,capacity:8,combo:.55,peak:1.9},
 {level:15,interval:.165,capacity:12,combo:.85,peak:1.1},
 {level:20,interval:.11,capacity:16,combo:1,peak:.7},
];
const fullWeights={arcane_bolt:2,heavy_lance:1.2,needle_burst:1.5,dark_orb:1.4,artillery:1.1,flame_circle:1,sun_beam:.9,cage:.55,meteor_rain:.8};
export const DIFFICULTIES=Object.freeze(Array.from({length:MAX_DODGE_LEVEL},(_,index)=>{
 const level=index+1,a=stages.findLast(p=>p.level<=level),b=stages.find(p=>p.level>level)??a,t=a===b?0:(level-a.level)/(b.level-a.level),mix=key=>a[key]+(b[key]-a[key])*t;
 const weights=Object.fromEntries(Object.entries(fullWeights).filter(([id])=>!(['heavy_lance','flame_circle'].includes(id)&&level<3||['needle_burst','sun_beam'].includes(id)&&level<5||id==='dark_orb'&&level<7||['cage','meteor_rain'].includes(id)&&level<9)));
 return Object.freeze({level,interval:mix('interval'),capacity:Math.round(mix('capacity')),comboChance:mix('combo'),peakCooldown:mix('peak'),rulesetVersion:DODGE_RULESET,playerSpeed:DODGE_MOVEMENT_SPEED,
 comboDelay:Math.max(.13,.34-index*.011),comboSize:level>=16?3:level>=10?2:1,pathHint:level<=2?'full':'off',hintDuration:level<=2?5:0,
 horizon:2.8,reaction:.2,speedFactor:.85+index*.095,warningFactor:level<=2?1.12:1,minArrival:level<=5?1.05:level<=12?1:.95,weights:Object.freeze(weights)});
}));
export function difficultyFor(level=1){return DIFFICULTIES.find(p=>p.level===level)??DIFFICULTIES[0];}
export function validateDifficulty(p){
 if(!p||!Number.isInteger(p.level)||p.level<1||p.level>MAX_DODGE_LEVEL||!Number.isFinite(p.interval)||p.interval<.06||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>20||!Number.isFinite(p.comboChance)||p.comboChance<0||p.comboChance>1||!Number.isFinite(p.comboDelay)||p.comboDelay<.07||!Number.isFinite(p.peakCooldown)||p.peakCooldown<.35||!Number.isFinite(p.horizon)||p.horizon<=0||p.horizon>3||!Number.isFinite(p.reaction)||p.reaction<0||!Number.isFinite(p.playerSpeed)||p.playerSpeed<=0||p.playerSpeed>20||!p.weights||!Object.keys(p.weights).length||Object.entries(p.weights).some(([id,w])=>!VARIANTS[id]||!Number.isFinite(w)||w<=0))throw new TypeError('Invalid difficulty profile.');
 return p;
}
