import * as THREE from 'three';
/** The clickable sphere is the logical visual size; decorative rings are not hitboxes. */
export function createPrecisionVisuals(scene,camera,exercise){
 const group=new THREE.Group();scene.add(group);const meshes=new Map(),labels=new Map(),geometry=new THREE.SphereGeometry(1,20,12),material=new THREE.MeshStandardMaterial({color:0x8de7ed,emissive:0x174e68,emissiveIntensity:.8,roughness:.35});const lateMaterial=material.clone();lateMaterial.color.setHex(0xffb967);lateMaterial.emissive.setHex(0x7a3617);let disposed=false;
 function bounds(target){
   const points=[];
   for(const x of [target.minX,target.maxX])for(const z of [target.minZ??target.position.z,target.maxZ??target.position.z])for(const [dx,dy,dz]of [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]]){
     const p=new THREE.Vector3(x+dx*target.radius,1+dy*target.radius,z+dz*target.radius).project(camera);points.push(p);
   }
   if(points.some(p=>p.z< -1||p.z>1||Math.abs(p.x)>.92||p.y>.5||p.y<-.78))return null;
   return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.max(...points.map(p=>p.y)),bottom:Math.min(...points.map(p=>p.y))};
 }
 exercise.setProjectionValidator((candidate,active)=>{
   camera.updateMatrixWorld();scene.updateMatrixWorld(true);const box=bounds(candidate);if(!box)return false;
   const center=new THREE.Vector3(candidate.position.x,1,candidate.position.z),projected=center.clone().project(camera),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(projected.x,projected.y),camera);ray.far=Math.max(0,camera.position.distanceTo(center)-candidate.radius);
   if(ray.intersectObjects(scene.children,true).some(hit=>!hit.object.userData.targetId&&!hit.object.userData.precisionLabel))return false;
   return active.every(target=>{const other=bounds(target);return !other||box.right+.04<other.left||box.left-.04>other.right||box.top+.04<other.bottom||box.bottom-.04>other.top;});
 });
 const labelTextures=new Map(),doc=globalThis.document;function numberSprite(number){if(!doc?.defaultView?.CanvasRenderingContext2D)return null;if(!labelTextures.has(number)){const c=doc.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#12232f';ctx.beginPath();ctx.arc(64,64,54,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e3f6ff';ctx.lineWidth=5;ctx.stroke();ctx.font='bold 76px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(String(number),64,68);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;labelTextures.set(number,texture);}const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTextures.get(number),depthTest:false,depthWrite:false}));sprite.scale.set(.85,.85,1);sprite.renderOrder=10;sprite.userData.precisionLabel=true;sprite.raycast=()=>{};return sprite;}
 const nextMaterial=material.clone();nextMaterial.color.setHex(0xb5ff78);nextMaterial.emissive.setHex(0x387a20);
 return {sync(snapshot){if(disposed)return;const ids=new Set(snapshot.targets.map(t=>t.id));for(const [id,mesh]of meshes)if(!ids.has(id)){group.remove(mesh);meshes.delete(id);const label=labels.get(id);if(label){label.removeFromParent();label.material.dispose();labels.delete(id);}}
   for(const target of snapshot.targets){if(!meshes.has(target.id)){const mesh=new THREE.Mesh(geometry,material);mesh.userData.targetId=target.id;group.add(mesh);meshes.set(target.id,mesh);}const mesh=meshes.get(target.id);mesh.position.set(target.position.x,1,target.position.z);mesh.scale.setScalar(target.radius);mesh.material=snapshot.nextTargetId===target.id?nextMaterial:target.overdue?lateMaterial:material;if(snapshot.priority&&!labels.has(target.id)){const label=numberSprite(target.order);if(label){labels.set(target.id,label);group.add(label);}}const label=labels.get(target.id);if(label)label.position.set(target.position.x,1+target.radius+.65,target.position.z);}
 },acceptHit(raycaster,hit){scene.updateMatrixWorld(true);return raycaster.intersectObjects(scene.children,true)[0]?.object===hit.object;},clickTargets(){group.updateMatrixWorld(true);return [...meshes.values()];},dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.clear();meshes.clear();for(const label of labels.values())label.material.dispose();labels.clear();for(const texture of labelTextures.values())texture.dispose();labelTextures.clear();geometry.dispose();material.dispose();lateMaterial.dispose();nextMaterial.dispose();}};
}
