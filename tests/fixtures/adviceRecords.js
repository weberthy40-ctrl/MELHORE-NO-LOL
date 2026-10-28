// Browser-safe QA records. Real practice/attempt engines produce the non-dodge
// counters and official scorers produce every score; no score is overridden.
// Dodge uses the existing validated metric fixture, not a claimed real match.
import {modernDodge} from './modernDodge.js';
import {createSession} from '../../src/training/session.js';
import {createAttemptRecord} from '../../src/persistence/attemptRecord.js';
import {createRandom} from '../../src/core/random.js';
import {createPrecisionPractice} from '../../src/training/precision/practice.js';
import {createPrecisionAttempt} from '../../src/training/precision/attempt.js';
import {precisionDifficulty} from '../../src/training/precision/difficulty.js';
import {calculatePrecisionScore} from '../../src/training/precision/score.js';
import {createKitingPractice} from '../../src/training/kiting/practice.js';
import {createKitingAttempt} from '../../src/training/kiting/attempt.js';
import {calculateKitingScore} from '../../src/training/kiting/score.js';
import {createReflexExercise} from '../../src/training/reflex/exercise.js';
import {createReflexAttempt} from '../../src/training/reflex/attempt.js';
import {calculateReflexScore} from '../../src/training/reflex/score.js';

export function adviceRecord(modality, options={}) {
  const {level=3,date='2026-10-27T12:00:00.000Z'}=options;
  if(modality==='dodge')return modernDodge({id:'advice-dodge',level,elapsed:60,hits:2,resolved:20,...options,date});
  const session=createSession({countdown:0,timeLimit:60}),running=()=>session.snapshot().state==='running';
  let practice,attempt,score;
  if(modality==='precision'){
    const variant=options.variant??'mixed';
    practice=createPrecisionPractice({...precisionDifficulty(level,variant),variant,rng:createRandom(42),clock:()=>session.snapshot().elapsed});
    attempt=createPrecisionAttempt({session,practice,variant,level});score=calculatePrecisionScore;
  }else if(modality==='kiting'){
    const variant=options.variant??'combat';
    // Invulnerable fixture isolates attack counters; it is not official gameplay evidence.
    practice=createKitingPractice({variant,level,rng:createRandom(42),isRunning:running,damageEnabled:Boolean(options.short)});
    attempt=createKitingAttempt({session,practice,variant,level});score=calculateKitingScore;
  }else if(modality==='reflex'){
    let clock=0;
    practice=createReflexExercise({variant:options.variant??'integrated',level,technical:false,rng:createRandom(42),now:()=>clock,isRunning:running});
    attempt=createReflexAttempt({session,exercise:practice});score=calculateReflexScore;
    session.start();practice.start();practice.setRunning(true);
    let presentations=0,presentedAt=0,anticipations=options.anticipations??0;
    for(let n=0;n<601&&!attempt.snapshot();n++){
      session.update(.1);clock+=100;practice.update(.1);let p=practice.snapshot();
      if(p.phase==='waiting'&&anticipations>0){practice.respond('Space');anticipations--;p=practice.snapshot();}
      if(p.phase==='cue-pending'&&presentations<(options.presented??Infinity)){practice.present();presentations++;presentedAt=clock;p=practice.snapshot();}
      if(p.phase==='cue-visible'&&clock-presentedAt>=100){
        if(p.cue.answer===null){if(options.commissions)practice.respond('Space');}
        else if(!options.omissions)practice.respond(options.wrong?(p.cue.answer==='Space'?'KeyQ':'Space'):p.cue.answer);
      }
      attempt.evaluate();
    }
    const metrics=attempt.snapshot(),record=createAttemptRecord(metrics,score(metrics),{completedAt:date});practice.dispose();session.dispose();return record;
  }else throw new TypeError('Unknown advice fixture modality.');
  session.start();practice.start();let lastOrderError=-1;
  for(let n=0;n<601&&!attempt.snapshot();n++){
    const before=session.snapshot().elapsed;session.update(.1);practice.update(session.snapshot().elapsed-before);
    const p=practice.snapshot();
    if(modality==='precision'&&p.clicksEligible<(options.clicks??32)&&running()){
      if(p.misses<(options.misses??2))practice.miss();
      else if(options.orderErrors&&p.priority&&p.targets.length>1&&lastOrderError!==p.groupsCompleted){lastOrderError=p.groupsCompleted;practice.hit(p.targets.at(-1).id);}
      else if(p.targets.length)practice.hit(p.targets[0].id);
    }
    if(modality==='kiting'&&p.accepted<(options.short?0:options.accepted??20)&&running()){
      if(practice.click({x:0,z:0})&&p.cancellations<(options.cancellations??2))practice.moveCommand();
    }
    attempt.evaluate();
  }
  const metrics=attempt.snapshot(),record=createAttemptRecord(metrics,score(metrics),{completedAt:date});practice.dispose();session.dispose();return record;
}
