> Calibração atual: rc.14 / `dodge-v10`, vinte níveis e patentes. Consulte [PLAYER_FEEDBACK_RC14.md](PLAYER_FEEDBACK_RC14.md). Os números históricos abaixo não substituem a configuração atual.

> Atualização rc.11: as alterações de velocidade, gaiola, modos e nota estão em [PLAYER_FEEDBACK_RC11.md](PLAYER_FEEDBACK_RC11.md). Os valores abaixo descrevem a rc.10, não a calibração atual.

# Escala e calibração rc.10

O projeto usa **100 unidades de referência do LoL para 1 unidade da arena**. É uma convenção explícita do treinador: não reproduz a câmera, o cliente ou todas as regras de colisão da Riot. Não há integração com partidas ou instalação do LoL.

## Fonte e limites

Não foi possível acessar os dados do patch atual neste ambiente. Foi consultada uma [base histórica da comunidade, fixada no commit 3dbccd6](https://github.com/Esk0r/LeagueSharp/blob/3dbccd6b85dce14b0428dba8cda00aa7c9cf40b2/Evade/SpellDatabase.cs). O arquivo não oferece garantia de compatibilidade com o patch atual. Foram usados apenas os números literais como referência de dimensões e velocidade; nenhum código ou funcionalidade de automação foi incorporado.

| Referência histórica | Campo literal | Valor histórico | Preparação histórica |
| --- | --- | ---: | ---: |
| Ezreal Q | Radius / MissileSpeed | 60 / 2.000 por segundo | 250 ms |
| Lux R | Radius | 190 | 1.000 ms |
| Xerath R | Radius | 130 | 700 ms |
| Brand W | Radius | 260 | 850 ms |
| Veigar E | RingRadius / Radius | 350 / 80 | 500 ms |

`Radius` nessa tabela é o literal da base histórica. Alguns consumidores dessa base adicionavam a hitbox do campeão e margens; esses acréscimos não foram importados. Não interpretar os números como medições oficiais atuais.

## Dimensões efetivamente usadas no treinador

| Habilidade própria | Geometria real | Equivalente na escala de referência | Velocidade base |
| --- | --- | --- | --- |
| Disparo arcano | raio 0,60 | largura 120 | 2.000/s |
| Feixe solar | semilargura 1,00; comprimento base 40 | largura 200; comprimento base 4.000 | Instantâneo após aviso |
| Bombardeio astral | raio 1,60 | raio 160 | Área após aviso |
| Pilar de fogo | raio 2,50 | raio 250 | Área após aviso |
| Gaiola sombria | raio central 3,50; semiespessura 0,35 | raio 350; espessura total 70 | Borda após aviso |
| Jogador | raio 0,65 | raio 65 | 540/s constantes na esquiva |

As habilidades são adaptações. O feixe foi estreitado e áreas receberam preparação suficiente para o jogador mais lento. O raio do jogador entra separadamente na colisão. Halos, filamentos, partículas e rastros são cosméticos e não expandem a hitbox. A interface de Configurações mostra a geometria usada pelo treino.

## Pressão e adaptação na rc.10

A arena exclusiva da esquiva mede 32,4 × 25,2 (redução proporcional de 10% em relação à rc.9). Kiting e a prévia genérica mantêm a arena 26 × 38 e suas configurações da rc.8.

- A velocidade do jogador é uma adaptação deliberada para a agilidade do treinador: 5,4 u/s em todos os níveis. A altura visual de 3,45 u não é uma medida de colisão ou uma dimensão física de um campeão do LoL.
- Esquiva fixa: intervalo de tentativa de 1,70 a 0,108 s; limite de 2 a 17 ameaças, incluindo avisos. Nem toda tentativa é admitida. Os níveis iniciais introduzem habilidades gradualmente; os altos misturam salvas de origens variadas, fogo cruzado e áreas com disparos subsequentes.
- Multiplicador de velocidade do disparo: `0,72 + 0,14 × (nível − 1)`, com fator adicional de 1,06 nos níveis 3–10, aplicado à base de 20 u/s: 1.440 a 4.197,6 unidades de referência por segundo. O aviso mínimo permanece em 0,20 s para disparos e 0,78 s para áreas/feixes. O percurso até o jogador soma tempo à preparação. Conjuradores ficam fora da arena e a pelo menos 9 u no instante de um novo lançamento.
- No laboratório, pressão `P` entre 1 e 1,8 divide o intervalo por `P` e multiplica a velocidade de novos projéteis por `√P`. O limite é `min(20, ceil(capacidade_base × √P))`. Ataques já lançados e a velocidade do jogador ficam fixos.
- Com adaptação opcional, a pressão inicial é 85% do máximo selecionado, com piso de 75%. Oito ameaças resolvidas e intervalo mínimo de cinco segundos permitem um ajuste: +8 pontos percentuais quando ao menos 7/8 são evitadas, −12 quando no máximo 4/8 são evitadas. O ajuste respeita o piso e o teto. Projéteis que não ameaçaram o jogador não entram nessa amostra.
- A origem é sorteada no perímetro e varia entre lançamentos. O alvo é a posição real do personagem no momento da conjuração; não há antecipação por velocidade, alvo no cursor ou deslocamento lateral intencional da mira. Depois disso, direção e posição anunciadas ficam fixas. Somente os níveis 1–2 mostram a linha dos disparos móveis; áreas e feixes mantêm aviso. Setas discretas indicam conjuradores fora da câmera. O feixe pode ser alongado além de sua base para atravessar a arena até o alvo anunciado.
- A admissão procura rotas retas amostradas durante 2,2 s, usando velocidade e colisão reais, reação de 0,16 s e margem de 0,15. Isso é uma proteção finita, não uma prova de escape universal ou equilíbrio competitivo.

A classificação de esquiva usa `dodge-v6` após três sessões oficiais próprias no mesmo nível. Até lá, a referência anterior pode aparecer. O laboratório é uma prática separada e não altera o perfil. Os registros e backups anteriores permanecem legíveis; gráficos separam versões e calibrações. Estatísticas gerais e recordes históricos ainda abrangem todas as versões, identificadas nos detalhes.

A rc.10 não altera precisão (`clear-group-v4`), kite (`kiting-combat-v4`) ou reflexo. Suas calibragens constam da [revisão rc.8](PLAYER_FEEDBACK_RC8.md).
