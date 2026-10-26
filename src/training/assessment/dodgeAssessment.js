import { readonlySnapshot } from '../snapshot.js';
export const ASSESSMENT_LEVELS=Object.freeze([2,5,8]);
export const DIAGNOSTIC_VERSION='dodge-diagnostic-v1';
export function validDiagnostic(result,index){
 return result?.diagnosticVersion===DIAGNOSTIC_VERSION&&result.origin==='diagnostic'&&typeof result.attemptId==='string'&&result.attemptId.length>0&&result.index===index+1&&result.level===ASSESSMENT_LEVELS[index]&&result.durationTarget===20&&result.complete===true&&Number.isFinite(result.activeSeconds)&&result.activeSeconds>=0&&result.activeSeconds<=20&&result.initialLives===3&&Number.isInteger(result.finalLives)&&result.finalLives>=0&&result.finalLives<=3&&Number.isInteger(result.hits)&&result.hits===3-result.finalLives&&['diagnostic-time','diagnostic-lives'].includes(result.endReason)&&((result.endReason==='diagnostic-time'&&result.activeSeconds===20&&result.finalLives>0)||(result.endReason==='diagnostic-lives'&&result.finalLives===0))&&Number.isInteger(result.eligibleThreats)&&result.eligibleThreats>=result.hits&&Number.isInteger(result.verifiedDodges)&&result.verifiedDodges>=0&&result.verifiedDodges+result.hits<=result.eligibleThreats;
}
export function createDodgeAssessmentFlow(){
 let state='introduction',results=[];
 const snapshot=()=>readonlySnapshot({state,index:Math.min(3,results.length+1),level:ASSESSMENT_LEVELS[results.length]??null,results});
 return {snapshot,start(){if(state!=='introduction')return false;state='preparing';return true;},running(){if(state!=='preparing')return false;state='running';return true;},
   finishRound(result){if(state!=='running'||!validDiagnostic(result,results.length)||results.some(r=>r.attemptId===result.attemptId))return false;results.push(readonlySnapshot(result));state=results.length===3?'completed':'round-summary';return true;},
   next(){if(state!=='round-summary')return false;state='preparing';return true;},
   cancel(){state='cancelled';results=[];},fail(){state='error';},reset(){state='introduction';results=[];},
 };
}
export function calculateDodgeGuidedAssessment(results){
 const base={guidedAssessmentVersion:'1',recommendedStartingLevel:null,perAttempt:[],evidenceWarnings:[],complete:Array.isArray(results)&&results.length===3};
 if(!base.complete||!results.every(validDiagnostic)||new Set(results.map(r=>r.attemptId)).size!==3)return readonlySnapshot({...base,complete:false,status:'invalid-data',explanation:'Três tentativas diagnósticas válidas nas dificuldades 2, 5 e 8 são necessárias.'});
 if(results.some(r=>r.eligibleThreats<3))return readonlySnapshot({...base,status:'insufficient-evidence',perAttempt:results,evidenceWarnings:results.filter(r=>r.eligibleThreats<3).map(r=>`Tentativa ${r.index}: menos de três ameaças resolvidas.`),explanation:'Evidências insuficientes; refaça a avaliação.'});
 const perAttempt=results.map(r=>({...r,qi:Math.round(100*(.5*r.activeSeconds/20+.3*r.verifiedDodges/r.eligibleThreats+.2*r.finalLives/3))}));
 const [q2,q5,q8]=perAttempt.map(r=>r.qi);

 return readonlySnapshot({...base,status:'recommended',perAttempt,recommendedStartingLevel:recommendDodgeLevel(q2,q5,q8,results[2].hits),explanation:'Sugestão experimental baseada nos três testes curtos. Não altera a classificação pessoal no Perfil.'});
}

export function recommendDodgeLevel(q2,q5,q8,lastHits){
 if(![q2,q5,q8].every(q=>Number.isInteger(q)&&q>=0&&q<=100)||!Number.isInteger(lastHits)||lastHits<0||lastHits>3)throw new TypeError('Invalid diagnostic scores.');
 const rules=[[10,q8>=95&&q5>=85&&q2>=75&&lastHits===0],[9,q8>=85&&q5>=75&&q2>=65],[8,q8>=70&&q5>=65&&q2>=55],[7,q8>=55&&q5>=65&&q2>=55],[6,q5>=85&&q2>=60],[5,q5>=70&&q2>=50],[4,q5>=55&&q2>=45],[3,q2>=85],[2,q2>=65],[1,true]];
 return rules.find(([,condition])=>condition)[0];
}
