// @vitest-environment jsdom
import * as THREE from 'three';
import * as preferenceFixture from '../../src/settings/preferences.js';
import { describe,expect,it,vi } from 'vitest';
import { attachPreviewControls } from '../../src/game3d/previewControls.js';
import { createMovement } from '../../src/training/movement.js';
import { createCameraController,edgeIntent,ZOOM } from '../../src/game3d/cameraController.js';
import { createSession } from '../../src/training/session.js';
import { loadCameraSettings,saveCameraSettings,normalizeCameraSettings } from '../../src/settings/cameraSettings.js';
describe('movement and camera',()=>{
  it('moves independently of frame rate, redirects and stops exactly',()=>{
    const a=createMovement(),b=createMovement();a.moveTo({x:7,z:0});b.moveTo({x:7,z:0});
    for(let i=0;i<10;i++)a.update(.1);for(let i=0;i<100;i++)b.update(.01);
    expect(a.snapshot().position.x).toBeCloseTo(b.snapshot().position.x);expect(a.snapshot().position.x).toBeCloseTo(7);
    expect(a.moveTo({x:90,z:0})).toBe(false);a.moveTo({x:0,z:0});a.update(.1);expect(a.snapshot().position.x).toBeLessThan(7);
    const before=a.snapshot();for(const dt of [NaN,-1,Infinity])a.update(dt);expect(a.snapshot().position).toEqual(before.position);
  });
  it('preserves zoom through toggles, limits zoom and prevents locked pan',()=>{
    const c=createCameraController(),prefs={edgePanEnabled:true,edgePanSpeed:1};
    c.wheel(100);const zoom=c.snapshot().zoom;c.toggle();c.update({x:5,z:5},{x:1,z:1},.1,prefs);
    expect(c.snapshot().center.x).not.toBe(5);c.toggle();expect(c.snapshot().zoom).toBe(zoom);
    c.update({x:5,z:5},{x:1,z:1},.1,prefs);expect(c.snapshot().center).toEqual({x:5,z:5});
    for(let i=0;i<100;i++)c.wheel(-100);expect(c.snapshot().zoom).toBe(ZOOM.min);
    expect(edgeIntent(400,250,800,500)).toEqual({x:0,z:0});expect(edgeIntent(-1,0,800,500)).toEqual({x:0,z:0});
  });
  it('persists validated preferences with legacy/corrupt fallback',()=>{
    const storage={getItem:()=>'{bad'};expect(loadCameraSettings(storage).edgePanEnabled).toBe(true);
    expect(normalizeCameraSettings({edgePanSpeed:Infinity}).edgePanSpeed).toBe(1);
    const saved=saveCameraSettings(window.localStorage,{edgePanEnabled:false,edgePanSpeed:9});
    expect(loadCameraSettings(window.localStorage)).toEqual(saved);expect(saved.edgePanSpeed).toBe(2);window.localStorage.clear();
  });
});
describe('session lifecycle',()=>{
  it('counts only active time and pauses both countdown and running',()=>{
    const session=createSession();session.start();for(let i=0;i<10;i++)session.update(.1);
    session.pause();session.update(.1);expect(session.snapshot().elapsed).toBe(0);expect(session.snapshot().preparation).toBeCloseTo(1);
    session.resume();for(let i=0;i<30;i++)session.update(.1);expect(session.snapshot().state).toBe('running');expect(session.snapshot().elapsed).toBeCloseTo(1);
    session.pause();session.update(.1);expect(session.snapshot().elapsed).toBeCloseTo(1);
    session.resume();session.abandon();expect(session.snapshot().state).toBe('abandoned');expect(session.finish()).toBe(false);session.dispose();session.update(.1);expect(session.snapshot().state).toBe('disposed');
  });
  it('only emits one completion and protects snapshot metadata',()=>{
    const events={emit:vi.fn()},session=createSession({countdown:0,events,metadata:{type:'demo'}});session.start();
    session.finish();session.finish();expect(events.emit.mock.calls.filter(([,s])=>s.state==='completed')).toHaveLength(1);
    expect(Object.isFrozen(session.snapshot().metadata)).toBe(true);
  });
});
describe('scoped input and cleanup',()=>{
  it('uses one loop, respects modifiers and disposes keyboard/RAF/DOM',()=>{
    vi.spyOn(document,'hidden','get').mockReturnValue(false);
    const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);document.body.append(container);
    const callbacks=new Map();let next=0;
    const cancelFrame=vi.fn(id=>callbacks.delete(id));const requestFrame=fn=>{callbacks.set(++next,fn);return next;};
    const camera=new THREE.PerspectiveCamera(44,1.6,.1,160);
    const controls=attachPreviewControls({container,renderer:{domElement:canvas},camera,character:{setPose:vi.fn()},render:vi.fn(),requestFrame,cancelFrame});
    expect(callbacks.size).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',ctrlKey:true}));expect(controls.controller.snapshot().locked).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'y'}));expect(controls.controller.snapshot().locked).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',repeat:true}));expect(controls.controller.snapshot().locked).toBe(false);
    vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:100,top:50,width:800,height:500});
    canvas.dispatchEvent(new MouseEvent('pointerdown',{button:0,clientX:550,clientY:300}));expect(controls.movement.snapshot().target).toBeNull();
    canvas.dispatchEvent(new MouseEvent('pointerdown',{button:2,clientX:550,clientY:300}));expect(controls.movement.snapshot().target).not.toBeNull();
    expect(controls.movement.snapshot().target.x).toBeGreaterThan(0);
    const context=new MouseEvent('contextmenu',{cancelable:true});canvas.dispatchEvent(context);expect(context.defaultPrevented).toBe(true);
    controls.dispose();controls.dispose();expect(cancelFrame).toHaveBeenCalledTimes(1);expect(callbacks.size).toBe(0);expect(container.querySelector('.preview-instructions')).toBeNull();
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'y'}));expect(controls.controller.snapshot().locked).toBe(false);container.remove();
  });
});
it('holds A only in active Kiting, clears on release/blur, and never schedules after disposal inside a tick',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(false);const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);const session=createSession({countdown:0});session.start();
 let callback,controls;const requestFrame=vi.fn(fn=>{callback=fn;return 1;}),visuals={sync:vi.fn(),setRangeVisible:vi.fn()},exercise={kind:'kiting',update:vi.fn(),snapshot:()=>({})},render=vi.fn();
 controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},session,exercise,visuals,requestFrame,cancelFrame:vi.fn(),render,onTick:()=>controls.dispose()});
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'a',code:'KeyA'}));expect(visuals.setRangeVisible).toHaveBeenLastCalledWith(true);window.dispatchEvent(new KeyboardEvent('keyup',{key:'a',code:'KeyA'}));expect(visuals.setRangeVisible).toHaveBeenLastCalledWith(false);
 const input=document.createElement('input');document.body.append(input);input.dispatchEvent(new KeyboardEvent('keydown',{key:'a',code:'KeyA',bubbles:true}));expect(visuals.setRangeVisible).toHaveBeenLastCalledWith(false);input.remove();window.dispatchEvent(new Event('blur'));expect(session.snapshot().state).toBe('paused');expect(visuals.setRangeVisible).toHaveBeenLastCalledWith(false);
 callback(0);expect(requestFrame).toHaveBeenCalledTimes(1);session.dispose();
});
it('keeps movement and session time in real seconds at five frames per second',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(false);const session=createSession({countdown:0});session.start();let callback;
 const canvas=document.createElement('canvas'),container=document.createElement('div');container.append(canvas);
 const controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},render:vi.fn(),session,requestFrame:fn=>{callback=fn;return 1;},cancelFrame:vi.fn()});
 controls.movement.moveTo({x:0,z:18});callback(0);for(let frame=1;frame<=5;frame++)callback(frame*200);
 expect(session.snapshot().elapsed).toBeCloseTo(1);expect(controls.movement.snapshot().position.z).toBeCloseTo(11);controls.dispose();session.dispose();
});
it('uses A only for the range display and attacks from an ordinary floor click without ray-selecting a body',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(false);const session=createSession({countdown:0});session.start();const canvas=document.createElement('canvas'),container=document.createElement('div');container.append(canvas);
 vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:800,height:500});const click=vi.fn(()=>true),visuals={sync:vi.fn(),setRangeVisible:vi.fn(),clickTargets:vi.fn()},exercise={kind:'kiting',click,update:vi.fn(),snapshot:()=>({})};
 const controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},session,exercise,visuals,requestFrame:()=>1,cancelFrame:vi.fn(),render:vi.fn()});
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'a',code:'KeyA'}));expect(click).not.toHaveBeenCalled();expect(visuals.setRangeVisible).toHaveBeenLastCalledWith(true);window.dispatchEvent(new KeyboardEvent('keyup',{key:'a',code:'KeyA'}));
 canvas.dispatchEvent(new MouseEvent('pointerdown',{button:0,clientX:750,clientY:440}));expect(click).toHaveBeenCalledOnce();expect(click.mock.calls[0][0]).toMatchObject({x:expect.any(Number),z:expect.any(Number)});expect(visuals.clickTargets).not.toHaveBeenCalled();
 controls.dispose();session.dispose();
});
it('starts windup at the input time between slow frames and counts cancellation with S',async()=>{
 const {createKitingPractice}=await import('../../src/training/kiting/practice.js');vi.spyOn(document,'hidden','get').mockReturnValue(false);let clock=0,callback;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);
 const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:800,height:500});const session=createSession({countdown:0});session.start();const exercise=createKitingPractice({variant:'waves'});exercise.start();const controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},session,exercise,visuals:{sync:vi.fn(),setRangeVisible:vi.fn()},requestFrame:fn=>{callback=fn;return 1;},cancelFrame:vi.fn(),render:vi.fn()});
 callback(0);clock=290;canvas.dispatchEvent(new MouseEvent('pointerdown',{button:0,clientX:450,clientY:300}));clock=300;callback(clock);expect(exercise.snapshot()).toMatchObject({phase:'windup',hits:0,cancellations:0});clock=320;window.dispatchEvent(new KeyboardEvent('keydown',{key:'s',code:'KeyS'}));expect(exercise.snapshot()).toMatchObject({hits:0,cancellations:1});expect(controls.movement.snapshot().target).toBeNull();controls.dispose();session.dispose();
});
it('uses Flash only once per active cooldown, freezes while paused and does not report blink as walking',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(false);window.localStorage.clear();let clock=0,callback;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:800,height:500});const session=createSession({countdown:0});session.start();const onStep=vi.fn(),exercise={update:vi.fn(),snapshot:()=>({})};const controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},session,exercise,visuals:{sync:vi.fn()},requestFrame:fn=>{callback=fn;return 1;},cancelFrame:vi.fn(),render:vi.fn(),onStep});callback(0);canvas.dispatchEvent(new MouseEvent('pointermove',{clientX:700,clientY:250}));const flash=()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',code:'KeyD'}));flash();const first=controls.movement.snapshot().position;expect(Math.hypot(first.x,first.z)).toBeCloseTo(4);flash();expect(controls.movement.snapshot().position).toEqual(first);
 session.pause();for(let i=0;i<200;i++){clock+=100;callback(clock);}session.resume();flash();expect(controls.movement.snapshot().position).toEqual(first);for(let i=0;i<151;i++){clock+=100;callback(clock);}flash();expect(controls.movement.snapshot().position).not.toEqual(first);for(const [,previous,next]of onStep.mock.calls)expect(previous).toEqual(next);controls.dispose();session.dispose();
});
it('recenters a free camera with Space without locking it, changing zoom, cancelling movement or consuming reflex input',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(false);const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);const controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},requestFrame:()=>1,cancelFrame:vi.fn(),render:vi.fn()});controls.controller.toggle();controls.controller.wheel(100);controls.movement.blink({x:8,z:4});controls.movement.moveTo({x:8,z:4});controls.controller.update({x:0,z:0},{x:-1,z:-1},.1,{edgePanEnabled:true,edgePanSpeed:1});const zoom=controls.controller.snapshot().zoom,target=controls.movement.snapshot().target,event=new KeyboardEvent('keydown',{key:' ',code:'Space',cancelable:true});window.dispatchEvent(event);expect(event.defaultPrevented).toBe(true);expect(controls.controller.snapshot()).toMatchObject({locked:false,zoom,center:controls.movement.snapshot().position});expect(controls.movement.snapshot().target).toEqual(target);controls.dispose();
 const reflex=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},exercise:{kind:'reflex'},requestFrame:()=>1,cancelFrame:vi.fn(),render:vi.fn()});const response=new KeyboardEvent('keydown',{key:' ',code:'Space',cancelable:true});window.dispatchEvent(response);expect(response.defaultPrevented).toBe(false);reflex.dispose();
});
it('rejects invalid recenter coordinates and preserves free pan after recentering',()=>{
 const controller=createCameraController();controller.toggle();controller.wheel(-100);const zoom=controller.snapshot().zoom;expect(controller.recenter({x:3,z:4})).toBe(true);expect(controller.snapshot()).toMatchObject({locked:false,zoom,center:{x:3,z:4}});expect(controller.recenter({x:Infinity,z:0})).toBe(false);controller.update({x:3,z:4},{x:1,z:0},.1,{edgePanEnabled:true,edgePanSpeed:1});expect(controller.snapshot().center.x).toBeGreaterThan(3);
});
it('registers precision against the displayed target before advancing a delayed frame, while preserving the session deadline',async()=>{
 const {createPrecisionPractice}=await import('../../src/training/precision/practice.js'),{createPrecisionVisuals}=await import('../../src/game3d/precisionVisuals.js'),{createRandom}=await import('../../src/core/random.js');vi.spyOn(document,'hidden','get').mockReturnValue(false);let clock=0;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);
 const canvas=document.createElement('canvas'),container=document.createElement('div');container.append(canvas);vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:1000,height:700});const camera=new THREE.PerspectiveCamera(44,1000/700,.1,160),scene=new THREE.Scene(),session=createSession({countdown:0,timeLimit:60});session.start();const exercise=createPrecisionPractice({variant:'mixed',level:1,speed:4,rng:createRandom(53)}),visuals=createPrecisionVisuals(scene,camera,exercise);let callback;
 const controls=attachPreviewControls({container,renderer:{domElement:canvas},camera,character:{setPose:vi.fn()},exercise,visuals,session,requestFrame:fn=>{callback=fn;return 1;},cancelFrame:vi.fn(),render:vi.fn(),onTick:()=>{if(session.snapshot().elapsed>=60){exercise.stop();session.finish();}}});exercise.start();callback(0);const target=exercise.snapshot().targets[0],screen=new THREE.Vector3(target.position.x,1,target.position.z).project(camera);clock=500;canvas.dispatchEvent(new MouseEvent('pointerdown',{button:0,clientX:(screen.x+1)*500,clientY:(1-screen.y)*350}));expect(exercise.snapshot()).toMatchObject({hits:1,misses:0});expect(session.snapshot().elapsed).toBeCloseTo(.5);for(clock=600;clock<60000;clock+=100)callback(clock);const last=exercise.snapshot().targets[0],at=new THREE.Vector3(last.position.x,1,last.position.z).project(camera);clock=60100;canvas.dispatchEvent(new MouseEvent('pointerdown',{button:0,clientX:(at.x+1)*500,clientY:(1-at.y)*350}));expect(exercise.snapshot().hits).toBe(1);expect(session.snapshot().elapsed).toBe(60);controls.dispose();visuals.dispose();session.dispose();
});
it('projects a dodge move against the displayed locked camera before catching up a delayed frame',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(false);let clock=0,callback;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:800,height:500});const camera=new THREE.PerspectiveCamera(44,1.6,.1,160),session=createSession({countdown:0});session.start();const exercise={kind:'dodge',update:vi.fn(),snapshot:()=>({playerSpeed:5.4,projectiles:[]})},controls=attachPreviewControls({container,renderer:{domElement:canvas},camera,character:{setPose:vi.fn()},session,exercise,visuals:{sync:vi.fn()},requestFrame:fn=>{callback=fn;return 1;},cancelFrame:vi.fn(),render:vi.fn()});callback(0);controls.movement.moveTo({x:10,z:0});const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(.25,0),camera);const expected=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());clock=400;canvas.dispatchEvent(new MouseEvent('pointerdown',{button:2,clientX:500,clientY:250}));expect(controls.movement.snapshot().position.x).toBeGreaterThan(2);expect(controls.movement.snapshot().target.x).toBeCloseTo(expected.x);expect(controls.movement.snapshot().target.z).toBeCloseTo(expected.z);controls.dispose();session.dispose();
});
it('never starts a dodge skill on a right-click catchup, but fires on the next autonomous frame',async()=>{
 const {createTechnicalDodge}=await import('../../src/training/dodge/technicalDodge.js'),{createRandom}=await import('../../src/core/random.js');vi.spyOn(document,'hidden','get').mockReturnValue(false);let clock=0,callback;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:800,height:500});const session=createSession({countdown:0});session.start();const exercise=createTechnicalDodge({level:10,rng:createRandom(51),isRunning:()=>session.snapshot().state==='running'}),controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},render:vi.fn(),session,exercise,visuals:{sync:vi.fn()},requestFrame:fn=>{callback=fn;return 1;},cancelFrame:vi.fn()});callback(0);for(const time of [200,400,600]){clock=time;canvas.dispatchEvent(new MouseEvent('pointerdown',{button:2,clientX:500,clientY:300}));expect(exercise.snapshot().shots).toBe(0);}clock=650;callback(clock);expect(exercise.snapshot().shots).toBeGreaterThan(0);controls.dispose();exercise.dispose();session.dispose();
});
it('binds the dodge dash to a saved key, keeps cooldown frozen on pause and preserves movement with either camera',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(false);window.localStorage.clear();let callback,clock=0;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);
 const make=locked=>{const container=document.createElement('div'),canvas=document.createElement('canvas');container.append(canvas);vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:800,height:500});const session=createSession({countdown:0});session.start();const exercise={kind:'dodge',update:vi.fn(),snapshot:()=>({playerSpeed:5.8,projectiles:[]})},controls=attachPreviewControls({container,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose:vi.fn()},session,exercise,visuals:{sync:vi.fn()},requestFrame:fn=>{callback=fn;return 1;},cancelFrame:vi.fn(),render:vi.fn()});if(!locked)controls.controller.toggle();callback(clock);return {controls,session,container,canvas};};
 const {DEFAULT_PREFERENCES}=preferenceFixture;window.localStorage.setItem('moba-training:preferences:v1',JSON.stringify({...DEFAULT_PREFERENCES,dashKey:'KeyF'}));
 const a=make(true);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e',code:'KeyE'}));expect(a.controls.movement.snapshot().dash).toBeNull();window.dispatchEvent(new KeyboardEvent('keydown',{key:'f',code:'KeyF'}));expect(a.controls.movement.snapshot().dash).not.toBeNull();clock=150;callback(clock);expect(a.controls.movement.snapshot().position.z).toBeCloseTo(1.8);window.dispatchEvent(new KeyboardEvent('keydown',{key:'f',code:'KeyF'}));expect(a.controls.movement.snapshot().dash).toBeNull();a.session.pause();for(let n=0;n<60;n++){clock+=100;callback(clock);}a.session.resume();window.dispatchEvent(new KeyboardEvent('keydown',{key:'f',code:'KeyF'}));expect(a.controls.movement.snapshot().dash).toBeNull();for(let n=0;n<51;n++){clock+=100;callback(clock);}window.dispatchEvent(new KeyboardEvent('keydown',{key:'f',code:'KeyF'}));expect(a.controls.movement.snapshot().dash).not.toBeNull();a.controls.movement.stop();a.controls.movement.moveTo({x:8,z:1.8});const before=a.controls.movement.snapshot().position;for(let n=0;n<10;n++){clock+=100;callback(clock);}const distance=a.controls.movement.snapshot().position.x-before.x;expect(distance).toBeCloseTo(5.8);a.controls.dispose();a.session.dispose();const b=make(false);b.controls.movement.moveTo({x:8,z:0});for(let n=0;n<10;n++){clock+=100;callback(clock);}expect(b.controls.movement.snapshot().position.x).toBeCloseTo(distance);b.controls.dispose();b.session.dispose();window.localStorage.clear();
});
