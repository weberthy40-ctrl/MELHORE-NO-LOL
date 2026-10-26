import { it,expect } from 'vitest';
import { PRECISION_PRESETS,PRECISION_DIAGNOSTIC_VERSION,createPrecisionAssessmentFlow,calculatePrecisionGuidedAssessment } from '../../src/training/assessment/precisionAssessment.js';
import { recommendStartingLevel } from '../../src/training/assessment/recommendStartingLevel.js';
import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
const rounds=(hits=15,misses=0)=>PRECISION_PRESETS.map((p,i)=>({...p,origin:'diagnostic',diagnosticVersion:PRECISION_DIAGNOSTIC_VERSION,attemptId:`r${i}`,index:i+1,durationTarget:20,activeSeconds:20,endReason:'diagnostic-time',complete:true,hits,misses,clicksEligible:hits+misses,accuracy:hits+misses?hits/(hits+misses):null}));
it('advances exactly three validated rounds, with explicit transitions and cancellation',()=>{
 const flow=createPrecisionAssessmentFlow(),data=rounds();expect(flow.finishRound(data[0])).toBe(false);flow.start();flow.running();expect(flow.finishRound(data[1])).toBe(false);
 for(let i=0;i<3;i++){if(i)flow.next();flow.running();expect(flow.finishRound(data[i])).toBe(true);expect(flow.finishRound(data[i])).toBe(false);}
 expect(flow.snapshot().state).toBe('completed');expect(flow.next()).toBe(false);flow.reset();expect(flow.snapshot().results).toHaveLength(0);flow.cancel();expect(flow.start()).toBe(false);
});
it('uses real twenty-second metas and a deterministic diagnostic formula independent of official score',()=>{
 const data=rounds(),serialized=JSON.stringify(data),result=calculatePrecisionGuidedAssessment(data);expect(result.status).toBe('recommended');expect(result.recommendedStartingLevel).toBe(10);expect(result.perAttempt[0].targetHits20).toBe(44/3);expect(JSON.stringify(data)).toBe(serialized);expect(Object.isFrozen(result.perAttempt[0])).toBe(true);
 expect(calculatePrecisionGuidedAssessment(rounds(6,6)).perAttempt[0].qi).toBeLessThan(calculatePrecisionGuidedAssessment(rounds(6)).perAttempt[0].qi);
 expect(calculatePrecisionGuidedAssessment(rounds(5)).perAttempt[0].qi).toBeLessThan(calculatePrecisionGuidedAssessment(rounds(10)).perAttempt[0].qi);
 expect(calculatePrecisionGuidedAssessment(rounds(0,5)).perAttempt[0].qi).toBe(0);
 for(const r of data)expect(()=>createAttemptRecord(r,{status:'scored',score:100})).toThrow();
});
it('rejects inconsistent data/configuration and returns no fallback for inactivity',()=>{
 for(const n of [0,1,4])expect(calculatePrecisionGuidedAssessment(rounds(n)).status).toBe('insufficient-evidence');
 for(const patch of [{origin:'official'},{attemptId:'r1'},{hits:-1},{hits:1.5},{misses:Infinity},{clicksEligible:NaN},{level:1},{activeSeconds:19.9},{accuracy:.1}]){const data=rounds();Object.assign(data[0],patch);expect(calculatePrecisionGuidedAssessment(data).status).toBe('invalid-data');}
 expect(calculatePrecisionGuidedAssessment(rounds().slice(1)).recommendedStartingLevel).toBeNull();expect(calculatePrecisionGuidedAssessment(rounds(),PRECISION_PRESETS.map(p=>({...p,targetHits20:0}))).status).toBe('invalid-config');
});
it('applies every ordered recommendation boundary without averaging',()=>{
 for(const [scores,level]of [[[75,85,95],10],[[65,75,85],9],[[55,65,70],8],[[55,65,55],7],[[60,85,0],6],[[50,70,0],5],[[45,55,0],4],[[85,0,0],3],[[65,0,0],2],[[64,0,0],1]])expect(recommendStartingLevel(...scores)).toBe(level);
});
