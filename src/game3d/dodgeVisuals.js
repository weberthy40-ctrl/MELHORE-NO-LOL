import * as THREE from 'three';
import { VARIANTS } from '../training/dodge/projectiles.js';
export function createDodgeVisuals(scene){
 const group=new THREE.Group();scene.add(group);const owned=new Set(),active=new Map();let disposed=false;
 const own=resource=>{owned.add(resource);return resource;};
 const assets=Object.fromEntries(Object.entries(VARIANTS).map(([id,v])=>[id,{
  geometry:own(id==='aoe_zone'?new THREE.CircleGeometry(v.radius,64):id==='hook_linear'?new THREE.TorusGeometry(v.radius*.7,v.radius*.28,8,16,Math.PI*1.6):new THREE.SphereGeometry(v.radius,16,10)),
  material:own(new THREE.MeshStandardMaterial({color:v.color,emissive:v.color,emissiveIntensity:id==='aoe_zone'?.8:1.2,transparent:id==='aoe_zone',opacity:id==='aoe_zone'?.24:1,side:THREE.DoubleSide})),
  glow:own(new THREE.MeshBasicMaterial({color:v.color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false})),
 }]));
 const portalGeometry=own(new THREE.RingGeometry(.45,.58,40)),areaEdge=own(new THREE.RingGeometry(VARIANTS.aoe_zone.radius-.08,VARIANTS.aoe_zone.radius,64)),cableMaterial=own(new THREE.LineBasicMaterial({color:0x9ac7da}));
 function remove(id){const e=active.get(id);if(!e)return;e.root.removeFromParent();e.cable?.geometry.dispose();active.delete(id);}
 return {sync(snapshot){
  if(disposed)return;const live=new Set(snapshot.projectiles.map(p=>p.id));for(const id of active.keys())if(!live.has(id))remove(id);
  for(const p of snapshot.projectiles){
   if(!active.has(p.id)){
    const asset=assets[p.variant],root=new THREE.Group(),body=new THREE.Mesh(asset.geometry,asset.material),portal=new THREE.Mesh(portalGeometry,asset.glow);root.add(body,portal);portal.rotation.x=-Math.PI/2;portal.position.set(p.origin.x,.055,p.origin.z);portal.raycast=body.raycast=()=>{};
    let edge,cable;if(p.variant==='aoe_zone'){body.rotation.x=-Math.PI/2;edge=new THREE.Mesh(areaEdge,asset.glow);edge.rotation.x=-Math.PI/2;edge.position.set(p.origin.x,.065,p.origin.z);edge.raycast=()=>{};root.add(edge);}
    if(p.variant==='hook_linear'){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));cable=new THREE.Line(geometry,cableMaterial);cable.raycast=()=>{};root.add(cable);}
    group.add(root);active.set(p.id,{root,body,portal,edge,cable});
   }
   const e=active.get(p.id);e.body.position.set(p.position.x,p.variant==='aoe_zone'?.05:.65,p.position.z);e.portal.visible=p.age<.35;e.portal.scale.setScalar(1+p.age*1.8);
   if(p.variant==='fast'){e.body.scale.set(1,1,2.4);e.body.rotation.y=Math.atan2(p.direction.x,p.direction.z);}
   if(e.edge)e.edge.scale.setScalar(1+Math.sin(p.age*6)*.02);
   if(e.cable){const a=e.cable.geometry.attributes.position;a.setXYZ(0,p.origin.x,.65,p.origin.z);a.setXYZ(1,p.position.x,.65,p.position.z);a.needsUpdate=true;e.cable.geometry.computeBoundingSphere();}
  }
 },dispose(){if(disposed)return;disposed=true;for(const id of active.keys())remove(id);group.removeFromParent();group.clear();for(const resource of owned)resource.dispose();owned.clear();}};
}
