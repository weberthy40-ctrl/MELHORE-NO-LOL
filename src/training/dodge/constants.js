export const MAX_DODGE_LEVEL=20;
export const DODGE_RULESET='dodge-v10';
export const isUnlimitedDodge=version=>['dodge-v7','dodge-v8','dodge-v9',DODGE_RULESET].includes(version);
export const dodgeLevelLimit=version=>[DODGE_RULESET,'dodge-v9','dodge-v8'].includes(version)?MAX_DODGE_LEVEL:10;
