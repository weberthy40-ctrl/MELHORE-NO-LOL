import * as THREE from 'three';
import { createMovement,safeDelta,DODGE_MOVEMENT_SPEED,KITING_MOVEMENT_SPEED } from '../training/movement.js';
import { createCameraController,edgeIntent } from './cameraController.js';
import { loadPreferences } from '../settings/preferences.js';
import { loadCameraSettings } from '../settings/cameraSettings.js';
import { ARENA } from './spatial.js';
import { CAMERA } from './cameraConfig.js';
export function attachPreviewControls({container,renderer,camera,character,render,onError=()=>{},session,exercise,visuals,feedback,onTick=()=>{},onStep=()=>{},onVisualStep=()=>{},requestFrame,cancelFrame}) {
  const document=container.ownerDocument, window=document.defaultView, canvas=renderer.domElement;
  const world=!['precision','reflex'].includes(exercise?.kind),dodge=Boolean(exercise)&&!['precision','reflex','kiting'].includes(exercise.kind);
  const movement=createMovement(dodge?{speed:exercise.snapshot().playerSpeed??DODGE_MOVEMENT_SPEED}:exercise?.kind==='kiting'?{speed:exercise.snapshot().config?.playerSpeed??KITING_MOVEMENT_SPEED}:{}), controller=createCameraController();
  const raycaster=new THREE.Raycaster(), plane=new THREE.Plane(new THREE.Vector3(0,1,0),-ARENA.groundY);
  const cursor=new THREE.Vector2(), point=new THREE.Vector3();
  let disposed=false, frame=null, last=null, pan={x:0,z:0},flashRemaining=0,pointerKnown=false;
  let preferences;
  try {preferences=loadCameraSettings(window.localStorage);} catch {preferences=loadCameraSettings(null);}
  const status=document.createElement('p');status.className='preview-instructions';status.setAttribute('aria-live','polite');container.append(status);
  let bindings;try{bindings=loadPreferences(window.localStorage);}catch{bindings=loadPreferences(null);}
  const ability=document.createElement('p');ability.className='ability-hud';ability.hidden=!world;container.append(ability);
  const running=()=>!session || session.snapshot().state==='running';
  const editable=target=>target?.closest?.('input,textarea,select,button,a,dialog,[contenteditable="true"]');
  function pose(dt=0) {
    if(running()) movement.update(dt);
    const snapshot=movement.snapshot(),combat=exercise?.kind==='kiting'?exercise.snapshot():null;
    if(combat?.maxHealth)character.setHealth?.(combat.health/combat.maxHealth);
    character.setPose(snapshot.position,combat?.phase==='windup'?Math.atan2(combat.target.position.x-snapshot.position.x,combat.target.position.z-snapshot.position.z):snapshot.angle);
    const center=controller.update(snapshot.position,running()?pan:{x:0,z:0},dt,preferences), view=controller.snapshot();
    const fit=Math.max(1,1/camera.aspect);
    const precision=exercise?.kind==='precision';
    camera.position.set(precision?0:center.x+CAMERA.x*view.zoom*fit,precision?34:CAMERA.y*view.zoom*fit,precision ? .001 : center.z+CAMERA.z*view.zoom*fit);
    camera.lookAt(precision?0:center.x,0,precision?0:center.z);camera.updateMatrixWorld();
    ability.textContent=`${bindings.flashKey.replace('Key','')} · Flash ${flashRemaining>0?Math.ceil(flashRemaining)+'s':'pronto'}   /   ${bindings.stopKey.replace('Key','')} · Parar`;
    status.textContent=exercise?.kind==='reflex'?'TECLADO / MOUSE · responda ao sinal   /   ESC · pausar':precision?'ESQUERDO · acertar os alvos   /   ESC · pausar':`DIREITO · mover   /   ${exercise?.kind==='kiting'?'ESQUERDO · atacar   /   A · mostrar alcance   /   ':''}Y · câmera ${view.locked?'travada':'livre'}   /   ESPAÇO · centralizar   /   RODA · zoom   /   ESC · pausar`;
  }
  function tick(time) {
    try { tickFrame(time); } catch(error) { api.dispose(); onError(error); }
  }
  function tickFrame(time,schedule=true) {
    if(schedule)frame=null;if(disposed||document.hidden)return;
    const frameTime=last===null?time:Math.max(time,last),dt=last===null?0:(frameTime-last)/1000;last=frameTime;
    // Preserve real speed on slower frames, with bounded physics substeps and one render.
    const frameDelta=Number.isFinite(dt)?Math.max(0,Math.min(.5,dt)):0,steps=Math.max(1,Math.ceil(frameDelta/.05));
    for(let step=0;step<steps;step++){
      const elapsedBefore=session?.snapshot().elapsed;session?.update(frameDelta/steps);
      const activeDelta=session?session.snapshot().elapsed-elapsedBefore:safeDelta(frameDelta/steps);
      flashRemaining=Math.max(0,flashRemaining-activeDelta);
      const previous=movement.snapshot().position;pose(activeDelta);if(!running())visuals?.setRangeVisible?.(false);
      if(running()&&exercise){exercise.update(activeDelta,previous,movement.snapshot().position);visuals.sync(exercise.snapshot(),movement.snapshot().position);}
      const nextPosition=movement.snapshot().position;character.animate?.({moving:Math.hypot(nextPosition.x-previous.x,nextPosition.z-previous.z)>1e-6,attackPhase:exercise?.kind==='kiting'?exercise.snapshot().phase:null,state:session?.snapshot().state??'running'},activeDelta);feedback?.update(activeDelta);onVisualStep(activeDelta);onStep(activeDelta,previous,nextPosition);if(disposed)return;onTick();if(disposed)return;
    }
    if(schedule){if(!session||['running','countdown'].includes(session.snapshot().state))render();frame=requestFrame(tick);}
  }

  function start() {if(!disposed&&!document.hidden&&frame===null){last=null;frame=requestFrame(tick);}}
  function suspend() {visuals?.setRangeVisible?.(false);pan={x:0,z:0};last=null;session?.pause();}
  function visibility() {suspend();if(document.hidden){if(frame!==null)cancelFrame(frame);frame=null;}else start();}
  function pointer(event) {const rect=canvas.getBoundingClientRect();if(rect.width>0&&rect.height>0){cursor.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);pointerKnown=true;}pan=edgeIntent(event.clientX-rect.left,event.clientY-rect.top,rect.width,rect.height);}
  function flush(){if(last!==null)tickFrame(window.performance.now(),false);}
  function down(event) {
    if(!running()||![0,2].includes(event.button))return;
    if(exercise?.kind!=='precision')flush();if(disposed||!running())return;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0||event.clientX<rect.left||event.clientY<rect.top||event.clientX>rect.left+rect.width||event.clientY>rect.top+rect.height)return;
    cursor.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    pose();raycaster.setFromCamera(cursor,camera);
    if(event.button===0){
      if(!['precision','kiting'].includes(exercise?.kind))return;
      if(exercise.kind==='kiting'){
        // Every left click on the arena requests one attack; A only displays range.
        const aim=raycaster.ray.intersectPlane(plane,point)?{x:point.x,z:point.z}:movement.snapshot().position;
        if(exercise.click(aim))movement.stop();
      }else{
        const hit=raycaster.intersectObjects(visuals.clickTargets(),false)[0],valid=hit&&(!visuals.acceptHit||visuals.acceptHit(raycaster,hit)),targetId=valid?hit.object.userData.targetId:null;
        // Pick the displayed pose, then catch up the clock before accepting the target identity.
        flush();if(disposed||!running())return;
        if(valid)exercise.hit(targetId);else exercise.miss();
      }
      visuals.sync(exercise.snapshot(),movement.snapshot().position);onTick();if(!disposed)render();return;
    }
    if(exercise?.kind==='precision'||exercise?.kind==='reflex')return;
    if(raycaster.ray.intersectPlane(plane,point)&&movement.moveTo({x:Math.max(ARENA.bounds.minX,Math.min(ARENA.bounds.maxX,point.x)),z:Math.max(ARENA.bounds.minZ,Math.min(ARENA.bounds.maxZ,point.z))})){exercise?.moveCommand?.();feedback?.move?.(movement.snapshot().target);onTick();}
  }
  function context(event){event.preventDefault();}
  function leave(){pan={x:0,z:0};}
  function wheel(event) {if(event.ctrlKey||event.metaKey||event.altKey||!Number.isFinite(event.deltaY)||event.deltaY===0)return;event.preventDefault();controller.wheel(event.deltaY,event.deltaMode);pose();render();}
  function key(event) {
    if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||editable(event.target))return;
    if(world&&event.code==='Space'){event.preventDefault();pan={x:0,z:0};controller.recenter(movement.snapshot().position);pose();render();return;}
    if(world&&running()&&[bindings.stopKey,bindings.flashKey].includes(event.code)){
      event.preventDefault();flush();if(disposed||!running())return;
      if(event.code===bindings.stopKey){movement.stop();exercise?.moveCommand?.();}
      else if(flashRemaining<=0){pose();raycaster.setFromCamera(cursor,camera);const current=movement.snapshot(),aim=pointerKnown&&raycaster.ray.intersectPlane(plane,point)?{x:point.x,z:point.z}:current.target??{x:current.position.x+Math.sin(current.angle)*4,z:current.position.z+Math.cos(current.angle)*4};if(movement.blink(aim)){flashRemaining=15;exercise?.moveCommand?.();feedback?.move?.(movement.snapshot().position);}}
      pose();visuals?.sync?.(exercise?.snapshot(),movement.snapshot().position);onTick();if(!disposed)render();return;
    }
    if(event.code==='KeyA'&&exercise?.kind==='kiting'&&running()){visuals.setRangeVisible(true);render();}
    if(event.key.toLowerCase()==='y') {controller.toggle();pose();render();}
    if(event.key==='Escape'&&session){event.preventDefault();if(session.snapshot().state==='paused')session.resume();else session.pause();}
  }
  function keyup(event){if(event.code==='KeyA'){visuals?.setRangeVisible?.(false);}}
  window.addEventListener('keyup',keyup);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('contextmenu',context);canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('wheel',wheel,{passive:false});
  window.addEventListener('keydown',key);window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',visibility);
  const api = {movement,controller,dispose(){if(disposed)return;disposed=true;if(frame!==null)cancelFrame(frame);
    canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('contextmenu',context);canvas.removeEventListener('pointermove',pointer);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('wheel',wheel);
    window.removeEventListener('keyup',keyup);visuals?.setRangeVisible?.(false);window.removeEventListener('keydown',key);window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',visibility);status.remove();ability.remove();
  }};
  try { pose();start(); } catch(error) { api.dispose();throw error; }
  return api;
}
