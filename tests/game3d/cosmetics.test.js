import { it,expect,vi } from 'vitest';
import * as THREE from 'three';
import { createEventBus } from '../../src/core/eventBus.js';
import { createCharacter } from '../../src/game3d/character.js';
import { createFeedbackVisuals } from '../../src/game3d/feedbackVisuals.js';
import { applyGraphicsQuality,validatePreferences,DEFAULT_PREFERENCES } from '../../src/settings/preferences.js';
it('applies three real pixel-ratio caps without changing CSS or gameplay configuration',()=>{
 const renderer={setPixelRatio:vi.fn()};for(const [quality,ratio]of [['leve',1],['medio',1.2],['alto',1.5]]){applyGraphicsQuality(renderer,quality,2);expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(ratio);}expect(()=>validatePreferences({...DEFAULT_PREFERENCES,quality:'extreme'})).toThrow();
});
it('animates limbs while preserving the root pose and the exact neutral raycast distances',()=>{
 const character=createCharacter(),ray=new THREE.Raycaster(new THREE.Vector3(.22,.35,10),new THREE.Vector3(0,0,-1));character.group.updateMatrixWorld(true);const before=ray.intersectObject(character.group,true).map(h=>h.distance);character.animate({moving:true,attackPhase:'windup'},.1);character.group.updateMatrixWorld(true);const after=ray.intersectObject(character.group,true).map(h=>h.distance);expect(after).toEqual(before);expect(character.group.position.toArray()).toEqual([0,0,0]);const pose=character.group.children.map(m=>m.rotation.x);character.animate({state:'paused',moving:true},.1);expect(character.group.children.map(m=>m.rotation.x)).toEqual(pose);character.dispose();
});
it('bounds confirmed feedback to four reusable rings, freezes on zero active delta and cleans subscriptions',()=>{
 const scene=new THREE.Scene(),events=createEventBus(),feedback=createFeedbackVisuals({scene,events,attemptId:'one',position:()=>({x:0,z:0})}),group=scene.children[0];events.emit('precision:hit',{attemptId:'other'});expect(group.children.some(m=>m.visible)).toBe(false);for(let i=0;i<20;i++)events.emit('precision:hit',{attemptId:'one'});expect(group.children).toHaveLength(4);feedback.update(.1);const values=group.children.map(m=>m.material.opacity);feedback.update(0);expect(group.children.map(m=>m.material.opacity)).toEqual(values);feedback.dispose();expect(scene.children).toHaveLength(0);expect(events.emit('precision:hit',{attemptId:'one'})).toBe(0);
});
it('samples a neutral model pose immediately, hides alternate equipment and releases cloned GPU resources',async()=>{
 const {createAnimatedModel}=await import('../../src/game3d/sceneAssets.js');const root=new THREE.Group();
 for(const name of ['Rogue_Body','Knife','1H_Crossbow']){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.5,1,.4),new THREE.MeshStandardMaterial());mesh.name=name;root.add(mesh);}
 const clip=new THREE.AnimationClip('Idle',1,[new THREE.NumberKeyframeTrack('Rogue_Body.rotation[x]',[0,1],[.25,.25])]),template={scene:root,animations:[clip]},animated=createAnimatedModel(template);
 expect(animated.root.getObjectByName('Knife').visible).toBe(false);expect(animated.root.getObjectByName('1H_Crossbow').visible).toBe(true);expect(animated.root.getObjectByName('Rogue_Body').rotation.x).toBeCloseTo(.25);expect(root.getObjectByName('Rogue_Body').rotation.x).toBe(0);
 expect(animated.root.getObjectByName('Rogue_Body').geometry).not.toBe(root.getObjectByName('Rogue_Body').geometry);animated.dispose();
 const {disposeObject}=await import('../../src/game3d/resources.js');disposeObject(animated.root);disposeObject(root);
});
it('keeps dodge projectiles visible when zoomed out without changing their logical collision data',async()=>{
 const {createDodgeVisuals,projectileHaloSize}=await import('../../src/game3d/dodgeVisuals.js');const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(44,1.6,.1,160);camera.position.set(0,50,30);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const visuals=createDodgeVisuals(scene,{camera,container:{clientHeight:400}}),projectile={id:'visible',variant:'fast',radius:.22,speed:28,age:.3,distance:8,position:{x:1,z:2},origin:{x:-7,z:2},direction:{x:1,z:0}},before=JSON.stringify(projectile);
 visuals.sync({projectiles:[projectile]});const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});expect(meshes.some(m=>m.renderOrder===115&&m.visible)).toBe(true);expect(meshes.find(m=>m.renderOrder===118).material.depthTest).toBe(false);expect(meshes.find(m=>m.renderOrder===118).material.toneMapped).toBe(false);
 let halo;scene.traverse(o=>{if(o.isSprite)halo=o;});const size=projectileHaloSize(.22,60,44,400);expect(size/(2*60*Math.tan(44*Math.PI/360)/400)).toBeGreaterThanOrEqual(26);expect(halo.scale.x).toBeGreaterThan(.88);expect(JSON.stringify(projectile)).toBe(before);
 const resources=new Set();scene.traverse(n=>{if(n.isMesh&&n.geometry)resources.add(n.geometry);if(n.material)resources.add(n.material);});const spies=[...resources].map(r=>vi.spyOn(r,'dispose'));visuals.sync({projectiles:[]});visuals.dispose();expect(scene.children).toHaveLength(0);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
});
it('bounds pooled spell roots and caster actors during repeated launches and releases all resources',async()=>{
 const {createDodgeVisuals}=await import('../../src/game3d/dodgeVisuals.js'),{createAttackData}=await import('../../src/training/dodge/projectiles.js');const scene=new THREE.Scene(),visuals=createDodgeVisuals(scene),variants=['arcane_bolt','sun_beam','artillery','flame_circle','cage'];
 for(let i=0;i<100;i++){const p=createAttackData({variant:variants[i%5],origin:{x:0,z:0},direction:{x:1,z:0},caster:{x:15.8,z:0}});p.id='pool-'+i;p.phase='warning';visuals.sync({projectiles:[p],elapsed:i*.05});expect(scene.children[0].children.length).toBeLessThanOrEqual(5);visuals.sync({projectiles:[],elapsed:i*.05});}
 const resources=new Set();scene.traverse(n=>{if(n.geometry&&!n.isSprite)resources.add(n.geometry);if(n.material)resources.add(n.material);});const spies=[...resources].map(r=>vi.spyOn(r,'dispose'));visuals.dispose();visuals.dispose();expect(scene.children).toHaveLength(0);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
});
it('reduces only traveling-bolt prediction across tiers and keeps instant beam warning visible',async()=>{
 const {createDodgeVisuals}=await import('../../src/game3d/dodgeVisuals.js'),{createAttackData,VARIANTS}=await import('../../src/training/dodge/projectiles.js');const scene=new THREE.Scene(),v=createDodgeVisuals(scene);
 for(const [hint,age,visible]of [['full',.4,true],['brief',.1,true],['brief',.4,false],['off',.1,false]]){const p=createAttackData({variant:'arcane_bolt',origin:{x:0,z:0},direction:{x:1,z:0},config:{...VARIANTS.arcane_bolt,pathHint:hint,hintDuration:.2}});p.id='hint';p.age=age;p.phase='warning';v.sync({projectiles:[p],elapsed:age});expect(scene.getObjectByName('cast-path').visible).toBe(visible);}v.sync({projectiles:[]});const beam=createAttackData({variant:'sun_beam',origin:{x:0,z:0},direction:{x:1,z:0},config:{...VARIANTS.sun_beam,pathHint:'off'}});beam.id='beam';beam.phase='warning';v.sync({projectiles:[beam]});const roots=scene.children[0].children.filter(r=>r.visible);expect(roots[0].getObjectByName('cast-path').visible).toBe(true);v.dispose();
});
