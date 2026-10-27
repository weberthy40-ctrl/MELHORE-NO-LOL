# Escala e calibração rc.8

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
| Feixe solar | semilargura 1,00; comprimento 40 | largura 200; comprimento 4.000 | Instantâneo após aviso |
| Bombardeio astral | raio 1,60 | raio 160 | Área após aviso |
| Pilar de fogo | raio 2,50 | raio 250 | Área após aviso |
| Gaiola sombria | raio central 3,50; semiespessura 0,35 | raio 350; espessura total 70 | Borda após aviso |
| Jogador | raio 0,65 | raio 65 | 385–434,5/s na esquiva |

As habilidades são adaptações. O feixe foi estreitado e áreas receberam preparação suficiente para o jogador mais lento. O raio do jogador entra separadamente na colisão. Halos, filamentos, partículas e rastros são cosméticos e não expandem a hitbox. A interface de Configurações mostra a geometria usada pelo treino.

## Pressão

- Esquiva: intervalo de tentativa de 0,95 a 0,13 s; limite de 4 a 14 ameaças, incluindo avisos. Nem toda tentativa é admitida. Os combos avançados podem encadear quatro conjurações buscando direções diferentes.
- A velocidade base do disparo é multiplicada por `1 + 0,075 × (nível − 1)`: 2.000 a 3.350 unidades de referência/s. Preparação mínima de 0,20 s para disparos; 0,78 s para áreas/feixes. O tempo de deslocamento até o jogador se soma à preparação do disparo.
- Antecipação de movimento cresce com o nível. Direção e posição do ataque ficam fixas depois do aviso; mudar de direção continua sendo uma resposta válida. Níveis 7–10 não mostram a linha dos disparos móveis; áreas e feixes instantâneos mantêm aviso.
- A admissão procura rotas retas amostradas durante 2,2 s, usando velocidade e colisão reais, reação de 0,16 s e margem de 0,15. Isso é uma proteção finita, não uma prova de escape universal ou equilíbrio competitivo.
- Kite: movimento 380,5–430/s, perseguidores a 98% dessa velocidade; ataques do jogador de 0,90 a 0,342 s e preparação de 0,25 a 0,115 s. Atiradores antecipam deslocamento no lançamento; ondas chegam a oito inimigos no nível 10, com dano maior e reposição mais frequente. Nível 1 preserva um inimigo por vez.
- Precisão: 4–10 alvos, raio 1,05–0,48 u, movimento até 14,5 u/s; prioridade a cada três grupos nos níveis 1–6, a cada dois nos níveis 7–10. Grupos só mudam depois de todos os acertos. O primeiro acerto isolado continua usando a fórmula escolhida pelo jogador, com aviso de amostra pequena.

A classificação pessoal preserva resultados antigos, mas não mistura amostras entre a calibração anterior e `competitive-v4`, `clear-group-v4` ou `kiting-combat-v4`. Após três sessões novas no mesmo nível, a nova calibração passa a ser a referência. Até lá, a referência anterior pode continuar aparecendo. Gráficos separam as linhas quando muda a calibração ou a versão de pontuação. Estatísticas gerais, recordes e histórico continuam abrangendo todas as versões e devem ser lidos com essa limitação; os detalhes do registro identificam a calibração.
