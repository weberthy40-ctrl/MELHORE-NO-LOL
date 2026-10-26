import * as THREE from 'three';
import { ARENA,isInsideArena } from './spatial.js';
import { createAnimatedModel } from './sceneAssets.js';
import { disposeObject } from './resources.js';
/** Original articulated sentinel; geometry is cosmetic and does not define the collision radius. */
export function createCharacter({position=ARENA.center,rotation=0,scale=1,reducedMotion=false,enemy=false,caster=false,ranged=false}={}){
 if(!isInsideArena(position)||!Number.isFinite(rotation)||!Number.isFinite(scale)||scale<=0)throw new TypeError('Invalid character pose.');
 const group=new THREE.Group(),limbs=[];group.userData.ranged=ranged;
 const armor=new THREE.MeshStandardMaterial({color:enemy?0x953e6f:0xced9ce,metalness:.45,roughness:.38});
 const cloth=new THREE.MeshStandardMaterial({color:enemy?0x44203f:0x164d59,roughness:.85,side:THREE.DoubleSide});
 const dark=new THREE.MeshStandardMaterial({color:0x202c33,roughness:.7});
 const gold=new THREE.MeshStandardMaterial({color:0xe4b568,metalness:.65,roughness:.3});
 const glow=new THREE.MeshStandardMaterial({color:enemy?0xff7bc6:0x83f5dc,emissive:enemy?0xb02860:0x187e6a,emissiveIntensity:1.5});
 function part(geometry,material,x,y,z){
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.updateMatrix();const rest=mesh.matrix.clone(),proxy=new THREE.Mesh(geometry,material);
  mesh.raycast=(raycaster,hits)=>{proxy.matrixWorld.multiplyMatrices(group.matrixWorld,rest);const start=hits.length;THREE.Mesh.prototype.raycast.call(proxy,raycaster,hits);for(let i=start;i<hits.length;i++)hits[i].object=mesh;};
  mesh.userData.rest=rest;group.add(mesh);return mesh;
 }
 const sphere=(r,sx,sy,sz,mat,x,y,z)=>{const p=part(new THREE.SphereGeometry(r,20,12),mat,x,y,z);p.scale.set(sx,sy,sz);p.updateMatrix();return p;};
 for(const side of [-1,1]){
  const leg=part(new THREE.CapsuleGeometry(.17,.53,5,12),dark,side*.23,.52,0);limbs.push({mesh:leg,side,arm:false});
  sphere(.22,1,1.1,1.4,armor,side*.23,.2,.1);
  const arm=part(new THREE.CapsuleGeometry(.17,.4,5,12),armor,side*.59,1.35,0);limbs.push({mesh:arm,side,arm:true});
  sphere(.3,1.25,.8,1,armor,side*.57,1.68,0);sphere(.16,1,1,1,gold,side*.57,1.79,.03);
 }
 sphere(.5,1,1.2,.65,armor,0,1.36,0);
 part(new THREE.CylinderGeometry(.45,.4,.15,20),gold,0,.91,0);
 sphere(.31,1,1.2,.95,armor,0,2.04,0);
 sphere(.22,1,.23,.45,glow,0,2.08,.27);
 part(new THREE.ConeGeometry(.15,.4,8),gold,0,2.48,-.03);
 const cape=part(new THREE.CylinderGeometry(.37,.65,1.15,20,1,true,0,Math.PI),cloth,0,1.14,-.2);cape.rotation.y=Math.PI;
 const sword=part(new THREE.CylinderGeometry(.065,.09,1.2,8),gold,.8,1.2,.3);sword.rotation.x=Math.PI/3;
 part(new THREE.SphereGeometry(.15,12,8),glow,.8,1.7,.6);
 const shield=sphere(.4,1,.95,.24,cloth,-.76,1.1,.23);shield.rotation.y=-.3;
 sphere(.15,1,1,.3,gold,-.76,1.1,.34);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.47,.53,48),new THREE.MeshBasicMaterial({color:enemy?0xff709f:0x69e9cc,transparent:true,opacity:.7,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;ring.raycast=()=>{};group.add(ring);
 for(const child of group.children){if(child.userData.rest){child.updateMatrix();child.userData.rest.copy(child.matrix);}}
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.7,32),new THREE.MeshBasicMaterial({color:0x08100d,transparent:true,opacity:.24,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;shadow.raycast=()=>{};group.add(shadow);
 const pixels=new Uint8Array(64*8*4);for(let y=0;y<8;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,border=y===0||y===7||x===0||x===63||x%8===0;pixels[i]=border?14:enemy?237:104;pixels[i+1]=border?24:enemy?85:223;pixels[i+2]=border?21:enemy?126:79;pixels[i+3]=255;}
 const barTexture=new THREE.DataTexture(pixels,64,8);barTexture.needsUpdate=true;barTexture.magFilter=THREE.NearestFilter;
 const health=new THREE.Sprite(new THREE.SpriteMaterial({map:barTexture,depthTest:false}));health.position.set(0,2.95,0);health.scale.set(1.5,.18,1);health.raycast=()=>{};group.add(health);health.visible=!caster;
 if(caster){const staff=new THREE.Mesh(new THREE.CylinderGeometry(.055,.08,2.5,12),gold.clone()),gem=new THREE.Mesh(new THREE.IcosahedronGeometry(.26,1),glow.clone());staff.position.set(.85,1.2,.3);gem.position.set(.85,2.55,.3);staff.castShadow=true;group.add(staff,gem);}
 let disposed=false,phase=0,animated=null;
 function setPose({x,z},angle=group.rotation.y){if(![x,z,angle].every(Number.isFinite))throw new TypeError('Invalid visual pose.');group.position.set(x,ARENA.groundY,z);group.rotation.y=angle;}
 setPose(position,rotation);group.scale.setScalar(scale);
 return {group,setPose,setAccent(hex){const color=new THREE.Color(hex);group.traverse(node=>{if(!node.isMesh||!node.material?.color)return;const m=node.material;if(!m.userData.baseTint)m.userData.baseTint=m.color.clone();m.color.copy(m.userData.baseTint).lerp(color,.38);});ring.material.color.copy(color);},setHealth(ratio){health.scale.x=1.5*Math.max(.02,Math.min(1,Number.isFinite(ratio)?ratio:1));},applyAssets(assets){
  if(disposed||animated)return;const nextModel=createAnimatedModel(ranged?assets.ranger:enemy?assets.knight:assets.ranger,{enemy,caster,ranged});const original=new THREE.Group();for(const child of [...group.children])if(child.userData.rest){group.remove(child);original.add(child);}disposeObject(original);limbs.length=0;
  animated=nextModel;group.add(animated.root);
  const proxy=new THREE.Mesh(new THREE.CapsuleGeometry(.55,1.35,4,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));proxy.position.y=1.25;proxy.userData.rest=true;group.add(proxy);group.userData.model=enemy&&!ranged?'knight':'ranger';
 },animate({moving=false,attackPhase,state='running'}={},delta=0){
  if(disposed||state==='paused'||delta<=0&&['running','countdown'].includes(state))return;
  if(reducedMotion||!['running','countdown'].includes(state)){for(const limb of limbs)limb.mesh.rotation.x=0;return;}
  if(animated){animated.update({moving,attackPhase,reducedMotion},delta);return;}
  phase+=Math.min(.1,Math.max(0,delta))*13;
  for(const limb of limbs)limb.mesh.rotation.x=(moving?Math.sin(phase)*.44*limb.side*(limb.arm?-1:1):0)+(limb.arm?(attackPhase==='windup'?-.75:attackPhase==='recovery'?.25:0):0);
 },dispose(){if(disposed)return;disposed=true;animated?.dispose();disposeObject(group);barTexture.dispose();limbs.length=0;}};
}
