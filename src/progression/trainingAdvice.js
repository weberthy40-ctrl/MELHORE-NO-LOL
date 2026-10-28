import { validateAttemptRecord } from '../persistence/attemptRecord.js';
import { DODGE_RULESET } from '../training/dodge/constants.js';

const MODALITIES = ['dodge', 'precision', 'kiting', 'reflex'];
const freeze = (status, title, evidence, objective, path, action) => Object.freeze({status, title, evidence, objective, path, action});
const menu = modality => modality === 'dodge' ? '/train/dodge' : `/assessment/${modality}`;
const repeat = (modality, level) => modality === 'dodge' ? '/train/dodge' : `/timed/${modality}/${level}`;
const number = value => new Intl.NumberFormat('pt-BR').format(value);

/**
 * Read-only focus for one valid last attempt, never a diagnosis or trend.
 * Sample floors (30 s/8 resolved dodge; 20 precision clicks; 30 s/10 accepted
 * kite preparations; 12 presented reflex cues) limit advice from sparse rounds.
 * They do not change scoring, difficulty, rank, or persisted records.
 */
export function trainingAdvice(modality, record = null) {
  if (!MODALITIES.includes(modality)) throw new TypeError('Modalidade de treino inválida.');
  if (record === null || record === undefined) {
    return freeze('empty', 'Crie sua primeira referência', 'Ainda não há uma tentativa oficial para orientar este foco.', 'Faça uma avaliação ou um treino para começar a observar seu desempenho.', `/assessment/${modality}`, 'Fazer avaliação');
  }
  try {
    validateAttemptRecord(record);
    if (record.modality !== modality) throw new TypeError('Modalidade incompatível.');
  } catch {
    return freeze('invalid', 'Colete uma referência válida', 'O último registro disponível não permite uma orientação confiável.', 'Abra a modalidade e conclua um treino atual; nenhum dado anterior será substituído.', menu(modality), modality === 'dodge' ? 'Abrir modalidade' : 'Avaliar ponto de partida');
  }
  const m = record.metrics;
  const current = modality === 'dodge' ? m.rulesetVersion === DODGE_RULESET
    : modality === 'precision' ? record.variant === 'mixed' && m.sequenceVersion === 'clear-group-v4'
    : modality === 'kiting' ? record.variant === 'combat' && m.config?.configVersion === 'kiting-combat-v4'
    : record.variant === 'integrated' && m.config?.configVersion === 'reflex-integrated-v1';
  if (!current) {
    return freeze('legacy', 'Observe o desafio atual', 'O último treino pertence a outro exercício ou configuração; ele continua no histórico.', 'Colete uma tentativa do desafio atual antes de usar este foco de prática.', menu(modality), modality === 'dodge' ? 'Abrir desafio atual' : 'Avaliar desafio atual');
  }
  const path = repeat(modality, record.level);
  const ready = (title, evidence, objective) => freeze('ready', title, evidence, objective, path, 'Praticar este foco');
  const insufficient = evidence => freeze('insufficient', 'Colete mais oportunidades', evidence, 'Repita o contexto quando estiver pronto para observar uma amostra maior; esta sugestão não altera sua dificuldade.', path, 'Continuar treino');
  if (modality === 'dodge') {
    const resolved = m.threatsDodged + m.threatsHit;
    if (m.elapsedActiveSeconds < 30 || resolved < 8) return insufficient(`${m.elapsedActiveSeconds.toFixed(1)} s ativos e ${number(resolved)} ameaças resolvidas. Este foco usa ao menos 30 s e oito resoluções.`);
    return ready(m.threatsHit ? 'Revise o aviso antes do próximo movimento' : 'Consolide a leitura dos avisos', `${number(m.threatsDodged)} ameaças evitadas e ${number(m.threatsHit)} impactos em ${number(resolved)} resoluções. Contatos durante proteção não contam como esquivas.`, m.threatsHit ? 'No próximo treino, ao encerrar, abra a revisão e observe um contato se houver no trecho, antes de repetir o deslocamento.' : 'Repita seu percurso observando os avisos e o espaço disponível; não é necessário subir o nível para praticar este foco.');
  }
  if (modality === 'precision') {
    if (m.clicksEligible < 20) return insufficient(`${number(m.clicksEligible)} cliques elegíveis no último treino. Este foco usa ao menos 20 cliques.`);
    if (Number.isInteger(m.orderErrors) && m.orderErrors > 0) return ready('Confira a ordem antes de clicar', `${number(m.orderErrors)} erros de ordem entre ${number(m.misses)} cliques errados e ${number(m.clicksEligible)} cliques elegíveis.`, 'Nos grupos numerados, identifique o próximo número antes de clicar. Observe os erros de ordem ao terminar.');
    if (m.misses > 0) return ready('Confirme o alvo de cada clique', `${number(m.hits)} acertos e ${number(m.misses)} cliques errados em ${number(m.clicksEligible)} cliques elegíveis.`, 'Procure confirmar a posição visível do alvo antes do clique, mantendo o mesmo nível para observar o resultado.');
    if (Number.isInteger(m.expiredTargets) && m.expiredTargets > 0) return ready('Observe o prazo dos alvos', `${number(m.expiredTargets)} alvos ultrapassaram o prazo; houve ${number(m.hits)} acertos em ${number(m.clicksEligible)} cliques.`, 'Ao rever o próximo grupo, observe quais alvos permanecem após o prazo; priorize clareza da sequência antes de acelerar.');
    return ready('Consolide o controle dos grupos', `${number(m.hits)} acertos em ${number(m.clicksEligible)} cliques elegíveis.`, 'Repita o contexto observando os grupos e mantendo cliques intencionais. Uma tentativa isolada não indica tendência.');
  }
  if (modality === 'kiting') {
    if (m.elapsedActiveSeconds < 30 || m.accepted < 10) return insufficient(`${m.elapsedActiveSeconds.toFixed(1)} s ativos e ${number(m.accepted)} preparações aceitas. Este foco usa ao menos 30 s e dez preparações.`);
    if (m.cancellations > 0) return ready('Observe o momento de mover', `${number(m.cancellations)} preparações canceladas entre ${number(m.accepted)} aceitas. Cancelar pode ser uma escolha para evitar dano.`, 'Em um trecho seguro, experimente aguardar o disparo antes de mover e observe os cancelamentos ao terminar.');
    if (m.rhythmOpportunities > 0 && m.rhythmCycles < m.rhythmOpportunities) return ready('Intercale movimento e disparos', `${number(m.rhythmCycles)} ciclos com movimento em ${number(m.rhythmOpportunities)} oportunidades entre acertos.`, 'Experimente um deslocamento entre disparos, preservando a preparação. Use o resultado para observar o ritmo, sem mudar o nível automaticamente.');
    return ready('Consolide seu ritmo de ataque', `${number(m.hits)} acertos em ${number(m.shots)} disparos e ${number(m.accepted)} preparações aceitas.`, 'Repita o contexto e observe a alternância entre atacar e mover. Este foco descreve somente a última tentativa.');
  }
  const s = m.summary;
  if (s.presented < 12) return insufficient(`${number(s.presented)} sinais apresentados. Este foco usa ao menos 12 sinais.`);
  if (s.commissions > 0) return ready('Observe os sinais de não responder', `${number(s.commissions)} respostas em sinais de inibição e ${number(s.inhibited)} inibições corretas.`, 'Nos sinais de não responder, aguarde a próxima indicação. Compare esses contadores ao terminar o próximo treino.');
  if (s.anticipations > 0) return ready('Espere o sinal aparecer', `${number(s.anticipations)} antecipações em ${number(s.opportunities)} oportunidades registradas.`, 'Aguarde o sinal visível antes de responder e observe as antecipações ao terminar.');
  if (s.omissions > 0) return ready('Complete a leitura de cada sinal', `${number(s.omissions)} omissões em ${number(s.presented)} sinais apresentados.`, 'Mantenha atenção no texto e no símbolo de cada sinal. Observe quantos ficam sem resposta no próximo treino.');
  if (s.wrong > 0) return ready('Associe o sinal ao comando indicado', `${number(s.wrong)} erros de escolha em ${number(s.presented)} sinais apresentados.`, 'Leia o comando solicitado antes de responder; observe os erros de escolha sem buscar velocidade a qualquer custo.');
  return ready('Consolide as respostas corretas', `${number(s.correct)} respostas corretas ou inibições em ${number(s.opportunities)} oportunidades.`, 'Repita o desafio integrado buscando ler cada indicação com clareza. Uma tentativa não demonstra evolução nem prevê desempenho em partidas.');
}
