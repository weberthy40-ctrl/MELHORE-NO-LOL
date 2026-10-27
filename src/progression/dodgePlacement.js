import { validateAttemptRecord } from '../persistence/attemptRecord.js';
import { MAX_DODGE_LEVEL,DODGE_RULESET } from '../training/dodge/constants.js';
import { calculateDodgeGuidedAssessment } from '../training/assessment/dodgeAssessment.js';
import { readonlySnapshot } from '../training/snapshot.js';
export const DODGE_PLACEMENT_KEY='moba-training:dodge-placement:v1';
export function validateDodgePlacement(value){
 const result=calculateDodgeGuidedAssessment(value?.results);
 if(value?.version!==1||value.rulesetVersion!==DODGE_RULESET||result.status!=='recommended'||!Number.isInteger(value.level)||value.level<1||value.level>MAX_DODGE_LEVEL||!Number.isFinite(Date.parse(value.assessedAt))||(value.lastAdvancedAttempt!=null&&(typeof value.lastAdvancedAttempt!=='string'||value.lastAdvancedAttempt.length>200)))throw new TypeError('Avaliação de esquiva incompatível.');
 return readonlySnapshot({version:1,rulesetVersion:DODGE_RULESET,level:value.level,assessedAt:value.assessedAt,results:value.results,lastAdvancedAttempt:value.lastAdvancedAttempt??null});
}
export function readDodgePlacement(storage){try{return validateDodgePlacement(JSON.parse(storage?.getItem(DODGE_PLACEMENT_KEY)));}catch{return null;}}
export function saveDodgeAssessment(storage,results,{assessedAt=new Date().toISOString()}={}){
 const result=calculateDodgeGuidedAssessment(results);if(result.status!=='recommended')throw new TypeError('Conclua uma avaliação válida antes do Normal.');
 const value=validateDodgePlacement({version:1,rulesetVersion:DODGE_RULESET,level:result.recommendedStartingLevel,assessedAt,results,lastAdvancedAttempt:null});
 if(!storage)throw new Error('Não foi possível salvar a avaliação neste dispositivo.');storage.setItem(DODGE_PLACEMENT_KEY,JSON.stringify(value));return value;
}
/** Advance only after an eligible saved Normal round; retries are idempotent. */
export function advanceDodgePlacement(storage,record){
 const current=readDodgePlacement(storage),m=record?.metrics;try{validateAttemptRecord(record);}catch{return current;}if(!current||record.modality!=='dodge'||record.mode!=='normal'||m?.rulesetVersion!==DODGE_RULESET||record.level!==current.level||Date.parse(record.completedAt)<Date.parse(current.assessedAt)||current.lastAdvancedAttempt===record.attemptId)return current;
 const resolved=m.threatsDodged+m.threatsHit,demonstrated=m.elapsedActiveSeconds>=45&&resolved>=12&&m.threatsDodged/resolved>=.85;
 if(!demonstrated||current.level===MAX_DODGE_LEVEL)return current;
 const next=validateDodgePlacement({...current,level:current.level+1,lastAdvancedAttempt:record.attemptId});storage.setItem(DODGE_PLACEMENT_KEY,JSON.stringify(next));return next;
}
