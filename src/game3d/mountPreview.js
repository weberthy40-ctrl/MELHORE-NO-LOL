import { loadSceneAssets } from './sceneAssets.js';
import { createFeedbackVisuals } from './feedbackVisuals.js';
import { loadPreferences,GRAPHICS_PRESETS,applyGraphicsQuality } from '../settings/preferences.js';
import * as THREE from 'three';
import { createKitingVisuals } from './kitingVisuals.js';
import { createPrecisionVisuals } from './precisionVisuals.js';
import { createDodgeVisuals } from './dodgeVisuals.js';
import { createArena } from './arena.js';
import { createCharacter } from './character.js';
const mounted = new WeakMap();
import { CAMERA } from './cameraConfig.js';
import { attachPreviewControls } from './previewControls.js';
export { CAMERA } from './cameraConfig.js';
/** Mount/dispose owns all scene resources. Render on demand; no ornamental RAF. */
export function mountPreview(container, { createRenderer = options => new THREE.WebGLRenderer(options),
  ResizeObserverClass = globalThis.ResizeObserver, onError = () => {}, controls = true, session, exercise, events, onTick = () => {}, onStep = () => {},
  requestFrame = callback => container.ownerDocument.defaultView.requestAnimationFrame(callback),
  cancelFrame = id => container.ownerDocument.defaultView.cancelAnimationFrame(id) } = {}) {
  mounted.get(container)?.dispose();
  const document = container.ownerDocument;let storage;try{storage=document.defaultView.localStorage;}catch{storage=null;}const preferences=loadPreferences(storage),graphics=GRAPHICS_PRESETS[preferences.quality],reducedMotion=preferences.motion==='reduced'||Boolean(document.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  let renderer, arena, character, observer, input, visuals, feedback, backdrop, disposed = false;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(exercise?.kind==='precision'?0x10142a:0x283e30);
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  camera.position.set(CAMERA.x, CAMERA.y, CAMERA.z); camera.lookAt(0,0,0);
  const errorMessage = document.createElement('p'); errorMessage.className = 'preview-error'; errorMessage.setAttribute('role', 'alert');
  function fail(error) {
    errorMessage.textContent = 'A visualização 3D está indisponível. Verifique o suporte a WebGL do navegador.';
    if (!disposed) { container.append(errorMessage); onError(error); }
  }
  function resize() {
    if (disposed || !renderer || document.hidden) return;
    const width = Math.max(1, container.clientWidth || 800), height = Math.max(1, container.clientHeight || 500);
    applyGraphicsQuality(renderer,preferences.quality,document.defaultView?.devicePixelRatio||1);camera.aspect = width/height; camera.updateProjectionMatrix();
    renderer.setSize(width,height,false); renderer.render(scene,camera);
  }
  function lost(event) { event.preventDefault(); input?.dispose(); fail(new Error('WebGL context lost.')); }
  const api = { get movement(){return input?.movement;}, dispose() {
    if (disposed) return; disposed = true;
    input?.dispose(); observer?.disconnect(); document.removeEventListener('visibilitychange', resize);
    document.defaultView?.removeEventListener('resize', resize);
    renderer?.domElement.removeEventListener('webglcontextlost', lost);
    backdrop?.dispose();feedback?.dispose();visuals?.dispose(); arena?.dispose(); character?.dispose(); renderer?.dispose(); renderer?.forceContextLoss?.();
    renderer?.domElement.remove(); errorMessage.remove(); scene.clear();
    if (mounted.get(container) === api) mounted.delete(container);
  } };
  mounted.set(container,api);
  try {
    renderer = createRenderer({ antialias: graphics.antialias, alpha: false });
    applyGraphicsQuality(renderer,preferences.quality,document.defaultView?.devicePixelRatio||1);
    renderer.domElement.setAttribute('aria-label','Campo de treino com personagens animados');
    container.append(renderer.domElement);
    character = createCharacter({reducedMotion});
    if(!['precision','reflex'].includes(exercise?.kind)){arena=createArena({document,quality:preferences.quality});scene.add(arena.group,character.group);}
    else if(document.defaultView.CanvasRenderingContext2D){
      const c=document.createElement('canvas');c.width=1280;c.height=900;const ctx=c.getContext('2d');
      if(ctx){const palette=['#213c43','#322d49','#243c32'][document.defaultView.crypto.getRandomValues(new Uint8Array(1))[0]%3],g=ctx.createRadialGradient(640,420,40,640,450,850);g.addColorStop(0,palette);g.addColorStop(1,'#080e18');ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#c0e2ff08';for(let x=0;x<1280;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,900);ctx.stroke();}for(let y=0;y<900;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke();}backdrop=new THREE.CanvasTexture(c);backdrop.colorSpace=THREE.SRGBColorSpace;scene.background=backdrop;}
    }
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    if(arena)scene.fog=new THREE.FogExp2(0x18352e,.013);
    scene.add(new THREE.HemisphereLight(0xc5e4e1,0x3c392b,1.5));
    const light=new THREE.DirectionalLight(0xffe5b8,2.7);light.position.set(-12,26,12);scene.add(light);
    if(arena&&renderer.shadowMap&&preferences.quality!=='leve'){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;light.castShadow=true;light.shadow.mapSize.setScalar(preferences.quality==='alto'?2048:1024);Object.assign(light.shadow.camera,{left:-30,right:30,top:32,bottom:-32,near:1,far:85});light.shadow.bias=-.0002;light.shadow.normalBias=.04;}
    observer = ResizeObserverClass ? new ResizeObserverClass(resize) : undefined; observer?.observe(container);
    document.addEventListener('visibilitychange',resize); document.defaultView?.addEventListener('resize',resize);
    renderer.domElement.addEventListener('webglcontextlost',lost); resize();
    if (exercise) visuals=exercise.kind==='precision'?createPrecisionVisuals(scene,camera,exercise):exercise.kind==='kiting'?createKitingVisuals(scene):exercise.kind==='reflex'?{sync(){},dispose(){}}:createDodgeVisuals(scene,{camera,container});
    if(exercise)visuals.sync(exercise.snapshot(),{x:0,z:0});
    if(exercise)feedback=createFeedbackVisuals({scene,events,attemptId:session?.snapshot().id,enabled:graphics.effects,reducedMotion,position:()=>exercise.kind==='kiting'?exercise.snapshot().target.position:input?.movement.snapshot().position??{x:0,z:0}});
    container.dataset.visuals='basic';
    if(arena&&document.defaultView.CanvasRenderingContext2D){
      container.dataset.visuals='loading';loadSceneAssets().then(assets=>{if(disposed)return;character.applyAssets(assets);visuals?.applyAssets?.(assets);arena.applyAssets(assets);container.dataset.visuals='ready';}).catch(()=>{if(!disposed)container.dataset.visuals='basic';});
    }
    if (controls) input = attachPreviewControls({container,renderer,camera,character,onError,session,exercise,visuals,feedback,onTick,onStep,onVisualStep:dt=>arena?.update(dt),requestFrame,cancelFrame,render:()=>renderer.render(scene,camera)});
  } catch (error) {
    api.dispose(); renderer = undefined; arena = undefined; character = undefined; observer = undefined;
    disposed = false; mounted.set(container,api); fail(error);
  }
  return api;
}
