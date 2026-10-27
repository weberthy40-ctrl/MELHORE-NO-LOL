# Revisão rc.9 — foco na esquiva

Pedido: movimento menos pesado, personagem e habilidades mais legíveis, arena mais larga e menos comprida, progressão útil para iniciantes e jogadores avançados. Os outros três treinos mantêm suas regras, suas arenas, suas velocidades e suas apresentações.

## Movimento e espaço

- Arena exclusiva da esquiva: **36 × 28**, em lugar de 26 × 38. Kiting e a prévia genérica continuam usando o layout anterior.
- Movimento **constante de 5,4 u/s** nos dez níveis. A dificuldade muda a pressão das habilidades, preservando a memória muscular. Parar, Flash, câmera livre/travada e Espaço para centralizar continuam disponíveis.
- O clique direito e o Flash da esquiva projetam a posição usando a câmera exibida antes de atualizar uma simulação atrasada. Evita deslocar o ponto clicado com uma câmera que ainda não apareceu na tela. Mudança de direção continua imediata, sem aceleração artificial.
- Câmera e tamanho visual próprios da esquiva. Personagem com 3,45 u de altura visual, roupa em tons de azul, transição de animação mais rápida e passada revisada. O raio de colisão continua em 0,65 u; altura e roupa são cosméticas.
- Novo arranjo de bordas, muros, torres nas extremidades, vegetação e pavimento. O centro permanece livre de obstáculos e enfeites que escondam projéteis.

## Progressão

- Nível 1: disparo e bombardeio, com menor cadência e pista completa. Nível 2 introduz fogo, nível 3 introduz feixe; a gaiola entra a partir do nível 4.
- Pistas completas nos níveis 1–3, breves nos 4–6 e sem linha antecipada dos disparos móveis nos 7–10. Áreas e feixes continuam avisando antes do dano.
- Níveis altos acrescentam padrões de **leque, fogo cruzado e áreas com disparos subsequentes**. Cada lançamento é admitido separadamente, considerando as ameaças já presentes e uma fuga amostrada. Os ataques em andamento não mudam de direção ou velocidade.
- Avisos na borda indicam conjuradores fora da câmera. Um novo sprite pintado para o disparo arcano acrescenta ponta luminosa e rastros; o halo tem tamanho mínimo em pixels. Brilho e rastro não expandem a colisão.
- Os níveis são faixas próprias do treinador. Não há equivalência validada entre nível 10, pressão de 180%, Desafiante ou jogador profissional. O ajuste dos extremos ainda depende de testes com jogadores reais.

## Laboratório avançado

Acesso em Todos os níveis, na tela de escolha da esquiva ou diretamente em `#/practice/dodge`. Os endereços técnicos anteriores continuam funcionando.

- Escolha nível base e pressão máxima de **100–180%**. A prática dura 60 segundos ativos e não limita vidas.
- A adaptação é opcional. Começa em 85% do máximo escolhido, com piso de 75%. Só considera ameaças resolvidas, sem contar projéteis que passaram longe. Com oito resoluções e pelo menos cinco segundos desde o último ajuste, aumenta 8 pontos percentuais se ao menos 7/8 foram evitadas; reduz 12 pontos se no máximo 4/8 foram evitadas. Respeita o teto selecionado.
- Pressão altera a cadência, o limite de ameaças e a velocidade de novos projéteis. Não altera a velocidade do jogador nem ataques já lançados.
- Pausa congela relógio, adaptação, movimento e habilidades. É possível encerrar a prática, analisar, repetir ou mudar a configuração.
- O laboratório não recebe um repositório de dados e não salva tentativas ou classificação. Os modos Normal e Sobrevivência continuam separados e usam pressão fixa.

## Revisão e resultados

- Os últimos **seis segundos**, a até 20 amostras por segundo, ficam em um buffer limitado em memória. Os marcadores indicam contatos na prática e dano válido nos modos com vidas.
- O resultado oferece revisão com seletor de instante e reprodução a 0,25×, 0,5× ou 1×. Reconstitui posições e geometrias da simulação; não é uma gravação de vídeo ou das animações exatas do modelo. Não retoma ou altera a tentativa encerrada.
- Ao abrir a revisão, as métricas dão lugar ao visualizador; as ações centrais continuam visíveis. Sair, fechar a revisão ou reiniciar libera seu renderer e cancela sua animação.
- Uma dica por habilidade mais frequente orienta a próxima tentativa.
- Corrigida a perda de histórico nas derrotas rápidas. `dodge-score-v2` permite registrar a derrota quando ainda não há duas janelas para medir consistência: essa parcela concede zero pontos e é explicitamente sinalizada como sem amostra. Pesos e limite proporcional de exposição permanecem iguais. Vitórias sem amostra suficiente continuam sem pontuação; dados contraditórios continuam rejeitados.
- Registros anteriores de `dodge-score-v1` continuam aceitos. A classificação usa a nova calibração `dodge-v5` após três tentativas oficiais próprias na mesma dificuldade; não mistura essas amostras com as anteriores. Gráficos separam versões e calibrações.

## Validação

- 222 testes em 46 arquivos passaram, incluindo clique contra câmera exibida em quadro atrasado, movimento constante e isolamento das arenas, limites e janelas de adaptação, buffers de revisão, reprodução sem alterar a sessão encerrada, padrões avançados, persistência de derrotas rápidas e compatibilidade de score v1.
- A verificação independente de fuga passou nos dez níveis e próximo dos cantos da nova arena com 180% de pressão. É uma proteção finita, não uma prova de escape em todos os estados possíveis.
- Lint sem avisos e build de produção concluído. O módulo 3D permanece sob demanda e mantém o aviso informativo de tamanho do Vite.
- Chromium: adaptação reduziu pressão de 153% a 141% após os contatos observados; pausa congelou o estado; câmera, parar, Flash e Espaço funcionaram; revisão aceitou busca e reprodução em meia velocidade sem avançar a tentativa. Reiniciar retirou o canvas da revisão. Derrota oficial ficou salva, com ações centrais e revisão disponíveis. Ao voltar ao início não restaram canvases ou RAFs.

- Na produção, os testes dos outros treinos passaram: kite com três ataques, um cancelamento e um abate; precisão com quatro grupos concluídos por cliques nativos e relógio controlado; reflexo com 22 respostas corretas e zero erros de escolha. Nenhuma regra desses modos foi alterada.
- Navegação em cinco rotas, quarenta níveis, quatro diagnósticos, dez reentradas, três modos gráficos e três tamanhos de menu passou. Depois de sair das arenas não restaram canvases ou loops; os limites de resolução permaneceram em 1/1,2/1,5.
- Armazenamento em Chromium com módulos do servidor de desenvolvimento: migração, bloqueio de upgrade, quatro registros antigos, preservação de conflito, rollback e seis conquistas permanentes passaram. O roteiro de armazenamento importa módulos de `src` e não é executável diretamente contra o servidor de produção.
- Os 30 testes específicos de 3D e laboratório foram repetidos após o ajuste da atualização visual ao carregar texturas, e passaram. A cena em Alto carregou personagem, materiais, textura do disparo e cinco habilidades sem erros de execução; é uma captura controlada para inspeção visual, não um benchmark de FPS.

[Ver imagem da arena](media/esquiva-rc9.webp). A captura mostra uma composição controlada de cinco habilidades no mesmo renderizador do jogo, com zoom disponível no controle normal; não representa uma sequência de ataques admitida pelo diretor. A limitação conhecida da API Fullscreen no Chromium headless permanece; aceitação e desempenho em PCs de jogadores continuam precisando de validação manual.

## Próxima recomendação

Antes de criar mais números de nível, calibrar esta faixa com três públicos: quem está aprendendo, jogadores intermediários e jogadores de alto nível. Depois, acrescentar exercícios por objetivo — saída perpendicular de feixes, passos curtos e mudança de direção após a conjuração — usando os contatos do replay para escolher o foco.
