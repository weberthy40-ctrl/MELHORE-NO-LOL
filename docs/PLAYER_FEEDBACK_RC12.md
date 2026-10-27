# rc.12 — patentes, percurso Normal e vinte níveis

## Pontos e perfil

O perfil mostra uma patente por modalidade e a média geral das habilidades treinadas. O primeiro treino oficial válido já produz pontos; a patente fica provisória até haver cinco amostras por habilidade. A média geral informa cobertura incompleta enquanto faltar alguma das quatro modalidades. Dados indisponíveis não viram zero.

A classificação `trainer-rating-v1` usa as 20 tentativas mais recentes, ordenadas por data e ID, com peso `0,9^i` (i=0 para a mais recente). Não acumula XP. Repetir níveis baixos mantém o teto de pontos daquele desempenho. Todos os registros antigos continuam no histórico e no backup; nenhuma nota salva é sobrescrita.

Cada tentativa usa uma base por dificuldade: `600 + 9400 × ((nível − 1) / (máximo − 1))^0,9`. O máximo é 20 para esquiva e dez para as outras modalidades. As tentativas antigas de esquiva permanecem nos níveis 1–10 da escala atual, sem serem promovidas automaticamente ao patamar 20.

- Esquiva: qualidade = 70% de ameaças evitadas entre resolvidas (incluindo contatos ignorados como contatos) + 30% do tempo ativo, normalizado até 60 s. A amostra alcança peso completo após 30 s e oito ameaças resolvidas.
- Outras modalidades: qualidade = nota salva / 90, limitada a 1. A amostra considera tempo ativo e oportunidades reais: 20 cliques, dez disparos e seis acertos no kite, ou 12 sinais de reflexo. Variantes antigas e exercícios isolados têm fator 0,7; os treinos mistos atuais usam 1.
- Pontos da tentativa = base × qualidade × amostra × fator de contexto. Média da modalidade = média ponderada das tentativas recentes. Média geral = média simples das modalidades que possuem tentativas válidas.

A nota 0–100 da tentativa continua visível. Pontos da patente combinam dificuldade e desempenho e aparecem também no resultado. Patentes são internas ao treinador; não são equivalências ao elo do LoL nem certificação profissional.

| Patente | Pontos mínimos |
| --- | ---: |
| Ferro | 0 |
| Bronze | 600 |
| Prata | 1.400 |
| Ouro | 2.300 |
| Platina | 3.300 |
| Esmeralda | 4.400 |
| Diamante | 5.600 |
| Mestre | 6.800 |
| Grão-Mestre | 7.800 |
| Desafiante | 8.800 |
| Profissional | 9.600 |

## Normal e Sobrevivência

Normal exige uma avaliação completa da nova calibração. As três etapas continuam com até 40 s e três vidas, agora nos níveis 2, 10 e 18. O resultado é persistido e abre o Normal no nível indicado. Entrar por uma URL direta também respeita esse nível. Avaliações parciais, canceladas, inválidas ou sem salvamento não liberam Normal.

O percurso avança um nível após uma tentativa oficial Normal salva com pelo menos 45 s, 12 ameaças resolvidas e 85% de esquivas. Repetir o callback de salvamento não avança novamente. Uma tentativa antiga não altera uma avaliação mais recente. No nível 20, o percurso permanece no máximo. O resumo informa o avanço e oferece o próximo nível. É possível refazer a avaliação no menu.

Sobrevivência continua com uma vida e tempo ilimitado, com seletor livre dos níveis 1–20. Não exige avaliação. Laboratório e treino técnico sem pontuação de esquiva foram removidos; os links antigos abrem o novo menu de esquiva. O replay continua disponível após tentativas pontuadas.

A avaliação e o nível atual entram no backup como preferência versionada. Backups anteriores continuam aceitos; os treinos restaurados compõem as patentes. Sem uma avaliação atual restaurada, Normal pede uma nova avaliação.

## Dificuldade

A calibração é `dodge-v8`. O nível 1 começa com intervalo-base de 0,85 s (antes 1,7 s), até quatro ameaças e três habilidades. O nível 10 alcança intervalo de 0,10 s e até 18 ameaças. Os níveis 11–20 aumentam até intervalo de 0,065 s, capacidade de 20 e combinações de até cinco conjurações incluindo a inicial. Limites são capacidade e cadência candidatas: a admissão ainda rejeita combinações sem uma rota de fuga encontrada pelo teste de segurança.

Velocidade de movimento permanece 5,8 u/s. A chegada dos disparos respeita pelo menos 0,9 s até o contato na posição anunciada. As velocidades máximas da flecha, lança e dardos permanecem 26/18/30 u/s. Áreas e feixes mantêm aviso; previsão de trajetória somente nos níveis 1 e 2. O verificador de segurança também testa um passo curto seguido de parada quando há gaiolas, para considerar esquivas dentro delas.

A dificuldade ainda precisa de calibração humana. Os testes verificam pressão, variedade, limites e rotas de fuga; não estabelecem equivalência com jogadores profissionais.
