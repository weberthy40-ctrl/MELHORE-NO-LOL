import * as THREE from 'three';
import { createMovement,safeDelta } from '../training/movement.js';
import { createCameraController,edgeIntent } from './cameraController.js';
import { loadCameraSettings } from '../settings/cameraSettings.js';
import { ARENA } from './spatial.js';
import { CAMERA } from './cameraConfig.js';
export function attachPreviewControls({container,renderer,camera,character,render,onError=()=>{},session,exercise,visuals,feedback,onTick=()=>{},onStep=()=>{},requestFrame,cancelFrame}) {
  const document=container.ownerDocument, window=document.defaultView, canvas=renderer.domElement;
  const movement=createMovement(), controller=createCameraController();
  const raycaster=new THREE.Raycaster(), plane=new THREE.Plane(new THREE.Vector3(0,1,0),-ARENA.groundY);
  const cursor=new THREE.Vector2(), point=new THREE.Vector3();
  let disposed=false, frame=null, last=null, pan={x:0,z:0};
  let preferences;
  try {preferences=loadCameraSettings(window.localStorage);} catch {preferences=loadCameraSettings(null);}
  const status=document.createElement('p');status.className='preview-instructions';status.setAttribute('aria-live','polite');container.append(status);
  const running=()=>!session || session.snapshot().state==='running';
  const editable=target=>target?.closest?.('input,textarea,select,[contenteditable="true"]');
  function pose(dt=0) {
    if(running()) movement.update(dt);
    const snapshot=movement.snapshot();character.setPose(snapshot.position,snapshot.angle);
    const center=controller.update(snapshot.position,running()?pan:{x:0,z:0},dt,preferences), view=controller.snapshot();
    const fit=Math.max(1,1/camera.aspect);
    camera.position.set(center.x+CAMERA.x*view.zoom*fit,CAMERA.y*view.zoom*fit,center.z+CAMERA.z*view.zoom*fit);
    camera.lookAt(center.x,0,center.z);camera.updateMatrixWorld();
    status.textContent=`Clique direito: mover · Y: câmera ${view.locked?'travada':'livre'} · Roda: zoom${!view.locked && preferences.edgePanEnabled?' · Bordas: mover câmera':''}`;
  }
  function tick(time) {
    try { tickFrame(time); } catch(error) { api.dispose(); onError(error); }
  }
  function tickFrame(time) {
    frame=null;if(disposed||document.hidden)return;
    const dt=last===null?0:(time-last)/1000;last=time;
    const elapsedBefore=session?.snapshot().elapsed;session?.update(dt);
    const activeDelta=session?session.snapshot().elapsed-elapsedBefore:safeDelta(dt);
    const previous=movement.snapshot().position;pose(activeDelta);if(!running())visuals?.setRangeVisible?.(false);
    if(running()&&exercise){exercise.update(activeDelta,previous,movement.snapshot().position);visuals.sync(exercise.snapshot(),movement.snapshot().position);}
    const nextPosition=movement.snapshot().position;character.animate?.({moving:Math.hypot(nextPosition.x-previous.x,nextPosition.z-previous.z)>1e-6,attackPhase:exercise?.kind==='kiting'?exercise.snapshot().phase:null,state:session?.snapshot().state??'running'},activeDelta);feedback?.update(activeDelta);onStep(activeDelta,previous,nextPosition);if(disposed)return;onTick();if(disposed)return;render();frame=requestFrame(tick);
  }
  function start() {if(!disposed&&!document.hidden&&frame===null){last=null;frame=requestFrame(tick);}}
  function suspend() {visuals?.setRangeVisible?.(false);pan={x:0,z:0};last=null;session?.pause();}
  function visibility() {suspend();if(document.hidden){if(frame!==null)cancelFrame(frame);frame=null;}else start();}
  function pointer(event) {const rect=canvas.getBoundingClientRect();pan=edgeIntent(event.clientX-rect.left,event.clientY-rect.top,rect.width,rect.height);}
  function down(event) {
    if(!running()||![0,2].includes(event.button))return;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0||event.clientX<rect.left||event.clientY<rect.top||event.clientX>rect.left+rect.width||event.clientY>rect.top+rect.height)return;
    cursor.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    pose();raycaster.setFromCamera(cursor,camera);
    if(event.button===0){
      if(!['precision','kiting'].includes(exercise?.kind))return;
      const hit=raycaster.intersectObjects(visuals.clickTargets(),false)[0];
      const valid=hit&&(!visuals.acceptHit||visuals.acceptHit(raycaster,hit));
      if(exercise.kind==='kiting'){if(exercise.click(valid?hit.object.userData.targetId:null))movement.stop();}
      else if(valid)exercise.hit(hit.object.userData.targetId);else exercise.miss();
      visuals.sync(exercise.snapshot(),movement.snapshot().position);onTick();if(!disposed)render();return;
    }
    if(raycaster.ray.intersectPlane(plane,point)&&movement.moveTo({x:point.x,z:point.z})){exercise?.moveCommand?.();onTick();}
  }
  function context(event){event.preventDefault();}
  function leave(){pan={x:0,z:0};}
  function wheel(event) {if(event.ctrlKey||event.metaKey||event.altKey||!Number.isFinite(event.deltaY)||event.deltaY===0)return;event.preventDefault();controller.wheel(event.deltaY,event.deltaMode);pose();render();}
  function key(event) {
    if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||editable(event.target))return;
    if(event.code==='KeyA'&&exercise?.kind==='kiting'&&running()){visuals.setRangeVisible(true);render();}
    if(event.key.toLowerCase()==='y') {controller.toggle();pose();render();}
    if(event.key==='Escape'&&session){event.preventDefault();if(session.snapshot().state==='paused')session.resume();else session.pause();}
  }
  function keyup(event){if(event.code==='KeyA')visuals?.setRangeVisible?.(false);}
  window.addEventListener('keyup',keyup);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('contextmenu',context);canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('wheel',wheel,{passive:false});
  window.addEventListener('keydown',key);window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',visibility);
  const api = {movement,controller,dispose(){if(disposed)return;disposed=true;if(frame!==null)cancelFrame(frame);
    canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('contextmenu',context);canvas.removeEventListener('pointermove',pointer);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('wheel',wheel);
    window.removeEventListener('keyup',keyup);visuals?.setRangeVisible?.(false);window.removeEventListener('keydown',key);window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',visibility);status.remove();
  }};
  try { pose();start(); } catch(error) { api.dispose();throw error; }
  return api;
}
