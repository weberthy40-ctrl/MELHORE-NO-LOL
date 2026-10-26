import * as THREE from 'three';
import { createCharacter } from './character.js';
export function createKitingVisuals(scene){
 const group=new THREE.Group();scene.add(group);const enemies=new Map();
 const ringGeometry=new THREE.RingGeometry(.78,.86,64),ringMaterial=new THREE.MeshBasicMaterial({color:0xffbd74,side:THREE.DoubleSide,transparent:true,opacity:.9});
 const rangeGeometry=new THREE.RingGeometry(.995,1.005,96),rangeMaterial=new THREE.MeshBasicMaterial({color:0xa1f8d8,side:THREE.DoubleSide,transparent:true,opacity:.7}),range=new THREE.Mesh(rangeGeometry,rangeMaterial);range.rotation.x=-Math.PI/2;range.visible=false;range.raycast=()=>{};group.add(range);
 const bolt=new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),new THREE.MeshBasicMaterial({color:0xffe8ad}));bolt.raycast=()=>{};bolt.visible=false;group.add(bolt);
 const trailGeometry=new THREE.CylinderGeometry(.025,.075,1,8),trailMaterial=new THREE.MeshBasicMaterial({color:0xffc66c,transparent:true,opacity:.6}),trail=new THREE.Mesh(trailGeometry,trailMaterial);trail.visible=false;trail.raycast=()=>{};group.add(trail);
 let disposed=false,lastTime=0,assets=null;
 return {applyAssets(value){if(disposed)return;assets=value;for(const e of enemies.values())e.actor.applyAssets(value);},sync(snapshot,player={x:0,z:0}){
  if(disposed)return;const dt=Math.max(0,snapshot.elapsed-lastTime);lastTime=snapshot.elapsed;
  for(const target of snapshot.targets??[snapshot.target]){
   if(!enemies.has(target.id)){const actor=createCharacter({enemy:true,scale:1});if(assets)actor.applyAssets(assets);group.add(actor.group);const selection=new THREE.Mesh(ringGeometry,ringMaterial);selection.rotation.x=-Math.PI/2;selection.raycast=()=>{};group.add(selection);enemies.set(target.id,{actor,selection,last:{...target.position}});}
   const e=enemies.get(target.id),t=target.position;e.actor.setPose(t,Math.atan2(player.x-t.x,player.z-t.z));e.actor.animate({moving:Math.hypot(t.x-e.last.x,t.z-e.last.z)>.001},dt);e.last={...t};e.selection.position.set(t.x,.03,t.z);e.selection.visible=snapshot.selectedTargetId===target.id;
  }
  range.position.set(player.x,.04,player.z);range.scale.setScalar(snapshot.config.attackRange);
  const attack=snapshot.lastAttack,progress=attack?(snapshot.elapsed-attack.at)/.2:2;bolt.visible=trail.visible=Boolean(attack)&&progress>=0&&progress<1;
  if(bolt.visible){const t=snapshot.targets.find(t=>t.id===attack.targetId)?.position??attack.to,from=attack.from;bolt.position.set(from.x+(t.x-from.x)*progress,1.4+Math.sin(progress*Math.PI)*.25,from.z+(t.z-from.z)*progress);const direction=new THREE.Vector3(t.x-from.x,0,t.z-from.z).normalize();trail.position.copy(bolt.position).addScaledVector(direction,-.28);trail.scale.y=.55;trail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);}
 },setRangeVisible(value){range.visible=Boolean(value)&&!disposed;},clickTargets(){group.updateMatrixWorld(true);const result=[];for(const {actor}of enemies.values())actor.group.traverse(node=>{if(node.isMesh&&node.userData.rest)result.push(node);});return result;},dispose(){if(disposed)return;disposed=true;for(const {actor}of enemies.values())actor.dispose();enemies.clear();group.removeFromParent();group.clear();for(const r of [ringGeometry,ringMaterial,rangeGeometry,rangeMaterial,bolt.geometry,bolt.material,trailGeometry,trailMaterial])r.dispose();}};
}
