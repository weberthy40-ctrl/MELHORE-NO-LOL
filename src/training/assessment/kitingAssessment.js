import { readonlySnapshot } from '../snapshot.js';
import { kitingDifficulty } from '../kiting/difficulty.js';
import { createThreeRoundFlow } from './threeRoundFlow.js';
import { recommendStartingLevel } from './recommendStartingLevel.js';
export const KITING_DIAGNOSTIC_VERSION='kiting-diagnostic-v1';
export const KITING_PRESETS=readonlySnapshot(['combat','combat','combat'].map((variant,i)=>{const config=kitingDifficulty([2,5,8][i],variant);return {variant,level:config.level,duration:20,config,targetHits20:Math.max(1,config.referenceHits/3)};}));
export function validKitingDiagnostic(r,index){
 const preset=KITING_PRESETS[index];return Boolean(preset&&r?.origin==='diagnostic'&&r.modality==='kiting'&&r.diagnosticVersion===KITING_DIAGNOSTIC_VERSION&&typeof r.attemptId==='string'&&r.attemptId.trim()&&r.index===index+1&&r.level===preset.level&&r.variant===preset.variant&&r.durationTarget===20&&r.activeSeconds===20&&r.endReason==='diagnostic-time'&&r.complete===true&&r.config&&Object.entries(preset.config).every(([key,value])=>r.config[key]===value)&&[r.accepted,r.shots,r.hits,r.cancellations,r.rhythmOpportunities,r.rhythmCycles].every(n=>Number.isInteger(n)&&n>=0)&&r.hits<=r.shots&&r.shots+r.cancellations<=r.accepted&&r.rhythmOpportunities===Math.max(0,r.hits-1)&&r.rhythmCycles<=r.rhythmOpportunities&&Number.isFinite(r.totalDistanceMoved)&&r.totalDistanceMoved>=0&&Array.isArray(r.histogram)&&r.histogram.length===4&&r.histogram.every(n=>Number.isInteger(n)&&n>=0)&&r.histogram.reduce((n,h)=>n+h,0)===r.hits);
}
export const createKitingAssessmentFlow=()=>createThreeRoundFlow({presets:KITING_PRESETS,validate:validKitingDiagnostic});
export function createKitingDiagnosticResult({session,practice,index}){
 const p=practice.snapshot(),s=session.snapshot();const result={origin:'diagnostic',modality:'kiting',diagnosticVersion:KITING_DIAGNOSTIC_VERSION,attemptId:s.id,index,level:p.level,variant:p.variant,config:p.config,durationTarget:20,activeSeconds:s.elapsed,endReason:'diagnostic-time',complete:s.state==='completed',accepted:p.accepted,shots:p.shots,hits:p.hits,cancellations:p.cancellations,rhythmOpportunities:p.rhythmOpportunities,rhythmCycles:p.rhythmCycles,totalDistanceMoved:p.totalDistanceMoved,histogram:p.histogram};if(!validKitingDiagnostic(result,index-1))throw new TypeError('Incomplete kiting diagnostic.');return readonlySnapshot(result);
}
export function calculateKitingGuidedAssessment(results,presets=KITING_PRESETS){
 const base={assessmentVersion:'1',recommendedStartingLevel:null,perAttempt:[],warnings:[],complete:false};
 if(!Array.isArray(presets)||presets.length!==3||!presets.every((p,i)=>p?.variant===KITING_PRESETS[i].variant&&p.level===KITING_PRESETS[i].level&&p.duration===20&&Number.isFinite(p.targetHits20)&&p.targetHits20>0))return readonlySnapshot({...base,status:'invalid-config',reason:'Metas ou presets de Kiting inválidos.'});
 if(!Array.isArray(results)||results.length!==3||!results.every(validKitingDiagnostic)||new Set(results.map(r=>r.attemptId)).size!==3)return readonlySnapshot({...base,status:'invalid-data',reason:'Três tentativas diagnósticas completas, distintas e ordenadas são necessárias.'});
 const perAttempt=results.map((r,i)=>{const efficiency=r.shots?r.hits/r.shots:0,productivity=Math.min(1,r.hits/presets[i].targetHits20),rhythm=r.rhythmOpportunities?r.rhythmCycles/r.rhythmOpportunities:0,consistency=r.histogram.filter(n=>n>0).length/4*Math.min(1,r.hits/4);return {...r,targetHits20:presets[i].targetHits20,efficiency,productivity,rhythm,consistency,qi:Math.round(100*(.4*efficiency+.3*productivity+.2*rhythm+.1*consistency))};});
 if(results.some(r=>r.hits<3))return readonlySnapshot({...base,status:'insufficient-evidence',complete:true,perAttempt,reason:'Pelo menos três acertos confirmados são necessários em cada exercício.',warnings:results.filter(r=>r.hits<3).map(r=>`Tentativa ${r.index}: apenas ${r.hits} acertos.`)});
 return readonlySnapshot({...base,status:'recommended',complete:true,perAttempt,recommendedStartingLevel:recommendStartingLevel(...perAttempt.map(r=>r.qi)),reason:'Sugestão provisória baseada nos três exercícios curtos.'});
}
