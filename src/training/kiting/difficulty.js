import { readonlySnapshot } from '../snapshot.js';
export const KITING_VARIANTS=readonlySnapshot({waves:{label:'Ondas progressivas'},static:{label:'Alvos parados'},moving:{label:'Alvos móveis'},spacing:{label:'Perseguidores / spacing'}});
export const KITING_RULES=Object.freeze({attackRange:5,attackInterval:.9,windupDuration:.25,cancelCooldown:.15,targetRadius:.65,minimumSeparation:1.3,cycleDistance:.75});
export const KITING_LEVELS=readonlySnapshot([
 [1.2,2,20,18,16],[1.4,2.2,23,20,18],[1.6,2.4,26,22,20],[1.8,2.6,29,24,22],[2,2.8,32,26,24],
 [2.2,3,35,28,26],[2.4,3.2,38,30,28],[2.6,3.4,41,32,30],[2.8,3.6,44,34,32],[3,3.8,47,36,34],
].map(([movingSpeed,pursuitSpeed,staticReference,movingReference,spacingReference],i)=>({level:i+1,movingSpeed,pursuitSpeed,decisionInterval:4-i*.15,references:{static:staticReference,moving:movingReference,spacing:spacingReference},minSampleHits:6})));
export function kitingDifficulty(level,variant,{legacy=false}={}){
 if(!Number.isInteger(level)||level<1||level>10||!Object.hasOwn(KITING_VARIANTS,variant))throw new TypeError('Invalid kiting difficulty.');
 const p=KITING_LEVELS[level-1];if(variant==='waves')return readonlySnapshot({...KITING_RULES,level,variant,attackInterval:.85-(level-1)*.025,windupDuration:.28-(level-1)*.006,...(legacy?{}:{configVersion:'kiting-waves-v2',playerSpeed:8}),targetSpeed:legacy?3.5+(level-1)*.3:4.5+(level-1)*.35,decisionInterval:3,referenceHits:p.references.spacing,minSampleHits:p.minSampleHits,targetCount:1,maxTargets:Math.min(6,1+Math.floor(level/2)),maxHealth:3+Math.floor(level/3),spawnInterval:Math.max(2,8-level*.4)});return readonlySnapshot({...KITING_RULES,level,variant,attackInterval:.85-(level-1)*.025,windupDuration:.22-(level-1)*.006,targetSpeed:variant==='static'?0:variant==='moving'?p.movingSpeed:4+(level-1)*.3,decisionInterval:p.decisionInterval,referenceHits:p.references[variant],minSampleHits:p.minSampleHits,targetCount:2+Math.floor((level-1)/2)});
}
