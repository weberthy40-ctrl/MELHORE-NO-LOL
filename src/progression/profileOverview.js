import { createSkillRating } from './skillRating.js';
import { readonlySnapshot } from '../training/snapshot.js';
/** One bounded streaming query per modality; no writes; history produces both progress and the trainer rating. */
export async function loadSkillOverview({repository,modality,createProgress}){
 const progress=createProgress(),rating=createSkillRating(modality);let latest=null,bestScore=null;
 const response=await repository.scanCompletedAttempts({modality,onRecord(record){progress.add(record);rating.add(record);bestScore=bestScore===null?record.score.score:Math.max(bestScore,record.score.score);if(!latest||Date.parse(record.completedAt)>Date.parse(latest.completedAt)||(record.completedAt===latest.completedAt&&record.attemptId>latest.attemptId))latest=record;}});
 return readonlySnapshot({progress:progress.snapshot(),rating:rating.snapshot(),latest,bestScore,invalid:response.invalid});
}
