# Revisão rc.10 — objetivos e lançamento independente do clique

Pedido: aplicar exercícios por erro, impedir o menu contextual dentro da arena, reduzir proporcionalmente seu tamanho, corrigir a impressão de que as habilidades nascem conforme o clique e aumentar levemente a pressão. Trajetórias antecipadas somente nos níveis 1 e 2.

## Esquiva

- Arena de **32,4 × 25,2**, redução de 10% em ambos os eixos em relação a 36 × 28. Piso, bordas e decoração acompanham a redução. Personagem, controles e velocidade de movimento mantêm suas dimensões e sua calibração.
- O menu contextual do botão direito é cancelado em toda a tela de treinamento de esquiva, incluindo canvas, HUD, controles, resultado e avaliação. O listener é removido ao sair. O botão continua funcionando como comando de movimento.
- Os novos disparos são iniciados somente pela atualização autônoma dos quadros. A atualização física feita entre quadros para processar um clique continua movimentando habilidades existentes, mas não cria outras.
- Cada lançamento sorteia uma origem externa e mira **a posição real do personagem no momento da conjuração**. Removidas antecipação baseada na velocidade, dispersão da mira e reutilização de um alvo antigo nas salvas. Depois de anunciada, a trajetória permanece fixa; não há perseguição do personagem durante o voo.
- As origens buscam separação angular. Perto dos cantos, a preferência por ângulos muito separados é suavizada após tentativas limitadas, evitando que a distância mínima force repetidamente a mesma origem de emergência. O afastamento mínimo de 9 u permanece.
- Os antigos leques foram substituídos por salvas de origens variadas, com cada disparo mirando novamente o personagem. Fogo cruzado e combinações com áreas continuam sujeitos à admissão de uma fuga amostrada.
- A prévia de trajetória dos disparos móveis aparece **somente nos níveis 1 e 2**. Áreas e feixes instantâneos mantêm seu aviso de dano. Indicadores de origem fora da câmera e brilho do projétil continuam visíveis.
- Nos níveis 3–10, intervalo de tentativa reduzido em 10%, velocidade de novos disparos aumentada em 6% e capacidade aumentada em uma ameaça. Não foi reduzida a velocidade do jogador. O laboratório continua limitado a 20 ameaças com pressão máxima de 180%.
- O marcador de movimento da esquiva ficou verde e o retorno de dano ficou vermelho, distinguindo o clique de movimento de uma habilidade.

## Exercícios por objetivo

O laboratório oferece quatro opções em **Objetivo**:

| Objetivo | Prática |
| --- | --- |
| Esquiva mista | Habilidades e combinações normais do nível |
| Passos curtos | Disparos arcanos individuais, para sair da linha e parar quando seguro |
| Saída perpendicular | Feixes, para cruzar sua menor largura durante o aviso |
| Mudança de direção | Salvas de disparos e bombardeios, para responder às conjurações seguintes |

Cada exercício apresenta orientação própria, uma meta orientativa de oito ameaças evitadas e um resumo de esquivas confirmadas, contatos e distância percorrida. A contagem considera ameaças resolvidas; não transforma projéteis pendentes ou contatos em esquivas. A meta não atribui uma nota automática à qualidade do passo ou do ângulo.

O resultado/replay oferece **Treinar: ...** conforme a habilidade que mais causou contatos e abre o objetivo correspondente no mesmo nível. Links diretos, por exemplo: `#/practice/dodge/micro/6`, `#/practice/dodge/sidestep/6` e `#/practice/dodge/direction/6`.

As práticas permanecem em memória, sem nota, conquistas ou histórico oficial. Normal e Sobrevivência usam a nova calibração `dodge-v6`, com amostras separadas das anteriores. Kite, precisão e reflexo mantêm suas regras e sua apresentação.

## Validação

- 231 testes em 47 arquivos passaram. Há verificações novas para mirar a posição do personagem em cada disparo e área, variedade das origens, ausência de novos ataques no processamento do clique, seleção de habilidades por exercício, sugestões do replay e cancelamento do menu no HUD e nos controles.
- As rotas de fuga continuam verificadas independentemente nos dez níveis e próximo dos novos cantos com 180% de pressão. A proteção é finita e não representa uma prova de escape universal.
- Lint sem avisos e build de produção concluído. O módulo 3D continua carregado sob demanda e mantém o aviso informativo de tamanho do Vite.

- Na produção em Chromium, o clique direito nativo foi cancelado tanto no canvas quanto no HUD. Os três objetivos abriram no nível escolhido, emitiram suas habilidades e exibiram orientação e meta. O replay ofereceu um exercício correspondente aos contatos.
- Adaptação, pausa, busca e reprodução em meia velocidade, reinício e encerramento da prática passaram; a derrota oficial foi salva e manteve ações centrais e replay. Sair retirou canvases e loops de animação.
- Os testes dos outros treinos passaram: ataque/cancelamento/abate e morte no kite, quatro grupos de precisão concluídos por cliques nativos com relógio controlado, 22 respostas corretas no reflexo e zero erros de escolha.
- Cinco rotas, quarenta níveis, quatro diagnósticos, dez reentradas, três modos gráficos e três tamanhos de menu passaram. O armazenamento nativo também passou em migração, bloqueio de upgrade, quatro registros antigos, conflito preservado, rollback e conquistas permanentes.
- A limitação conhecida da API Fullscreen no Chromium headless permanece; o teste geral a omite explicitamente com `QA_SKIP_FULLSCREEN=1`. Desempenho e aceitação em PCs de jogadores continuam dependendo de validação manual. Não há equivalência validada entre os níveis deste treinador e elos do LoL.
