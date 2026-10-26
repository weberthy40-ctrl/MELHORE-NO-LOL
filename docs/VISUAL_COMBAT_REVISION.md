# Visual e combate — 1.0.0-rc.3

## Controles de kiting

- Esquerdo em qualquer ponto do chão solicita um ataque, sem exigir A ou clique no corpo do inimigo. Entre os inimigos dentro das 5 unidades de alcance, escolhe o mais próximo do ponto clicado. Se não houver candidato, mostra “Nenhum inimigo no alcance”; não inventa ataque ou acerto.
- Direito move o jogador. Antes da confirmação, cancela a preparação do ataque; depois dela, permite reposicionar sem apagar o ataque confirmado.
- A somente exibe o alcance enquanto pressionado. Soltar a tecla, perder foco ou pausar remove o indicador.
- Um clique aceita um ataque a um único inimigo. Spam não ignora o intervalo; o alvo fica fixo durante a preparação. O projétil visual segue o inimigo escolhido. As métricas continuam contando a confirmação como acerto garantido, sem simular HP ou dano.
- População por nível: **2, 2, 3, 3, 4, 4, 5, 5, 6, 6**. Na variante de perseguição, todos seguem o jogador; velocidade permanece de 4 a 6,7 u/s, abaixo das 11 u/s do jogador. Separação local reduz sobreposição. Parados e móveis também usam a quantidade do nível.

## Esquiva

O lançador fixo foi removido. Cada projétil linear escolhe uma origem sorteada ao redor do jogador, dentro dos limites visuais do corredor, entre 7,5 e 11,5 unidades de distância. Há no máximo 12 tentativas por geração; posições inválidas ou sem rota de fuga são rejeitadas, sem forçar um disparo. Áreas continuam usando sua própria admissão para não nascerem sobre o jogador.

Depois de lançado, o projétil mantém sua direção. Portais cosméticos marcam a origem por um instante; não causam colisão. Cabo de gancho e indicadores de área também são visuais. O teste independente de escape continua verificando os dez níveis.

## Arte e desempenho

Arqueiro de capuz para o jogador; cavaleiros com espada, escudo e animações de corrida para os inimigos. São modelos **KayKit / Kay Lousberg, CC0-1.0**, dos pacotes Adventurers e Dungeon Remastered. Não são modelos da Riot. Fontes, commits e SHA-256 estão em `public/assets/kaykit/SOURCES.json`; os dois textos de licença acompanham os arquivos.

Os GLBs de personagens foram reduzidos de aproximadamente 3,6 MB para 0,48/0,54 MB cada, preservando quatro animações e eliminando buffers de animações não usadas. Sete modelos totalizam aproximadamente 1,23 MB e são servidos pelo próprio site, com texturas incorporadas. Não há dependência de CDN externo. O cache de templates é limitado a esses sete modelos; cada instância possui geometria, materiais e esqueleto próprios, liberados ao sair.

Chão pintado com pedras menores e selo central; canais laterais com movimento de água; árvores e vegetação instanciadas; pilares, bandeiras, muros e ruínas. Sombras: Alto 2048 px, Médio 1024 px, Leve sem sombras e com menos ruínas. Movimento da água e animações usam o mesmo loop da sessão, sem RAF extra. Se os modelos não carregarem, a representação procedural mantém o treino utilizável. A opção de redução de movimento congela as animações dos personagens.

Os registros anteriores permanecem legíveis. Registros de kiting sem `targetCount` mantêm o contexto anterior; novos registros guardam a população do nível. Dados e pontuações anteriores não são recalculados. Compare versões e contextos equivalentes.


## Legibilidade e resumo — 1.0.0-rc.4

Projéteis móveis usam cores sem influência da iluminação, contorno escuro, centro claro e rastro proporcional à velocidade. O halo tem pelo menos 26 pixels de diâmetro, calculado pela projeção da câmera; é um indicador visual, não a área de colisão. Efeitos móveis são desenhados sobre personagens e cenário para não desaparecerem atrás deles. Raios, velocidades e regras de colisão permanecem os mesmos.

Ao terminar Normal ou Sobrevivência, o resumo abre como diálogo modal. Jogar novamente e Voltar ao menu saem do HUD e passam ao rodapé do resumo. A área de métricas tem rolagem própria, mantendo as ações visíveis; foco inicial no replay e navegação por teclado dentro do diálogo. O HUD atrás fica oculto até a próxima tentativa.
