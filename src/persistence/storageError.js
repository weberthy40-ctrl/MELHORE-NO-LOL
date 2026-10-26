export class StorageError extends Error {constructor(message,code='STORAGE_ERROR'){super(message);this.name='StorageError';this.code=code;}}

export function assertRecordData(record){
  const ancestors=new WeakSet();
  function check(value,depth=0){if(depth>64)throw new StorageError('Dados muito profundos.','INVALID_RECORD');if(typeof value==='number'&&!Number.isFinite(value))throw new StorageError('Número inválido.','INVALID_RECORD');if(value&&typeof value==='object'){if(ancestors.has(value))throw new StorageError('Dados cíclicos.','INVALID_RECORD');ancestors.add(value);if(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype)throw new StorageError('Dados não serializáveis.','INVALID_RECORD');Object.values(value).forEach(item=>check(item,depth+1));ancestors.delete(value);}else if(!['number','string','boolean','object'].includes(typeof value))throw new StorageError('Dados não serializáveis.','INVALID_RECORD');}
  check(record);return record;
}
