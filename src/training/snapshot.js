export function readonlySnapshot(data) {
  const copy=structuredClone(data);
  function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  return freeze(copy);
}
