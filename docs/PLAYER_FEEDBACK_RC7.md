# Revisão rc.7 — opções escolhidas pelo jogador

Implementação das três escolhas: progressão intensa de esquiva; precisão mista com prioridades ocasionais; ondas mistas de kite com vida, dano e morte. As regras de reflexo permanecem iguais.

## Esquiva

- Níveis 1–3 mostram o caminho durante a preparação. Níveis 4–6 mostram por 0,35/0,25/0,15 s. Níveis 7–10 não desenham a previsão dos disparos móveis. Feixes instantâneos e áreas mantêm aviso antes do dano.
- Intervalo de lançamento de 1,1 s até 0,19 s, capacidade de 3 até 10 ataques pendentes/ativos; combos nos níveis altos encadeiam até três lançamentos, buscando direções diferentes. A admissão continua considerando as formas reais e rotas de escape limitadas.
- Disparos chegam a 41,875 u/s; preparação mínima de 0,30 s para disparos e 0,55 s para feixes/áreas. O aviso do conjurador continua visível, mesmo sem linha de previsão.
- Conjuradores usam dois modelos, cores por habilidade e cajados; fogo tem partículas suaves. Modelos e efeitos são reaproveitados. Corrigida a liberação indevida da geometria global compartilhada por sprites ao descartar um personagem.

## Precisão

- Grupos de 3–8 alvos conforme o nível, variando posições, tamanhos e movimentos: órbita e zigue-zague em dois eixos. As trajetórias ficam em regiões reservadas para evitar sobreposição e os controles continuam fora da área de alvos.
- Dois grupos livres seguidos de um numerado. O próximo alvo fica verde; errar a ordem soma um erro e um erro de ordem, sem retirar o alvo. O grupo muda apenas após completar todos os acertos. Atrasos continuam separados e não apagam alvos.
- Versão `clear-group-v3`, com contagem de grupos, ordem e erros. Os registros anteriores continuam legíveis.
- O clique identifica a posição exibida antes de atualizar uma simulação atrasada; depois verifica o relógio e a identidade do alvo. Isso evita perder cliques por um avanço invisível e rejeita cliques após o encerramento.

## Kite

- Novo contexto de histórico `combat`, preservando os anteriores. Movimento do jogador: 6,8 → 8,42 u/s; intervalo entre ataques: 0,90 → 0,432 s; preparação: 0,27 → 0,153 s.
- Perseguidores correm a 91% da velocidade do jogador. Param para preparar o golpe e só acertam se o jogador ainda estiver ao alcance na confirmação. Atiradores entram gradualmente a partir do nível 3, disparam após preparação e criam projéteis que podem ser desviados com movimento.
- Vida de 100, dano com intervalo mínimo entre contatos, derrota ao chegar a zero. Preparação de ataque, movimento e tiros congelam com a pausa; nenhuma simulação continua após a derrota.
- Derrota abre um diálogo central com vida, dano, ataques, cancelamentos e ações de reinício/menu. Tentativas oficiais encerradas por derrota são salvas; abandono não é salvo. A pontuação de derrota é limitada proporcionalmente ao tempo sobrevivido.
- Classificação pessoal usa referências separadas para combate e treinos anteriores. O diagnóstico mantém vinte segundos para medir ritmo e explicita que não há perda de vida nesse fluxo.
- Barra de vida no personagem, tipos de inimigo visualmente distintos, tiros inimigos e retorno visual/sonoro de dano. Reiniciar restaura vida e recargas.

## Validação

- 208 testes em 43 arquivos passaram. Incluem progressão e pistas visuais por faixa, rotas de escape nos dez níveis, ordem incorreta sem remoção do alvo, órbitas e zigue-zague limitados, ataques evitáveis, pausa, morte, backup de derrota e reinício com vida cheia.
- O teste de clique em quadro lento também verifica que um clique depois do limite de sessenta segundos não soma acerto. ESLint sem avisos; build de produção concluído, mantendo o aviso conhecido de tamanho do módulo 3D.
- Na simulação técnica de sessenta segundos com semente 43 e jogador parado: níveis 1/5/10 emitiram 36/62/124 ataques, com 16/35/98 combinações. São amostras reproduzíveis, não garantia para toda sequência. A simulação do nível 10 levou 75 ms neste executor; o teste de estresse de determinismo recebeu margem de tempo para execução em CI sob carga.
- Chromium com cliques nativos: quatro grupos concluídos, incluindo grupo numerado; acertos, erros e atrasos contabilizados; 22 respostas corretas no reflexo, sem alterar suas regras; ataque, cancelamento, abate e Flash no kite.
- Kite nível 10: derrota por cem de dano recebido, resultado salvo, ações centrais visíveis e reinício com cem de vida. A sequência terminou sem erros de execução.
- Visualização conferida com oito alvos numerados e primeiro destacado. Bundle de produção rc.7 carregou ondas com os dois tipos de inimigo e esquiva nível 10 sem previsão dos disparos; capturas locais e console sem erros.
- Navegação: dez reentradas sem laços ou canvases restantes, três perfis gráficos e três tamanhos de menu. Heap após aquecimento: 11.409.452 → 12.027.104 bytes nesta sequência.
- IndexedDB nativo: migração, bloqueio de upgrade, backup, preservação de conflitos, rollback e conquistas permanentes passaram. Históricos antigos continuam aceitos.
- A limitação já documentada da API Fullscreen no Chromium headless não é alterada por esta revisão. Desempenho e aceitação em outros dispositivos ainda dependem de validação manual.
