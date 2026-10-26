# Feedback registrado para a revisão rc.5

- Kiting: corrigir cancelamentos; inimigos com vida, dano por acerto, morte e reposição. Começar com um e aumentar sobreposição/quantidade/velocidade com o nível. Nível 1 sequencial; níveis maiores podem adicionar inimigos antes da morte do atual.
- Precisão: um modo misto; alternar parado, móvel e grupos de forma aleatória, com velocidade, tamanho e prazo controlados pelo nível.
- Reflexo: um modo integrado de teclado e mouse, sem setas; cores e símbolos para clicar com esquerdo, direito ou não responder.
- Esquiva: reduzir velocidade do jogador; origens acompanharão o jogador no mundo, independentemente da câmera. Preservar controles de câmera aprovados.
- Arena: botão de tela cheia; reduzir travamentos, especialmente na qualidade alta.
- Mobilidade: Flash e parar com S; teclas configuráveis. Flash de treino: 4 unidades e 15 segundos ativos de recarga.
- Mapa: corredor mais largo; uma torre central em cada extremidade.

Dados anteriores continuam legíveis; modalidades antigas permanecem como contextos de histórico. Os modos novos são apresentados no fluxo de treino, com referências próprias de classificação.

## Comportamento implementado

- **Kiting:** cada ataque confirmado retira um ponto de vida. Movimento, parada ou Flash durante a preparação cancelam uma única vez. O relógio é atualizado antes de receber o comando, para que o tempo anterior ao clique não consuma a preparação. Nível 1 mantém um inimigo por vez; o 2 permite reposição em grupo após abates; a partir do 3 pode entrar outro quando o atual está perto da morte; a partir do 4 também há pressão por tempo. Limite de 1–6 inimigos, conforme o nível; vida e velocidade aumentam gradualmente.
- **Precisão:** a cada 4,2–6 segundos ativos troca entre os quatro padrões, em uma ordem aleatória que inclui todos antes de repetir. Grupos têm 2–5 alvos; o nível controla tamanho, velocidade e prazo. Expirações continuam separadas dos cliques errados.
- **Reflexos:** Q/W/E/R, Espaço, F/J, cliques esquerdo/direito e inibição formam a mesma sequência. Verde, azul e vermelho incluem texto e símbolos. As setas saem dos treinos novos; sessões antigas continuam consultáveis.
- **Esquiva:** velocidade 8 u/s (antes 11). Novas origens seguem a posição do jogador, mesmo nas bordas; projéteis em voo mantêm suas trajetórias no mundo. Movimento da câmera não altera a simulação.
- **Mobilidade:** S interrompe movimento e preparação; D usa Flash em direção ao cursor, limitado a 4 unidades e às bordas, com recarga de 15 segundos ativos. Pausar congela a recarga. O deslocamento do Flash não conta como caminhada nem percorre colisões intermediárias. As duas teclas podem ser trocadas nas Configurações.
- **Arena:** largura jogável de 18 para 26 unidades e uma torre central em cada extremidade. Botão de tela cheia na própria arena; reiniciar mantém a tela cheia.
- **Desempenho:** inimigos derrotados são reaproveitados visualmente, sombras atualizam no máximo 20 vezes por segundo e usam mapas menores; resolução interna limitada a 1×/1,2×/1,5× nos três perfis. Cenas encerradas ou pausadas deixam de redesenhar continuamente. Médio é o padrão para instalações novas. Sem promessa de FPS: GPU, navegador e dispositivo ainda influenciam.

- Pedido complementar: Espaço centraliza a câmera no personagem na esquiva e no kiting, sem travar a câmera, mudar o zoom ou cancelar o movimento. Teclado de reação permanece independente. Espaço é reservado para a câmera nas arenas com movimento.

## Evidência de validação

- 188 testes automatizados passaram, incluindo sessões completas de 60 segundos dos três modos novos, dano e ondas, cancelamentos entre quadros lentos, Flash com pausa, diversidade dos alvos, cores/inibição e registros anteriores.
- ESLint sem avisos e build de produção concluído. O empacotador mantém o aviso conhecido sobre o tamanho do módulo 3D (Three.js).
- A validação nativa da API Fullscreen permanece pendente: neste Chromium headless, até um botão isolado fora do jogo deixa `requestFullscreen()` pendente. O teste de ciclo de vida cobre entrada, saída, limpeza e preservação ao refazer a arena; o teste de navegador pode ser executado com `QA_SKIP_FULLSCREEN=1` apenas para contornar esta limitação explícita do executor.
- Chromium nativo: cancelamento com S, dano/abate/reposição por cliques no chão, Flash, os quatro padrões de precisão e os 22 sinais da prática integrada passaram. Os três sinais coloridos foram apresentados; 22 respostas corretas, incluindo quatro inibições. Nenhum erro de execução na sequência, inclusive ao mover a câmera livre na esquiva.
- Navegação: dez reentradas sem laços ou canvases restantes, três qualidades gráficas e menus em três tamanhos de tela. Heap após aquecimento: 11.230.624 → 11.831.716 bytes nesta sequência.
- IndexedDB nativo: migração, bloqueio de upgrade, backup, conflitos, rollback e conquistas permanentes passaram.
- Build de produção servido localmente: versão rc.5 carregou e o Espaço centralizou a câmera livre durante a esquiva, sem erro de execução.
