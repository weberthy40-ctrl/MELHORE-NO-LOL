# Revisão da experiência — 1.0.0-rc.2

Revisão solicitada após o primeiro teste do site pelo jogador.

- Início e menus com hierarquia nova, acesso direto aos quatro treinos, cores e cartões consistentes. Perfil concentra nível, treinos e melhor nota em quatro cartões; histórico e explicação ficam acessíveis por links/detalhes.
- Treinos ocupam todo o viewport, sem cabeçalho do site. Controles sobrepostos recolhem seletores durante a sessão; resultados abrem sobre a arena.
- Câmera de jogo próxima, voltada ao corredor. Chão original pintado por textura, pedras, árvores e tochas; cenário estático agrupado por instâncias para reduzir draw calls. Personagens arredondados e articulados com capa, equipamento, indicador de seleção e barra visual de identificação. A barra identifica a unidade; kiting continua sem simulação de dano/HP.
- Movimento: 7 → 11 u/s. O loop processa até 0,5 s de atraso com subpassos de até 50 ms e desenha uma vez por quadro. Assim, quedas moderadas de FPS não descartam o tempo do treino; foco/visibilidade continuam pausando explicitamente.
- Esquiva: intervalos de 1,1 s no nível 1 a 0,28 s no 10, capacidade 3 → 8, velocidade dos projéteis multiplicada por 1,3 → 2,065. Níveis altos antecipam parte do movimento. O lançador aparece mais perto, em z = −10. A verificação de rota de escape usa a velocidade real de movimento; não substitui calibração humana.
- Precisão: cenário independente com paleta sorteada, alvos de raio 1,15 → 0,70; velocidade móvel 4 → 11,2 u/s; prazo de 1,6 → 0,655 s antes de reposição. Expirações são contadas à parte, sem inventar cliques nem mudar a fórmula de pontuação aceita anteriormente. Um único acerto ainda pode render nota alta pela precisão; o aviso de amostra pequena permanece.
- Kiting: primeiro clique prepara o ataque; A + clique admite alvo próximo do cursor. Perseguidor abre por padrão, a 4 → 6,7 u/s. Intervalo de ataque 0,85 → 0,625 s, preparação 0,22 → 0,166 s. Movimento antes da confirmação cancela; depois dela permite reposicionamento. Alvo parado e móvel permanecem como exercícios específicos.
- Reflexo: novo desafio misto com Q/W/E/R, Espaço, F, setas e sinais de inibição. Prática de 18 sinais em blocos equilibrados; treino oficial de 60 s e avaliação de 3 × 20 s também usam esse desafio por padrão. As quatro variantes antigas mantêm suas configurações para validar registros anteriores. O nível pessoal usa três sessões mistas por dificuldade quando disponíveis, com reação simples como referência anterior, sem misturar as amostras.

## DPI

O foco passa a ser medir e comparar DPI, sem supor que a escala de velocidade do LoL seja um multiplicador linear.

1. Medição assistida: usuário marca uma distância física (2–50 cm; padrão 10 cm), solicita captura bruta com `unadjustedMovement`, desloca o mouse e encerra com Espaço. `DPI = |soma das contagens X| × 2,54 / distância em cm`. A mediana de três passagens é a estimativa. Retorno superior a 10%, desvio vertical superior a 20% ou falta de entrada bruta rejeitam a passagem. Variação total superior a 8% pede repetição. O navegador não verifica a régua nem identifica sozinho o DPI do hardware.
2. Comparação: dez alvos por rodada, tempo e distância do primeiro usados como aquecimento, com erros contados na rodada inteira. Para os nove deslocamentos seguintes, `ID = log₂(1 + distância / diâmetro)`; `índice = soma de ID / segundos × precisão²`. Comparamos a mediana de três rodadas por DPI, em pelo menos dois valores, com mesma área, DPR e velocidade de referência no LoL. Vantagem inferior a 5% resulta em empate. Não há afirmação de significância estatística nem de DPI ideal universal.
3. Velocidade do LoL: 0–100, padrão 50. O campo registra a referência no jogo; não altera a velocidade do ponteiro do navegador. DPI deve ser aplicado no software do mouse, e a recomendação local deve ser confirmada no LoL.

Registros oficiais e backups anteriores permanecem legíveis, sem apagar ou recalcular tentativas. Alterações de câmera, velocidade e dificuldade limitam a comparação direta entre resultados das versões rc.1 e rc.2.

## Validação

Testes de domínio cobrem medição/rejeições de DPI, comparação com repetição e condições iguais, expiração sem cliques fictícios, sequência mista oficial salvável e avanço de movimento/tempo a cinco FPS. Conferência visual e testes Chromium verificam viewport, cliques e navegação. A medição física com régua e o balanceamento com jogadores precisam de teste humano em computador; não são comprovados pelo navegador automatizado.
