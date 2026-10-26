import { readonlySnapshot } from '../snapshot.js';
import { kitingDifficulty } from './difficulty.js';
export const KITING_METRICS_VERSION='kiting-metrics-v1';
export function createKitingAttempt({session,practice,variant,level}){
 const config=kitingDifficulty(level,variant);let result=null;
 function finish(endReason){if(result)return result;practice.stop();session.finish(endReason);const p=practice.snapshot();result=readonlySnapshot({attemptId:session.snapshot().id,origin:'official',modality:'kiting',metricsVersion:KITING_METRICS_VERSION,variant,level,terminal:true,endReason,elapsedActiveSeconds:session.snapshot().elapsed,kills:p.kills,accepted:p.accepted,shots:p.shots,hits:p.hits,cancellations:p.cancellations,totalDistanceMoved:p.totalDistanceMoved,rhythmOpportunities:p.rhythmOpportunities,rhythmCycles:p.rhythmCycles,histogram:p.histogram,spacing:p.spacing,config});return result;}
 return {snapshot:()=>result,evaluate(){if(!result&&session.snapshot().state==='running'&&session.snapshot().elapsed>=60)finish('completed');return result;},abandon:()=>finish('abandoned'),dispose(){if(!result)finish('abandoned');}};
}
