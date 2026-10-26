import { it,expect } from 'vitest';
import { reflexRecord } from '../fixtures/reflexRecord.js';
import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { REFLEX_DIAGNOSTIC_VERSION,calculateReflexGuidedAssessment } from '../../src/training/assessment/reflexAssessment.js';
const rounds=()=>[3,6,9].map((level,i)=>({...reflexRecord({id:`diagnostic-${i}`,level,variant:'mixed'}).metrics,origin:'diagnostic',diagnosticVersion:REFLEX_DIAGNOSTIC_VERSION,index:i+1,durationTarget:20,elapsedActiveSeconds:20,endReason:'diagnostic-time'}));
it('recommends only demonstrated references 3/6/9, never interpolating ten or changing official records',()=>{
 const data=rounds(),before=JSON.stringify(data),r=calculateReflexGuidedAssessment(data);expect(r.recommendedStartingLevel).toBe(9);expect(r.perAttempt.every(p=>p.demonstrated)).toBe(true);expect(JSON.stringify(data)).toBe(before);expect(Object.isFrozen(r)).toBe(true);
 for(const d of data)expect(()=>createAttemptRecord(d,{})).toThrow();
 const low=rounds().map(r=>({...r,rounds:r.rounds.map((v,i)=>i&&v.cue!=='noGo'?{...v,status:'missed',reactionMs:null,response:null}:v)}));
 // Rebuild only factual derived summaries after changing test results.
 return import('../../src/training/reflex/exercise.js').then(({summarizeReactions})=>{low.forEach(r=>{r.summary=summarizeReactions(r.rounds);});expect(calculateReflexGuidedAssessment(low).recommendedStartingLevel).toBe(1);});
});
it('rejects wrong protocol, durations, duplicate IDs and insufficient evidence without fallback',async()=>{
 for(const patch of [{origin:'official'},{index:2},{level:10},{elapsedActiveSeconds:60},{attemptId:'diagnostic-1'},{endReason:'abandoned'}]){const data=rounds();Object.assign(data[0],patch);expect(calculateReflexGuidedAssessment(data).status).toBe('invalid-data');}
 const {summarizeReactions}=await import('../../src/training/reflex/exercise.js');const data=rounds().map(r=>({...r,rounds:r.rounds.map(v=>v.cue==='noGo'?v:({...v,status:'missed',reactionMs:null,response:null}))}));data.forEach(r=>{r.summary=summarizeReactions(r.rounds);});expect(calculateReflexGuidedAssessment(data).status).toBe('insufficient-evidence');expect(calculateReflexGuidedAssessment(data).recommendedStartingLevel).toBeNull();
});
