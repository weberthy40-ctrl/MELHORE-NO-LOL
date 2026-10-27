import { MAX_DODGE_LEVEL,DODGE_RULESET } from './constants.js';
import { VARIANTS } from './projectiles.js';
import { DODGE_MOVEMENT_SPEED } from '../movement.js';
const fullWeights=Object.freeze({arcane_bolt:2,heavy_lance:1.6,needle_burst:1.8,meteor_rain:1.4,sun_beam:1.4,artillery:1.3,flame_circle:1.3,cage:.65});
/** One movement speed preserves muscle memory; difficulty comes from threat timing and patterns. */
export const DIFFICULTIES=Object.freeze(Array.from({length:MAX_DODGE_LEVEL},(_,index)=>{
 const level=index+1,early=Math.min(1,index/9),elite=Math.max(0,(index-9)/10);
 return Object.freeze({level,interval:.85*(.1/.85)**early*(.065/.1)**elite,capacity:Math.min(20,4+Math.floor(early*14)+Math.ceil(elite*2)),comboChance:Math.min(1,.12+index*.1),peakCooldown:3.2*(.52/3.2)**early*(.36/.52)**elite,rulesetVersion:DODGE_RULESET,playerSpeed:DODGE_MOVEMENT_SPEED,
 comboDelay:Math.max(.075,.27-index*.018),comboSize:level>=15?4:level>=9?3:level>=5?2:1,
 pathHint:level<=2?'full':'off',hintDuration:level<=2?5:0,horizon:2.2,reaction:.16,speedFactor:.9+index*.14,warningFactor:level<=2?1.12:1,
 weights:level<=2?Object.freeze({arcane_bolt:3,heavy_lance:1,artillery:1.2}):level<=4?Object.freeze({arcane_bolt:2,heavy_lance:1.5,artillery:1.6,flame_circle:1.5,sun_beam:1.4}):fullWeights,
 });
}));
export function difficultyFor(level=1){return DIFFICULTIES.find(p=>p.level===level)??DIFFICULTIES[0];}
export function validateDifficulty(p){
 if(!p||!Number.isInteger(p.level)||p.level<1||p.level>MAX_DODGE_LEVEL||!Number.isFinite(p.interval)||p.interval<.06||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>20||!Number.isFinite(p.comboChance)||p.comboChance<0||p.comboChance>1||!Number.isFinite(p.comboDelay)||p.comboDelay<.07||!Number.isFinite(p.peakCooldown)||p.peakCooldown<.35||!Number.isFinite(p.horizon)||p.horizon<=0||p.horizon>3||!Number.isFinite(p.reaction)||p.reaction<0||!Number.isFinite(p.playerSpeed)||p.playerSpeed<=0||p.playerSpeed>20||!p.weights||!Object.keys(p.weights).length||Object.entries(p.weights).some(([id,w])=>!VARIANTS[id]||!Number.isFinite(w)||w<=0))throw new TypeError('Invalid difficulty profile.');
 return p;
}
