import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { calculateDodgeScore } from '../../src/training/dodge/score.js';
export function recordFixture(id='fixture-1'){
 const metrics={attemptId:id,mode:'normal',level:1,metricsVersion:'dodge-metrics-v1',terminal:true,endReason:'victory',elapsedActiveSeconds:60,attacksEmitted:5,threatsQualified:5,threatsDodged:5,threatsHit:0,validHits:0,contactsIgnored:0,attacksNonThreatening:0,threatsUnresolved:0,totalDistanceMoved:14,activeMovementSeconds:2,stationarySeconds:58,riskDistance:4,
 buckets:[{start:0,end:30,qualified:3,dodged:3,hit:0,ignored:0,distance:7,movementSeconds:1,stationarySeconds:29},{start:30,end:60,qualified:2,dodged:2,hit:0,ignored:0,distance:7,movementSeconds:1,stationarySeconds:29}]};
 return createAttemptRecord(metrics,calculateDodgeScore(metrics),{completedAt:'2026-10-25T20:00:00.000Z'});
}
