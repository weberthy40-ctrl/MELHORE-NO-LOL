import { readonlySnapshot } from '../snapshot.js';
/** Three explicit rounds; only validated results can advance the flow. */
export function createThreeRoundFlow({presets,validate}){
 if(!Array.isArray(presets)||presets.length!==3||typeof validate!=='function')throw new TypeError('Three diagnostic presets are required.');
 const fixed=readonlySnapshot(presets);let state='introduction',results=[];
 return {snapshot:()=>readonlySnapshot({state,index:Math.min(3,results.length+1),preset:fixed[results.length]??null,results}),
 start(){if(state!=='introduction')return false;state='preparing';return true;},
 running(){if(state!=='preparing')return false;state='running';return true;},
 finishRound(result){if(state!=='running'||!validate(result,results.length)||results.some(r=>r.attemptId===result.attemptId))return false;results.push(readonlySnapshot(result));state=results.length===3?'completed':'round-summary';return true;},
 next(){if(state!=='round-summary')return false;state='preparing';return true;},
 cancel(){state='cancelled';results=[];},fail(){state='error';results=[];},reset(){state='introduction';results=[];},
 };
}
