import * as THREE from 'three';
import { createCharacter } from './character.js';
export function createKitingVisuals(scene){
 const group=new THREE.Group();scene.add(group);const enemy=createCharacter({enemy:true,scale:1.05});group.add(enemy.group);
 const bodies=[];enemy.group.traverse(node=>{if(node.isMesh&&node.userData.rest){node.userData.targetId='kiting-target';bodies.push(node);}});
 const selectGeometry=new THREE.RingGeometry(.82,.9,64),selectMaterial=new THREE.MeshBasicMaterial({color:0xff82a6,side:THREE.DoubleSide,transparent:true,opacity:.9}),selection=new THREE.Mesh(selectGeometry,selectMaterial);selection.rotation.x=-Math.PI/2;selection.visible=false;group.add(selection);
 const rangeGeometry=new THREE.RingGeometry(.995,1.005,96),rangeMaterial=new THREE.MeshBasicMaterial({color:0xa1f8d8,side:THREE.DoubleSide,transparent:true,opacity:.7}),range=new THREE.Mesh(rangeGeometry,rangeMaterial);range.rotation.x=-Math.PI/2;range.visible=false;group.add(range);
 const bolt=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),new THREE.MeshBasicMaterial({color:0xffe1a0}));bolt.raycast=()=>{};bolt.visible=false;group.add(bolt);
 selection.raycast=range.raycast=()=>{};let disposed=false,lastTime=0,lastHits=0,boltAt=-1,from={x:0,z:0},last={x:-3,z:-3};
 return {sync(snapshot,player={x:0,z:0}){
  if(disposed)return;const t=snapshot.target.position,dt=Math.max(0,snapshot.elapsed-lastTime);lastTime=snapshot.elapsed;
  enemy.setPose(t,Math.atan2(player.x-t.x,player.z-t.z));enemy.animate({moving:Math.hypot(t.x-last.x,t.z-last.z)>.001},dt);last={...t};
  selection.position.set(t.x,.025,t.z);selection.visible=snapshot.selected;range.position.set(player.x,.03,player.z);range.scale.setScalar(snapshot.config.attackRange);
  if(snapshot.hits>lastHits){lastHits=snapshot.hits;boltAt=snapshot.elapsed;from={...player};}
  const progress=(snapshot.elapsed-boltAt)/.16;bolt.visible=boltAt>=0&&progress<1;
  if(bolt.visible)bolt.position.set(from.x+(t.x-from.x)*progress,1.25,from.z+(t.z-from.z)*progress);
 },setRangeVisible(value){range.visible=Boolean(value)&&!disposed;},clickTargets(){group.updateMatrixWorld(true);return bodies;},acceptHit(raycaster,hit){scene.updateMatrixWorld(true);return raycaster.intersectObjects(scene.children,true)[0]?.object===hit.object;},dispose(){if(disposed)return;disposed=true;enemy.dispose();group.removeFromParent();group.clear();for(const resource of [selectGeometry,selectMaterial,rangeGeometry,rangeMaterial,bolt.geometry,bolt.material])resource.dispose();}};
}
