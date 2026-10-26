import * as THREE from 'three';
/** The clickable sphere is the logical visual size; decorative rings are not hitboxes. */
export function createPrecisionVisuals(scene,camera,exercise){
 const group=new THREE.Group();scene.add(group);const meshes=new Map(),geometry=new THREE.SphereGeometry(1,20,12),material=new THREE.MeshStandardMaterial({color:0x8de7ed,emissive:0x174e68,emissiveIntensity:.8,roughness:.35});let disposed=false;
 function bounds(target){
   const points=[];
   for(const x of [target.minX,target.maxX])for(const [dx,dy,dz]of [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]]){
     const p=new THREE.Vector3(x+dx*target.radius,1+dy*target.radius,target.position.z+dz*target.radius).project(camera);points.push(p);
   }
   if(points.some(p=>p.z< -1||p.z>1||Math.abs(p.x)>.92||Math.abs(p.y)>.82))return null;
   return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.max(...points.map(p=>p.y)),bottom:Math.min(...points.map(p=>p.y))};
 }
 exercise.setProjectionValidator((candidate,active)=>{
   camera.updateMatrixWorld();scene.updateMatrixWorld(true);const box=bounds(candidate);if(!box)return false;
   const center=new THREE.Vector3(candidate.position.x,1,candidate.position.z),projected=center.clone().project(camera),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(projected.x,projected.y),camera);ray.far=Math.max(0,camera.position.distanceTo(center)-candidate.radius);
   if(ray.intersectObjects(scene.children,true).length)return false;
   return active.every(target=>{const other=bounds(target);return !other||box.right+.04<other.left||box.left-.04>other.right||box.top+.04<other.bottom||box.bottom-.04>other.top;});
 });
 return {sync(snapshot){if(disposed)return;const ids=new Set(snapshot.targets.map(t=>t.id));for(const [id,mesh]of meshes)if(!ids.has(id)){group.remove(mesh);meshes.delete(id);}
   for(const target of snapshot.targets){if(!meshes.has(target.id)){const mesh=new THREE.Mesh(geometry,material);mesh.userData.targetId=target.id;group.add(mesh);meshes.set(target.id,mesh);}const mesh=meshes.get(target.id);mesh.position.set(target.position.x,1,target.position.z);mesh.scale.setScalar(target.radius);}
 },acceptHit(raycaster,hit){scene.updateMatrixWorld(true);return raycaster.intersectObjects(scene.children,true)[0]?.object===hit.object;},clickTargets(){group.updateMatrixWorld(true);return [...meshes.values()];},dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.clear();meshes.clear();geometry.dispose();material.dispose();}};
}
