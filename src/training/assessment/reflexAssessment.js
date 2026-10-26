import { readonlySnapshot } from '../snapshot.js';
import { validReflexMetrics,REFLEX_METRICS_VERSION } from '../reflex/metrics.js';
import { reflexDifficulty } from '../reflex/difficulty.js';
import { createThreeRoundFlow } from './threeRoundFlow.js';
export const REFLEX_DIAGNOSTIC_VERSION='reflex-diagnostic-v2';
export const REFLEX_PRESETS=readonlySnapshot([3,6,9].map(level=>({level,variant:'mixed',duration:20})));
export function validReflexDiagnostic(r,index){return Boolean(REFLEX_PRESETS[index]&&r?.origin==='diagnostic'&&r.diagnosticVersion===REFLEX_DIAGNOSTIC_VERSION&&r.index===index+1&&r.variant==='mixed'&&r.level===REFLEX_PRESETS[index].level&&r.durationTarget===20&&r.elapsedActiveSeconds===20&&r.endReason==='diagnostic-time'&&r.terminal===true&&validReflexMetrics(r,{official:false}));}
export const createReflexAssessmentFlow=()=>createThreeRoundFlow({presets:REFLEX_PRESETS,validate:validReflexDiagnostic});
export function createReflexDiagnosticAttempt({session,exercise,index}){
 const preset=REFLEX_PRESETS[index-1];if(!preset||exercise.config.variant!=='mixed'||exercise.config.level!==preset.level)throw new TypeError('Invalid diagnostic preset.');let result=null;
 function finish(endReason){if(result)return result;exercise.stop();session.finish(endReason);const p=exercise.snapshot();result=readonlySnapshot({origin:'diagnostic',diagnosticVersion:REFLEX_DIAGNOSTIC_VERSION,metricsVersion:REFLEX_METRICS_VERSION,modality:'reflex',attemptId:session.snapshot().id,index,variant:p.variant,level:p.config.level,config:p.config,terminal:true,durationTarget:20,endReason,elapsedActiveSeconds:session.snapshot().elapsed,rounds:p.rounds,summary:p.summary,extraAnticipations:0,partialRound:p.partialRound});return result;}
 return {snapshot:()=>result,evaluate(){if(!result&&session.snapshot().state==='running'&&session.snapshot().elapsed>=20)finish('diagnostic-time');return result;},abandon:()=>finish('abandoned'),dispose(){if(!result)finish('abandoned');}};
}
export function calculateReflexGuidedAssessment(results){
 const base={recommendationVersion:'reaction-diagnostic-v1',recommendedStartingLevel:null,perAttempt:[],warnings:[]};
 if(!Array.isArray(results)||results.length!==3||!results.every(validReflexDiagnostic)||new Set(results.map(r=>r.attemptId)).size!==3)return readonlySnapshot({...base,status:'invalid-data',reason:'São necessárias três etapas completas e distintas de 20 segundos nos níveis 3, 6 e 9.'});
 const perAttempt=results.map(r=>{const enough=r.summary.presented>=3&&r.summary.reactionTimes.length>0,window=reflexDifficulty(r.level,'mixed').responseWindow,speed=r.summary.meanMs===null?null:Math.max(0,1-r.summary.meanMs/window),indicator=enough?100*(.7*r.summary.accuracy+.3*speed):null;return {attemptId:r.attemptId,index:r.index,level:r.level,accuracy:r.summary.accuracy,meanMs:r.summary.meanMs,opportunities:r.summary.presented,speed,indicator,demonstrated:enough&&indicator>=65,enough};});
 const warnings=perAttempt.filter(r=>!r.enough).map(r=>`Etapa ${r.index}: exige três oportunidades visuais completas e ao menos uma resposta correta.`);
 if(perAttempt.every(r=>!r.enough))return readonlySnapshot({...base,perAttempt,warnings,status:'insufficient-evidence',reason:'Faltaram respostas válidas e oportunidades suficientes; refaça a avaliação.'});
 return readonlySnapshot({...base,status:'recommended',perAttempt,warnings,recommendedStartingLevel:perAttempt.filter(r=>r.demonstrated).at(-1)?.level??1,reason:'Maior referência demonstrada (mínimo de três oportunidades e indicador de 65). Sugestão provisória; não altera seu nível no Perfil.'});
}
