import {expect,it} from 'vitest';
import {trainingAdvice} from '../../src/progression/trainingAdvice.js';
import {validateAttemptRecord,createAttemptRecord} from '../../src/persistence/attemptRecord.js';
import {calculateDodgeScore} from '../../src/training/dodge/score.js';
import {adviceRecord} from '../fixtures/adviceRecords.js';

const modalities=['dodge','precision','kiting','reflex'];
it('returns a safe, explicit first step without inventing evidence when no official attempt exists',()=>{
 for(const modality of modalities){
  const advice=trainingAdvice(modality);
  expect(advice).toMatchObject({status:'empty',path:`/assessment/${modality}`,action:'Fazer avaliação'});
  expect(advice.evidence).toContain('Ainda não há');expect(Object.isFrozen(advice)).toBe(true);
 }
 expect(()=>trainingAdvice('dpi')).toThrow(TypeError);
});
it('validates records and modality instead of presenting corrupt counters as coaching',()=>{
 for(const modality of modalities){
  const record=adviceRecord(modality),broken=structuredClone(record);broken.metrics.elapsedActiveSeconds=NaN;
  expect(trainingAdvice(modality,broken).status).toBe('invalid');
  expect(trainingAdvice(modality,{modality,score:{score:100}}).status).toBe('invalid');
 }
 expect(trainingAdvice('reflex',adviceRecord('precision')).status).toBe('invalid');
});
it('uses valid current contexts and keeps level without changing scores, records, or selected difficulty',()=>{
 for(const modality of modalities){
  const record=adviceRecord(modality,{level:7}),before=JSON.stringify(record);
  expect(validateAttemptRecord(record)).toBe(record);
  const advice=trainingAdvice(modality,record);
  expect(advice.status).toBe('ready');expect(advice.path).toBe(modality==='dodge'?'/train/dodge':`/timed/${modality}/7`);
  expect(advice.title).toBeTruthy();expect(advice.objective).toBeTruthy();expect(advice.evidence).toMatch(/\d/);
  expect(JSON.stringify(record)).toBe(before);expect(Object.isFrozen(advice)).toBe(true);
  expect(trainingAdvice(modality,record)).toEqual(advice);
 }
});
it('treats legacy exercises and calibration as baseline collection, preserving their valid historical records',()=>{
 const cases=[
  ['dodge',adviceRecord('dodge',{rulesetVersion:'dodge-v9'})],
  ['precision',adviceRecord('precision',{variant:'single-static'})],
  ['kiting',adviceRecord('kiting',{variant:'static'})],
  ['reflex',adviceRecord('reflex',{variant:'mixed'})],
 ];
 for(const [modality,record]of cases){
  const before=JSON.stringify(record);expect(validateAttemptRecord(record)).toBe(record);
  const advice=trainingAdvice(modality,record);expect(advice.status).toBe('legacy');expect(advice.evidence).toContain('continua no histórico');
  expect(advice.path).toBe(modality==='dodge'?'/train/dodge':`/assessment/${modality}`);expect(JSON.stringify(record)).toBe(before);
 }
 const mixed=structuredClone(adviceRecord('precision'));delete mixed.metrics.sequenceVersion;
 expect(trainingAdvice('precision',mixed).status).toBe('legacy');
});
it('requires both active duration and resolved non-immune threats for dodge advice',()=>{
 expect(trainingAdvice('dodge',adviceRecord('dodge',{elapsed:29.99,resolved:20})).status).toBe('insufficient');
 expect(trainingAdvice('dodge',adviceRecord('dodge',{elapsed:30,resolved:7})).status).toBe('insufficient');
 expect(trainingAdvice('dodge',adviceRecord('dodge',{elapsed:30,resolved:8})).status).toBe('ready');
 const original=adviceRecord('dodge',{elapsed:30,resolved:7}),metrics=structuredClone(original.metrics);
 metrics.contactsIgnored+=5;metrics.threatsQualified+=5;metrics.attacksEmitted+=5;metrics.buckets[0].ignored+=5;metrics.buckets[0].qualified+=5;
 const withProtection=createAttemptRecord(metrics,calculateDodgeScore(metrics));
 expect(trainingAdvice('dodge',withProtection).status).toBe('insufficient');
 const advice=trainingAdvice('dodge',adviceRecord('dodge'));
 expect(advice.evidence).toContain('18 ameaças evitadas e 2 impactos em 20 resoluções');
 expect(advice.objective).toContain('No próximo treino');expect(advice.objective).toContain('se houver no trecho');
 expect(trainingAdvice('dodge',adviceRecord('dodge',{hits:0})).title).toBe('Consolide a leitura dos avisos');
});
it('uses precision click floors and observed ordering mistakes without assuming optional counters are zero',()=>{
 expect(trainingAdvice('precision',adviceRecord('precision',{clicks:0})).status).toBe('insufficient');
 expect(trainingAdvice('precision',adviceRecord('precision',{clicks:19})).status).toBe('insufficient');
 expect(trainingAdvice('precision',adviceRecord('precision',{clicks:20})).status).toBe('ready');
 const ordered=adviceRecord('precision',{orderErrors:true,misses:0});expect(ordered.metrics.orderErrors).toBeGreaterThan(0);
 expect(trainingAdvice('precision',ordered).title).toBe('Confira a ordem antes de clicar');
 const advice=trainingAdvice('precision',adviceRecord('precision'));
 expect(advice.evidence).toContain('30 acertos e 2 cliques errados em 32 cliques elegíveis');
 const unknown=structuredClone(adviceRecord('precision',{misses:0}));delete unknown.metrics.orderErrors;delete unknown.metrics.expiredTargets;
 expect(validateAttemptRecord(unknown)).toBe(unknown);
 expect(trainingAdvice('precision',unknown).status).toBe('ready');
 expect(trainingAdvice('precision',unknown).evidence).not.toContain('ordem');expect(trainingAdvice('precision',unknown).evidence).not.toContain('prazo');
});
it('grounds kite suggestions in accepted preparations and treats short defeat as insufficient evidence',()=>{
 expect(trainingAdvice('kiting',adviceRecord('kiting',{accepted:0})).status).toBe('insufficient');
 expect(trainingAdvice('kiting',adviceRecord('kiting',{accepted:9})).status).toBe('insufficient');
 expect(trainingAdvice('kiting',adviceRecord('kiting',{accepted:10})).status).toBe('ready');
 const short=adviceRecord('kiting',{short:true,level:10});expect(short.endReason).toBe('defeat');expect(short.metrics.elapsedActiveSeconds).toBeLessThan(30);
 expect(trainingAdvice('kiting',short).status).toBe('insufficient');
 const advice=trainingAdvice('kiting',adviceRecord('kiting'));
 expect(advice.evidence).toContain('2 preparações canceladas entre 20 aceitas');expect(advice.evidence).toContain('pode ser uma escolha para evitar dano');
 expect(trainingAdvice('kiting',adviceRecord('kiting',{cancellations:0})).title).toBe('Intercale movimento e disparos');
});
it('uses presented reflex cues, distinguishes observed errors, and never turns sparse success into a diagnosis',()=>{
 expect(trainingAdvice('reflex',adviceRecord('reflex',{presented:11})).status).toBe('insufficient');
 expect(trainingAdvice('reflex',adviceRecord('reflex',{presented:12})).status).toBe('ready');
 const commissions=adviceRecord('reflex',{commissions:true});expect(commissions.metrics.summary.commissions).toBeGreaterThan(0);
 expect(trainingAdvice('reflex',commissions).title).toBe('Observe os sinais de não responder');
 const anticipation=adviceRecord('reflex',{anticipations:3});expect(anticipation.metrics.summary.anticipations).toBe(3);
 expect(trainingAdvice('reflex',anticipation).title).toBe('Espere o sinal aparecer');
 const omissions=adviceRecord('reflex',{omissions:true});expect(omissions.metrics.summary.omissions).toBeGreaterThan(0);
 expect(trainingAdvice('reflex',omissions).title).toBe('Complete a leitura de cada sinal');
 const wrong=adviceRecord('reflex',{wrong:true});expect(wrong.metrics.summary.wrong).toBeGreaterThan(0);
 expect(trainingAdvice('reflex',wrong).title).toBe('Associe o sinal ao comando indicado');
 expect(trainingAdvice('reflex',adviceRecord('reflex')).title).toBe('Consolide as respostas corretas');
});
