import * as THREE from 'three';
import { DODGE_ARENA } from './spatial.js';
import { cloneModel } from './sceneAssets.js';
import { disposeObject } from './resources.js';
/** Independent layout and materials: no change to the kiting arena. */
export function createDodgeArena({quality='alto'}={}){
 const group=new THREE.Group(),textures=[],art=new THREE.Group();group.name='Dodge arena 36 × 28';group.add(art);let disposed=false,upgraded=false;
 const stone=new THREE.MeshStandardMaterial({color:0x51656b,roughness:.92}),trim=new THREE.MeshStandardMaterial({color:0x8d9e94,metalness:.35,roughness:.65}),gold=new THREE.MeshStandardMaterial({color:0xa69b71,metalness:.6,roughness:.5}),ground=new THREE.MeshStandardMaterial({color:0x254039,roughness:1}),water=new THREE.MeshStandardMaterial({color:0x173d4a,metalness:.25,roughness:.35});
 function mesh(geometry,material,x=0,y=0,z=0,parent=group){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=quality!=='leve';m.raycast=()=>{};parent.add(m);return m;}
 function plane(w,h,material,x=0,y=0,z=0,parent=group){const m=mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,parent);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
 plane(60,52,ground,0,-.1);const floor=plane(DODGE_ARENA.width+.8,DODGE_ARENA.length+.8,stone,0,-.025);
 for(const side of [-1,1]){
  plane(3.4,42,water,side*23,-.07);mesh(new THREE.BoxGeometry(.5,.28,29.5),trim,side*18.8,.05);
  mesh(new THREE.BoxGeometry(38,.28,.5),trim,0,.05,side*14.8);
  plane(.045,27.8,gold,side*17.9,.006);plane(35.8,.045,gold,0,.006,side*13.9);
 }
 for(const radius of [3.8,4.05]){const m=mesh(new THREE.RingGeometry(radius,radius+.025,96),gold,0,.009);m.rotation.x=-Math.PI/2;m.castShadow=false;}
 // Keep the center uncluttered so the player and telegraphs remain distinct.
 function place(template,height,x,z,angle=0){if(!template)return;const model=cloneModel(template),box=new THREE.Box3().setFromObject(model),s=height/Math.max(.1,box.max.y-box.min.y);model.scale.setScalar(s);model.position.set(x,-box.min.y*s,z);model.rotation.y=angle;art.add(model);}
 return {group,applyAssets(assets){if(disposed||upgraded)return;upgraded=true;
  if(assets.stone){const map=assets.stone.clone();map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(5,4);map.anisotropy=quality==='leve'?2:4;map.needsUpdate=true;textures.push(map);floor.material.dispose();floor.material=new THREE.MeshStandardMaterial({map,bumpMap:quality==='leve'?null:map,bumpScale:.065,color:0xc5ced0,roughness:.91});}
  for(const side of [-1,1]){
   for(const z of [-10,0,10]){place(assets.pillar,3.4,side*20,z);place(assets.banner,2.8,side*20,z+.6,side*Math.PI/2);}
   for(const x of [-13,-6,6,13])place(assets.barrier,1.15,x,side*16,0);
   for(const z of [-6,6])place(assets.barrier,1.15,side*20,z,Math.PI/2);
   for(const x of [-14,14])place(assets.torch,2.1,x,side*16.6);
   place(assets.pillar,5.2,0,side*18);
   if(quality!=='leve')for(const x of [-25,25])for(const z of [-16,16])place(assets.rubble,1.8,x,z,side*.7);
  }
  if(assets.canopy){const map=assets.canopy.clone();map.colorSpace=THREE.SRGBColorSpace;map.needsUpdate=true;textures.push(map);const material=new THREE.MeshStandardMaterial({map,alphaTest:.4,side:THREE.DoubleSide,color:0xa4bbb1,roughness:1}),trees=new THREE.InstancedMesh(new THREE.PlaneGeometry(8,8),material,36),dummy=new THREE.Object3D();let index=0;
   for(const side of [-1,1]){for(let i=0;i<12;i++){dummy.position.set(-29+i*5.2,3.7,side*(23+(i%3)*.65));dummy.rotation.set(-Math.PI/2,0,i*.83);dummy.scale.setScalar(.9+(i%4)*.06);dummy.updateMatrix();trees.setMatrixAt(index++,dummy.matrix);}for(let i=0;i<6;i++){dummy.position.set(side*29,3.5,-14+i*5.4);dummy.rotation.set(-Math.PI/2,0,i);dummy.scale.setScalar(1);dummy.updateMatrix();trees.setMatrixAt(index++,dummy.matrix);}}trees.castShadow=trees.receiveShadow=quality!=='leve';trees.computeBoundingSphere();group.add(trees);
  }
 },update(){},dispose(){if(disposed)return;disposed=true;disposeObject(group);for(const texture of textures)texture.dispose();}};
}
