import { it,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAnimatedModel } from '../../src/game3d/sceneAssets.js';
import { disposeObject } from '../../src/game3d/resources.js';
it('keeps the real knight within its world pose through running, idle and direction changes without animated self-shadowing',async()=>{
 const bytes=await readFile(new URL('../../public/assets/kaykit/knight.glb',import.meta.url)),length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length).toString());
 // Geometry, skin and animation remain the shipped asset; image decoding is unnecessary here.
 gltf.images=[];gltf.textures=[];for(const m of gltf.materials){for(const key of ['normalTexture','occlusionTexture','emissiveTexture'])delete m[key];delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture;}
 const json=Buffer.from(JSON.stringify(gltf).padEnd(Math.ceil(Buffer.byteLength(JSON.stringify(gltf))/4)*4,' ')),binary=bytes.subarray(20+length),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+json.length+binary.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);const data=Buffer.concat([header,json,binary]),buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),asset=await new GLTFLoader().parseAsync(buffer,''),model=createAnimatedModel(asset,{dodge:true});
 for(let n=0;n<120;n++){
  model.update({moving:n%30<25},1/60);model.root.rotation.y=n*.07;model.root.updateMatrixWorld(true);const bounds=new THREE.Box3();model.root.traverse(mesh=>{if(!mesh.isMesh||!mesh.visible)return;if(mesh.isSkinnedMesh){mesh.skeleton.update();mesh.computeBoundingBox();}bounds.expandByObject(mesh,true);expect(mesh.frustumCulled).toBe(false);expect(mesh.receiveShadow).toBe(false);});
  expect(bounds.min.y).toBeGreaterThan(-.6);expect(bounds.max.y).toBeLessThan(5);expect(bounds.getSize(new THREE.Vector3()).y).toBeGreaterThan(2);expect(bounds.getCenter(new THREE.Vector3()).length()).toBeLessThan(4);
 }
 model.dispose();disposeObject(model.root);disposeObject(asset.scene);
});
