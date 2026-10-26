import * as THREE from 'three';
/** Original dummy and cosmetic rings. Only the body participates in selection raycasts. */
export function createKitingVisuals(scene){
 const group=new THREE.Group();scene.add(group);const geometry=new THREE.CapsuleGeometry(.65,.9,4,12),material=new THREE.MeshStandardMaterial({color:0x72bfd0,emissive:0x12455c,roughness:.65});
 const body=new THREE.Mesh(geometry,material);body.userData.targetId='kiting-target';group.add(body);
 const selectGeometry=new THREE.RingGeometry(.8,.87,48),selectMaterial=new THREE.MeshBasicMaterial({color:0x9ce8ff,side:THREE.DoubleSide,transparent:true,opacity:.85}),selection=new THREE.Mesh(selectGeometry,selectMaterial);selection.rotation.x=-Math.PI/2;selection.visible=false;group.add(selection);
 const rangeGeometry=new THREE.RingGeometry(.99,1.01,64),rangeMaterial=new THREE.MeshBasicMaterial({color:0x9ce8ff,side:THREE.DoubleSide,transparent:true,opacity:.6}),range=new THREE.Mesh(rangeGeometry,rangeMaterial);range.rotation.x=-Math.PI/2;range.visible=false;group.add(range);let disposed=false;
 // Cosmetic surfaces cannot intercept a ray toward the dummy or terrain.
 selection.raycast=range.raycast=()=>{};
 return {sync(snapshot,player={x:0,z:0}){if(disposed)return;const t=snapshot.target.position;body.position.set(t.x,1.1,t.z);selection.position.set(t.x,.025,t.z);selection.visible=snapshot.selected;range.position.set(player.x,.03,player.z);range.scale.setScalar(snapshot.config.attackRange);material.emissiveIntensity=snapshot.lastAction==='Ataque confirmado'?2:.6;},setRangeVisible(value){range.visible=Boolean(value)&&!disposed;},clickTargets(){group.updateMatrixWorld(true);return [body];},acceptHit(raycaster,hit){scene.updateMatrixWorld(true);return raycaster.intersectObjects(scene.children,true)[0]?.object===hit.object;},dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.clear();geometry.dispose();material.dispose();selectGeometry.dispose();selectMaterial.dispose();rangeGeometry.dispose();rangeMaterial.dispose();}};
}
