import { it,expect,vi } from 'vitest';
import * as THREE from 'three';
import { createEventBus } from '../../src/core/eventBus.js';
import { createCharacter } from '../../src/game3d/character.js';
import { createFeedbackVisuals } from '../../src/game3d/feedbackVisuals.js';
import { applyGraphicsQuality,validatePreferences,DEFAULT_PREFERENCES } from '../../src/settings/preferences.js';
it('applies three real pixel-ratio caps without changing CSS or gameplay configuration',()=>{
 const renderer={setPixelRatio:vi.fn()};for(const [quality,ratio]of [['leve',1],['medio',1.4],['alto',1.75]]){applyGraphicsQuality(renderer,quality,2);expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(ratio);}expect(()=>validatePreferences({...DEFAULT_PREFERENCES,quality:'extreme'})).toThrow();
});
it('animates limbs while preserving the root pose and the exact neutral raycast distances',()=>{
 const character=createCharacter(),ray=new THREE.Raycaster(new THREE.Vector3(.22,.35,10),new THREE.Vector3(0,0,-1));character.group.updateMatrixWorld(true);const before=ray.intersectObject(character.group,true).map(h=>h.distance);character.animate({moving:true,attackPhase:'windup'},.1);character.group.updateMatrixWorld(true);const after=ray.intersectObject(character.group,true).map(h=>h.distance);expect(after).toEqual(before);expect(character.group.position.toArray()).toEqual([0,0,0]);const pose=character.group.children.map(m=>m.rotation.x);character.animate({state:'paused',moving:true},.1);expect(character.group.children.map(m=>m.rotation.x)).toEqual(pose);character.dispose();
});
it('bounds confirmed feedback to four reusable rings, freezes on zero active delta and cleans subscriptions',()=>{
 const scene=new THREE.Scene(),events=createEventBus(),feedback=createFeedbackVisuals({scene,events,attemptId:'one',position:()=>({x:0,z:0})}),group=scene.children[0];events.emit('precision:hit',{attemptId:'other'});expect(group.children.some(m=>m.visible)).toBe(false);for(let i=0;i<20;i++)events.emit('precision:hit',{attemptId:'one'});expect(group.children).toHaveLength(4);feedback.update(.1);const values=group.children.map(m=>m.material.opacity);feedback.update(0);expect(group.children.map(m=>m.material.opacity)).toEqual(values);feedback.dispose();expect(scene.children).toHaveLength(0);expect(events.emit('precision:hit',{attemptId:'one'})).toBe(0);
});
