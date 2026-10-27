# rc.14 — início manual, foco e avaliação adaptativa

## Personagem em movimento

O relato foi esclarecido como partes/sombras tremendo. No modelo animado da esquiva, a recepção de sombras foi desligada para evitar auto-sombreamento instável. A sombra projetada no chão e a iluminação do personagem permanecem. O jogador também deixa de depender de um volume de recorte calculado numa pose parada; isso evita descarte incorreto de partes animadas. As animações e os materiais de base são preservados. A mudança é restrita aos modelos da esquiva.

O teste usa a geometria, esqueleto e clipes do cavaleiro realmente distribuído: alterna corrida, repouso e direção por 120 quadros e confere a posição e limites do corpo. A percepção de cintilação no monitor do jogador continua dependente do teste no seu equipamento; não foi feita medição de FPS nele.

## Preparação e foco

Normal, Sobrevivência e cada etapa diagnóstica entram na arena em estado parado. O botão **Iniciar desafio** é liberado após a visualização carregar. Até o clique não há tempo decorrido, movimento ou ataques. Não existe contagem regressiva nessa entrada; Precisão, Kiting e Reflexos mantêm seu fluxo.

Antes do início, a câmera mostra a arena ampla e o botão de tela cheia fica acessível. Ao iniciar, passa ao enquadramento próximo do personagem (zoom inicial 0,86; visão de preparação 1,7). Os textos grandes, link superior, legenda de ajuda e instruções longas são ocultados durante o jogo. Permanecem vidas/tempo, Pausar, recargas e tela cheia. Pausar revela Sair/abandonar e Encerrar e analisar. Câmera livre, Y, Espaço e zoom continuam disponíveis.

## Avaliação adaptativa

A avaliação nova `dodge-diagnostic-v4` usa cinco etapas de até 30 s, três vidas e início manual em cada etapa. Começa no nível 5. Após demonstrar uma dificuldade, busca um nível superior; após dificuldade não demonstrada, busca um inferior. Todas as etapas têm de seguir essa sequência e usar identidades distintas.

Uma etapa demonstra a dificuldade quando o jogador sobrevive ao menos 24 s, mantém vida, resolve pelo menos seis ameaças e evita ao menos 80% delas. Contatos durante proteção não contam como esquiva; projéteis sem ameaça resolvida não concedem domínio. A recomendação é a maior dificuldade efetivamente demonstrada, sem extrapolar para um nível superior não testado. Sem domínio demonstrado, recomenda nível 1 como ponto de partida provisório.

Exemplos: cinco etapas dominadas percorrem 5, 13, 17, 19 e 20; um jogador que domina até 7 percorre 5, 13, 9, 7 e 8 e começa no 7. Derrotas rápidas fazem o percurso descer para 5, 2, 1, 1 e 1. Resultados incompletos, adulterados ou sem amostra mínima são recusados. Esta recomendação não mede o elo do LoL nem a patente do perfil.

Avaliações anteriores de três etapas continuam legíveis, com suas regras originais. Nível já salvo, histórico, patentes e backups são preservados. Concluir a avaliação nova salva o nível e abre o Normal aguardando o jogador apertar Iniciar. O menu de esquiva permite abrir “Ver minha avaliação” e consultar as etapas, esquivas, impactos e duração observados.

## Pressão e habilidades

Foram mantidas as nove famílias de habilidades, suas silhuetas e os avisos. A curva `dodge-v10` ajusta o intervalo-base para 0,88 / 0,54 / 0,27 / 0,165 / 0,11 s nos níveis 1 / 5 / 10 / 15 / 20. A capacidade permanece 3 / 5 / 8 / 12 / 16. Assim há um aumento moderado na frequência das oportunidades de conjuração, sem acelerar globalmente os disparos.

A admissão por rota de fuga, o tempo mínimo até contato, o raio da gaiola, o orçamento de disparos estreitos dentro dela e os desbloqueios graduais permanecem. Intervalo candidato não é quantidade garantida de ataques aceitos. Evidências das versões v8, v9 e v10 ficam separadas na progressão; os registros antigos continuam acessíveis.

## Próximas melhorias sugeridas

- Desafios com sequência reproduzível para comparar evolução em condições iguais, acompanhados dos treinos aleatórios habituais.
- Sessões curtas recomendadas automaticamente pelas habilidades que mais causaram impactos, sem uma tela de configuração complexa.
- Calibração com jogadores de diferentes níveis e equipamentos: validar curva, diagnóstico e desempenho antes de associar resultados a faixas competitivas.

Resultados executados: [VALIDATION.md](VALIDATION.md).
