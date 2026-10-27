import { DODGE_RULESET } from '../../src/training/dodge/constants.js';
import { recordFixture } from './record.js';
import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { calculateDodgeScore } from '../../src/training/dodge/score.js';
export function modernDodge({id='modern',level=1,elapsed=60,hits=0,resolved=20,mode='normal',date='2026-10-27T12:00:00.000Z',rulesetVersion=DODGE_RULESET}={}){
 const dodged=resolved-hits,firstDodged=Math.floor(dodged/2),firstHits=Math.floor(hits/2),movement=elapsed>=2?2:0;
 const buckets=[{start:0,end:elapsed/2,qualified:firstDodged+firstHits,dodged:firstDodged,hit:firstHits,ignored:0,distance:movement*2.9,movementSeconds:movement/2,stationarySeconds:(elapsed-movement)/2},{start:elapsed/2,end:elapsed,qualified:resolved-firstDodged-firstHits,dodged:dodged-firstDodged,hit:hits-firstHits,ignored:0,distance:movement*2.9,movementSeconds:movement/2,stationarySeconds:(elapsed-movement)/2}];
 const metrics={...recordFixture().metrics,attemptId:id,level,mode,rulesetVersion,elapsedActiveSeconds:elapsed,endReason:hits===(mode==='normal'?3:1)?'defeat':'completed',attacksEmitted:resolved,threatsQualified:resolved,threatsDodged:dodged,threatsHit:hits,validHits:hits,totalDistanceMoved:movement*5.8,activeMovementSeconds:movement,stationarySeconds:elapsed-movement,riskDistance:8,buckets};
 return createAttemptRecord(metrics,calculateDodgeScore(metrics),{completedAt:date});
}
