import { GAME_VERSION } from '../app/version.js';
import { readonlySnapshot } from '../training/snapshot.js';
import { PRECISION_VARIANTS } from '../training/precision/practice.js';
import { PRECISION_METRICS_VERSION } from '../training/precision/attempt.js';
import { PRECISION_SCORING_VERSION } from '../training/precision/score.js';
import { StorageError,assertRecordData } from './storageError.js';
export function validatePrecisionRecord(r){
 assertRecordData(r);
 const m=r?.metrics,s=r?.score;
 if(m?.groupsCompleted!==undefined&&(!Number.isInteger(m.groupsCompleted)||m.groupsCompleted<0||m.groupsCompleted>m.hits))throw new StorageError('Grupos concluídos inválidos.','INVALID_RECORD');
 if(m?.patternsSeen!==undefined&&(!Array.isArray(m.patternsSeen)||m.patternsSeen.length>4||new Set(m.patternsSeen).size!==m.patternsSeen.length||m.patternsSeen.some(v=>!['single-static','single-moving','multi-static','multi-moving'].includes(v))))throw new StorageError('Padrões de treino inválidos.','INVALID_RECORD');
 if(m?.expiredTargets!==undefined&&(!Number.isInteger(m.expiredTargets)||m.expiredTargets<0))throw new StorageError('Alvos expirados inválidos.','INVALID_RECORD');
 if(r?.recordSchemaVersion!==1||r.modality!=='precision'||r.mode!=='timed'||r.endReason!=='completed'||typeof r.attemptId!=='string'||!r.attemptId.trim()||!Object.hasOwn(PRECISION_VARIANTS,r.variant)||!Number.isInteger(r.level)||r.level<1||r.level>10||!Number.isFinite(Date.parse(r.completedAt))||!m||!s)throw new StorageError('Registro de Precisão inválido.','INVALID_RECORD');
 if(m.origin!=='official'||m.modality!=='precision'||!m.terminal||m.endReason!=='completed'||m.elapsedActiveSeconds!==60||m.metricsVersion!==PRECISION_METRICS_VERSION||s.scoringVersion!==PRECISION_SCORING_VERSION||s.metricsVersion!==PRECISION_METRICS_VERSION||s.status!=='scored'||!Number.isInteger(s.score)||s.score<0||s.score>100)throw new StorageError('Precisão não elegível para salvamento.','INELIGIBLE');
 if([m,s].some(v=>v.attemptId!==r.attemptId||v.variant!==r.variant||v.level!==r.level)||![m.hits,m.misses,m.clicksEligible].every(n=>Number.isInteger(n)&&n>=0)||m.hits+m.misses!==m.clicksEligible||!Array.isArray(m.histogram)||m.histogram.length!==6||!m.histogram.every(n=>Number.isInteger(n)&&n>=0)||m.histogram.reduce((n,h)=>n+h,0)!==m.hits)throw new StorageError('Métricas de Precisão contraditórias.','INVALID_RECORD');
 if((m.clicksEligible===0&&m.accuracy!==null)||(m.clicksEligible>0&&(!Number.isFinite(m.accuracy)||Math.abs(m.accuracy-m.hits/m.clicksEligible)>1e-10))||!Array.isArray(s.components)||s.components.length!==3||s.components.some((c,i)=>c.weight!==[60,25,15][i]||Math.abs(c.contribution-c.weight*c.index)>1e-6||![c.index,c.weight,c.contribution].every(Number.isFinite)||c.index<0||c.index>1||c.contribution<0||c.contribution>c.weight)||s.components.reduce((n,c)=>n+c.weight,0)!==100||Math.round(s.components.reduce((n,c)=>n+c.contribution,0))!==s.score)throw new StorageError('Score de Precisão inconsistente.','INVALID_RECORD');
 return r;
}
export function createPrecisionRecord(metrics,score,{completedAt=new Date().toISOString(),gameVersion=GAME_VERSION}={}){
 return readonlySnapshot(validatePrecisionRecord({recordSchemaVersion:1,attemptId:metrics.attemptId,modality:'precision',mode:'timed',variant:metrics.variant,level:metrics.level,endReason:metrics.endReason,completedAt,gameVersion,metrics,score}));
}
