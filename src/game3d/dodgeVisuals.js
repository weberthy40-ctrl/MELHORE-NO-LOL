import * as THREE from 'three';
import { VARIANTS } from '../training/dodge/projectiles.js';
import { ATTACK_ORIGIN } from '../training/dodge/technicalDodge.js';
import { disposeObject } from './resources.js';
export function createDodgeVisuals(scene) {
  const group=new THREE.Group();scene.add(group);
  const marker=new THREE.Mesh(new THREE.CylinderGeometry(.65,.9,1.4,6),new THREE.MeshStandardMaterial({color:0x936588,emissive:0x261725}));
  marker.position.set(ATTACK_ORIGIN.x,.7,ATTACK_ORIGIN.z);group.add(marker);
  const assets=Object.fromEntries(Object.entries(VARIANTS).map(([id,v])=>[id,{geometry:id==='aoe_zone'?new THREE.CircleGeometry(v.radius,48):id==='hook_linear'?new THREE.TorusGeometry(v.radius*.65,v.radius*.3,6,12,Math.PI*1.6):id==='fast'?new THREE.OctahedronGeometry(v.radius):new THREE.IcosahedronGeometry(v.radius,1),material:new THREE.MeshStandardMaterial({color:v.color,emissive:v.color,emissiveIntensity:.4})}]));
  const meshes=new Map(),cables=new Map(),cableMaterial=new THREE.LineBasicMaterial({color:0x95a6b8});let disposed=false;
  return {sync(snapshot){
    if(disposed)return;const alive=new Set(snapshot.projectiles.map(p=>p.id));
    for(const [id,mesh] of meshes)if(!alive.has(id)){group.remove(mesh);meshes.delete(id);const cable=cables.get(id);if(cable){group.remove(cable);cable.geometry.dispose();cables.delete(id);}}
    for(const p of snapshot.projectiles){if(!meshes.has(p.id)){const asset=assets[p.variant];const mesh=new THREE.Mesh(asset.geometry,asset.material);group.add(mesh);meshes.set(p.id,mesh);if(p.variant==='aoe_zone')mesh.rotation.x=-Math.PI/2;
      if(p.variant==='hook_linear'){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const cable=new THREE.Line(geometry,cableMaterial);cables.set(p.id,cable);group.add(cable);}}meshes.get(p.id).position.set(p.position.x,p.variant==='aoe_zone'?.045:.6,p.position.z);
      if(cables.has(p.id)){const attribute=cables.get(p.id).geometry.attributes.position;attribute.setXYZ(0,p.origin.x,.6,p.origin.z);attribute.setXYZ(1,p.position.x,.6,p.position.z);attribute.needsUpdate=true;cables.get(p.id).geometry.computeBoundingSphere();}}
  },dispose(){if(disposed)return;disposed=true;for(const cable of cables.values()){group.remove(cable);cable.geometry.dispose();}cables.clear();cableMaterial.dispose();disposeObject(group);for(const asset of Object.values(assets)){if(![...meshes.values()].some(mesh=>mesh.geometry===asset.geometry)){asset.geometry.dispose();asset.material.dispose();}}meshes.clear();}};
}
