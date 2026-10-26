import { readonlySnapshot } from '../snapshot.js';
export const KITING_VARIANTS=readonlySnapshot({static:{label:'Alvo parado'},moving:{label:'Alvo móvel'},spacing:{label:'Alvo perseguidor / spacing'}});
export const KITING_RULES=Object.freeze({attackRange:5,attackInterval:.9,windupDuration:.25,cancelCooldown:.15,targetRadius:.65,minimumSeparation:1.3,cycleDistance:.75});
export const KITING_LEVELS=readonlySnapshot([
 [1.2,2,20,18,16],[1.4,2.2,23,20,18],[1.6,2.4,26,22,20],[1.8,2.6,29,24,22],[2,2.8,32,26,24],
 [2.2,3,35,28,26],[2.4,3.2,38,30,28],[2.6,3.4,41,32,30],[2.8,3.6,44,34,32],[3,3.8,47,36,34],
].map(([movingSpeed,pursuitSpeed,staticReference,movingReference,spacingReference],i)=>({level:i+1,movingSpeed,pursuitSpeed,decisionInterval:4-i*.15,references:{static:staticReference,moving:movingReference,spacing:spacingReference},minSampleHits:6})));
export function kitingDifficulty(level,variant){
 if(!Number.isInteger(level)||level<1||level>10||!Object.hasOwn(KITING_VARIANTS,variant))throw new TypeError('Invalid kiting difficulty.');
 const p=KITING_LEVELS[level-1];return readonlySnapshot({...KITING_RULES,level,variant,attackInterval:.85-(level-1)*.025,windupDuration:.22-(level-1)*.006,targetSpeed:variant==='static'?0:variant==='moving'?p.movingSpeed:4+(level-1)*.3,decisionInterval:p.decisionInterval,referenceHits:p.references[variant],minSampleHits:p.minSampleHits});
}
