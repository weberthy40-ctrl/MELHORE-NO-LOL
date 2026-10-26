import { readonlySnapshot } from '../snapshot.js';
import { PRECISION_VARIANTS } from './practice.js';
export const PRECISION_METRICS_VERSION='precision-metrics-v1';
export function createPrecisionAttempt({session,practice,level,variant}){
 if(!Object.hasOwn(PRECISION_VARIANTS,variant)||!Number.isInteger(level)||level<1||level>10)throw new TypeError('Invalid precision attempt.');
 let result=null;
 function finish(endReason){if(result)return result;practice.stop();session.finish(endReason);const p=practice.snapshot();result=readonlySnapshot({attemptId:session.snapshot().id,origin:'official',modality:'precision',metricsVersion:PRECISION_METRICS_VERSION,variant,level,terminal:true,endReason,elapsedActiveSeconds:session.snapshot().elapsed,patternsSeen:p.patternsSeen,expiredTargets:p.expired,hits:p.hits,misses:p.misses,clicksEligible:p.clicksEligible,accuracy:p.accuracy,histogram:p.histogram});return result;}
 return {snapshot:()=>result,evaluate(){if(!result&&session.snapshot().state==='running'&&session.snapshot().elapsed>=60)finish('completed');return result;},abandon(){return finish('abandoned');},dispose(){if(!result)finish('abandoned');}};
}
