import { readonlySnapshot } from '../snapshot.js';
import { REFLEX_METRICS_VERSION } from './metrics.js';
export function createReflexAttempt({session,exercise}){
 let result=null;
 function finish(endReason){if(result)return result;exercise.stop();session.finish(endReason);const p=exercise.snapshot();result=readonlySnapshot({attemptId:session.snapshot().id,origin:'official',modality:'reflex',metricsVersion:REFLEX_METRICS_VERSION,variant:p.variant,level:p.config.level,config:p.config,terminal:true,endReason,elapsedActiveSeconds:session.snapshot().elapsed,rounds:p.rounds,summary:p.summary,extraAnticipations:p.summary.anticipations-p.rounds.filter(r=>r.status==='anticipated').length,partialRound:p.partialRound});return result;}
 return {snapshot:()=>result,evaluate(){if(!result&&session.snapshot().state==='running'&&session.snapshot().elapsed>=60)finish('completed');return result;},abandon:()=>finish('abandoned'),dispose(){if(!result)finish('abandoned');}};
}
