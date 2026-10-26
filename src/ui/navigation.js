import { mountProfile } from './profileScreen.js';
import { mountAudioFeedback } from '../audio/feedback.js';
import { mountBackup } from './backupScreen.js';
import { loadPreferences,applyInterfacePreferences } from '../settings/preferences.js';
import { mountPreferences } from './preferencesScreen.js';
import { mountPrecisionAssessment } from './precisionAssessmentScreen.js';
import { mountKiting } from './kitingScreen.js';
import { mountKitingAssessment } from './kitingAssessmentScreen.js';
import { mountReflex } from './reflexScreen.js';
import { mountReflexAssessment } from './reflexAssessmentScreen.js';
import { mountMouseTools } from './mouseScreen.js';
import { NAVIGATION, resolveRoute } from './routes.js';
import { element, link } from './elements.js';
import { createAttemptRepository } from '../persistence/attemptRepository.js';
import { mountPrecisionPractice } from './precisionPracticeScreen.js';
import { mountDodgeAssessment } from './dodgeAssessmentScreen.js';
import { mountDodgeData } from './dodgeDataScreens.js';
import { mountSaveAttempt } from './saveAttempt.js';
import { createDodgeTelemetry } from '../training/dodge/telemetry.js';
import { calculateDodgeScore } from '../training/dodge/score.js';
import { createDodgeMode } from '../training/dodge/mode.js';
import { createTechnicalDodge } from '../training/dodge/technicalDodge.js';
import { createRandom } from '../training/dodge/random.js';
import { createSession } from '../training/session.js';
import { mountSettings } from './settingsScreen.js';
import { createScreen } from './screens.js';

/** Hash routing provides native back/forward without server rewrite rules. */
export function mountNavigation({ root, core, window = root.ownerDocument.defaultView,
  loadPreview = () => import('../game3d/mountPreview.js'), attemptRepository }) {
  const document = root.ownerDocument;let preferencesStorage;try{preferencesStorage=window.localStorage;}catch{preferencesStorage=null;}applyInterfacePreferences(document,loadPreferences(preferencesStorage));
  let indexedDB;try{indexedDB=window.indexedDB;}catch{indexedDB=null;}
  const repository = attemptRepository ?? createAttemptRepository({indexedDB});const audio=mountAudioFeedback({root,core,preferences:loadPreferences(preferencesStorage)});
  const shell = element(document, 'div', 'app-shell');
  const skip = link(document, 'Pular para o conteúdo', '/', 'skip-link');
  skip.href = '#content';
  skip.addEventListener('click', skipContent);
  const header = element(document, 'header', 'site-header');
  header.append(link(document, 'M / MOBA TRAINING', '/', 'brand'));
  const nav = element(document, 'nav', 'site-nav'); nav.setAttribute('aria-label', 'Navegação principal');
  for (const [path, label] of NAVIGATION) nav.append(link(document, label, path, 'nav-link'));
  header.append(nav);
  const host = element(document, 'div', 'screen-host'); host.id = 'content';
  shell.append(skip, header, host); root.append(shell);
  let active = true;
  let revision = 0;
  let preview;
  let session;
  let exercise;
  let rules;
  let telemetry;
  let cleanupScreen = () => {};
  function skipContent(event) { event.preventDefault(); host.querySelector('h1')?.focus(); }
  function render(focus = true) {
    const renderRevision = ++revision;audio.stopAll();
    preview?.dispose(); preview = undefined; cleanupScreen(); cleanupScreen = () => {}; rules?.dispose(); rules=undefined; telemetry?.dispose();telemetry=undefined; session?.dispose(); session = undefined; exercise?.dispose(); exercise = undefined;
    const route = resolveRoute(window.location.hash);
    const isDodge = route.path.startsWith('/dodge-tech') || Boolean(route.mode);
    const screen = createScreen(document, route);
    const training=/^\/(play|practice|timed|assessment|dodge-tech|demo|preview)(\/|$)/.test(route.path);
    shell.classList.toggle('is-training',training);shell.dataset.session='idle';
    screen.classList.toggle('training-screen',training);screen.classList.toggle('profile-screen',route.path==='/profile');
    host.replaceChildren(screen);
    for (const item of nav.children) {
      if (item.hash === `#${route.path}` || (route.modality && item.hash === '#/levels')) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
    const heading = screen.querySelector('h1'); heading.tabIndex = -1; if (focus) heading.focus();
    core.events.emit('navigation:changed', Object.freeze(route));
    if(route.path==='/dpi'){const mouse=mountMouseTools(screen);cleanupScreen=()=>mouse.dispose();}
    if (route.path === '/settings'){mountSettings(screen);mountPreferences(screen,{onChange:p=>audio.setPreferences(p)});const backup=mountBackup({screen,repository});cleanupScreen=()=>backup.dispose();}
    if(route.path==='/practice/reflex'||route.path.startsWith('/timed/reflex')){const training=mountReflex({screen,core,loadPreview,repository,timed:route.path.startsWith('/timed/reflex'),initialLevel:route.level??1});cleanupScreen=()=>training.dispose();}
    if(route.path==='/practice/kiting'||route.path.startsWith('/timed/kiting')){const training=mountKiting({screen,core,loadPreview,repository,timed:route.path.startsWith('/timed/kiting'),initialLevel:route.level??1});cleanupScreen=()=>training.dispose();}
    if(route.path==='/practice/precision'||route.path.startsWith('/timed/precision')){const practice=mountPrecisionPractice({screen,core,loadPreview,timed:route.path.startsWith('/timed/precision'),initialLevel:route.level??1,repository});cleanupScreen=()=>practice.dispose();}
    if(route.path==='/assessment/reflex'){const assessment=mountReflexAssessment({screen,core,loadPreview});cleanupScreen=()=>assessment.dispose();}
    if(route.path==='/assessment/kiting'){const assessment=mountKitingAssessment({screen,core,loadPreview});cleanupScreen=()=>assessment.dispose();}
    if(route.path==='/assessment/precision'){const assessment=mountPrecisionAssessment({screen,core,loadPreview});cleanupScreen=()=>assessment.dispose();}
    if(route.path==='/assessment/dodge'){const assessment=mountDodgeAssessment({screen,core,loadPreview});cleanupScreen=()=>assessment.dispose();}
    if(route.path==='/profile'){const profile=mountProfile({screen,repository});cleanupScreen=()=>profile.dispose();}
    if(/^\/(history|records|evolution|achievements)\/(dodge|precision|kiting|reflex)$/.test(route.path)){
      const modalities=[route.path.split('/')[2]];
      const views=modalities.map(modality=>mountDodgeData({screen,repository,modality,kind:route.path.split('/')[1]}));cleanupScreen=()=>views.forEach(view=>view.dispose());
    }
    let updateSession = () => {};
    if (route.path === '/demo' || isDodge) {
      session = createSession({events:core.events,timeLimit:route.mode==='normal'?60:null,metadata:{type:route.mode??(isDodge?'dodge-technical':'demonstration'),level:route.level??1}});
      if(route.mode)rules=createDodgeMode({session,mode:route.mode,level:route.level,events:core.events});
      if(route.mode)telemetry=createDodgeTelemetry({session,mode:route.mode,level:route.level,events:core.events});
      if(isDodge)exercise=createTechnicalDodge({level:route.level??1,attemptId:session.snapshot().id,mode:route.mode??'technical',isRunning:()=>session?.snapshot().state==='running',canSpawn:()=>route.mode!=='normal'||session.snapshot().elapsed<60,events:core.events,rng:createRandom(window.crypto.getRandomValues(new Uint32Array(1))[0])});
      const hud = element(document,'div','session-hud');
      const status = element(document,'p','',''); status.setAttribute('aria-live','off');
      const pause = element(document,'button','button','Pausar');pause.type='button';
      const exit = link(document,'Sair / abandonar','/','button');
      pause.addEventListener('click',()=>{if(session?.snapshot().state==='paused')session.resume();else session?.pause();});
      updateSession = () => {if(!session)return; const s=session.snapshot();status.textContent=s.state==='countdown'?`Começar em ${Math.ceil(s.countdown-s.preparation)}`:`${s.state==='paused'?'Pausado':s.state==='completed'?'Concluído':s.state==='abandoned'?'Abandonado':'Em execução'} · ${s.elapsed.toFixed(1)} s`;pause.textContent=s.state==='paused'?'Retomar':'Pausar';};
      const diagnostics=element(document,'p','status-note','');
      const updateClock=updateSession;updateSession=()=>{updateClock();if(exercise){const s=exercise.snapshot();diagnostics.textContent=`Diagnóstico em memória: ${s.shots} disparos · ${s.impacts} impactos`;}};
      const replay=element(document,'button','button primary','Jogar novamente');replay.type='button';replay.hidden=true;replay.addEventListener('click',()=>render());
      const resultMetrics=element(document,'section','result-metrics','');resultMetrics.hidden=true;let shownResult=false;
      const outcome=element(document,'p','result-message','');outcome.setAttribute('aria-live','polite');
      const updateTechnical=updateSession;updateSession=()=>{
        updateTechnical();if(!rules)return;rules.evaluate();const current=rules.snapshot();
        diagnostics.textContent=`Vidas: ${current.lives}/${current.initialLives} · ${current.mode==='normal'?'Tempo restante':'Tempo sobrevivido'}: ${(current.mode==='normal'?Math.max(0,60-current.elapsed):current.elapsed).toFixed(1)} s`;
        if(telemetry?.isFinal()&&!shownResult){
          shownResult=true;resultMetrics.hidden=false;const m=telemetry.snapshot(),score=calculateDodgeScore(m);
          resultMetrics.append(element(document,'h2','','Métricas da tentativa'),element(document,'p','muted',`Tempo ativo: ${m.elapsedActiveSeconds.toFixed(1)} s · Ameaças: ${m.threatsQualified} · Evitadas: ${m.threatsDodged} · Impactos válidos: ${m.validHits} · Distância: ${m.totalDistanceMoved.toFixed(1)} u · Pendentes: ${m.threatsUnresolved}`));
          resultMetrics.append(element(document,'h2','',score.status==='scored'?`Pontuação desta tentativa: ${score.score}/100`:'Pontuação indisponível nesta tentativa'));
          if(score.status==='scored')for(const c of score.components)resultMetrics.append(element(document,'p','muted',`${c.name}: ${c.contribution.toFixed(1)} / ${c.weight}`));
          else resultMetrics.append(element(document,'p','status-note',score.reasons.join(' ')));
          if(score.status==='scored')mountSaveAttempt({container:resultMetrics,repository,metrics:m,score,core,isActive:()=>active&&revision===renderRevision});
          if(score.smallSample)resultMetrics.append(element(document,'p','status-note','Amostra pequena de ameaças resolvidas.'));
          if(score.capFactor<1)resultMetrics.append(element(document,'p','status-note','Nota limitada pela exposição curta antes da derrota.'));
          resultMetrics.append(element(document,'p','status-note','Fórmula provisória. A nota desta tentativa não representa seu nível de habilidade.'));
        }
        replay.hidden=!current.outcome;pause.hidden=Boolean(current.outcome);
        outcome.textContent=current.outcome?`${current.outcome==='victory'?'Vitória':current.outcome==='defeat'?'Derrota':current.outcome==='error'?'Treino interrompido por erro':'Abandonado'} · ${current.elapsed.toFixed(1)} s · ${current.lives} vidas restantes`:'';
      };
      hud.append(status,pause,exit,diagnostics,replay,outcome);screen.insertBefore(hud,screen.querySelector('.stage'));screen.append(resultMetrics);
      cleanupScreen=core.events.on('session:changed',updateSession);session.start();updateSession();
    }
    if (['/preview','/demo'].includes(route.path)||isDodge) loadPreview().then(({ mountPreview }) => {
      if (!active || revision !== renderRevision) return;
      preview = mountPreview(screen.querySelector('.stage'), { events:core.events,session, exercise, onStep:(...args)=>telemetry?.step(...args), onTick:updateSession, onError: error => { core.errors.report(error, { source: 'preview' }); if(rules)rules.fail();else session?.finish('error'); } });
    }).catch(error => {
      if (!active || revision !== renderRevision) return;
      core.errors.report(error, { source: 'preview.load' });
      const message = element(document, 'p', 'status-note', 'A prévia 3D não pôde ser carregada. Volte ao menu e tente novamente.');
      message.setAttribute('role', 'alert'); screen.append(message);
    });
  }
  const stopSessionUI=core.events.on('session:changed',s=>{shell.dataset.session=s.state;});
  window.addEventListener('hashchange', render);
  render(false);
  return { dispose() {
    if (!active) return;
    active = false; revision++; preview?.dispose(); cleanupScreen(); rules?.dispose();telemetry?.dispose(); session?.dispose(); exercise?.dispose();
    stopSessionUI();audio.dispose();repository.close();window.removeEventListener('hashchange', render); skip.removeEventListener('click', skipContent); shell.remove();
  } };
}
