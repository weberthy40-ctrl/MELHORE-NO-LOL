# Registro de evolução

## Checkpoint operacional — E011/E013, mandato R$ 0

- Branch `rift-lab/beam-practice`, base `3db5669`; trabalho anterior preservado. Concluídos: série técnica de feixes de45s e acesso a ela a partir de contato capturado na revisão. Menu esquiva oferece entrada; sem pontos, vidas eliminatórias, histórico ou mudança no Normal.
- Orçamento adicional R$0, conforme issue#2 lida pela página pública. Policy `paid_api_allowed:false` bloqueia API antes de variáveis; live/secret não foram ativados. Guard publicado na branch de infraestrutura do PR#1; não mesclar/ativar API paga para testar o jogo.
- Validação:309 testes/60 arquivos, lint/build aprovados. Bateria completa antes do último CTA: seis suítes, audit0, produção e cenário nativo45s aprovados. Após CTA: replay nativo com Enter/navegação em1366/390 e smokeprodução final aprovados. Infra49Python+4Node aprovados. Detalhes/falhas/exclusões abaixo.
- Revisão independente sem bloqueios; capturas da arena ativa390×600, resultado e CTA inspecionadas. Fullscreen headless excluído; hardware físico, som percebido e calibração humana não executados.
- Sem retomada automática comprovada após renovar franquia. CLI aceita loginChatGPT, mas não há ferramenta nativa de agendamento nesta interface nem acesso ao Windows do usuário. Alternativas A/B/C/D e fontes oficiais em docs/AUTOMATION.md. Não copiarOAuth nem usar provedores/APIpagos ou burlar limites.
- Próxima prioridade escolhida: acrescentar revisão temporária dos contatos da série técnica, reaproveitando gravador/review existentes, sem salvar tentativas. Antes de editar, confirmar eventos técnicos de impacto e contrato de captura terminal; não usar contagem como causa/diagnóstico.
- Retomada curta: “Continue do checkpoint em rift-lab/beam-practice, seguindo a issue#2 e orçamento R$0.” Isso é instrução de retomada, não execução agendada.
- Trava free-product-20261028 liberada no fechamento após conferir proprietário; novos agentes devem adquirir a sua. Sem merge/main/deploy ou dependências novas.


Execução inicial: 27/10/2026. Base: rc.14, Fases 1/2 com alterações locais ainda não commitadas. Sem push, merge, deploy ou serviço externo. Método: [skill](../.agents/skills/rift-lab-evolution/SKILL.md); visão/backlog: [EVOLUTION.md](EVOLUTION.md).

## Avaliação inicial e escolhas

- Gameplay: regras/colisão estão separadas do renderer, com testes de pausa, mobilidade e fairness; calibragem humana continua pendente. Não houve evidência que justificasse reconstruir combate ou mudar velocidades nesta execução.
- Visual/áudio: recursos próprios/CC0 e áudio por gesto já existem; a oportunidade imediata é tornar o replay útil para análise, não adicionar partículas sem critério. Bundle e fallback de sombras continuam no backlog.
- Treinamento: dados reais e pontos já existem, mas integrado de Reflexos recebe fator incorreto e revisão não oferece acesso aos contatos. Corrigir justiça e leitura de erros precede coach heurístico.
- Engenharia: persistência validada, snapshots e migração aditiva existentes; preservar contratos reduz risco. Novos testes devem usar motor/renderer reais onde a alegação depende deles.
- Produto: quatro modalidades funcionais e navegação local; não há base para introduzir conta/serviço ou prometer elo. Orientação de próximo treino permanece candidata, com requisito de amostra/contexto explícitos.

## E001 — justiça na classificação de Reflexos — concluído

**Observação:** UI oficial usa `integrated`; `pointsForAttempt` aplica fator 0,7 a toda variante diferente de `mixed`. Dificuldade define ambos como desafios completos. Assim o integrado sofre desconto destinado a exercícios simples. Testes anteriores não exercitam histórico integrado.

**Prompt autogerado:** No RIFT LAB rc.14, corrija o fator de contexto da classificação derivada de Reflexos para que o desafio integrado atual e o misto legado recebam o tratamento de desafio completo. Preserve o desconto de variantes simples, os scores e registros persistidos e a janela/ponderação existentes. Versione a regra derivada para tornar a mudança identificável e informe seu efeito na patente. Use métricas oficiais válidas, não fixtures adulteradas. Aceite: com evidência equivalente, integrado não recebe o desconto simples; simples ainda recebe; amostra insuficiente continua reduzindo pontos; as outras modalidades são idênticas; IDs/registros/scores e backup não mudam. Teste registros integrados reais, limites, rating agregado e regressões existentes. Risco: patentes derivadas de históricos integrados podem subir ao corrigir o cálculo, sem reescrever notas históricas. Sem recalibrar metas ou fazer refatoração ampla.

**Validação planejada:** Vitest direcionado e completo, lint/build; revisão independente. Browser do Perfil após E002 complementará apresentação sem alegar nova calibração competitiva.

**Implementado:** integrado e misto legado tratados como desafios completos; desconto simples mantido. `trainer-rating-v2` identifica a regra derivada (também nos snapshots das outras modalidades, cujos valores não mudam). Scores/records/esquema de backup não mudam; históricos integrados podem apresentar patente maior ao consultar novamente.

**Evidências:** `npm test`: 261 testes/54 arquivos, saída 0; `npm run lint`: saída 0; `npm run build`: saída 0, aviso 3D de 714,70 kB permanece. Primeiro teste direcionado falhou (7/8): expectativa de score >=90 para três apresentações ignorava o fator de consistência existente. Correção 1/3 desse problema: usar resultado real 88 e pontos 2444, sem alterar scorer ou relaxar gates; suíte completa passou. Novos cenários cobrem níveis 1/10, integrado com mouse/inibição, simples, legado mixed, amostra, rating agregado, duplicata, imutabilidade e round-trip de backup.

**Revisão:** subagente independente sem bloqueios; confirmou que só a variante integrada muda numericamente. Nenhum recalibrador de dificuldade foi adicionado. Aprendizado: gerar registros pelo motor detecta expectativas erradas que fixtures de score fabricado esconderiam. Aceite humano/CI remoto não executados.

## E002 — revisão navegável de impactos — concluído

**Observação/seleção:** o replay de seis segundos já conserva posições e contatos, mas os pontos da timeline são spans passivos. O jogador precisa procurar manualmente o instante. Escolhido antes do coaching de perfil por fechar o ciclo observar→rever com dados já existentes, sem inferir deficiência nem mudar persistência.

**Prompt autogerado:** Torne os contatos registrados da revisão de esquiva navegáveis. Mantenha timeline, scrub, velocidades e saída existentes. Exiba uma lista cronológica de contatos no intervalo capturado, com habilidade, tempo e botão nativo para rever cerca de um segundo antes; limite ao primeiro frame e selecione o frame em ou antes do instante desejado. Contatos simultâneos devem continuar acessíveis individualmente; sem contatos mostre estado vazio explícito. Ao selecionar, pause reprodução e destaque a seleção, sem retomar a sessão original ou recalcular score. Garanta teclado, foco visível e layout estreito; não apresente hipótese de causa como fato. Escopo: UI/CSS da revisão, testes e documentação do comportamento. Não altere combate, ring, schemas, classificação, áudio, publicação ou dependências. Aceite: seleção muda o frame mostrado e cancela RAF; alvos fora do ring não aparecem; múltiplos eventos e vazio funcionam; fechar/reabrir e imports tardios não deixam renderer/RAF nem erro antigo. Rode testes de UI/ownership, suíte completa, lint/build e navegador real com inspeção visual desktop/estreita. Risco: densidade no modal e concorrência entre carregamento e fechamento; preserve controles antigos e mensagem de indisponibilidade.

**Validação planejada:** testes adversariais específicos antes dos gates; subagente revisor; CDP no perfil temporário e screenshot real. Três rodadas por problema, com falhas/skips explícitos.

**Inspeção adversarial E002 / ampliação delimitada do aceite:** as capturas revelaram seletor de velocidade vazio. `option.value=String(.5)` é `0.5`, mas o controle selecionava `.5`; sem opção selecionada, `Number(speed.value)` é zero e o replay não avança. Corrigir o valor e provar avanço por RAF/navegador, além da pausa, faz parte de preservar controles existentes. O foco no evento também podia rolar o botão de fechar para fora do conteúdo visível; manter esse botão alcançável durante a rolagem e verificar por hit test nas duas larguras. Essas correções não mudam gravação, combate nem sessão original.

**Falha do harness de teclado (E002):** a primeira rodada completa de navegador aprovou browser/storage/dodge/gameplay, mas test:replay falhou: slider 0 em vez de 60. Correção 1/3 desse problema (informar virtual key 13) ainda não ativou botão. Diagnóstico independente em botão mínimo mostrou keydown/keyup confiáveis, mas sem keypress/click; enviando também caractere CR ocorreu click nativo. Correção 2/3: evento completo de Enter, preservando assertion de seek e acrescentando foco/pausa. O teste isolado passou em 1366/390 antes das correções visuais acima. Nenhum produto foi mudado para contornar a falha do harness.

**Implementado/revisado:** lista cronológica com botões nativos de 44 px, seleção `aria-pressed`, busca para um segundo antes, pausa, vazio explícito e preservação do scrub. Erros/imports tardios são guardados por geração; erro de renderer não é apagado ao buscar, e descarte remove renderer/RAF e texto auxiliar. Subagente independente revisou implementação e correções, sem bloqueios. Dois problemas iniciais de teste (foco em dialog fechado e expectativa de arredondamento do frame) corrigidos na rodada 1 de cada um; testes de produto não foram relaxados.

**Defeitos preexistentes corrigidos após inspeção:** opção inicial agora é `0.5`, com regressão de avanço em 0.5×, 1× e 0.25×; fechar permanece sticky e alcançável após foco/rolagem. Rodada de correção 1/3 para cada problema, validada por testes e novas capturas. Os testes extras confirmam reprodução efetivamente avançando antes da seleção, não apenas rótulo de pausa.

**Gates finais:**

| Verificação | Evidência real |
| --- | --- |
| `npm test` | Saída 0; **270 testes em 55 arquivos**, sem skips reportados. Inclui nove cenários específicos de replay e dois adicionais de rating. |
| `npm run lint` | Saída 0. |
| `npm run build` | Saída 0; 117 módulos; chunk 3D 714,70 kB, aviso preservado. |
| `CHROME_BIN=chromium QA_ARTIFACT_DIR=/tmp/rift-phase3/browser bash scripts/ci-browser.sh` | Antes dos ajustes finais dos controles: browser full, storage, dodge e gameplay passaram; gameplay excluiu fullscreen explicitamente. Replay falhou por input incompleto do harness; a execução geral teve saída 1 e não foi descrita como aprovada. |
| `QA_ARTIFACT_DIR=/tmp/rift-phase3/replay-final-v2 CDP_TIMEOUT_MS=45000 npm run test:replay` | Após correções: saída 0, WebGL real em 1366/390 px, quatro contatos, avanço de reprodução, Enter nativo busca 3 s/pausa, seleção e hit test do fechar, saída sem canvas. Composição controlada, não tentativa oficial. |
| Inspeção visual | Capturas `replay-1366.png`/`replay-390.png` em `/tmp/rift-phase3/replay-final-v2/` vistas pelo agente principal; foco, velocidade 0.5×, texto legível e fechar visível. Não é benchmark de GPU/Windows. |
| Revisões independentes | E001, E002 e processo/documentação revisados por subagentes distintos; observações de versão global, teclado e estado retomável incorporadas. |

O helper agora inclui `test:replay`, com limite global de 40 minutos no mesmo job; nenhum mecanismo/gatilho de publicação foi alterado. Não se repetiu toda a rodada de navegador após o ajuste final: a suíte afetada, unidade completa, lint e build foram repetidos. A auditoria de dependências não foi repetida (nenhuma dependência nova), nem CI remoto, upload de artefatos, preview de produção, fullscreen real/Windows, mouse físico, áudio ou calibração competitiva. Limites anteriores de bundle, sombras e Pages independente continuam abertos.

**Aprendizado de processo:** keydown confiável não equivale à ativação padrão de botão. A sondagem mínima isolou a falha do harness antes de alterar produto. Capturas revelaram um controle quebrado que testes de seek não detectavam; o aceite passou a exigir avanço de reprodução e alcance do fechar. A skill incorporou essa prática. Duas rodadas de correção para o problema de Enter, uma para cada problema de fixture/controle; nenhuma excedeu o limite de três.

## E008 — captura terminal — concluído

**Por que vem antes do coaching:** garantir que uma derrota tenha seu instante final disponível torna a revisão recém-melhorada mais útil. Há indício na ordenação de eventos: a UI pode congelar o recording antes do último `onStep`. O evento terminal fora do intervalo capturado continua explicitamente excluído; não há alegação de que foi corrigido.

**Próximo prompt autogerado:** No RIFT LAB, reproduza com um teste de integração a perda do contato fatal entre `dodge:damage`, finalização síncrona de sessão e captura em `onStep`. Use motor/eventos reais e relógio controlado, identificando exatamente o último quadro e o timestamp do contato; não use uma imagem inventada como se fosse capturada. Só após confirmar, escolha a menor correção na captura/finalização que conserve o quadro terminal real e o trecho anterior, mantendo limite de memória/janela, snapshots imutáveis, descarte e ausência de escrita extra. Aceite: derrota curta e Normal/Sobrevivência têm contato terminal navegável quando há quadros suficientes; o estado/tempo corresponde ao mesmo step lógico; pausa/abandono/retry não criam quadros ou resultados oficiais falsos; snapshots anteriores não mudam; testes de ring, navegação, persistência e replay continuam válidos. Não recalibre colisão, vida, score ou dificuldade. Rode regressões do gravador e integração, unidade completa/lint/build, browser de esquiva e replay; obtenha revisão independente. Se a causa não for reproduzida, registre a hipótese como não confirmada e mantenha o comportamento, sem ampliar o intervalo de eventos para esconder a ausência de quadros. Limite de três rodadas de correção por problema.

**Estado de retomada:** dois ciclos encerrados nesta execução. Arquivos/documentos das Fases 1/2 preservados; nenhuma instalação ou dependência nova, alteração em schemas/backup, publicação, commit, push, merge ou deploy. Processos temporários de QA são encerrados ao terminar. Próxima sessão deve ler este registro e rever prioridades/evidência antes de aplicar o prompt E008. Não há execução autônoma em segundo plano.

## Inventário desta fase e conferência

- Processo: `AGENTS.md`, `.agents/skills/rift-lab-evolution/SKILL.md`, `docs/EVOLUTION.md`, `docs/EVOLUTION_LOG.md`.
- Produto: `src/progression/skillRating.js`, `src/ui/dodgeReplayReview.js`, regras de replay em `src/styles/global.css`.
- Regressões: `tests/progression/skillRating.test.js`, `tests/ui/dodgeReplayReview.test.js`, `scripts/browser-replay.js`.
- Integração/contratos: `package.json` (script, sem dependências), `scripts/ci-browser.sh` (quinta suíte), `.github/workflows/ci.yml` (limite 40 min), `docs/CURRENT_SCOPE.md`, `docs/QA.md`.

Conferência final: 28 referências locais válidas; frontmatter da skill, YAML da CI, comando npm e sintaxe shell verificados. `git diff --check` sem erros. `package-lock.json`, `src/persistence` e `.github/workflows/pages.yml` sem diff. Navegador e Vite temporários encerrados (saída 130 do Vite é interrupção deliberada após os testes). Logs/screenshots de `/tmp` são evidências locais temporárias, não devem ser pré-requisito da próxima sessão; os cenários reproduzíveis e os resultados estão nos arquivos do repositório.

### E008 — retomada e reprodução antes da correção

O prompt E008 acima foi adotado nesta continuação. A reprodução com motor, sessão, eventos, input loop e UI reais (renderer substituído, sem WebGL neste teste) falhou nos dois casos esperados: Sobrevivência nível 5/seed 1 terminou em 2,300 s com último quadro 2,275 s; Normal nível 5/seed 2 terminou em 5,650 s com último quadro 5,625 s. `npm test -- tests/ui/dodgeTerminalReplay.test.js`: saída 1, dois testes falharam por perda de 25 ms.

A causa confirmada é o gate de 50 ms em `capture`, não a hipótese original de UI congelar antes de `onStep`: telemetria só se finaliza em `telemetry.step`, antes da captura normal e do `onTick` que monta a revisão. Subagente independente confirmou o gate com outras seeds, sem UI.

Estratégia antes de implementar: operação `finish` do gravador aceita o estado real terminal ignorando só o intervalo mínimo, mantém timestamps monotônicos, substitui quadro de mesmo instante em vez de duplicar e sela a gravação. A UI fornece snapshot/posição/ângulo reais antes de congelar a revisão, inclusive em Encerrar e analisar. Janela, limite de quadros, marcadores fora do intervalo e contratos de combate/persistência permanecem. Testar final duplicado, entrada inválida, janela longa, clear/reinício, pausa, análise manual e abandono. Não inventar estado nem mover o timestamp do contato para fazê-lo caber.


**E008 — implementação e revisão:** `finish` aceita a amostra terminal real, substitui timestamps iguais e sela captura/marcação; `clear` reinicia o gravador. A UI finaliza antes de montar a revisão, usando a posição e ângulo de `preview.movement`, sem copiar/mudar o relógio do contato. Mantida a filtragem de contatos ao intervalo capturado, sem estendê-lo artificialmente. Subagente independente revisou código e testes, sem bloqueios.

**E008 — regressões atuais:** os dois testes de reprodução passaram após a primeira correção do defeito. Mais cinco cenários cobrem monotonicidade, entrada inválida, mesmo timestamp, imutabilidade, finalização repetida, limites de quadros/marcadores, clear, análise manual pausada e abandono/reinício. `npm test`: 277 testes/57 arquivos, saída 0. `npm run lint` e `npm run build`: saída 0; chunk 3D 714,70 kB continua com aviso. O browser de esquiva foi ampliado para exigir contato fatal navegável, último quadro com timestamp correspondente e sessão original completed; validação nativa em andamento. Correções do problema principal: 1/3, sem enfraquecer teste.


**E008 — validação final nativa:**

| Check desta continuação | Resultado |
| --- | --- |
| Reprodução antes do fix | Dois testes de integração falharam nos últimos quadros 25 ms anteriores aos contatos; falha esperada documentada. |
| Unidade/regressão final | `npm test`: saída 0, 277 testes em 57 arquivos. Sete novos cenários em `dodgeReplayTerminal.test.js`/`dodgeTerminalReplay.test.js`. |
| Lint/build | Saída 0 nos dois. Aviso do chunk 3D mantido; sem alteração de dependências. |
| `CDP_TIMEOUT_MS=45000 QA_ARTIFACT_DIR=/tmp/rift-e008/artifacts npm run test:dodge` | Saída 0. Derrotas reais salvas: Sobrevivência com contato/quadro final 1.23 s (um contato); Normal 8.12 s (três contatos). Cinco etapas diagnósticas, mobilidade, perfil e ausência de canvas/RAF no menu também passaram. |
| `npm run test:storage` | Saída 0: migração de um registro, três adicionados, round-trip de quatro, um conflito preservado, rollback e seis conquistas. |
| `CDP_TIMEOUT_MS=45000 QA_ARTIFACT_DIR=/tmp/rift-e008/artifacts npm run test:replay` | Saída 0. Composição controlada/WebGL real em 1366 e 390 px: quatro contatos, teclado, reprodução, seek, pausa, fechamento sem canvas. Não é tentativa oficial. |
| Inspeção visual | Capturas das derrotas reais Normal/Sobrevivência vistas pelo agente principal: último contato presente e instante final correspondente; reprodução/saída acessíveis. Evidências temporárias em `/tmp/rift-e008/artifacts/`. |

Nenhuma correção adicional foi necessária depois do fix principal (1/3). A revisão independente confirmou janela, monotonicidade, sealing e uso do estado real. Não se repetiram gameplay das outras modalidades, smoke geral, auditoria, preview de produção ou CI remoto: o código alterado é da captura/revisão de esquiva e os checks afetados foram executados. Fullscreen, Windows/GPU físicos e calibração humana continuam não verificados; avisos de bundle e sombras permanecem no backlog.

**Aprendizado E008:** confirmar a ordem causal antes de corrigir. Eventos síncronos pareciam explicar o defeito, mas a reprodução mostrou que a montagem estava na ordem correta. Só a amostra terminal precisava de tratamento distinto; o combate e o relógio não foram alterados.

**Arquivos deste ciclo:** `src/training/dodge/replay.js`, `src/ui/navigation.js`, `scripts/browser-dodge.js`, novos `tests/training/dodgeReplayTerminal.test.js` e `tests/ui/dodgeTerminalReplay.test.js`; atualização de `docs/CURRENT_SCOPE.md`, `docs/QA.md`, visão/backlog e este registro. Preservados os arquivos das execuções anteriores, a persistência, o lockfile e o Pages. Sem commits, pushes, merges ou deploy.

## E003 — orientação local de próximo treino — concluído

**Seleção:** classificação e revisão agora têm correções verificadas; a próxima oportunidade de produto é transformar métricas em uma ação de prática compreensível, em vez de apenas repetir o último nível. Risco principal: inferir fraqueza, tendência ou causalidade sem amostra/contexto suficientes.

**Prompt autogerado E003:** Implemente orientação local explicável de próximo treino no Perfil usando os dados oficiais já lidos por `loadSkillOverview`. Comece pela última tentativa válida de cada modalidade, sem varreduras extras nem nova persistência. Crie uma função pura que retorne foco, evidência numérica, objetivo observável e CTA compatível com os modos atuais. Use contadores realmente presentes (por exemplo, cancelamentos de ataque versus preparações, erros de ordem versus cliques, respostas/inibições); não derive fraqueza comparando patentes entre modalidades, nem prometa melhoria no LoL. Defina e documente amostra mínima para cada conselho; sem amostra, retorne orientação neutra de coletar dados. Registros legados ou de configuração incompatível não devem gerar recomendação fingindo representar o desafio atual. Não aumente/diminua dificuldade automaticamente, não recalcule scores e não restaure laboratório removido. Preserve carregamento, falhas/retry independentes por modalidade e descarte de consultas tardias. Aceite: histórico vazio/erro/zero ações/amostra curta/legado não produzem diagnóstico falso; conselho com amostra mostra números verificáveis e CTA seguro; não há escrita nem duplicação de consultas; tela funciona por teclado e em largura estreita. Teste função pura com registros válidos do motor, integração de Perfil, unidade/lint/build e browser com composição controlada e dados reais de QA; inspeção visual e revisão independente. Caso os contadores não permitam um conselho defensável para alguma modalidade, explicite a limitação sem inventar uma métrica. Registre o prompt/decisões/resultados e mantenha limite de três rodadas por problema.

Estado para retomar: E008 concluído, E003 preparado. Processos temporários de navegador/servidor são encerrados após validação. Nenhum serviço contínuo ou publicação automática foi iniciado.

### E003 — contrato delimitado antes de editar (Fase 4)

Reutilizar a última tentativa que `loadSkillOverview` já retorna, sem nova consulta. Função pura `trainingAdvice(modality, record=null)` produz status, título/foco, evidência numérica, objetivo observável, path e ação. Perfil exibe um bloco por habilidade, explicitando que é uma sugestão baseada somente no último treino, sem tendência/causalidade nem prescrição de dificuldade. CTA de registros atuais mantém nível; esquiva abre seu menu e respeita avaliação/progressão existentes.

Amostras mínimas são salvaguardas de interpretação, não novos cortes de score: esquiva atual com 30 s e oito ameaças resolvidas; precisão mista atual com 20 cliques; combate de kiting atual com 30 s e dez preparações aceitas; reflexos integrado atual com 12 sinais apresentados. Compatibilidade exige regras atuais (dodge-v10, clear-group-v4, kiting-combat-v4, reflex-integrated-v1) e validação do registro. Registro vazio/inválido/legado/curto gera orientação neutra com motivo, sem escolher um histórico antigo mais favorável. Contadores opcionais ausentes não são tratados como zero. Nenhuma escrita ou mudança em score/rating/curvas.

Aceite adversarial: quatro modalidades e seus casos de vazio, zero ação, erro de leitura, retry, dado legado, amostra curta, descarte/import tardio; mesma última tentativa independentemente da ordem da consulta, sem varrer novamente o histórico; dados e scores imutáveis; um CTA seguro; teclado e 390 px legíveis. Testes com registros válidos/motor real, UI de Perfil, suite inteira/lint/build e browser; revisão de outro agente. Parar/reverter apenas alterações próprias se surgir regressão sem correção após três rodadas. Arquivos previstos: módulo progression, profileScreen/CSS, testes e script de browser existente; sem dependências ou migração.


### Fase 4 — recursos e linha de base verificados

O usuário confirmou explicitamente executar a proposta anexada. Goals/Automations/agendamento e medição de orçamento não aparecem no catálogo de ferramentas desta sessão; não se simulou `/goal` nem cron. Subagentes nativos foram usados de fato. O modo operacional é execução finita no Codex com skill/checkpoint, não agendamento diário. A consulta `gh run list --repo weberthy40-ctrl/MELHORE-NO-LOL --limit 3 --json databaseId,status,conclusion,headSha,workflowName` falhou com Forbidden; causa não determinada, sem criar/extrair credenciais ou modificar rede. Não há evidência remota nova.

Uma cópia local da base original foi reconstruída de HEAD + arquivo de recuperação, com 22 hashes verificados, fora do checkout e sem worktree/Git separado. Dependências existentes foram reutilizadas. O helper original nessa cópia aprovou as cinco suítes browser/storage/dodge/gameplay/replay; fullscreen explicitamente excluído. Assim a comparação de navegador não misturou as novas mudanças com o estado anterior. Evidência local temporária: `/tmp/rift-phase4-baseline-browser.log` e `/tmp/rift-phase4-baseline-artifacts/summary.md`. A base atual inicial também aprovou 277 testes/57 arquivos, lint, build e auditoria npm (zero vulnerabilidades reportadas).

A trava cooperativa foi adquirida por criação exclusiva; uma segunda aquisição foi testada e recusada, sem sobrescrever proprietário. O arquivo de recuperação foi relido e hashes verificados. Isso preserva trabalho local, não comprova restauração em outra máquina ou publicação de snapshot. Não foram criados commits, PRs, push ou deploy; branch exclusiva local rift-lab/phase4.

### E003 — implementação e revisão

Função pura interpreta somente a última tentativa validada, nos contextos atuais e com pisos de amostra documentados. Perfil mostra foco, evidência, objetivo e CTA; reaproveita as quatro consultas existentes, sem escrever dados. Campos opcionais ausentes não são falsamente zerados. Carregamento, erro/retry e descarte permanecem independentes; guardas de geração impedem que um retry antigo substitua a resposta mais recente. Legado/inválido encaminham para avaliação (esquiva mantém menu), sem sugerir nível 1 como redução de dificuldade.

Revisão independente achou três pontos corrigidos na rodada 1/3 de cada problema: composição de fixtures não podia quebrar smoke de produção (separada em test:profile dev-only); CTA neutro de legado não devia prescrever nível 1; preparação do banco temporário precisava participar do cleanup mesmo em falha. A orientação de esquiva foi ajustada para abrir a revisão no próximo treino, pois replays históricos não são persistidos. Não se alterou a mecânica nem se adicionou persistência.

O cleanup inicialmente escrito com throw em finally falhou no lint (no-unsafe-finally/preserve-caught-error). Correção 1/3: fluxo coleta erro primário, executa cleanup e preserva ambos em AggregateError com cause quando necessário; sem desabilitar regras. Foi reforçada a visibilidade do foco no teste estreito, usando rolagem instantânea da composição controlada para eliminar captura intermediária. Após ajustes, 15 testes direcionados e a suíte completa de 290 testes/58 arquivos passaram; lint/build passaram. Teste nativo de Perfil aprovou quatro orientações, quatro reads e zero writes em 1366/390 px e ação por Enter. Captura estreita final vista pelo agente principal. Smoke de produção completo ainda em execução ao escrever esta entrada; não é aprovação antecipada.


**E003 fechado:** smoke completo do build de produção em `http://127.0.0.1:4173/` APROVADO (seis rotas, níveis/diagnósticos, dez remontagens, presets e três viewports), sem imports de fonte. Teste `test:profile` final APROVADO em Vite dev, com captura estreita final inspecionada: foco/CTA visíveis, contadores corretos, texto legível e nenhum overflow. Novo script possui banco temporário próprio, compara dados antes/depois e verifica exatamente quatro leituras/zero escritas da UI. Caminho por Enter abre o nível atual da modalidade. Revisão independente final sem bloqueios de código. As correções de tooling/CTA/cleanup tiveram uma rodada por problema; nenhuma regra foi removida.

## E007 — seleção compatível de sombras — concluído (bundle pendente)

**Motivação/evidência:** `mountPreview` seleciona PCFSoftShadowMap, mas Three.js 0.186.1 (`WebGLShadowMap.js`, linhas 99–103) emite aviso e muda para PCFShadowMap antes de renderizar. Avaliação independente confirma que a seleção direta preserva o algoritmo efetivo. O item E007 também contém bundle grande, que não será resolvido por esta mudança.

**Prompt autogerado:** Substitua somente a seleção removida de sombras pela seleção PCF suportada que o próprio renderer já utiliza como fallback. Preserve Leve sem sombras, Médio/Alto com resolução 512/1024, bias, DPR, materiais, luzes e efeitos; não prometa novas sombras soft nem ganho de FPS. Acrescente regressões por preset/arena com renderer injetado e mantenha o caminho sem shadowMap. No smoke de navegador, capture console.warn sem silenciá-lo e verifique ausência do aviso específico PCFSoftShadowMap após render real dos presets; menus-only deve indicar que não verificou sombras. Aceite: configurações e descarte continuam iguais, render real sem depreciação, gameplay/score/persistência inalterados, unidade/lint/build e bateria final nativa aprovados ou falhas honestamente registradas. Sem dependências, lockfile, API, publicação ou refatoração ampla. Parar se o algoritmo efetivo divergir ou após três correções sem resolver. Arquivos previstos: mountPreview.js, testes preview e browser-smoke.js; docs de estado. O bundle permanece aberto.


**E007 reprodução antes da correção:** os testes de preview com o renderer injetado falharam em quatro dos 11 casos: Médio/Alto nas duas arenas selecionavam constante 2 removida, em vez de PCF suportada 1. Leve e ownership existentes passaram. A linha de produção foi então alterada somente para PCFShadowMap; não se tentou reintroduzir o algoritmo antigo. Seis novos casos verificam presets/arenas, sombras desativadas em Leve, resolução 512/1024, bias, DPR e descarte; caminho sem shadowMap continua testado. Nova checagem do smoke captura console.warn sem silenciar e verifica ausência da depreciação após render real; o recorte menus-only marca esse check como excluído. Rodada de correção principal: 1/3.


**E007 revisão e resultado:** revisão independente sem bloqueios. Médio/Alto agora selecionam diretamente PCFShadowMap, que o Three já ativava após o fallback; Leve permanece sem sombras. Testes após o fix: 11/11 no preview, inclusive caminho sem shadowMap, resolução/bias/DPR e descarte. Não se atribui ganho de FPS ou equivalência em GPU física a esse resultado. A instrumentação de console.warn preserva a chamada original; após sugestão do revisor, retém somente mensagens do modo removido para não contaminar o teste de heap com avisos alheios. A repetição do smoke de produção usa essa instrumentação final. Mudança de produto principal teve uma rodada de correção; bundle permanece aberto no E007.

### Fase 4 — bateria final desta execução

| Verificação | Classificação e evidência |
| --- | --- |
| `npm test` | APROVADA: 296 testes em 58 arquivos, sem skips reportados, saída 0. |
| `npm run lint` | APROVADA após corrigir cleanup do harness; saída 0. |
| `npm run build` | APROVADA, saída 0; 118 módulos. Chunk 3D 714,70 kB/187,52 kB gzip mantém aviso. |
| `npm audit --cache /workspace/.cache/npm` | APROVADA: zero vulnerabilidades conhecidas na consulta desta fase; sem dependências novas. |
| `CHROME_BIN=chromium QA_ARTIFACT_DIR=/tmp/rift-phase4/final bash scripts/ci-browser.sh` | APROVADA: seis suítes completas, saída 0: browser, storage, dodge, gameplay, replay e profile. |
| `CDP_TIMEOUT_MS=45000 QA_ARTIFACT_DIR=/tmp/rift-phase4/final-production npm run test:browser -- http://127.0.0.1:4173/` | APROVADA: smoke completo do build de produção com instrumentação final, saída 0; três presets e zero avisos PCFSoftShadowMap. Log local `/tmp/rift-phase4-final-production.log`. Não usou imports de fixtures. |
| Sombras no smoke nativo final | APROVADA: três presets renderizados, zero avisos PCFSoftShadowMap; console.warn não foi silenciado. |
| Perfil nativo final | APROVADA: quatro orientações a partir de registros válidos controlados em banco temporário próprio; quatro scans e zero writes da UI em 1366/390 px, sem overflow, CTA por Enter; registros antes/depois idênticos. Não é medição de gameplay oficial. |
| Armazenamento nativo | APROVADA: migração, round-trip, conflito, idempotência, rollback e conquistas; dados do jogador não foram limpos. |
| Fullscreen no headless | EXCLUÍDA COM JUSTIFICATIVA na rodada de gameplay, como contrato já existente. Nenhuma nova alegação de aprovação da API ou Windows. |
| CI e artefatos remotos | NÃO EXECUTADA/sem evidência disponível: consulta read-only recebeu Forbidden. Configuração local não é uma execução remota. |
| Windows/GPU, mouse físico, áudio percebido e calibração com jogadores | NÃO EXECUTADAS neste ambiente. Não equivalem aos checks headless. |

Falhas mantidas no histórico: reprodução E007 (quatro falhas esperadas antes do fix) e lint do cleanup E003; ambas corrigidas sem enfraquecer gates. Os três problemas apontados na revisão E003 foram corrigidos antes dos checks finais. O smoke de produção E003 já passou por completo; a repetição final pós-E007 também passou, conforme registro abaixo.

**Arquivos alterados nesta Fase 4**, comparados ao arquivo inicial (19; outros arquivos pendentes pertencem às fases anteriores):

- Produto: `src/progression/trainingAdvice.js`, `src/ui/profileScreen.js`, `src/styles/global.css`, `src/game3d/mountPreview.js`.
- Testes: `tests/fixtures/adviceRecords.js`, `tests/progression/trainingAdvice.test.js`, `tests/ui/profileScreen.test.js`, `tests/game3d/preview.test.js`.
- QA/CI: `scripts/browser-profile.js`, `scripts/browser-profile-cases.js`, `scripts/browser-smoke.js`, `scripts/ci-browser.sh`, `package.json`, `.github/workflows/ci.yml`.
- Instruções/documentação: `.agents/skills/rift-lab-evolution/SKILL.md`, `docs/CURRENT_SCOPE.md`, `docs/QA.md`, `docs/EVOLUTION.md`, `docs/EVOLUTION_LOG.md`.

Sem sistema paralelo. Persistência, lockfile, Pages, curvas, scores e controles de combate sem diff desta fase. `AGENTS.md` e os arquivos de E008 permaneceram idênticos ao início da Fase 4.

**Fechamento em 28/10/2026:** revisão final independente de código, workflows e proteções sem bloqueios. `git diff --check` aprovado; comparação confirmou ausência de alteração em lockfile, persistência e Pages. As portas 4173, 5173 e 9222 não têm listeners no encerramento. A retomada conferiu os logs da bateria já executada nesta fase; não a registrou como uma nova execução. Arquivo final e hashes verificados localmente; não houve teste de restauração em nova máquina/tarefa. Nenhum processo contínuo, commit, PR, push, merge ou deploy foi iniciado.

## Próximo objetivo finito — E004 na sessão, sem nova persistência

**Decisão:** depois de feedback por último treino e correções da revisão/classificação, preservar a consulta de avaliações concluídas durante a mesma visita reduz repetição sem introduzir migração/backup. O escopo de armazenamento durável do E004 fica adiado; começar com memória limitada e lifecycle explícito é a alternativa de menor risco. Como segundo candidato, medir o carregamento do bundle antes de propor divisão; nenhum ganho de FPS será presumido.

**Prompt autogerado E004:** Inspecione as avaliações de Precisão, Kiting e Reflexos e reproduza a perda de resultados ao sair e voltar na mesma instância da aplicação. Preserve somente a última avaliação completa por modalidade em memória pertencente à aplicação (máximo três entradas), usando os resultados reais já calculados; não use singleton global, IndexedDB/localStorage ou novas versões de backup. Ao voltar, permita consultar o resumo e iniciar uma nova avaliação explicitamente. Identifique claramente que o resultado é desta sessão e se perde ao recarregar; não confunda com tentativa oficial salva. Cancelamento de uma nova avaliação não deve substituir a última completa; callbacks tardios após sair/recomeçar não podem sobrescrever resultado mais recente. Descarte da aplicação limpa a memória. Não altere duração, dificuldade, recomendação, score, patentes ou histórico. Teste três modalidades, vazio, completar/sair/voltar, refazer/cancelar, corrida de callbacks, reload/descarte e ausência de writes; rode unidade/lint/build, storage e cenários de browser afetados, inspecione layouts e obtenha revisão independente. Só implemente após confirmar a causa; se exigir alteração persistente, pare nesse escopo e registre proposta de migração separada. Limite de três rodadas por problema.

A próxima sessão deve rever prioridades do backlog antes de agir. Esta execução encerra após verificar E008 e concluir dois ciclos adicionais (E003 e E007-sombras); não há Automation ou Goal nativo ativo. Para agendamento real diário às 09:00 America/Sao_Paulo seria necessária uma interface que exponha tal capacidade e sua configuração efetiva; não foi criado cron, serviço ou promessa de retomada automática.


## M001 — jornada de treino com propósito (E004 + E009) — contrato

**Visão:** RIFT LAB como laboratório de execução deliberada, com esquiva como experiência principal e precisão/kiting/reflexos como habilidades complementares. Direção visual: arena escura, contrastes minerais e acento lima, hierarquia editorial, controles claros, conteúdo próprio. Primeiro entender o gesto, depois praticar, depois rever evidência; sem promessa de elo.

**Autoprompt E004:** Execute o prompt de memória de avaliações já registrado, após confirmar a perda ao desmontar. Propriedade da aplicação, no máximo três resumos completos, preservados durante navegação/refazer/cancelar e limpos ao descartar; sem armazenamento novo. CTA de treino no nível indicado e estado explícito de sessão. Testar motor real, corrida de callbacks e regressões nas três modalidades. Arquivos: assessments, navigation, módulo de memória e testes. Reverter somente o diff deste marco se não houver solução verificável.

**Autoprompt E009:** Redesenhe a entrada como briefing de treino: identidade RIFT LAB, caminho principal claro de avaliação de esquiva, acesso à seleção livre e trilha de três passos (avaliar/praticar/revisar). Cards explicam gesto e duração, sem prometer equivalência ao LoL; manter quatro modalidades e todas rotas existentes. Corrigir texto falso de todos os níveis livres, respeitando acesso Normal. Aceite: primeiro CTA leva à avaliação real, todos caminhos alcançáveis por teclado, sem overflow em 390 px, hierarquia legível e sem custo gráfico permanente; confirmar no navegador desktop/estreito, smoke produção e revisão independente. Arquivos screens/CSS/navigation branding e testes. Não introduzir ativos ou bibliotecas. Risco: CSS compartilhado e regressão de links/contagens; manter classes existentes, testes de rotas e bateria completa. E004 e E009 são componentes independentes do mesmo marco integrado, com responsáveis separados.


### M001 — implementação, evidências e revisão

Base reexecutada: 296 testes/58 arquivos, lint e build aprovados. Recuperação dos 32 arquivos anteriores preservada; dependências reutilizadas. Entrada passou de catálogo genérico a briefing com CTA de avaliação real, diagrama CSS original estático e trilha avaliar/praticar/revisar. Cards continuam oferecendo as quatro habilidades; seleção Normal descrita corretamente. Memória E004 por navegação guarda no máximo três resumos completos, validados pelos calculadores existentes e congelados; não lê/escreve armazenamento. Remontagem consulta o resumo; refazer/cancelar não substitui resultado completo; descarte limpa. Callback tardio de Reflexos ganhou guarda de revisão.

Falhas reais: primeiro full Vitest teve 299/300 (expectativa literal da mensagem anterior da home). Rodada1: atualizar contrato textual intencionalmente alterado e acrescentar aceite da rota principal/trilha, mantendo assertions. Reexecução300/300 em59 arquivos APROVADA. Lint/build antes do ajuste final de CSS aprovados; build final ainda precisa repetir. Browser Perfil/avaliações controladas aprovou3modalidades, restauração/cancelar e layouts1366/390. A revisão apontou risco de clipping em altura600px; wheel nativo confirmou scrollY0. Correção1 de CSS somente main não bastou; inspeção revelou shell ancestral também com overflowhidden. Correção2 condiciona ambos à avaliação não-esquiva sem arena, preservando enquadramento ativo. Reexecução do teste wheel passou nas3modalidades, sem remover assertion. Logs short-before/short-final/short-final-v2 em /tmp/rift-mandate*.log preservam falhas e correção. Essas composições usam motores reais/DOM nativo com renderer/relógio controlados; não são WebGL nem gameplay oficial. Capturas desktop/estreita e resumos foram inspecionadas. Revisão independente sem bloqueios; copy agora diz 'até' seis segundos disponíveis.

Sem scripts/workflows novos de CI: test:profile existente agrega os checks de resumo; smoke existente verifica CTA por Enter nativo e captura home em três larguras. Sem assets/dependências/licenças novas. Bateria completa em andamento; resultados parciais não aprovam o marco.


**M001 fechado:** helper completo6/6 APROVADO com saída0 (/tmp/rift-mandate/full/summary.md), incluindo armazenamento nativo e WebGL/gameplay reais dos cenários existentes. Fullscreen explicitamente EXCLUÍDO. Gate de resumo com wheel600px passou. Revisão independente sem bloqueios. Sem nova evidência remota/hardware.

## E010 — briefing de mobilidade antes do desafio — contrato

**Autoprompt:** jogador iniciante só vê movimento/Espaço/ESC antes do início; Flash/dash/parada são apresentados quando já há pressão. Acrescente briefing enxuto de comandos antes do start, lendo bindings reais com loadPreferences e fallback seguro em storage negado. Explique gesto de mirar cursor, Flash/dash/parada e câmera sem inventar parâmetros. Preserve gating de assets, tempo0, início explícito, ownership/dispose e foco do canvas. Não modifique motor, score, dados ou controles. Aceite: teclas remapeadas, defaults/storage indisponível, início1vez e assetsloading, preparação legível e botão alcançável em 390 px/600 px por rolagem; nenhum comando de combate disparado. Arquivos dodgeReady.js/tests e CSS da preparação; pai integra browser assertions de teclas reais. Validar testes afetados, gates e navegador/revisão. Reversão só do próprio diff se houver regressão; até3 correções por problema. Benefício esperado: jogador aprende mobilidade antes de perder a primeira vida. Próximo corte de maior impacto: série técnica de feixe isolado para ligar contato à prática, exigindo fluxo próprio sem gravação oficial; não será introduzida sem contrato/teste completo.


### E010 — revisão e validação em curso

Briefing lê as preferências validadas pelo mesmo serviço usado no renderer, com fallback em armazenamento negado. Nenhum alcance/cooldown foi duplicado no texto. Revisão independente reproduziu botão retido após dispose iniciando sessão: correção1/3 acrescentou guarda disposed e teste com botão habilitado; reprodução repetida mantém idle/tempo0 e onStart0. A rodada de browser em curso foi interrompida intencionalmente (saída143, não aprovada) para validar o código final congelado. Testes304/59, lint/build APROVADOS depois da correção; audit atual reportou zero vulnerabilidades. Bateria completa foi reiniciada.

Inspeção visual da captura390×600 mostrou fullscreen cobrindo canto do botão, embora o centro passasse no hit-test. Correção delimitada de layout e assertion de canto será aplicada depois de encerrar a bateria em curso, seguida dos checks afetados. Não declarar esse ponto resolvido antes da nova captura.

### Rubrica editorial do marco (0–5, não certificação comercial)

| Dimensão | Nota provisória e evidência | Limite |
| --- | --- | --- |
| Visual | 3: home/diagrama/briefing próprios, capturas desktop/estreita inspecionadas. | Ainda há componentes herdados e acabamento a revisar em uso humano. |
| Usabilidade | 3: CTA real, trilha explícita, resumos recuperáveis e controles ensinados antes de iniciar. | Depende da correção visual/aceite final e teste com iniciantes. |
| Jogabilidade | 3: movimentos, mobilidade e derrotas reais cobertos pelo browser existente. | Sensação física/diversão/balanceamento não medidos. Nenhuma mecânica nova neste marco. |
| Didática | 3: gesto e próximo passo mais claros; conselho explica amostra. | Série isolada de padrão ainda não existe na interface. |
| Progressão | 3: histórico/backup preservados, resumos separados de tentativas oficiais. | Sem equivalência com elo e sem resultado diagnóstico durável das três modalidades. |
| Desempenho | 2: M001 dez remontagens com canvas/RAF limpos; heap pós-aquecimento aumentou657348 bytes nesta sequência. | Chunk714,70kB e GPU/FPS físicos abertos; esse teste não é benchmark universal. |
| Robustez | 4: testes adversariais, storage nativo, guards/dispose e revisão independente. | CI remota/fullscreen/hardware ainda sem nova aprovação. |
| Manutenção | 3: serviços existentes e memória pequena; nenhum sistema paralelo/dependência. | Módulos densos e docs históricos grandes continuam dívida. |

A rubrica orienta decisões, não representa aumento medido de habilidade nem selo premium. O marco é uma candidata incremental da jornada, não conclusão de toda a ambição do mandato.


### Entrega M001/E010 — resultados consolidados

| Verificação | Resultado real |
| --- | --- |
| Base `npm test`/lint/build | APROVADA:296/58 e saídas0 antes de editar. |
| `npm test` final | APROVADA:304 testes/59 arquivos, saída0, sem skips. Inclui motores reais e lifecycle adversarial. |
| `npm run lint` e `npm run build` finais | APROVADAS, saídas0 depois do ajuste visual final; build de 119 módulos, chunk3D714,70kB/187,51kB gzip mantém aviso. |
| `npm audit --cache /workspace/.cache/npm` | APROVADA:zero vulnerabilidades reportadas na consulta atual; nenhuma dependência nova. |
| `CHROME_BIN=chromium QA_ARTIFACT_DIR=/tmp/rift-mandate/delivery-final bash scripts/ci-browser.sh` | APROVADA:6/6, saída0. Antes do último ajuste isolado de camada; conteúdo/gating/novo lifecycle já presentes. |
| `CDP_TIMEOUT_MS=45000 QA_ARTIFACT_DIR=/tmp/rift-mandate/production-dodge npm run test:dodge -- http://127.0.0.1:4173/` | APROVADA, saída0 após ajuste final: roda no buildprodução, controles/avaliação/derrotas/revisão/Perfil e briefing390×600. BindingF real, hit-test centro/canto e zero interseção fullscreen/card. Capturas topo e foco inspecionadas pelo pai e revisor. |
| `CDP_TIMEOUT_MS=45000 QA_ARTIFACT_DIR=/tmp/rift-mandate/production-smoke npm run test:browser -- http://127.0.0.1:4173/` | APROVADA, saída 0, build final: seis rotas, CTA por Enter, três viewports, dez remontagens, presets e zero avisos de sombras removidas. |
| Fullscreen headless | EXCLUÍDA COM JUSTIFICATIVA na bateria, sem alegar API corrigida. Reposição visual do botão não valida transição fullscreen. |
| CI remota, hardware, mouse/DPI físicos, áudio percebido e calibração | NÃO EXECUTADOS nesta rodada; sem publicação. |

E010 foi encerrado com guarda de dispose (1rodada) e layout com faixa reservada para fullscreen (1rodada daquele problema), além do clipping M001 corrigido em2rodadas. Capturas finais confirmaram ação inteira e textos legíveis. Não foram removidos testes ou assertions. Rodada interrompida143 mantém log e não conta como aprovação. Nenhuma mudança de motor/score/curvas/backups nesta entrega.

**Arquivos deste mandato (19), comparados ao inventário inicial:** docs/CURRENT_SCOPE.md, docs/EVOLUTION.md, docs/EVOLUTION_LOG.md, docs/QA.md; scripts/browser-assessment-cases.js, scripts/browser-dodge.js, scripts/browser-profile.js, scripts/browser-smoke.js; src/styles/global.css; src/ui/assessmentMemory.js, src/ui/dodgeReady.js, src/ui/kitingAssessmentScreen.js, src/ui/navigation.js, src/ui/precisionAssessmentScreen.js, src/ui/reflexAssessmentScreen.js, src/ui/screens.js; tests/application.test.js, tests/ui/assessmentMemory.test.js, tests/ui/dodgeReady.test.js. Demais arquivos pendentes pertencem às fases anteriores e foram preservados.

**Teste humano curto:** Node da.nvmrc; em checkout/pacote limpo use npm ci e npm run dev. Abra o endereço exibido no terminal. Na home, siga Começar pela esquiva e leia o kit antes de iniciar; teste movimento/parar/dash/Flash e câmera, termine/reveja um contato. Consulte Perfil. Complete uma avaliação de Precisão/Kiting/Reflexos, volte ao início e retorne: resumo reaparece; refazer/cancelar mantém o anterior; reload limpa somente esses resumos temporários. Verifique teclado, tela cheia real, som e sensação de controle no equipamento do jogador. Não importar/apagar dados pessoais para testar.

## Próximo corte E011 — prática de saída lateral (contrato de retomada)

**Autoprompt:** Reproduza no produto o caminho revisão→prática: hoje a dica de feixe não oferece repetir somente esse gesto. Examine dodgeFocusProfile('sidestep') e motor real já testado. Implemente um corte vertical com série técnica45 s de feixes em dificuldade explicitada, briefing/início manual, pausa/foco, resultado e repetir/voltar; acesso claro no menu e da revisão quando pertinente, sem chamar contato de fraqueza. Sem vidas eliminatórias nem tentativa oficial, pontos, progressão ou writes; tempo/contadores realmente observados e termos honestos para contatos/ameaças resolvidas. Não reabra laboratório genérico removido nem misture versão do histórico. Preserve física/render/input existentes, descarte por geração e acessibilidade por teclado/390px; não introduza métricas de eficácia sem calibração. Antes de editar, confirme os contratos do motor e escreva critérios específicos/arquivos/plano de reversão. Teste45 s,pausa,zeroações,abandono,reinício, callbacks tardios e ausência total de writes/progressão; browser com WebGL/input nativos, previewprodução, armazenamento e revisão independente. Se isolamento exigir mudar formato persistente, pare nesse escopo e proponha compatibilidade. Não prometa continuidade agendada.


**Fechamento verificado:** smoke de produção final APROVADO; revisão independente de capturas/código sem bloqueios para aceitação humana deste corte. Os dois ciclos E004/E009 (M001) e E010 foram implementados e validados; E011 permanece próximo corte, não funcionalidade entregue. SEM AGENDAMENTO AUTÔNOMO. Snapshot local inclui as fases anteriores preservadas, com inventário/reversão disponível; não houve upload, PR, merge ou publicação. Logs/capturas desta rodada copiados para `/workspace/.cache/rift-mandate-20261028/evidence/`; pacote fonte sem dependências/cache/dados de navegador em `/workspace/rift-lab-training-journey.zip`. Uso humano e próximos cortes continuam necessários para a ambição premium; não há selo comercial ou eficácia competitiva comprovada.


## E012 — orquestração recorrente segura — contrato

Pedido explícito confirmado e reforçado pelo texto colado em28/10/2026. Base25acaf9 limpa, branchrift-lab/recurring-qa; trava recurrence-20261028. Seed25acaf9 publicado com sucesso emrift-lab/product-journey; GitAPIghGraphQL retornouForbidden. Nenhuma publicação emmain/deploy.

**Autoprompt:** implemente workflow diário12UTC(09America/Sao_Paulo) e dispatch dry-run/live apenas narefdefault. Controles/prompt/política versionados em.github/automation, actionoficial pinSHAverificado eCLI0.165.0, permission-profile:workspace/drop-sudo, actionúltimastepnojobchave. Agente retornaJSONpatchlimitado como output, sem permissõeswrite/credenciaischeckout. Runnerseparado valida paths/base/modos/hash e roda gates existentes sobusuáriosemprivilégio/semchaves; revisorindependente separado read-only. Publisherconfiável revalida patch e optimisticpush somente branchfixarift-lab/evolution, nuncaexecutacódigo candidato. Semautomerge/Pagesmodificado. Continuidaderecuperaúltimaevolutionaceitaou seedpinned; rejeitaalteraçõesdoscontroles,manifest/lock/scripts/instruções e arquivos especiais. Um ciclo/rodada, três correções dentrodajanela, duas invocações CLI (cada uma pode fazer várias requisições API), timeouts e orçamento porcontagemconservadora mensal; valorUSDéestimativa,nãocapfinanceirocomprovado. Gatessemsecret falhamantescall. Testesestáticos+negativos/dry-runlocal, testesproduto existentes conformeviável; não chamar APIpaga semconfiguraçãoexplícita externa. PRinfra isolado deproduto via commitbase main+somenteinfra; abrir seAPIpermitir, senão linkcompare. Documentar gatilhosdoPagesexistente ao merge e statusimplementado/enviado/secret/execução/agendamento separados. Critérios: nenhumaexecuçãogeradacomcredencialpushouAPI, controlesimutáveisparapatch,corridaabortasemforcepush, ausênciachavenão aprova,dry-runnão chamamodelo,nãoativarporcondiçãoimplícita.


### E012 — implementação, evidências e pendências finais

Integração oficial pesquisada por README/action.yml/security e SDK oficiais. SDK é wrapper da CLI e exigiria manter proxy/isolation próprios; escolhida codex-action pin c05cfd74ad95c626cdf05c6685e62becc3bf7813, com CLI e proxy0.165.0 confirmados no registro npm (SRI fornecido). Tagv1 apontava outrarevisão. Perfil:workspace/drop-sudo e:read-only/drop-sudo disponíveis no action.yml pinado. Página de modelosdevelopers.openai.com retornou403; não se inventou disponibilidade de modelo: policy usa default da CLI fixada. Nenhuma chamada ao modelo/API paga foi executada.

Controladores com testes Git reais validam seed/base/ancestralidade, allowlist/modes/tamanhos, patch canônico, hashes, aprovação e publicação normal em destino fixo. Source nova é retomada da branch evolution, ou seed25acaf9. Outputs JSON limitados permitem a action ser última etapa dos jobs com chave; nenhum exportador é executado naquele host. QA em outro runner/usuário não recebe chave, token/env do runner ou.git; publisher comwrite revalida sem executar fonte. Revisor recebe patch e evidências coletadas. Limitesexternos são timeouts, invocações de CLI e rodadas/tamanho/paths; ciclo/correções são contrato semântico verificado por revisão. USD é estimativa de admissão, não hardcapfinanceiro. Instalação/alertas precisamserconfigurados pelo proprietário uma vez.

Falhas/achados tratados sem enfraquecer checks: lint inicial apontou URLglobal não definido nos.mjs; correção importou URL de node:url sem desabilitarregra. Revisão independente detectou coleta cp-a permitindo linkspara arquivos do runner; coletor novo comopenat/O_NOFOLLOW,fstat,hardlink/mode/size/count/depthlimites e testes de corrida fechaessecaminho. Download das evidências ao revisor foi confirmado. Master ganhou receita no-index para arquivosnovos, pois.git pode serread-only no sandbox. Textos livres do modelo deixam stdout para não virarem comandoslegados do runner. Publicador ganhou helper/testes próprios; fixtures iniciais comHEADbare master foram corrigidas nos testes. O agente principal identificou bypassde rerunparcial reutilizando admissãoprévia; guardsde github.run_attempt1 foram acrescentadas a implement/verify/review/publish, com regressãoestática. Revisor independente confirmou correção. Nenhuma chave foi exposta/testada; nenhumaexecuçãoremota inventada.

| Check desta tarefa | Resultado |
| --- | --- |
| 49 testes Python de patch/coleta/publicação/workflow | APROVADOS. Remotes bare locais cobrem duas rodadas, main intacta, stale base/corrida, hooks/fsmonitor inertes, paths/modos/links/hash e falta de chave. |
| 3 testes Node de admissão | APROVADOS: disabled/dry-run, tetos, defaults seguros, histórico incompleto/403 e rerun/ref inválidos. |
| YAML com PyYAML disponível; bash-n | APROVADOS localmente. Não substituem parsing/execução real do GitHub. Nenhuma dependência do produto foi adicionada. |
| dry-run local | APROVADO como probe sem modelo; model_calledfalse. |
| live sem chave (RIFT_KEY_PRESENTfalse) | FALHA ESPERADA, saída2 antes de qualquer modelo. Não é uma chamada real de API. |
| CHROME_BINchromium bash.github/automation/qa.sh checkout atual /tmp/rift-recurrence-qa | APROVADO, saída0: npmciignore-scripts,304testes/59arquivos,lint,build119módulos,audit0,seis suítes e smokeprodução. Execução local como usuário desta sessão, não comprova UID/sandbox do GitHub. |
| Fullscreen/headless | EXCLUÍDO COM JUSTIFICATIVA; interação/retorno da API em hardware não aprovados. |
| Modelo, chaveAPI real, isolamentoUID/proxy/GHA e reviewCodexremoto | NÃO EXECUTADOS. Exigem configuração externa e evidência do primeiro workflow. |
| Gitpush seed e infra | APROVADOS com refs remotas conferidas; sem pushmain/merge/deploy. |
| PR via gh/API | FALHOU Forbidden. Comparelink entregue para abertura/merge humano único. |
| Schedule | NÃO COMPROVADO/nãoativo: arquivo ainda não está na branch padrão. |

Revisão independente final não encontrou bloqueios estruturais remanescentes, inclusive coletor/publisher/guardsrerun. Produto, persistência, package/lock, scripts existentes, CI e Pages sem diff nesta tarefa. Os totais finais são 49 testes Python e 3 testes Node de admissão, separados dos 304 testes do produto. Evidências locais em /tmp/rift-recurrence*.log e /tmp/rift-recurrence-qa, arquivadas fora do checkout em /workspace/.cache/rift-recurrence-20261028.

Arquivos novos da infraestrutura: .github/workflows/rift-lab-autoevolution.yml; .github/automation/{.gitignore,policy.json,master.md,review.md,candidate.schema.json,review.schema.json,preflight.mjs,control.py,collect.py,publish.py,qa.sh,tests/check_preflight.mjs,tests/test_control.py,tests/test_collect.py,tests/test_publish.py,tests/test_workflow.py}; docs/AUTOMATION.md. Este registro é atualizado apenas na branch de checkpoint, mantendo o PR de infraestrutura separado do produto.


Extensibilidade do QA: o controlador aceita até5cenários nativos adicionais em tests/browser/*.mjs,90s por cenário, somente sob o usuário QA sem chaves, com URL de produção/CDP e pasta de capturas. Assim uma tela/modo novo pode trazer prova visual sem alterar scripts protegidos. Três testes locais do protocolo (fixtures Node sem browser) cobrem argumentos/artefatos, limite antesde execução e propagação de falha. Eles não são evidência de um modo novo nem execução de API. Total final desta execução: 49 testes Python e 3 testes Node de admissão, além dos304testes do produto.

Coletor confiável também foi exercitado com as evidências reais desta rodada, copiando-as para o arquivo local de recuperação sem seguir links; essa verificação não é uma execução remota ou de modelo.

Revisão independente final da extensão de cenários nativos: sem bloqueios;10 testes de estrutura/protocolo e bash-n reexecutados pelo revisor e aprovados. Infraestrutura final publicada em `2ef78d912e5871574932004a6f08326be736a333`, na branch `rift-lab/autoevolution-infra`; nenhuma execução remota do orquestrador é alegada.


## E011 — série técnica de feixes — execução autorizada com R$0

Autoprompt: implemente corte vertical jogável de saída lateral: rota /drill/dodge/sidestep,45s, perfil sidestep nível5 existente, início manual após assets, pausa/foco e resultado com contadores reais de contatos/ameaças evitadas, sem nota/vidas eliminatórias nem writes. Menu esquiva oferece acesso explícito. Preserve física/controles/persistência; resultado deixa claros os limites de amostra, repetir/voltar; dispose/callbacktardio guardados. Teste motor real e UI/rota/ausênciaescrita, navegador+capturas e revisão independente. Não recrie laboratório genérico antigo. Arquivos previstos módulo UI, routes/screens/navigation/CSS/tests. Condição de parada: regressão sem solução após3correções; preservar seed e deixar checkpoint. Em paralelo pesquisa gratuita limitada, sem APIpaga ouserviços novos; R$0 substitui orçamento anterior. Issue2 APIretornou403, não alegar leituraconcluída.


### E011/R$0 — implementação e pesquisa

Issue2 lida na página pública GitHub após REST403. A norma exige R$0 e nãoativarAPI. Seed anterior preservado no Git; módulo novo, rotas/menu e série usam perfil sidestep5 e renderer/motor existentes, sem onStep duplicado. Testesfocados e revisão independente confirmam sessão/pausa/restart/descarte/erro/importtardio. Função de admissão agora bloqueia APIpaga antes de considerar variáveis; testes positivos antigos usam fixture explicitamente autorizada, não política real. GuardR$0 publicado no PRinfra existente(branch) em1fb4f350020a791ff621f2c0136c748ef56be10a. Main inspecionada seguee221ae6 semworkflowrecorrente; nenhumserviçopago ativado.

Pesquisa: READMEoficialCodex confirma loginChatGPT, não gatilho quota; ferramentas nativas de agendamento/Goals não expostas, docsApp/Help403. Ollamaoficial descreve localWindows mashardwareusuário desconhecido; seminstalação/benchmark. READMEatualGeminiCLI avisaqueoferta individual migrouparaAntigravityCLI e nãooferecefree tiernesseCLI; nenhumdireitodecota/contafoicomprovado. CItestessóvalidamcódigo,nãogeramnovasrodadas. Não copiarOAuth, não contornarlimites, não prometer retomada automática. Comparação/citações emdocs/AUTOMATION.md.

Primeironativo E011 emVitedev: APROVADO,45s reais, WebGL, pausacongelada, restart, canvasremovido e contagensIndexedDBiguais. Unidade308/60, lint/build passaram inicialmente. Ao movercaso parahooktests/browser/*.mjs, lintnegou consoleglobal; corrigido importexplícitode node:console sem desabilitarregra. Primeirabateria final foiinterrompida por essa falha(sem aprovação global); reexecução completa emandamento. Capturasreadyeplayingdesktopinspecionadas; resultadoestreito e arenaativa390px aguardam a rodadafinal. Nenhum teste removido.


**E011 fechado:** controladorQA completoAPROVADO, saída0,308testes/60arquivos,lint/build/audit,seisbrowser,smokeprodução e novo nativo45s. Capturasproduçãoready/ativa390×600/resultados1366/390inspecionadas: feixe/personagemvisíveis e açõesacessíveis, semoverflow. Semhardwarefísico/fullscreenaprovado.

## E013 — rever um feixe e praticar o gesto — contrato
Autoprompt: acrescentar CTA direto para /drill/dodge/sidestep na revisão SOMENTE quando há contato sun_beam no intervalo capturado. Não usar ranking de contagem global para inventar diagnóstico; conservar botão repetirnível existente. Exibir como prática opcional de45s, não recomendação de redução de nível nem fraqueza. Removerlink no dispose. Testar positivo/negativo/fora do intervalo/cleanup e teclado/href/layout em browserreplay controlado. Não alterar gravação/scores/dados. Escopo pequeno: replayReview, unitUI e assertion no scriptbrowserreplay. Aceite: semcontato nenhumCTA, umCTA porgravaçãomesmocomváriosfeixes, navegaçãohashcompatível e replaycontrolesanteriorespreservados.


**E013 fechado:**309testes/60arquivos,lint/build finais APROVADOS; replay controlado comWebGL/tecladonativos em1366/390 passou, inclusive Enter no CTA abrindo a preparação real da série e saída semcanvas. Captura estreita do CTA inspecionada. O caso de revisão usa gravação controlada, não tentativa oficial. Smoke geral do build final APROVADO apósCTA; caso45sprodução já aprovado antes, motor e nova série não mudaram neste segundo ciclo. Nenhuma API paga, token ou serviço externo ativado. As falhas intermediárias de lint foram corrigidas sem desabilitar regras.

Arquivos desta rodada: src/ui/dodgeDrillScreen.js, routes.js/screens.js/navigation.js, dodgeReplayReview.js; global.css; tests/ui/dodgeDrill.test.js, dodgeReplayReview.test.js, tests/browser/beam.mjs e scripts/browser-replay.js. Normas/checkpoints: AGENTS.md, docs/CURRENT_SCOPE.md, EVOLUTION.md, EVOLUTION_LOG.md, QA.md e AUTOMATION.md. Proteção R$0: .github/automation/policy.json, preflight.mjs e tests/check_preflight.mjs. Persistência, lockfile e workflows CI/Pages sem diff. Nenhum modelo alternativo foi instalado.

Fechamento: guard e documentação R$0 publicados em `76ef174b0b1d1dea755a9d72e8d189d47e29c44a` no PRinfra; main permaneceu intacta. Evidências arquivadas em /workspace/.cache/rift-beam-20261028. Candidata-fonte em /workspace/rift-lab-beam-practice.zip. Sem agendamento nativo/retomada após franquia comprovados; sem API paga ativada.
