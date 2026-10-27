import { MAX_DODGE_LEVEL } from './constants.js';
export const DODGE_MODES=Object.freeze({diagnostic:Object.freeze({initialLives:3,duration:30,protection:.75}),normal:Object.freeze({initialLives:3,duration:null,protection:.75}),survival:Object.freeze({initialLives:1,duration:null,protection:0})});
/** Mode rules consume the shared session clock. Impact time uses end-of-step granularity. */
export function createDodgeMode({session,mode='normal',level=1,events}) {
  const config=DODGE_MODES[mode];
  if(!config||!Number.isInteger(level)||level<1||level>MAX_DODGE_LEVEL)throw new TypeError('Invalid dodge mode.');
  let lives=config.initialLives,outcome=null,lastDamage=-Infinity,disposed=false;
  const processed=new Set();
  const snapshot=()=>Object.freeze({id:session.snapshot().id,mode,level,lives,initialLives:config.initialLives,duration:config.duration,elapsed:session.snapshot().elapsed,outcome,protectionRemaining:Math.max(0,config.protection-(session.snapshot().elapsed-lastDamage))});
  function finish(reason){if(outcome||disposed)return;outcome=reason;session.finish(reason);events?.emit('dodge:finished',snapshot());processed.clear();}
  const unsubscribe=events?.on('dodge:impact',event=>{
    if(disposed||outcome||session.snapshot().state!=='running'||event.attemptId!==session.snapshot().id||processed.has(event.id))return;
    processed.add(event.id);const elapsed=session.snapshot().elapsed;
    if(elapsed-lastDamage<config.protection)return;
    lastDamage=elapsed;lives--;events?.emit('dodge:damage',Object.freeze({...snapshot(),attemptId:session.snapshot().id,attackId:event.id,variant:event.variant}));
    if(lives===0)finish(mode==='diagnostic'?'diagnostic-lives':'defeat');
  });
  return {snapshot,complete(){if(mode!=='diagnostic')finish('completed');},fail(){finish('error');},evaluate(){if(!outcome&&!disposed&&config.duration!==null&&session.snapshot().elapsed>=config.duration)finish(mode==='diagnostic'?'diagnostic-time':'victory');},
    abandon(){if(outcome||disposed)return;outcome='abandoned';session.abandon();events?.emit('dodge:finished',snapshot());},
    dispose(){if(disposed)return;if(!outcome)this.abandon();disposed=true;unsubscribe?.();processed.clear();}};
}
