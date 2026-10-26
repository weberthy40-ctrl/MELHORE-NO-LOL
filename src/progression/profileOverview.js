import { readonlySnapshot } from '../training/snapshot.js';
/** One bounded streaming query per modality; no writes or global score. */
export async function loadSkillOverview({repository,modality,createProgress}){
 const progress=createProgress();let latest=null;
 const response=await repository.scanCompletedAttempts({modality,onRecord(record){progress.add(record);if(!latest||Date.parse(record.completedAt)>Date.parse(latest.completedAt)||(record.completedAt===latest.completedAt&&record.attemptId>latest.attemptId))latest=record;}});
 return readonlySnapshot({progress:progress.snapshot(),latest,invalid:response.invalid});
}
