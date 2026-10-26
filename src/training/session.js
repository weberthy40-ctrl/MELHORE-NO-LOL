import { safeDelta } from './movement.js';
let sequence = 0;
function freezeData(value) {
  if(value && typeof value==='object') { for(const item of Object.values(value))freezeData(item); Object.freeze(value); }
  return value;
}
/** Session time is simulation time; no wall clocks, persistence, or own loop. */
export function createSession({ countdown=3, events, metadata={}, timeLimit=null } = {}) {
  if(!Number.isFinite(countdown)||countdown<0) throw new TypeError('Invalid countdown.');
  if(timeLimit!==null&&(!Number.isFinite(timeLimit)||timeLimit<=0))throw new TypeError('Invalid time limit.');
  const randomId=Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
  const id = `session-${randomId}-${++sequence}`, sessionMetadata = freezeData(structuredClone(metadata));
  let state='idle', prior=null, preparation=0, elapsed=0, reason=null;
  const snapshot=()=>Object.freeze({id,state,preparation,elapsed,countdown,reason,timeLimit,metadata:sessionMetadata});
  function transition(next) { state=next; events?.emit('session:changed',snapshot()); }
  return {
    snapshot,
    start() {if(state!=='idle') return false; transition(countdown?'countdown':'running');return true;},
    update(delta) {
      let dt=safeDelta(delta);
      if(state==='countdown') { const consumed=Math.min(dt,countdown-preparation);preparation+=consumed;dt-=consumed;if(preparation>=countdown)transition('running'); }
      if(state==='running') elapsed+=timeLimit===null?dt:Math.min(dt,Math.max(0,timeLimit-elapsed));
      return snapshot();
    },
    pause() {if(!['running','countdown'].includes(state))return false;prior=state;transition('paused');return true;},
    resume() {if(state!=='paused')return false;transition(prior);return true;},
    finish(completionReason='completed') {
      if(!['running','paused','countdown'].includes(state))return false;
      reason=completionReason;transition('finishing');transition(completionReason==='abandoned'?'abandoned':'completed');return true;
    },
    abandon() {return this.finish('abandoned');},
    dispose() {if(state==='disposed')return; if(['running','countdown','paused'].includes(state))this.abandon();transition('disposed');},
  };
}
