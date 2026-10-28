// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {DEFAULT_PREFERENCES,PREFERENCES_KEY} from '../../src/settings/preferences.js';
import { ARENA,isInsideArena } from '../../src/game3d/spatial.js';
import { createArena } from '../../src/game3d/arena.js';
import { createCharacter } from '../../src/game3d/character.js';
import { mountPreview } from '../../src/game3d/mountPreview.js';
describe('arena and character', () => {
  it('includes the boundary and rejects invalid/external coordinates', () => {
    expect(isInsideArena(ARENA.center)).toBe(true);
    expect(isInsideArena({x:ARENA.bounds.maxX,z:ARENA.bounds.minZ})).toBe(true);
    for (const p of [null,{x:NaN,z:0},{x:ARENA.bounds.maxX+1,z:0},{x:0,z:20}]) expect(isInsideArena(p)).toBe(false);
  });
  it('creates original meshes and disposes shared resources once', () => {
    const arena = createArena(); const resources = new Set();
    arena.group.traverse(node => { if(node.geometry) resources.add(node.geometry); if(node.material) resources.add(node.material); });
    const spies = [...resources].map(resource => vi.spyOn(resource,'dispose'));
    expect(arena.group.children.length).toBeGreaterThan(20); arena.dispose(); arena.dispose();
    spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
  });
  it('supports a passive pose, known front and finite validated inputs', () => {
    const character = createCharacter(); expect(character.group.position.y).toBe(ARENA.groundY);
    character.setPose({x:1,z:2}, Math.PI); expect(character.group.position.x).toBe(1);
    expect(() => character.setPose({x:Infinity,z:0})).toThrow();
    expect(() => createCharacter({scale:0})).toThrow(); character.dispose(); character.dispose();
  });
});
describe('preview lifecycle without WebGL', () => {
  function renderer() { return { domElement:document.createElement('canvas'), setPixelRatio:vi.fn(), setSize:vi.fn(),render:vi.fn(),dispose:vi.fn(),forceContextLoss:vi.fn() }; }
  it('mounts once, handles resize and replaces/releases previous resources', () => {
    const container = document.createElement('div'); const first = renderer(), second = renderer();
    const disconnect = vi.fn(); class Observer { observe() {} disconnect() {disconnect();} }
    const preview = mountPreview(container,{controls:false,createRenderer:()=>first,ResizeObserverClass:Observer});
    window.dispatchEvent(new Event('resize')); expect(first.render).toHaveBeenCalled();
    const next = mountPreview(container,{controls:false,createRenderer:()=>second,ResizeObserverClass:Observer});
    expect(first.dispose).toHaveBeenCalledTimes(1); expect(container.querySelectorAll('canvas')).toHaveLength(1);
    preview.dispose(); next.dispose(); next.dispose(); expect(second.dispose).toHaveBeenCalledTimes(1); expect(disconnect).toHaveBeenCalledTimes(2);
    expect(container.children).toHaveLength(0);
  });
  it('shows an accessible error and remains disposable on context creation failure', () => {
    const container = document.createElement('div'); const onError = vi.fn();
    const preview = mountPreview(container,{createRenderer:()=>{throw Error('No WebGL');},onError});
    expect(container.querySelector('[role=alert]').textContent).toContain('WebGL'); expect(onError).toHaveBeenCalledTimes(1);
    preview.dispose(); expect(container.children).toHaveLength(0);
  });
});

for(const quality of ['leve','medio','alto'])for(const dodge of [false,true])it(`preserves ${quality} shadow policy in ${dodge?'dodge':'general'} arenas using the supported renderer algorithm`,()=>{
 const previous=window.localStorage.getItem(PREFERENCES_KEY),container=document.createElement('div');
 window.localStorage.setItem(PREFERENCES_KEY,JSON.stringify({...DEFAULT_PREFERENCES,quality}));
 const renderer={shadowMap:{enabled:false},domElement:document.createElement('canvas'),setPixelRatio:vi.fn(),setSize:vi.fn(),render:vi.fn(),dispose:vi.fn(),forceContextLoss:vi.fn()};
 let view;
 try{
  view=mountPreview(container,{controls:false,createRenderer:()=>renderer,exercise:dodge?{kind:'dodge',snapshot:()=>({kind:'dodge',level:1,elapsed:0,projectiles:[]})}:undefined});
  const scene=renderer.render.mock.calls.at(-1)[0],light=scene.children.find(child=>child.isDirectionalLight);
  expect(renderer.shadowMap.enabled).toBe(quality!=='leve');expect(light.castShadow).toBe(quality!=='leve');
  expect(renderer.setPixelRatio).toHaveBeenCalledWith(1);
  if(quality!=='leve'){
   expect(renderer.shadowMap.type).toBe(THREE.PCFShadowMap);
   expect(light.shadow.mapSize.toArray()).toEqual([quality==='alto'?1024:512,quality==='alto'?1024:512]);
   expect(light.shadow.bias).toBe(-.0002);expect(light.shadow.normalBias).toBe(.04);
  }
 }finally{view?.dispose();if(previous===null)window.localStorage.removeItem(PREFERENCES_KEY);else window.localStorage.setItem(PREFERENCES_KEY,previous);}
 expect(renderer.dispose).toHaveBeenCalledTimes(1);expect(container.querySelector('canvas')).toBeNull();
});
