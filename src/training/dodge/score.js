import { readonlySnapshot } from '../snapshot.js';
import { METRICS_VERSION } from './telemetry.js';
export const SCORING_VERSION='dodge-score-v1';
const clamp=value=>Math.max(0,Math.min(1,value));
export function calculateDodgeScore(metrics) {
  const m=metrics??{},reasons=[],components=[];let capFactor=1;
  const resolved=m.threatsDodged+m.threatsHit;
  const result=()=>readonlySnapshot({attemptId:m.attemptId??null,mode:m.mode??null,level:m.level??null,scoringVersion:SCORING_VERSION,metricsVersion:m.metricsVersion??null,status:reasons.length?'unscorable':'scored',score:reasons.length?null:Math.round(components.reduce((sum,c)=>sum+c.contribution,0)),components,capFactor,resolvedSample:Number.isFinite(resolved)?resolved:0,smallSample:resolved<5,reasons});
  if(m.metricsVersion!==METRICS_VERSION||typeof m.attemptId!=='string'||!m.attemptId.trim()||!['normal','survival'].includes(m.mode)||!Number.isInteger(m.level)||m.level<1||m.level>10||!m.terminal||!['victory','defeat'].includes(m.endReason))reasons.push('Tentativa ou versão não elegível.');
  const counts=['attacksEmitted','threatsQualified','threatsDodged','threatsHit','validHits','contactsIgnored','attacksNonThreatening','threatsUnresolved'];
  if(counts.some(k=>!Number.isInteger(m[k])||m[k]<0)||['elapsedActiveSeconds','totalDistanceMoved','activeMovementSeconds','stationarySeconds','riskDistance'].some(k=>!Number.isFinite(m[k])||m[k]<0)||!Array.isArray(m.buckets))reasons.push('Métricas inválidas ou incompletas.');
  if(reasons.length)return result();
  if(m.buckets.some(b=>!['qualified','dodged','hit','ignored'].every(k=>Number.isInteger(b[k])&&b[k]>=0)))reasons.push('Contagens fracionárias nas janelas.');
  if(m.threatsQualified!==m.threatsDodged+m.threatsHit+m.threatsUnresolved+m.contactsIgnored||m.validHits!==m.threatsHit||m.attacksEmitted<m.threatsQualified||Math.abs(m.activeMovementSeconds+m.stationarySeconds-m.elapsedActiveSeconds)>.001)reasons.push('Contagens contraditórias.');
  if(m.mode==='normal'&&(m.validHits>3||m.elapsedActiveSeconds>60||(m.endReason==='victory'&&(m.elapsedActiveSeconds!==60||m.validHits>=3))||(m.endReason==='defeat'&&m.validHits!==3)))reasons.push('Resultado incompatível com o modo Normal.');
  if(m.mode==='survival'&&(m.endReason!=='defeat'||m.validHits!==1))reasons.push('Resultado incompatível com Sobrevivência.');
  if(resolved<=0)reasons.push('Sem amostra de ameaças resolvidas.');
  if(m.buckets.some(b=>!['dodged','hit','qualified','ignored','distance','movementSeconds','stationarySeconds','start','end'].every(k=>Number.isFinite(b[k])&&b[k]>=0)))reasons.push('Janelas temporais inválidas.');
  if(!reasons.length){
    for(const [key,total] of [['qualified',m.threatsQualified],['dodged',m.threatsDodged],['hit',m.threatsHit],['ignored',m.contactsIgnored]])if(m.buckets.reduce((sum,b)=>sum+b[key],0)!==total)reasons.push('Totais e janelas temporais divergem.');
    for(const [key,total] of [['distance',m.totalDistanceMoved],['movementSeconds',m.activeMovementSeconds],['stationarySeconds',m.stationarySeconds]])if(Math.abs(m.buckets.reduce((sum,b)=>sum+b[key],0)-total)>.001)reasons.push('Movimento e janelas temporais divergem.');
  }
  if(reasons.length)return result();
  const windows=m.buckets.filter(b=>b.dodged+b.hit>0);
  if(windows.length<2){reasons.push('Consistência: amostra insuficiente (menos de duas janelas).');return result();}
  const dodge=m.threatsDodged/resolved,rates=windows.map(b=>b.dodged/(b.dodged+b.hit)),mean=rates.reduce((a,b)=>a+b,0)/rates.length;
  const consistency=clamp(mean*(1-Math.sqrt(rates.reduce((sum,r)=>sum+(r-mean)**2,0)/rates.length)));
  const positioning=dodge*clamp(m.riskDistance/(resolved*2));
  function component(name,weight,index){components.push({name,weight,index,contribution:weight*index});}
  if(m.mode==='normal'){component('Esquivas',40,dodge);component('Impactos',35,clamp(1-m.validHits/3));}
  else{component('Tempo',45,m.elapsedActiveSeconds/(m.elapsedActiveSeconds+120));component('Esquivas',30,dodge);}
  component('Consistência',15,consistency);component('Posicionamento',10,positioning);
  // Early Normal defeats are capped proportionally to actual exposure, without changing weights.
  if(m.mode==='normal'&&m.endReason==='defeat'){
    const cap=100*clamp(m.elapsedActiveSeconds/60),total=components.reduce((sum,c)=>sum+c.contribution,0);
    if(total>cap){capFactor=cap/total;for(const c of components){c.uncappedContribution=c.contribution;c.contribution*=capFactor;}}
  }
  return result();
}
