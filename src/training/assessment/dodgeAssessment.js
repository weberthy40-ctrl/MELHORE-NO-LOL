import { readonlySnapshot } from '../snapshot.js';
export const ASSESSMENT_LEVELS=Object.freeze([2,10,18]); // Stored v3 assessments remain readable.
export const DIAGNOSTIC_VERSION='dodge-diagnostic-v4';
export const DIAGNOSTIC_ROUNDS=5;
export const DIAGNOSTIC_DURATION=30;
export function validDiagnostic(result,index){
 const legacy=result?.diagnosticVersion==='dodge-diagnostic-v3',duration=legacy?40:DIAGNOSTIC_DURATION;
 return (legacy||result?.diagnosticVersion===DIAGNOSTIC_VERSION)&&result.origin==='diagnostic'&&typeof result.attemptId==='string'&&result.attemptId.length>0&&result.index===index+1&&index<(legacy?3:DIAGNOSTIC_ROUNDS)&&Number.isInteger(result.level)&&result.level>=1&&result.level<=20&&(!legacy||result.level===ASSESSMENT_LEVELS[index])&&result.durationTarget===duration&&result.complete===true&&Number.isFinite(result.activeSeconds)&&result.activeSeconds>=0&&result.activeSeconds<=duration&&result.initialLives===3&&Number.isInteger(result.finalLives)&&result.finalLives>=0&&result.finalLives<=3&&Number.isInteger(result.hits)&&result.hits===3-result.finalLives&&['diagnostic-time','diagnostic-lives'].includes(result.endReason)&&((result.endReason==='diagnostic-time'&&result.activeSeconds===duration&&result.finalLives>0)||(result.endReason==='diagnostic-lives'&&result.finalLives===0))&&Number.isInteger(result.eligibleThreats)&&result.eligibleThreats>=result.hits&&Number.isInteger(result.verifiedDodges)&&result.verifiedDodges>=0&&result.verifiedDodges+result.hits<=result.eligibleThreats;
}
export function diagnosticEvidence(r){
 const resolved=r.verifiedDodges+r.hits,avoidance=resolved?r.verifiedDodges/resolved:0;
 return {resolved,avoidance,passed:r.activeSeconds>=24&&r.finalLives>0&&resolved>=6&&avoidance>=.8,qi:Math.round(100*(.5*r.activeSeconds/r.durationTarget+.35*avoidance+.15*r.finalLives/3))};
}
export function nextDiagnosticLevel(results){
 if(!results.length)return 5;
 let low=0,high=21;
 for(const r of results){if(diagnosticEvidence(r).passed)low=Math.max(low,r.level);else high=Math.min(high,r.level);}
 return Math.max(1,Math.min(20,Math.floor((low+high)/2)));
}
export function createDodgeAssessmentFlow(){
 let state='introduction',results=[];
 const snapshot=()=>readonlySnapshot({state,index:Math.min(DIAGNOSTIC_ROUNDS,results.length+1),total:DIAGNOSTIC_ROUNDS,level:results.length<DIAGNOSTIC_ROUNDS?nextDiagnosticLevel(results):null,results});
 return {snapshot,start(){if(state!=='introduction')return false;state='preparing';return true;},running(){if(state!=='preparing')return false;state='running';return true;},
 finishRound(result){if(state!=='running'||result?.diagnosticVersion!==DIAGNOSTIC_VERSION||!validDiagnostic(result,results.length)||result.level!==nextDiagnosticLevel(results)||results.some(r=>r.attemptId===result.attemptId))return false;results.push(readonlySnapshot(result));state=results.length===DIAGNOSTIC_ROUNDS?'completed':'round-summary';return true;},
 next(){if(state!=='round-summary')return false;state='preparing';return true;},cancel(){state='cancelled';results=[];},fail(){state='error';},reset(){state='introduction';results=[];}};
}
export function calculateDodgeGuidedAssessment(results){
 const legacy=results?.[0]?.diagnosticVersion==='dodge-diagnostic-v3',total=legacy?3:DIAGNOSTIC_ROUNDS;
 const base={guidedAssessmentVersion:legacy?'2':'3',recommendedStartingLevel:null,perAttempt:[],evidenceWarnings:[],complete:Array.isArray(results)&&results.length===total};
 if(!base.complete||!results.every((r,i)=>r?.diagnosticVersion===(legacy?'dodge-diagnostic-v3':DIAGNOSTIC_VERSION)&&validDiagnostic(r,i))||new Set(results.map(r=>r.attemptId)).size!==total||!legacy&&results.some((r,i)=>r.level!==nextDiagnosticLevel(results.slice(0,i))))return readonlySnapshot({...base,complete:false,status:'invalid-data',explanation:legacy?'Três tentativas diagnósticas válidas nas dificuldades 2, 10 e 18 são necessárias.':'Conclua as cinco etapas adaptativas na ordem apresentada.'});
 if(results.some(r=>r.eligibleThreats<3))return readonlySnapshot({...base,status:'insufficient-evidence',perAttempt:results,evidenceWarnings:results.filter(r=>r.eligibleThreats<3).map(r=>`Etapa ${r.index}: menos de três ameaças resolvidas.`),explanation:'Evidências insuficientes; refaça a avaliação.'});
 if(legacy){const perAttempt=results.map(r=>({...r,qi:Math.round(100*(.5*r.activeSeconds/40+.3*r.verifiedDodges/r.eligibleThreats+.2*r.finalLives/3))})),[q2,q10,q18]=perAttempt.map(r=>r.qi);return readonlySnapshot({...base,status:'recommended',perAttempt,recommendedStartingLevel:recommendDodgeLevel(q2,q10,q18,results[2].hits),explanation:'Avaliação anterior preservada. A nova avaliação adaptativa está disponível no menu.'});}
 const perAttempt=results.map(r=>({...r,...diagnosticEvidence(r)})),passed=perAttempt.filter(r=>r.passed),recommendedStartingLevel=Math.max(1,...passed.map(r=>r.level));
 const repeated=perAttempt.filter(r=>r.level===recommendedStartingLevel),uncertain=repeated.some(r=>!r.passed)||passed.length===0;
 return readonlySnapshot({...base,status:'recommended',perAttempt,recommendedStartingLevel,confidence:uncertain?'provisional':'observed',evidenceWarnings:uncertain?['Ponto de partida conservador; ainda há oscilação ou pouca evidência de domínio.']:[],explanation:'Maior dificuldade demonstrada com pelo menos seis ameaças resolvidas, 80% de esquiva e sobrevivência por 24 s. É um ponto de partida para treino, não uma estimativa do elo do LoL.'});
}
/** Published v3 boundaries are retained solely to validate saved assessments. */
export function recommendDodgeLevel(q2,q10,q18,lastHits){
 if(![q2,q10,q18].every(q=>Number.isInteger(q)&&q>=0&&q<=100)||!Number.isInteger(lastHits)||lastHits<0||lastHits>3)throw new TypeError('Invalid diagnostic scores.');
 const rules=[[20,q18>=95&&q10>=85&&q2>=75&&lastHits===0],[18,q18>=85&&q10>=75&&q2>=65],[16,q18>=70&&q10>=65&&q2>=55],[14,q18>=55&&q10>=65&&q2>=55],[12,q10>=85&&q2>=60],[10,q10>=70&&q2>=50],[8,q10>=55&&q2>=45],[5,q2>=85],[3,q2>=65],[1,true]];
 return rules.find(([,condition])=>condition)[0];
}
