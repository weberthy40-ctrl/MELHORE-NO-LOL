// @vitest-environment jsdom
import * as THREE from 'three';
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
