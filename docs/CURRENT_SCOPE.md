# Escopo atual — rc.14

Treinador web em português, publicado pelo GitHub Pages e voltado a teclado e mouse. Os registros de blocos 001–105 e revisões anteriores são históricos. Consulte [a revisão atual](PLAYER_FEEDBACK_RC14.md) e [a validação](VALIDATION.md).

- Esquiva: 20 níveis, Normal guiado por avaliação salva e progressão por desempenho; Sobrevivência com seleção livre. Três vidas no Normal e uma em Sobrevivência, ambos sem limite de tempo. Nove habilidades de conjuradores externos, Flash, dash, parada, câmera livre/travada e revisão das tentativas. Laboratório e treino sem pontuação foram removidos.
- Precisão: dez níveis, grupos mistos e prioridades ocasionais. O padrão muda após completar o grupo.
- Kiting: dez níveis, combate em ondas com perseguidores e atiradores, vida, dano, morte, cancelamentos e reposição de inimigos.
- Reflexos: dez níveis, teclado, mouse e inibição com cores, texto e símbolos.
- Perfil: pontos de habilidade de 0–10.000, patentes de Ferro a Profissional, média por modalidade e média geral com cobertura explicitada. Histórico, evolução, recordes, conquistas e backup local preservados.
- DPI: medição assistida por distância física e contagens brutas, comparação de configurações; escala do LoL de 0–100, padrão 50.

Avaliação da esquiva tem cinco etapas adaptativas de até 30 s; as outras mantêm etapas de 20 s. Estado de acesso ao Normal é incluído no backup. Toda persistência fica no dispositivo. Não há contas, backend, sincronização, API Riot, placar multiplayer ou telemetria externa.

Arte combina modelos KayKit CC0, texturas originais e efeitos procedurais; as fontes e licenças constam no repositório. Geometria, notas, patentes e níveis são adaptações do treinador, sem equivalência validada ao patch ou ao elo do LoL. Aceitação de fluidez, tela cheia e calibração humana no computador do jogador permanece manual.

A arena de esquiva mede 28 × 44 unidades. Piso mais discreto, cavaleiro animado, efeitos com núcleo sólido e contorno; natureza adicional KayKit CC0 com fonte e licença incluídas. Dash de 2,6 unidades em 170 ms. A curva `dodge-v10` introduz gaiola a partir do nível 9 e limita as combinações enquanto o personagem está dentro dela. Avaliações anteriores e níveis salvos continuam válidos. Início manual sem contagem, enquadramento amplo na preparação e próximo do personagem após começar.

## Evolução local após rc.14

- Classificação derivada `trainer-rating-v2`: Reflexos integrado e misto legado recebem fator de desafio completo; exercícios simples mantêm desconto. Históricos integrados podem mostrar pontos/patentes maiores ao consultar novamente. Scores salvos, janela de classificação e formatos de backup não mudam. A versão derivada também aparece nas outras modalidades, sem alterar seus valores.
- Os ciclos, a visão e o backlog ficam em [EVOLUTION.md](EVOLUTION.md) e [EVOLUTION_LOG.md](EVOLUTION_LOG.md). Não representam publicação ou aprovação de uma nova release.
- Revisão de esquiva: lista cronológica de contatos no trecho capturado, com botões de teclado/mouse para rever um segundo antes (limitado ao primeiro quadro), pausa e seleção visível. Eventos fora dos quadros disponíveis não são inventados. A finalização preserva um quadro terminal real, mesmo entre duas amostras regulares, para incluir o contato fatal no trecho. Revisão continua temporária e não altera a tentativa original.
- A reprodução da revisão começa em 0.5× e pode alternar para 0.25×/1×; o botão de fechar continua acessível durante rolagem da lista de contatos. Validação local e limitações: [registro de evolução](EVOLUTION_LOG.md).
- Captura terminal E008: o gravador finaliza com snapshot/posição/ângulo reais e sela a gravação. Mantém até 121 quadros em seis segundos; mesmo timestamp substitui a amostra sem duplicar nem modificar snapshots anteriores. Encerramento manual usa o último estado real sem acrescentar tempo de pausa.
- Perfil E003: orientação por habilidade baseada somente no último treino válido, com foco, contadores observados, objetivo e CTA. Pisos de amostra/contexto evitam diagnósticos com dados curtos ou legados; não há análise de tendência, dificuldade automática, nova consulta ou escrita. Os limiares são salvaguardas da sugestão, não cortes de pontuação nem calibração de elo.
- Sombras E007: seleção explícita de PCFShadowMap, o algoritmo que Three.js 0.186.1 já usava após fallback. Leve continua sem sombras e Médio/Alto preservam resolução, bias e DPR. O aviso de bundle grande permanece em aberto; não há alegação de ganho de FPS.

- Jornada M001: entrada RIFT LAB com briefing e trilha avaliar → praticar → revisar, mantendo todas as modalidades. Avaliações de Precisão/Kiting/Reflexos completas podem ser consultadas novamente durante a mesma instância da aplicação; refazer/cancelar preserva o último resumo. São temporárias, não tentativas oficiais: reload/descarte limpa a memória, sem alterações de backup.
- Preparação E010: mobilidade e câmera explicadas antes do início, com as teclas remapeadas atuais. O tempo permanece zero durante carregamento e preparação; nenhum comando de combate é emitido pelo briefing.

- Série técnica E011: menu de esquiva oferece saída lateral de feixes,45segundos ativos em padrão fixo de nível5. Início manual, pausa e repetição; sem eliminação, notas, pontos, histórico ou alteração do Normal. Contatos e ameaças evitadas são contadores do motor, não diagnóstico de domínio.

- Revisão E013: contato de feixe presente nos quadros capturados oferece entrada opcional na série técnica; contagens fora do trecho não geram essa entrada nem diagnóstico de fraqueza.
