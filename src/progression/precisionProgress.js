import { validatePrecisionRecord } from '../persistence/precisionRecord.js';
import { readonlySnapshot } from '../training/snapshot.js';
import { PRECISION_VARIANTS } from '../training/precision/practice.js';
export const PRECISION_ACHIEVEMENTS=Object.freeze([
 ['first-hit','Primeiro Acerto','Conclua uma tentativa oficial com pelo menos um acerto.'],
 ['good-aim','Boa Mira','Tenha pelo menos 20 cliques válidos e 80% de precisão.'],
 ['surgical','Mira Cirúrgica','Acerte todos os cliques em uma tentativa com pelo menos 20 cliques.'],
 ['highlight','Sessão de Destaque','Conclua uma tentativa com nota salva de pelo menos 80.'],
 ['versatile','Versátil','Conclua uma sessão mista com os quatro padrões de alvo, ou as quatro variantes anteriores.'],
 ['explorer','Explorador da Precisão','Conclua tentativas oficiais em três dificuldades distintas.'],
].map(([id,title,description])=>Object.freeze({id,title,description})));
const chronological=(a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)||(a.attemptId<b.attemptId?-1:a.attemptId>b.attemptId?1:0);
export function eligiblePrecision(record){try{validatePrecisionRecord(record);return true;}catch{return false;}}
export function comparePrecisionRecord(a,b,{accuracy=true}={}){
 const primary=b.score.score-a.score.score;if(primary)return primary;
 if(accuracy){const ratio=b.metrics.hits/b.metrics.clicksEligible-a.metrics.hits/a.metrics.clicksEligible;if(Number.isFinite(ratio)&&ratio)return ratio;}
 return b.metrics.hits-a.metrics.hits||chronological(a,b);
}
/** Two record candidates/context permit a context-wide decision to omit unknown accuracy. */
export function createPrecisionProgress(){
 const records=new Map(),evidence=new Map(),mixedEvidence=new Map(),competitiveEvidence=new Map(),levelFirst=new Map(),variantFirst=new Map(),first=new Map();let total=0,sum=0,best=null,latest=null;
 function mark(id,record){if(!first.has(id)||chronological(record,first.get(id))<0)first.set(id,record);}
 function markGroup(map,key,record){if(!map.has(key)||chronological(record,map.get(key))<0)map.set(key,record);}
 return {add(record){
   if(!eligiblePrecision(record))return;total++;sum+=record.score.score;best=best===null?record.score.score:Math.max(best,record.score.score);if(!latest||chronological(record,latest)>0)latest=record;
   const context=`${record.variant}:${record.level}`,measured=record.metrics.clicksEligible>0;
   if(!records.has(context))records.set(context,{accuracy:record,hits:record,comparable:measured});
   else{const r=records.get(context);r.comparable&&=measured;if(comparePrecisionRecord(record,r.accuracy)<0)r.accuracy=record;if(comparePrecisionRecord(record,r.hits,{accuracy:false})<0)r.hits=record;}
   if(record.variant==='mixed'&&record.metrics.patternsSeen?.length===4)mark('versatile',record);if(record.metrics.hits>=1)mark('first-hit',record);
   if(record.metrics.clicksEligible>=20&&record.metrics.hits/record.metrics.clicksEligible>=.8)mark('good-aim',record);
   if(record.metrics.clicksEligible>=20&&record.metrics.hits===record.metrics.clicksEligible)mark('surgical',record);
   if(record.score.score>=80)mark('highlight',record);markGroup(levelFirst,record.level,record);markGroup(variantFirst,record.variant,record);
   if(['single-static','mixed'].includes(record.variant)){
     const pool=record.variant==='mixed'?(record.metrics.sequenceVersion==='clear-group-v4'?competitiveEvidence:mixedEvidence):evidence;if(!pool.has(record.level))pool.set(record.level,{count:0,recent:[]});const e=pool.get(record.level);e.count++;e.recent.push(record);e.recent.sort((a,b)=>chronological(b,a));e.recent=e.recent.slice(0,3);
   }
 },snapshot(){
   const explorer=[...levelFirst.values()].sort(chronological)[2],versatile=[...variantFirst.values()].filter(r=>r.variant!=='mixed').sort(chronological)[3];if(explorer)mark('explorer',explorer);if(versatile)mark('versatile',versatile);
   const reference=[...competitiveEvidence.values()].some(e=>e.count>=3)?competitiveEvidence:[...mixedEvidence.values()].some(e=>e.count>=3)?mixedEvidence:evidence;
   const evidenceByLevel=Array.from({length:10},(_,index)=>{const level=index+1,e=reference.get(level)??{count:0,recent:[]},scores=e.recent.map(r=>r.score.score),median=scores.length===3?[...scores].sort((a,b)=>a-b)[1]:null,passing=scores.filter(n=>n>=60).length;return {level,count:e.count,attemptIds:e.recent.map(r=>r.attemptId),scores,median,passing,demonstrated:scores.length===3&&median>=60&&passing>=2};});
   const rating=evidenceByLevel.filter(e=>e.demonstrated).at(-1)?.level??null;
   return readonlySnapshot({total,records:[...records.values()].map(r=>r.comparable?r.accuracy:r.hits),achievements:PRECISION_ACHIEVEMENTS.map(a=>({...a,unlocked:first.has(a.id),completedAt:first.get(a.id)?.completedAt??null})),stats:{total,bestScore:best,meanScore:total?sum/total:null,latestScore:latest?.score.score??null},rating:{ratingVersion:'1',rating,status:rating===null?'insufficient-data':'classified',referenceConfig:reference===competitiveEvidence?'clear-group-v4':null,referenceVariant:[competitiveEvidence,mixedEvidence].includes(reference)?'mixed':'single-static',evidenceByLevel,totalEligibleAttempts:[...reference.values()].reduce((n,e)=>n+e.count,0)}});
 }};
}
export function calculatePrecisionProgress(attempts){const p=createPrecisionProgress(),seen=new Set();for(const r of attempts){if(seen.has(r?.attemptId))continue;seen.add(r?.attemptId);p.add(r);}return p.snapshot();}
export function preparePrecisionEvolution(attempts,{variant='single-static',level=1,limit=30}={}){
 if(!PRECISION_VARIANTS[variant]||!Number.isInteger(level)||level<1||level>10||![10,30,100].includes(limit))throw new TypeError('Invalid precision evolution filters.');
 const seen=new Set();return readonlySnapshot(attempts.filter(r=>eligiblePrecision(r)&&r.variant===variant&&r.level===level&&!seen.has(r.attemptId)&&seen.add(r.attemptId)).sort((a,b)=>chronological(b,a)).slice(0,limit).reverse().map(r=>({attemptId:r.attemptId,date:r.completedAt,variant,level,value:r.score.score,accuracy:r.metrics.clicksEligible?r.metrics.hits/r.metrics.clicksEligible*100:null,score:r.score.score,outcome:r.endReason,calibrationVersion:r.metrics.sequenceVersion??'legacy',scoringVersion:r.score.scoringVersion})));
}
