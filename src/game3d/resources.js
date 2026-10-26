/** Dispose each owned GPU resource once, including shared materials/geometries. */
export function disposeObject(group) {
  const resources = new Set();
  group.traverse(node => {
    if (node.isInstancedMesh) resources.add(node);
    if (node.geometry) resources.add(node.geometry);
    if (node.material) for (const material of [node.material].flat()) resources.add(material);
  });
  for (const resource of resources) resource.dispose();
  group.removeFromParent(); group.clear();
}
