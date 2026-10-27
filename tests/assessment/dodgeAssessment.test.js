import { describe,it,expect } from 'vitest';
import { createDodgeAssessmentFlow,calculateDodgeGuidedAssessment,recommendDodgeLevel,DIAGNOSTIC_VERSION,nextDiagnosticLevel } from '../../src/training/assessment/dodgeAssessment.js';
import { diagnosticRound } from '../fixtures/dodgePlacement.js';
const round=(index,level,changes={})=>({origin:'diagnostic',diagnosticVersion:DIAGNOSTIC_VERSION,attemptId:`adaptive-${index}`,index,level,durationTarget:30,activeSeconds:30,initialLives:3,finalLives:3,hits:0,eligibleThreats:12,verifiedDodges:12,endReason:'diagnostic-time',complete:true,...changes});
function rounds(pass){const result=[];for(let i=1;i<=5;i++){const level=nextDiagnosticLevel(result);result.push(round(i,level,pass(level,i)?{}:{activeSeconds:4,finalLives:0,hits:3,verifiedDodges:0,eligibleThreats:3,endReason:'diagnostic-lives'}));}return result;}
describe('adaptive diagnostic isolation',()=>{
 it('requires explicit starts and next actions and follows the five-stage sequence',()=>{
  const flow=createDodgeAssessmentFlow(),results=rounds(()=>true);expect(flow.snapshot().level).toBe(5);expect(results.map(r=>r.level)).toEqual([5,13,17,19,20]);expect(flow.finishRound(results[0])).toBe(false);flow.start();
  for(let i=0;i<5;i++){expect(flow.finishRound(results[i])).toBe(false);flow.running();expect(flow.finishRound({...results[i],level:1})).toBe(false);expect(flow.finishRound(results[i])).toBe(true);if(i<4){expect(flow.snapshot().state).toBe('round-summary');expect(flow.next()).toBe(true);expect(flow.next()).toBe(false);}}
  expect(flow.snapshot().state).toBe('completed');expect(flow.snapshot().index).toBe(5);expect(Object.isFrozen(flow.snapshot().results)).toBe(true);flow.cancel();expect(flow.snapshot().results).toHaveLength(0);flow.reset();expect(flow.snapshot().state).toBe('introduction');
 });
 it('finds a demonstrated boundary and descends for early defeats without credit for harmless shots',()=>{
  const results=rounds(level=>level<=7),value=calculateDodgeGuidedAssessment(results);expect(results.map(r=>r.level)).toEqual([5,13,9,7,8]);expect(value.recommendedStartingLevel).toBe(7);expect(value.perAttempt.filter(r=>r.passed).map(r=>r.level)).toEqual([5,7]);expect(calculateDodgeGuidedAssessment(rounds(()=>false))).toMatchObject({recommendedStartingLevel:1,confidence:'provisional'});
  const weak=rounds(()=>true);weak[0]={...weak[0],eligibleThreats:100,verifiedDodges:2};expect(calculateDodgeGuidedAssessment(weak).status).toBe('invalid-data'); // The later levels no longer follow the observed first result.
  const little=[];for(let i=1;i<=5;i++)little.push(round(i,nextDiagnosticLevel(little),{eligibleThreats:3,verifiedDodges:3}));expect(calculateDodgeGuidedAssessment(little).recommendedStartingLevel).toBe(1);
 });
 it('refuses missing, duplicate, reordered and fabricated stages',()=>{
  const results=rounds(()=>true);expect(calculateDodgeGuidedAssessment(results).recommendedStartingLevel).toBe(20);expect(calculateDodgeGuidedAssessment(results.slice(0,4)).status).toBe('invalid-data');expect(calculateDodgeGuidedAssessment(results.map((r,i)=>i===4?{...r,attemptId:results[0].attemptId}:r)).status).toBe('invalid-data');expect(calculateDodgeGuidedAssessment(results.map((r,i)=>i===2?{...r,origin:'official'}:r)).status).toBe('invalid-data');
 });
 it('keeps saved v3 assessments and every published recommendation boundary readable',()=>{
  expect(calculateDodgeGuidedAssessment([1,2,3].map(i=>diagnosticRound(i))).recommendedStartingLevel).toBe(20);
  for(const [expected,q2,q10,q18,hits]of [[20,75,85,95,0],[18,65,75,85,1],[16,55,65,70,1],[14,55,65,55,1],[12,60,85,0,3],[10,50,70,0,3],[8,45,55,0,3],[5,85,0,0,3],[3,65,0,0,3],[1,64,0,0,3]])expect(recommendDodgeLevel(q2,q10,q18,hits)).toBe(expected);
 });
});
