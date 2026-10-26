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
  let renderer, arena, character, observer, input, visuals, feedback, disposed = false;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x101e2b);
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
    feedback?.dispose();visuals?.dispose(); arena?.dispose(); character?.dispose(); renderer?.dispose(); renderer?.forceContextLoss?.();
    renderer?.domElement.remove(); errorMessage.remove(); scene.clear();
    if (mounted.get(container) === api) mounted.delete(container);
  } };
  mounted.set(container,api);
  try {
    renderer = createRenderer({ antialias: graphics.antialias, alpha: false });
    applyGraphicsQuality(renderer,preferences.quality,document.defaultView?.devicePixelRatio||1);
    renderer.domElement.setAttribute('aria-label','Arena original com guerreiro estilizado');
    container.append(renderer.domElement);
    arena = createArena(); character = createCharacter({reducedMotion}); scene.add(arena.group,character.group);
    scene.add(new THREE.HemisphereLight(0xcceaff,0x344039,2));
    const light = new THREE.DirectionalLight(0xffe4bb,3); light.position.set(8,16,5); scene.add(light);
    observer = ResizeObserverClass ? new ResizeObserverClass(resize) : undefined; observer?.observe(container);
    document.addEventListener('visibilitychange',resize); document.defaultView?.addEventListener('resize',resize);
    renderer.domElement.addEventListener('webglcontextlost',lost); resize();
    if (exercise) visuals=exercise.kind==='precision'?createPrecisionVisuals(scene,camera,exercise):exercise.kind==='kiting'?createKitingVisuals(scene):exercise.kind==='reflex'?{sync(){},dispose(){}}:createDodgeVisuals(scene);
    if(exercise)feedback=createFeedbackVisuals({scene,events,attemptId:session?.snapshot().id,enabled:graphics.effects,reducedMotion,position:()=>exercise.kind==='kiting'?exercise.snapshot().target.position:input?.movement.snapshot().position??{x:0,z:0}});
    if (controls) input = attachPreviewControls({container,renderer,camera,character,onError,session,exercise,visuals,feedback,onTick,onStep,requestFrame,cancelFrame,render:()=>renderer.render(scene,camera)});
  } catch (error) {
    api.dispose(); renderer = undefined; arena = undefined; character = undefined; observer = undefined;
    disposed = false; mounted.set(container,api); fail(error);
  }
  return api;
}
