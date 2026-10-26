import { GAME_VERSION } from '../app/version.js';
import { readonlySnapshot } from '../training/snapshot.js';
import { validReflexMetrics,REFLEX_METRICS_VERSION } from '../training/reflex/metrics.js';
import { REFLEX_SCORING_VERSION } from '../training/reflex/score.js';
import { StorageError,assertRecordData } from './storageError.js';
export function validateReflexRecord(r){
 assertRecordData(r);const m=r?.metrics,s=r?.score;
 if(r?.recordSchemaVersion!==1||r.modality!=='reflex'||r.mode!=='timed'||r.endReason!=='completed'||!Number.isFinite(Date.parse(r.completedAt))||!validReflexMetrics(m)||m.summary.presented<1||!s||s.status!=='scored'||s.metricsVersion!==REFLEX_METRICS_VERSION||s.scoringVersion!==REFLEX_SCORING_VERSION||!Number.isInteger(s.score)||s.score<0||s.score>100||[m,s].some(v=>v.attemptId!==r.attemptId||v.variant!==r.variant||v.level!==r.level))throw new StorageError('Reflexos não elegíveis para salvamento.','INELIGIBLE');
 if(!Array.isArray(s.components)||s.components.length!==3||s.components.some((c,i)=>Math.abs(c.contribution-c.weight*c.index)>1e-6||c.weight!==[55,25,20][i]||![c.index,c.contribution].every(Number.isFinite)||c.index<0||c.index>1||c.contribution<0||c.contribution>c.weight)||Math.round(s.components.reduce((n,c)=>n+c.contribution,0))!==s.score)throw new StorageError('Score de Reflexos inconsistente.','INVALID_RECORD');return r;
}
export function createReflexRecord(metrics,score,{completedAt=new Date().toISOString(),gameVersion=GAME_VERSION}={}){return readonlySnapshot(validateReflexRecord({recordSchemaVersion:1,attemptId:metrics.attemptId,modality:'reflex',mode:'timed',variant:metrics.variant,level:metrics.level,endReason:metrics.endReason,completedAt,gameVersion,metrics,score}));}
