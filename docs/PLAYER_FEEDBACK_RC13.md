# rc.13 — leitura das habilidades e espaço de esquiva

O Word enviado foi usado como referência visual de lança, gaiola, disparo arcano, círculo de fogo, raio e orbe sombrio. As imagens do documento não foram distribuídas. Os efeitos são originais e não reproduzem medidas ou regras de um patch específico do LoL.

## Visual e arena

- Projéteis com cabeça sólida, núcleo claro, contorno escuro, rastro curto e marca discreta da colisão. O halo foi reduzido para não esconder a silhueta; o contorno mantém o raio físico.
- Gaiola com borda fina, pilares e cristais; raio aumentado de 4,7 para 6,4 unidades, espessura física de 0,28 para 0,20. O espaço livre considerando o personagem passa de 3,77 para 5,55 unidades de raio.
- Arena de 28 × 44 unidades, antes 32,4 × 25,2: mais estreita e comprida para praticar câmera. Piso de pedras chanfradas instanciadas, sem a textura fotográfica que competia com os disparos. Torres nas extremidades, árvores, pedras e vegetação fora da área jogável.
- Jogador de esquiva usa cavaleiro animado com espada, escudo e capa. Outras modalidades mantêm seus personagens e cenários.

## Curva `dodge-v9`

| Nível | Intervalo-base candidato | Limite de ameaças |
| --- | --- | --- |
| 1 | 0,95 s | 3 |
| 5 | 0,58 s | 5 |
| 10 | 0,30 s | 8 |
| 15 | 0,18 s | 12 |
| 20 | 0,12 s | 16 |

Os valores intermediários são interpolados. A admissão continua exigindo uma rota de fuga encontrada pelo verificador; a cadência não garante que toda tentativa de conjuração seja aceita. Trajetórias completas aparecem somente nos níveis 1–2. Áreas e raios mantêm aviso de pelo menos um segundo.

Habilidades são introduzidas gradualmente: duas nos níveis 1–2; lança e fogo no 3; dardos e raio no 5; novo orbe sombrio no 7; gaiola e chuva de meteoros no 9. O disparo azul tem velocidade máxima reduzida de 26 para 24 unidades/s e o tempo mínimo calculado até contato é 1,05 s nos níveis 1–5, 1 s até o 12 e 0,95 s acima disso. A origem continua externa e aleatória, mirando a posição do personagem na conjuração, independente de cliques e câmera.

Só uma gaiola pode existir, com intervalo mínimo de 6,8 s. Uma janela de conjuração permite esperar as ameaças largas passarem. Dentro da gaiola, novas áreas, raios e lanças largas são rejeitados; há orçamento para dois projéteis estreitos até o nível 12 e três nos superiores. A verificação geral de escape continua aplicada. Isso reduz sobreposições sem espaço útil, mas não promete sobrevivência automática depois de decisões ruins de movimento.

Histórico e pontuação existentes são preservados. A avaliação `dodge-v8` continua liberando o Normal no nível salvo; novas tentativas usam `dodge-v9`. Evidências de progressão de versões diferentes ficam separadas.

## Movimento e entrada

Dash configurável: 2,6 unidades em 170 ms, recarga de 5 s ativos e sem invulnerabilidade. Flash mantém 4 unidades e 15 s. Ao usá-los durante uma caminhada, o personagem continua em direção à posição apontada, evitando a parada involuntária após a habilidade. S interrompe o movimento e o Dash. A câmera travada acompanha a mudança com suavização mais curta; física e colisão continuam no mundo, independentes da câmera.

O menu de contexto é bloqueado durante o treino, incluindo margens do documento em tela cheia. Botões laterais de voltar/avançar também têm o comportamento padrão cancelado nessa área. Clique esquerdo normal e menus fora do treino continuam utilizáveis. A página não controla menus do Windows ou controles externos do Chrome.

Conjuradores são reaproveitados e deixam de ser animados logo após lançar; árvores e pedras usam instâncias. Texto de ajuda e recargas só alteram o DOM quando necessário. São reduções de trabalho, sem declaração de FPS no computador do usuário.

## Pesquisa e licença dos recursos

Foi conferido o repositório oficial [KayKit Medieval Hexagon Pack](https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0), commit `84fa4e91af6a88989be7c99e0891cede11f2ca38`. Sua licença CC0 permite uso pessoal, educacional e comercial. Foram incluídos quatro modelos de natureza e sua paleta, aproximadamente 45 KB, sem dependências novas. Arquivos originais, licença, fonte e hashes estão em `public/assets/kaykit-nature/`. A CC0 é uma licença permissiva; não se pressupõe que qualquer recurso gratuito esteja livre de restrições.

Também foram procurados Kenney, Poly Haven e Quaternius; alguns sites estavam inacessíveis nesta execução. Não foram utilizados recursos sem licença conferida. A licença atual QAL da Quaternius não foi tratada como CC0. Os modelos antigos KayKit mantêm suas licenças e fontes em `public/assets/kaykit/`.

Validação executada e limitações: [VALIDATION.md](VALIDATION.md).
