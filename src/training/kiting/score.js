import { readonlySnapshot } from '../snapshot.js';
import { KITING_METRICS_VERSION } from './attempt.js';
import { kitingDifficulty } from './difficulty.js';
export const KITING_SCORING_VERSION='kiting-score-v1';
export function calculateKitingScore(metrics){
 const m=metrics??{};let config,components=[],activityGate=0;const reasons=[];
 try{config=kitingDifficulty(m.level,m.variant);}catch{reasons.push('Variante ou dificuldade inválida.');}
 if(m.origin!=='official'||m.modality!=='kiting'||m.metricsVersion!==KITING_METRICS_VERSION||!m.terminal||!((m.endReason==='completed'&&m.elapsedActiveSeconds===60)||(m.variant==='combat'&&m.endReason==='defeat'&&m.defeated===true&&m.health===0&&Number.isFinite(m.elapsedActiveSeconds)&&m.elapsedActiveSeconds>0&&m.elapsedActiveSeconds<=60))||typeof m.attemptId!=='string'||!m.attemptId.trim())reasons.push('Apenas sessão oficial completa de 60 segundos recebe nota.');
 if(![m.accepted,m.shots,m.hits,m.cancellations,m.rhythmOpportunities,m.rhythmCycles].every(n=>Number.isInteger(n)&&n>=0)||m.hits>m.shots||m.shots+m.cancellations>m.accepted||m.rhythmOpportunities!==Math.max(0,m.hits-1)||m.rhythmCycles>m.rhythmOpportunities||!Number.isFinite(m.totalDistanceMoved)||m.totalDistanceMoved<0||!Array.isArray(m.histogram)||m.histogram.length!==6||!m.histogram.every(n=>Number.isInteger(n)&&n>=0)||m.histogram.reduce((n,x)=>n+x,0)!==m.hits)reasons.push('Métricas inconsistentes.');
 if(!reasons.length){
  const efficiency=m.shots?m.hits/m.shots:0,productivity=Math.min(1,m.hits/config.referenceHits),rhythm=m.rhythmOpportunities?m.rhythmCycles/m.rhythmOpportunities:0,consistency=m.histogram.filter(n=>n>0).length/6*Math.min(1,m.hits/config.minSampleHits);activityGate=Math.min(1,m.hits/config.minSampleHits);
  components=[['Eficiência de ataque',40,efficiency],['Produtividade',30,productivity],['Ritmo ataque–movimento',20,rhythm],['Consistência',10,consistency]].map(([name,weight,index])=>{index*=m.endReason==='defeat'?m.elapsedActiveSeconds/60:1;return {name,weight,index,contribution:weight*index};});
 }
 return readonlySnapshot({attemptId:m.attemptId??null,modality:'kiting',mode:'timed',variant:m.variant??null,level:m.level??null,metricsVersion:m.metricsVersion??null,scoringVersion:KITING_SCORING_VERSION,status:reasons.length?'unscorable':'scored',score:reasons.length?null:Math.round(components.reduce((n,c)=>n+c.contribution,0)*activityGate),components,activityGate,referenceHits:config?.referenceHits??null,minSampleHits:config?.minSampleHits??null,reasons});
}
