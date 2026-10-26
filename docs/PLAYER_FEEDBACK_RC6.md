# Revisão rc.6: habilidades, grupos de precisão e ritmo do kite

Pedidos: tirar os impactos imediatos perto do personagem; colocar conjuradores fora da arena, mirando a região do jogador; ampliar a legibilidade e variar as habilidades; mudar o padrão da precisão apenas após acertar todo o grupo; acelerar os perseguidores e desacelerar o jogador, mantendo as ondas aprovadas.

## Comportamento

- Conjuradores em posições aleatórias no perímetro externo, a pelo menos 9 unidades do jogador no momento do lançamento. Os personagens usam cajado, animação de conjuração, runa e esfera de energia. Origens e alvos anunciados não mudam com a câmera nem perseguem o jogador depois do aviso.
- Cinco formatos próprios inspirados nos exemplos: disparo arcano linear (Q do Ezreal), feixe solar (R da Lux), bombardeio astral (R do Xerath), pilar de fogo (W do Brand) e gaiola sombria (E do Veigar). São adaptações para treino; arte e parâmetros próprios.
- Todo ataque novo tem aviso sem dano. Explosões e gaiolas anunciam a área antes de ativar; a gaiola só causa contato na borda, mantendo o centro seguro. O disparo linear tem 1 unidade de largura e o feixe, 1,8; as áreas têm raios de 2,1/2,5 e a gaiola, 3,2. Velocidade, intervalos e preparo mudam com o nível, preservando um aviso mínimo de 0,48 s para o disparo e 0,8 s para os demais formatos.
- A admissão considera ataques pendentes e ativos, com sondas de escape, bordas da arena e o formato real das colisões. Isso é uma verificação limitada de rotas, não uma prova de que qualquer sequência futura é evitável.
- Formas de colisão: círculo em movimento, feixe com espessura, círculo de impacto e anel. Aviso, dano e expiração são etapas separadas; varreduras consideram apenas o trecho do quadro em que a habilidade realmente estava ativa. Pausar congela os avisos.
- Precisão: o grupo permanece até acertar todos. Cliques fora somam erros e não mudam a sequência. O prazo marca cada alvo como atrasado uma única vez, sem apagá-lo. Alvos atrasados ficam alaranjados; acertos, erros, atrasos e quantidade restante aparecem separadamente. O próximo padrão é sorteado ao limpar o grupo.
- Kite: jogador de 11 para 8 u/s; perseguidores de 3,5–6,2 para 4,5–7,65 u/s. Surgimento, vida e sobreposição das ondas preservados. A nova configuração é versionada, e registros de ondas da rc.5 continuam válidos.
- Conjuradores e efeitos são reaproveitados, com limites finitos. A arte dos modelos continua sendo KayKit CC0; acessórios e efeitos são locais, sem serviços externos durante o jogo.

## Validação

- 196 testes em 41 arquivos passaram. Incluem espera sem dano, gaiola com centro seguro, espessura do feixe, colisão de disparos rápidos, pausa, origem externa nos cantos, manutenção do grupo até acertar tudo e compatibilidade dos registros de ondas da rc.5.
- A regressão dos dez níveis usa uma amostragem independente das cinco formas para verificar uma rota de escape nas admissões testadas; simultaneidade permanece limitada pelo nível.
- ESLint sem avisos e build concluído. Permanece o aviso conhecido do empacotador sobre o tamanho do módulo Three.js.
- Chromium com entrada nativa: quatro grupos de precisão completados por cliques reais, com quatro padrões distintos; erros e atrasos contabilizados; 22 respostas corretas no reflexo; abate, reposição, cancelamento, Flash e câmera no kite/esquiva sem erro de execução.
- A conferência da precisão encontrou e corrigiu alvos na faixa dos controles: a projeção agora reserva o topo da arena. Os alvos permanecem na área de clique abaixo do cabeçalho.
- Visualização das cinco habilidades e conjuradores conferida em capturas locais; exercício técnico real executado com os novos ataques, sem erros de execução.
- Navegação: dez reentradas sem canvases nem laços restantes; perfis Leve/Médio/Alto e menus em três tamanhos. Heap após aquecimento nesta sequência: 11.286.492 → 11.892.920 bytes.
- IndexedDB nativo: migração, bloqueio de upgrade, backup, conflitos, rollback e conquistas permanentes passaram.
- Bundle de produção rc.6 servido localmente: uma derrota Normal com três impactos chegou ao resumo, salvou o resultado no banco local de QA e manteve “Jogar novamente” e “Voltar ao menu” visíveis no centro.
- A limitação anterior da validação nativa de Fullscreen no Chromium headless continua fora do escopo desta revisão. Não se declara FPS garantido em outros dispositivos.
