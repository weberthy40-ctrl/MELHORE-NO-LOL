import { describe,it,expect } from 'vitest';
import { precisionDifficulty,PRECISION_LEVELS } from '../../src/training/precision/difficulty.js';
import { createPrecisionPractice,PRECISION_VARIANTS } from '../../src/training/precision/practice.js';
import { createSession } from '../../src/training/session.js';
import { createPrecisionAttempt } from '../../src/training/precision/attempt.js';
import { calculatePrecisionScore,HIT_REFERENCES } from '../../src/training/precision/score.js';
function metrics(hits=12,misses=0,histogram=[2,2,2,2,2,2]){return {attemptId:'test',origin:'official',modality:'precision',metricsVersion:'precision-metrics-v1',variant:'single-static',level:1,terminal:true,endReason:'completed',elapsedActiveSeconds:60,hits,misses,clicksEligible:hits+misses,accuracy:hits/(hits+misses)||null,histogram};}
describe('timed precision',()=>{
 it('has ten gradual profiles, all variants and unchanged technical defaults',()=>{
  expect(PRECISION_LEVELS).toHaveLength(10);
  for(const variant of Object.keys(PRECISION_VARIANTS)){expect(precisionDifficulty(1,variant).radius).toBeGreaterThan(precisionDifficulty(10,variant).radius);expect(HIT_REFERENCES[variant]).toHaveLength(10);}
  expect(()=>precisionDifficulty(11,'single-static')).toThrow();
 });
 it('caps the shared clock at sixty and ends once with a frozen summary',()=>{
  const session=createSession({countdown:3,timeLimit:60}),practice=createPrecisionPractice({clock:()=>session.snapshot().elapsed}),attempt=createPrecisionAttempt({session,practice,level:1,variant:'single-static'});practice.start();session.start();
  while(session.snapshot().state==='countdown')session.update(.1);
  for(let i=0;i<600;i++){session.update(.1);attempt.evaluate();}
  expect(attempt.snapshot()).toMatchObject({endReason:'completed',elapsedActiveSeconds:60,hits:0});expect(calculatePrecisionScore(attempt.snapshot()).score).toBe(0);expect(practice.miss()).toBe(false);const result=attempt.snapshot();attempt.evaluate();expect(attempt.snapshot()).toBe(result);session.dispose();practice.dispose();
 });
 it('calculates only real completed metrics, with controlled volume and consistency',()=>{
  expect(calculatePrecisionScore(metrics(0,0,[0,0,0,0,0,0])).score).toBe(0);
  const accurate=calculatePrecisionScore(metrics()),spam=calculatePrecisionScore(metrics(12,12));expect(accurate.score).toBeGreaterThan(spam.score);
  const concentrated=calculatePrecisionScore(metrics(12,0,[12,0,0,0,0,0]));expect(accurate.components[2].index).toBeGreaterThan(concentrated.components[2].index);
  expect(calculatePrecisionScore(metrics(1,0,[1,0,0,0,0,0])).score).toBeLessThan(70);
  expect(calculatePrecisionScore({...metrics(),endReason:'abandoned'}).score).toBeNull();expect(calculatePrecisionScore({...metrics(),hits:Infinity}).score).toBeNull();
 });
 it('places hits at 10,20 and60 seconds into exactly six windows',()=>{
  let clock=10;const p=createPrecisionPractice({clock:()=>clock});p.start();p.hit(p.snapshot().targets[0].id);clock=20;p.hit(p.snapshot().targets[0].id);clock=60;p.hit(p.snapshot().targets[0].id);expect(p.snapshot().histogram).toEqual([0,1,1,0,0,1]);p.dispose();
 });
});
