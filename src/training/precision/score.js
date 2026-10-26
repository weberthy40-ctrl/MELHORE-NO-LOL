import { PRECISION_VARIANTS } from './practice.js';
import { PRECISION_METRICS_VERSION } from './attempt.js';
import { readonlySnapshot } from '../snapshot.js';
export const PRECISION_SCORING_VERSION='precision-score-v1';
export const HIT_REFERENCES=Object.freeze({
 'single-static':Object.freeze([45,44,43,42,40,38,36,34,32,30]),
 'single-moving':Object.freeze([35,34,33,32,30,28,27,25,24,22]),
 'multi-static':Object.freeze([55,54,53,52,50,48,46,44,42,40]),
 'multi-moving':Object.freeze([40,39,38,37,35,34,32,31,30,28]),
});
export function calculatePrecisionScore(metrics){
 const m=metrics??{},reasons=[];let components=[];
 const result=()=>readonlySnapshot({attemptId:m.attemptId??null,modality:'precision',mode:'timed',variant:m.variant??null,level:m.level??null,metricsVersion:m.metricsVersion??null,scoringVersion:PRECISION_SCORING_VERSION,status:reasons.length?'unscorable':'scored',score:reasons.length?null:Math.round(components.reduce((sum,c)=>sum+c.contribution,0)),components,smallSample:(m.hits??0)<12,reasons});
 if(m.modality!=='precision'||m.origin!=='official'||!m.terminal||m.endReason!=='completed'||m.elapsedActiveSeconds!==60||m.metricsVersion!==PRECISION_METRICS_VERSION||typeof m.attemptId!=='string'||!m.attemptId.trim()||!Object.hasOwn(PRECISION_VARIANTS,m.variant)||!Number.isInteger(m.level)||m.level<1||m.level>10)reasons.push('Somente treino cronometrado concluído e válido recebe nota oficial.');
 if(![m.hits,m.misses,m.clicksEligible].every(n=>Number.isInteger(n)&&n>=0)||m.hits+m.misses!==m.clicksEligible||!Array.isArray(m.histogram)||m.histogram.length!==6||!m.histogram.every(n=>Number.isInteger(n)&&n>=0)||m.histogram.reduce((n,value)=>n+value,0)!==m.hits)reasons.push('Contadores ou janelas de acerto inconsistentes.');
 if((m.clicksEligible===0&&m.accuracy!==null)||(m.clicksEligible>0&&(!Number.isFinite(m.accuracy)||Math.abs(m.accuracy-m.hits/m.clicksEligible)>1e-10)))reasons.push('Precisão observada inconsistente.');
 if(reasons.length)return result();
 const precision=m.clicksEligible?m.hits/m.clicksEligible:0,throughput=Math.min(1,m.hits/HIT_REFERENCES[m.variant][m.level-1]);
 const balance=m.hits?Math.max(0,1-m.histogram.reduce((sum,h)=>sum+Math.abs(h-m.hits/6),0)/(2*m.hits*5/6)):0;
 const consistency=balance*Math.min(1,m.hits/12);
 components=[['Precisão',60,precision],['Acertos em relação à meta',25,throughput],['Consistência',15,consistency]].map(([name,weight,index])=>({name,weight,index,contribution:weight*index}));
 return result();
}
