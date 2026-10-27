export const MAX_DODGE_LEVEL=20;
export const DODGE_RULESET='dodge-v8';
export const isUnlimitedDodge=version=>['dodge-v7',DODGE_RULESET].includes(version);
export const dodgeLevelLimit=version=>version===DODGE_RULESET?MAX_DODGE_LEVEL:10;
