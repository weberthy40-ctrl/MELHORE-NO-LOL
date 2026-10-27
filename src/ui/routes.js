export const MODALITIES = Object.freeze([
  Object.freeze({ id: 'dodge', title: 'Esquiva', description: 'Leia ameaças e encontre espaço para reagir.', icon: '→' }),
  Object.freeze({ id: 'precision', title: 'Precisão de clique', description: 'Transforme intenção em cliques precisos.', icon: '◎' }),
  Object.freeze({ id: 'kiting', title: 'Kiting', description: 'Encontre o ritmo entre atacar e movimentar.', icon: '◇' }),
  Object.freeze({ id: 'reflex', title: 'Reflexos e reação', description: 'Responda aos sinais com atenção e controle.', icon: 'ϟ' }),
]);
export const NAVIGATION = Object.freeze([
  ['/', 'Início'], ['/diagnostics', 'Descubra seu nível'], ['/levels', 'Todos os níveis'],
  ['/dpi', 'DPI e sensibilidade'], ['/profile', 'Perfil'], ['/settings', 'Configurações'],
]);
export function resolveRoute(hash = '') {
  const path = hash.replace(/^#/, '') || '/';
  if (NAVIGATION.some(([route]) => route === path) || ['/practice/dodge','/preview','/demo','/dodge-tech','/history/dodge','/records/dodge','/evolution/dodge','/achievements/dodge','/assessment/dodge','/assessment/kiting','/history/kiting','/records/kiting','/evolution/kiting','/achievements/kiting','/assessment/reflex','/history/reflex','/records/reflex','/evolution/reflex','/achievements/reflex','/practice/reflex','/timed/reflex','/practice/kiting','/timed/kiting','/practice/precision','/timed/precision','/assessment/precision','/history/precision','/records/precision','/evolution/precision','/achievements/precision'].includes(path)) return { path };
  const reflex = /^\/timed\/reflex\/(10|[1-9])$/.exec(path);
  if(reflex)return {path,modality:'reflex',level:Number(reflex[1]),timed:true};
  const kiting = /^\/timed\/kiting\/(10|[1-9])$/.exec(path);
  if(kiting)return {path,modality:'kiting',level:Number(kiting[1]),timed:true};
  const precision = /^\/timed\/precision\/(10|[1-9])$/.exec(path);
  if(precision)return {path,modality:'precision',level:Number(precision[1]),timed:true};
  const play = /^\/play\/dodge\/(normal|survival)\/(10|[1-9])$/.exec(path);
  if(play)return {path,modality:'dodge',mode:play[1],level:Number(play[2])};
  const technical = /^\/dodge-tech\/(10|[1-9])$/.exec(path);
  if(technical)return {path,level:Number(technical[1])};
  const match = /^\/train\/([a-z]+)\/(10|[1-9])$/.exec(path);
  if (match && MODALITIES.some(({ id }) => id === match[1])) {
    return { path, modality: match[1], level: Number(match[2]) };
  }
  return { path: '/404' };
}
