import { GAME_VERSION } from '../app/version.js';
import { validateReflexRecord,createReflexRecord } from './reflexRecord.js';
import { validateKitingRecord,createKitingRecord } from './kitingRecord.js';
import { METRICS_VERSION } from '../training/dodge/telemetry.js';
import { SCORING_VERSION } from '../training/dodge/score.js';
import { readonlySnapshot } from '../training/snapshot.js';
import { StorageError,assertRecordData } from './storageError.js';
import { validatePrecisionRecord,createPrecisionRecord } from './precisionRecord.js';
export { StorageError } from './storageError.js';
export function validateAttemptRecord(record){
  if(record?.modality==='reflex')return validateReflexRecord(record);
  if(record?.modality==='kiting')return validateKitingRecord(record);
  if(record?.modality==='precision')return validatePrecisionRecord(record);
  const r=record,m=r?.metrics,s=r?.score;
  if(!r||r.recordSchemaVersion!==1||r.modality!=='dodge'||typeof r.attemptId!=='string'||!r.attemptId.trim()||!['normal','survival'].includes(r.mode)||!Number.isInteger(r.level)||r.level<1||r.level>10||!['victory','defeat'].includes(r.endReason)||!Number.isFinite(Date.parse(r.completedAt))||!m||!s)throw new StorageError('Formato de tentativa inválido.','INVALID_RECORD');
  if(m.metricsVersion!==METRICS_VERSION||s.scoringVersion!==SCORING_VERSION||s.metricsVersion!==METRICS_VERSION||!m.terminal||m.endReason!==r.endReason||s.status!=='scored'||!Number.isInteger(s.score)||s.score<0||s.score>100||!Array.isArray(s.components)||s.components.length!==4||s.components.reduce((sum,c)=>sum+c.weight,0)!==100)throw new StorageError('Tentativa não elegível para salvamento.','INELIGIBLE');
  for(const snapshot of [m,s])if(snapshot.attemptId!==r.attemptId||snapshot.mode!==r.mode||snapshot.level!==r.level)throw new StorageError('Identidades de tentativa incompatíveis.','INVALID_RECORD');
  if(['attacksEmitted','threatsQualified','threatsDodged','threatsHit','validHits','contactsIgnored','attacksNonThreatening','threatsUnresolved'].some(key=>!Number.isInteger(m[key])||m[key]<0)||!Array.isArray(m.buckets)||m.buckets.length>120)throw new StorageError('Contagens inválidas.','INVALID_RECORD');
  if(m.threatsQualified!==m.threatsDodged+m.threatsHit+m.threatsUnresolved+m.contactsIgnored||m.validHits!==m.threatsHit||m.threatsDodged+m.threatsHit<=0||!Number.isFinite(m.elapsedActiveSeconds)||m.elapsedActiveSeconds<0||(r.mode==='normal'&&(m.elapsedActiveSeconds>60||m.validHits>3||(r.endReason==='victory'&&(m.elapsedActiveSeconds!==60||m.validHits>=3))||(r.endReason==='defeat'&&m.validHits!==3)))||(r.mode==='survival'&&(r.endReason!=='defeat'||m.validHits!==1)))throw new StorageError('Métricas contraditórias.','INVALID_RECORD');
  if(['totalDistanceMoved','activeMovementSeconds','stationarySeconds','riskDistance'].some(key=>!Number.isFinite(m[key])||m[key]<0)||m.attacksEmitted<m.threatsQualified||Math.abs(m.activeMovementSeconds+m.stationarySeconds-m.elapsedActiveSeconds)>.001||m.buckets.some(b=>!b||!['start','end','distance','movementSeconds','stationarySeconds','qualified','dodged','hit','ignored'].every(key=>Number.isFinite(b[key])&&b[key]>=0)||b.start>b.end))throw new StorageError('Movimento ou janelas inválidas.','INVALID_RECORD');
  if(!Number.isFinite(s.capFactor)||s.capFactor<=0||s.capFactor>1)throw new StorageError('Fator de score inválido.','INVALID_RECORD');
  if(Math.round(s.components.reduce((sum,c)=>sum+c.contribution,0))!==s.score||s.components.some(c=>Math.abs(c.contribution-c.weight*c.index*s.capFactor)>1e-6||!Number.isFinite(c.index)||c.index<0||c.index>1||c.contribution<0||c.contribution>c.weight))throw new StorageError('Componentes de score inválidos.','INVALID_RECORD');
  assertRecordData(r);return r;
}
export function createAttemptRecord(metrics,score,{completedAt=new Date().toISOString(),gameVersion=GAME_VERSION}={}){
  if(metrics.modality==='reflex')return createReflexRecord(metrics,score,{completedAt,gameVersion});
  if(metrics.modality==='kiting')return createKitingRecord(metrics,score,{completedAt,gameVersion});
  if(metrics.modality==='precision')return createPrecisionRecord(metrics,score,{completedAt,gameVersion});
  return readonlySnapshot(validateAttemptRecord({recordSchemaVersion:1,attemptId:metrics.attemptId,modality:'dodge',mode:metrics.mode,level:metrics.level,endReason:metrics.endReason,completedAt,gameVersion,metrics,score}));
}
export function canonicalRecord(value){if(Array.isArray(value))return `[${value.map(canonicalRecord).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalRecord(value[key])}`).join(',')}}`;return JSON.stringify(value);}
