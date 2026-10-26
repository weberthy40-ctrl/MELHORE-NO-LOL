import * as THREE from 'three';
import { VARIANTS } from '../training/dodge/projectiles.js';
const COLORS={fast:0xffd64f,hook_linear:0x44edff,slow:0xff65ce,aoe_zone:0xd49bff};
// The translucent halo has a minimum screen size; the bright core keeps the logical radius.
export function projectileHaloSize(radius,depth,fov,viewportHeight){
 const pixel=2*Math.max(.1,depth)*Math.tan(fov*Math.PI/360)/Math.max(1,viewportHeight);
 return Math.max(radius*4,pixel*26);
}
export function createDodgeVisuals(scene,{camera,container}={}){
 const group=new THREE.Group();scene.add(group);const owned=new Set(),active=new Map();let disposed=false;
 const own=r=>{owned.add(r);return r;};
 const pixels=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const r=Math.hypot(x-31.5,y-31.5)/31.5,i=(y*64+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(Math.max(0,1-r)**2*190);}
 const haloMap=own(new THREE.DataTexture(pixels,64,64));haloMap.needsUpdate=true;
 const basic=(color,opacity=1)=>own(new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false}));
 const dark=basic(0x08101d),white=basic(0xfff9e8),assets=Object.fromEntries(Object.entries(VARIANTS).map(([id,v])=>[id,{
  geometry:own(id==='aoe_zone'?new THREE.CircleGeometry(v.radius,64):id==='hook_linear'?new THREE.TorusGeometry(v.radius*.7,v.radius*.4,8,20,Math.PI*1.6):new THREE.SphereGeometry(v.radius,16,10)),
  material:basic(COLORS[id],id==='aoe_zone'?.28:1),glow:basic(COLORS[id],.85),trail:basic(COLORS[id],.72),
  halo:own(new THREE.SpriteMaterial({color:COLORS[id],map:haloMap,transparent:true,opacity:.8,depthTest:false,depthWrite:false,toneMapped:false})),
 }]));
 const portalGeometry=own(new THREE.RingGeometry(.45,.58,40)),areaEdge=own(new THREE.RingGeometry(1.93,2,64)),trailGeometry=own(new THREE.CylinderGeometry(.015,.12,1,8)),coreGeometry=own(new THREE.SphereGeometry(1,12,8)),cableMaterial=own(new THREE.LineBasicMaterial({color:0xb4f6ff,transparent:true,opacity:.9,toneMapped:false,depthTest:false,depthWrite:false}));
 const yAxis=new THREE.Vector3(0,1,0),viewPoint=new THREE.Vector3();
 function remove(id){const e=active.get(id);if(!e)return;e.root.removeFromParent();e.cable?.geometry.dispose();active.delete(id);}
 function mesh(geometry,material,order){const m=new THREE.Mesh(geometry,material);m.renderOrder=order;m.raycast=()=>{};return m;}
 return {sync(snapshot){
  if(disposed)return;const live=new Set(snapshot.projectiles.map(p=>p.id));for(const id of active.keys())if(!live.has(id))remove(id);
  for(const p of snapshot.projectiles){
   const isArea=p.variant==='aoe_zone';
   if(!active.has(p.id)){
    const asset=assets[p.variant],root=new THREE.Group(),body=mesh(asset.geometry,asset.material,isArea?102:118),portal=mesh(portalGeometry,asset.glow,101);root.add(body,portal);portal.rotation.x=-Math.PI/2;portal.position.set(p.origin.x,.055,p.origin.z);
    let edge,cable,outline,core,halo,trail;
    if(isArea){body.rotation.x=-Math.PI/2;edge=mesh(areaEdge,asset.glow,103);edge.rotation.x=-Math.PI/2;edge.position.set(p.origin.x,.065,p.origin.z);root.add(edge);}
    else{
     outline=mesh(asset.geometry,dark,117);core=mesh(coreGeometry,white,119);halo=new THREE.Sprite(asset.halo);halo.renderOrder=110;halo.raycast=()=>{};trail=mesh(trailGeometry,asset.trail,115);root.add(outline,core,halo,trail);
    }
    if(p.variant==='hook_linear'){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));cable=new THREE.Line(geometry,cableMaterial);cable.renderOrder=109;cable.raycast=()=>{};root.add(cable);}
    group.add(root);active.set(p.id,{root,body,portal,edge,cable,outline,core,halo,trail});
   }
   const e=active.get(p.id);e.body.position.set(p.position.x,isArea?.05:.95,p.position.z);e.portal.visible=p.age<.35;e.portal.scale.setScalar(1+p.age*1.8);
   if(p.variant==='fast'){e.body.scale.set(1,1,2.4);e.body.rotation.y=Math.atan2(p.direction.x,p.direction.z);}
   if(!isArea){
    e.outline.position.copy(e.body.position);e.outline.rotation.copy(e.body.rotation);e.outline.scale.copy(e.body.scale).multiplyScalar(1.4);
    e.core.position.copy(e.body.position);e.core.scale.setScalar(p.radius*.48);e.halo.position.copy(e.body.position);
    const depth=camera?-viewPoint.copy(e.body.position).applyMatrix4(camera.matrixWorldInverse).z:24,size=projectileHaloSize(p.radius,depth,camera?.fov??44,container?.clientHeight??768);e.halo.scale.set(size,size,1);
    const length=Math.min(p.distance??0,Math.max(1,p.speed*.08));e.trail.visible=length>.02;e.trail.position.set(p.position.x-p.direction.x*length/2,.95,p.position.z-p.direction.z*length/2);e.trail.scale.y=length;e.trail.quaternion.setFromUnitVectors(yAxis,new THREE.Vector3(p.direction.x,0,p.direction.z));
   }
   if(e.cable){const a=e.cable.geometry.attributes.position;a.setXYZ(0,p.origin.x,.95,p.origin.z);a.setXYZ(1,p.position.x,.95,p.position.z);a.needsUpdate=true;e.cable.geometry.computeBoundingSphere();}
  }
 },dispose(){if(disposed)return;disposed=true;for(const id of active.keys())remove(id);group.removeFromParent();group.clear();for(const resource of owned)resource.dispose();owned.clear();}};
}
