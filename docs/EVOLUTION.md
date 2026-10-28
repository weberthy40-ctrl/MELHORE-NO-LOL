# Evolução do RIFT LAB

## Visão e critérios de decisão

Criar um treinador mecânico acessível e confiável: cada sessão deve ajudar o jogador a observar uma habilidade, praticá-la e entender o resultado. Identidade e conteúdo próprios; nenhuma equivalência com elo, melhoria em partidas ou desempenho físico sem calibração humana. Escopo entregue: [CURRENT_SCOPE.md](CURRENT_SCOPE.md); arquitetura e QA seguem os documentos existentes.

Avalie cinco dimensões: gameplay (resposta e justiça), visual/áudio (legibilidade e feedback), treinamento (métricas e ações úteis), engenharia (estabilidade, acessibilidade e dados), produto (clareza e motivo para voltar). Não é necessário mudar todas em cada ciclo. Novos modos, serviços ou efeitos precisam demonstrar benefício, não apenas aumentar complexidade.

Priorize defeitos reproduzíveis e integridade antes de ampliar recursos. Compare impacto esperado, evidência, risco e esforço; prefira a menor intervenção que resolve a causa. Uma nota baixa não comprova deficiência; uma seed não garante desafios equivalentes se o estado do jogador e os passos da simulação mudarem. Pesquisa externa é opcional quando resolve uma incerteza concreta; estas primeiras decisões usam evidência do repositório.

## Backlog vivo

| ID | Oportunidade e evidência | Impacto / risco / esforço | Estado e aceite |
| --- | --- | --- | --- |
| E001 | `skillRating.js` considera só `mixed` como desafio completo de Reflexos; UI oficial usa `integrated`. | Alto para justiça da classificação / baixo-médio (rating derivado muda) / pequeno | Concluído no E001. Integrado sem redutor simples, legado simples preservado; regra derivada v2, scores/histórico intactos. |
| E002 | `dodgeReplayReview.js` usa spans passivos para impactos; análise exige busca manual no slider. | Alto para feedback e acessibilidade / baixo / médio | Concluído E002. Busca de contatos, teclado, playback corrigido, limites do ring e imports tardios testados. |
| E008 | Contato fatal era descartado pelo gate de 50 ms do gravador; hipótese inicial de ordem da UI foi refutada. | Alto para revisão de derrota / médio (ordem terminal) / médio | Concluído E008: causa no sampling reproduzida; captura terminal real preservada sem alterar combate/score. |
| E003 | Perfil mostra dados/continuar, mas não converte métricas em foco de prática. | Alto para treino / médio (inferências e amostra) / médio | Concluído E003 na Fase 4, evidências no registro. Recomendações explicáveis por contexto, sem misturar versões ou prescrever dificuldade por patente. |
| E004 | Diagnósticos não-esquiva desaparecem ao sair. | Médio / médio-alto (backup e migração) / médio | Concluído em M001: consulta da última avaliação completa na mesma sessão; sem persistência nova. Armazenamento durável adiado até contrato de compatibilidade. |
| E005 | Desafio reproduzível: RNG existe, mas admissão depende de dt e movimento. | Alto / alto / grande | Investigação antes de implementar protocolo; não prometer igualdade só por seed. |
| E006 | Fullscreen headless sem transição até em página mínima; Chrome hospedado ainda não verificado. | Compatibilidade / médio / incerto | Aberto, evidência em PHASE2_VALIDATION. Limite de três rodadas por problema. Aceite Windows externo. |
| E007 | Chunk 3D grande, opção PCFSoftShadowMap removida com fallback. | Engenharia/visual / médio / médio | Fase 4: sombras corrigidas/validadas com PCF suportado e mesmo algoritmo efetivo; bundle permanece aberto. |

| E009 | Entrada genérica não explicava jornada nem distinguia acesso Normal. | Alto primeiro uso / baixo-médio / médio | Concluído M001: briefing, avaliação real como CTA e trilha de prática/revisão. |
| E010 | Flash/dash/parada eram descobertos sob pressão; preparo só ensinava três controles. | Alto primeiro treino / baixo-médio / médio | Implementado: kit com bindings reais, gating e lifecycle reforçado; evidências finais no registro. |
| E011 | Prática deliberada de saída lateral do feixe. | Alto / médio / médio | Concluído: série45s, perfil5, início/pausa/repetição e contadores sem pontuação/escrita. |
| E013 | Ligar contato observado à prática do gesto. | Alto didática / baixo / pequeno | Concluído: CTA de série apenas para feixe no intervalo capturado; teclado/rotas/cleanup validados. |

CI remoto e publicação continuam distintos. Pages independente do novo QA; não mudar gatilhos/publicação sem autorização. O próximo trabalho é escolhido novamente à luz do [registro](EVOLUTION_LOG.md), não por uma fila executada cegamente.

## Continuidade

Use a [skill versionada](../.agents/skills/rift-lab-evolution/SKILL.md). Ela define execução e evidência; este arquivo guarda visão e backlog, e o registro guarda prompts/resultados. Não há daemon, agendamento nem API de orquestração: uma execução Codex realiza ciclos finitos e deixa o próximo pronto. Dados de jogador não pertencem ao backlog.

Mandato vigente: issue #2, orçamento adicional R$0. API paga bloqueada na policy; não há retomada automática comprovada após renovação. Próxima prioridade de produto: feedback contextual de trajetória com evidência de posição, começando por investigação/contrato sem inferir causa de erro apenas do contato.
