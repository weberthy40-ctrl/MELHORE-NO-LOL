import { readonlySnapshot } from '../snapshot.js';
import { validReflexMetrics } from './metrics.js';
export const REFLEX_SCORING_VERSION='reflex-score-v1';
export function calculateReflexScore(m){
 const valid=validReflexMetrics(m)&&m.summary.presented>0,components=[],reasons=valid?[]:['É necessária uma sessão oficial completa com oportunidades visuais legítimas.'];
 if(valid){const times=m.summary.reactionTimes,n=times.length,mean=n?times.reduce((sum,t)=>sum+t,0)/n:0,spread=n>=2?Math.sqrt(times.reduce((sum,t)=>sum+(t-mean)**2,0)/n):0,speed=n?Math.max(0,1-mean/m.config.responseWindow):0,consistency=n>=2?Math.max(0,1-spread/m.config.responseWindow)*Math.min(1,n/5):0;
  components.push(...[['Precisão de resposta',55,m.summary.accuracy],['Velocidade das respostas corretas',25,speed],['Consistência dos tempos',20,consistency]].map(([name,weight,index])=>({name,weight,index,contribution:weight*index})));
 }
 return readonlySnapshot({attemptId:m?.attemptId??null,modality:'reflex',mode:'timed',variant:m?.variant??null,level:m?.level??null,metricsVersion:m?.metricsVersion??null,scoringVersion:REFLEX_SCORING_VERSION,status:valid?'scored':'unscorable',score:valid?Math.round(components.reduce((n,c)=>n+c.contribution,0)):null,components,reasons});
}
