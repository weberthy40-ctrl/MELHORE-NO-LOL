import { describe,it,expect } from 'vitest';
import { createDodgeAssessmentFlow,calculateDodgeGuidedAssessment,recommendDodgeLevel,DIAGNOSTIC_VERSION } from '../../src/training/assessment/dodgeAssessment.js';
const round=(index,changes={})=>({origin:'diagnostic',diagnosticVersion:DIAGNOSTIC_VERSION,attemptId:`diagnostic-${index}`,index,level:[2,10,18][index-1],durationTarget:40,activeSeconds:40,initialLives:3,finalLives:3,hits:0,eligibleThreats:6,verifiedDodges:6,endReason:'diagnostic-time',complete:true,...changes});
describe('three-round diagnostic isolation',()=>{
 it('requires explicit next actions, fixed levels and exactly three distinct results',()=>{
  const flow=createDodgeAssessmentFlow();expect(flow.snapshot().level).toBe(2);expect(flow.start()).toBe(true);expect(flow.finishRound(round(1))).toBe(false);flow.running();expect(flow.finishRound(round(1))).toBe(true);expect(flow.finishRound(round(1))).toBe(false);expect(flow.snapshot().state).toBe('round-summary');
  expect(flow.next()).toBe(true);expect(flow.next()).toBe(false);flow.running();flow.finishRound(round(2));flow.next();flow.running();flow.finishRound(round(3));expect(flow.snapshot().state).toBe('completed');expect(flow.snapshot().index).toBe(3);expect(flow.next()).toBe(false);expect(Object.isFrozen(flow.snapshot().results)).toBe(true);
  flow.cancel();expect(flow.snapshot().results).toHaveLength(0);flow.reset();expect(flow.snapshot().state).toBe('introduction');
 });
 it('calculates exact diagnostics separately from official scores and refuses missing evidence',()=>{
  const results=[round(1),round(2),round(3)],value=calculateDodgeGuidedAssessment(results);expect(value.status).toBe('recommended');expect(value.recommendedStartingLevel).toBe(20);expect(value.perAttempt.map(r=>r.qi)).toEqual([100,100,100]);
  expect(calculateDodgeGuidedAssessment([round(1,{eligibleThreats:2,verifiedDodges:2}),round(2),round(3)]).recommendedStartingLevel).toBeNull();
  expect(calculateDodgeGuidedAssessment(results.slice(0,2)).status).toBe('invalid-data');expect(calculateDodgeGuidedAssessment([round(1),round(2,{origin:'official'}),round(3)]).status).toBe('invalid-data');
 });
 it('preserves every published recommendation boundary and ordering',()=>{
  for(const [expected,q2,q5,q8,hits]of [[20,75,85,95,0],[18,65,75,85,1],[16,55,65,70,1],[14,55,65,55,1],[12,60,85,0,3],[10,50,70,0,3],[8,45,55,0,3],[5,85,0,0,3],[3,65,0,0,3],[1,64,0,0,3]])expect(recommendDodgeLevel(q2,q5,q8,hits)).toBe(expected);
  expect(recommendDodgeLevel(75,85,95,1)).toBe(18);expect(()=>recommendDodgeLevel(NaN,50,60,1)).toThrow();
 });
});
