export const SETTINGS_KEY = 'moba-training:camera:v1';
export const DEFAULT_CAMERA_SETTINGS = Object.freeze({edgePanEnabled:true,edgePanSpeed:1});
export function normalizeCameraSettings(value) {
  return Object.freeze({edgePanEnabled:typeof value?.edgePanEnabled==='boolean'?value.edgePanEnabled:true,
    edgePanSpeed:typeof value?.edgePanSpeed==='number' && Number.isFinite(value.edgePanSpeed)?Math.max(0.5,Math.min(2,value.edgePanSpeed)):1});
}
export function loadCameraSettings(storage) {
  try {return normalizeCameraSettings(JSON.parse(storage.getItem(SETTINGS_KEY)));} catch {return DEFAULT_CAMERA_SETTINGS;}
}
export function saveCameraSettings(storage,value) {
  const result = normalizeCameraSettings(value); storage.setItem(SETTINGS_KEY,JSON.stringify(result)); return result;
}
