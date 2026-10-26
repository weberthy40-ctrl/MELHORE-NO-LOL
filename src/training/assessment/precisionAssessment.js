import { readonlySnapshot } from '../snapshot.js';
import { precisionDifficulty } from '../precision/difficulty.js';
import { HIT_REFERENCES } from '../precision/score.js';
import { createThreeRoundFlow } from './threeRoundFlow.js';
import { recommendStartingLevel } from './recommendStartingLevel.js';
export const PRECISION_DIAGNOSTIC_VERSION='precision-diagnostic-v1';
// Same static-target exercise isolates size progression; no extrapolation to moving targets.
export const PRECISION_PRESETS=readonlySnapshot([2,5,8].map(level=>({level,variant:'single-static',duration:20,...precisionDifficulty(level,'single-static'),targetHits20:HIT_REFERENCES['single-static'][level-1]/3})));
export function validPrecisionDiagnostic(r,index){
 const preset=PRECISION_PRESETS[index];return Boolean(preset&&r?.origin==='diagnostic'&&r.diagnosticVersion===PRECISION_DIAGNOSTIC_VERSION&&typeof r.attemptId==='string'&&r.attemptId.trim()&&r.index===index+1&&r.level===preset.level&&r.variant===preset.variant&&r.radius===preset.radius&&r.speed===preset.speed&&r.durationTarget===20&&r.activeSeconds===20&&r.endReason==='diagnostic-time'&&r.complete===true&&[r.hits,r.misses,r.clicksEligible].every(n=>Number.isInteger(n)&&n>=0)&&r.hits+r.misses===r.clicksEligible&&(r.clicksEligible===0?r.accuracy===null:Number.isFinite(r.accuracy)&&Math.abs(r.accuracy-r.hits/r.clicksEligible)<1e-10));
}
export const createPrecisionAssessmentFlow=()=>createThreeRoundFlow({presets:PRECISION_PRESETS,validate:validPrecisionDiagnostic});
export function createPrecisionDiagnosticResult({session,practice,index}){
 const p=practice.snapshot(),s=session.snapshot(),preset=PRECISION_PRESETS[index-1];
 const result={origin:'diagnostic',diagnosticVersion:PRECISION_DIAGNOSTIC_VERSION,attemptId:s.id,index,level:preset?.level,variant:p.variant,radius:preset?.radius,speed:preset?.speed,durationTarget:20,activeSeconds:s.elapsed,hits:p.hits,misses:p.misses,clicksEligible:p.clicksEligible,accuracy:p.accuracy,endReason:'diagnostic-time',complete:s.state==='completed'};
 if(!validPrecisionDiagnostic(result,index-1))throw new TypeError('Incomplete precision diagnostic.');return readonlySnapshot(result);
}
export function calculatePrecisionGuidedAssessment(results,presets=PRECISION_PRESETS){
 const base={assessmentVersion:'1',recommendedStartingLevel:null,perAttempt:[],warnings:[],complete:false};
 if(!Array.isArray(presets)||presets.length!==3||!presets.every((p,i)=>p?.level===PRECISION_PRESETS[i].level&&p.variant===PRECISION_PRESETS[i].variant&&p.radius===PRECISION_PRESETS[i].radius&&p.speed===PRECISION_PRESETS[i].speed&&p.duration===20&&Number.isFinite(p.targetHits20)&&p.targetHits20>0))return readonlySnapshot({...base,status:'invalid-config',reason:'Metas ou presets diagnósticos inválidos.'});
 if(!Array.isArray(results)||results.length!==3||!results.every(validPrecisionDiagnostic)||new Set(results.map(r=>r.attemptId)).size!==3)return readonlySnapshot({...base,status:'invalid-data',reason:'São necessárias três tentativas completas e distintas, na ordem dos presets.'});
 const perAttempt=results.map((r,i)=>{const throughput=Math.min(1,r.hits/presets[i].targetHits20);return {...r,targetHits20:presets[i].targetHits20,throughput,qi:r.clicksEligible>=5?(r.hits?Math.round(100*(.6*r.accuracy+.4*throughput)):0):null};});
 if(perAttempt.some(r=>r.clicksEligible<5))return readonlySnapshot({...base,complete:true,perAttempt,status:'insufficient-evidence',reason:'Faltou atividade: pelo menos cinco cliques válidos são necessários em cada rodada.',warnings:perAttempt.filter(r=>r.clicksEligible<5).map(r=>`Tentativa ${r.index}: ${r.clicksEligible} cliques.`)});
 return readonlySnapshot({...base,complete:true,perAttempt,status:'recommended',reason:'Sugestão provisória baseada nas três amostras de 20 segundos.',recommendedStartingLevel:recommendStartingLevel(...perAttempt.map(r=>r.qi))});
}
