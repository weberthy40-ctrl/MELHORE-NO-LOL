# Escopo atual — rc.13

Treinador web em português, publicado pelo GitHub Pages e voltado a teclado e mouse. Os registros de blocos 001–105 e revisões anteriores são históricos. Consulte [a revisão atual](PLAYER_FEEDBACK_RC13.md) e [a validação](VALIDATION.md).

- Esquiva: 20 níveis, Normal guiado por avaliação salva e progressão por desempenho; Sobrevivência com seleção livre. Três vidas no Normal e uma em Sobrevivência, ambos sem limite de tempo. Nove habilidades de conjuradores externos, Flash, dash, parada, câmera livre/travada e revisão das tentativas. Laboratório e treino sem pontuação foram removidos.
- Precisão: dez níveis, grupos mistos e prioridades ocasionais. O padrão muda após completar o grupo.
- Kiting: dez níveis, combate em ondas com perseguidores e atiradores, vida, dano, morte, cancelamentos e reposição de inimigos.
- Reflexos: dez níveis, teclado, mouse e inibição com cores, texto e símbolos.
- Perfil: pontos de habilidade de 0–10.000, patentes de Ferro a Profissional, média por modalidade e média geral com cobertura explicitada. Histórico, evolução, recordes, conquistas e backup local preservados.
- DPI: medição assistida por distância física e contagens brutas, comparação de configurações; escala do LoL de 0–100, padrão 50.

Avaliação da esquiva tem três etapas de até 40 s; as outras mantêm etapas de 20 s. Estado de acesso ao Normal é incluído no backup. Toda persistência fica no dispositivo. Não há contas, backend, sincronização, API Riot, placar multiplayer ou telemetria externa.

Arte combina modelos KayKit CC0, texturas originais e efeitos procedurais; as fontes e licenças constam no repositório. Geometria, notas, patentes e níveis são adaptações do treinador, sem equivalência validada ao patch ou ao elo do LoL. Aceitação de fluidez, tela cheia e calibração humana no computador do jogador permanece manual.

A arena de esquiva mede 28 × 44 unidades. Piso mais discreto, cavaleiro animado, efeitos com núcleo sólido e contorno; natureza adicional KayKit CC0 com fonte e licença incluídas. Dash de 2,6 unidades em 170 ms. A curva `dodge-v9` introduz gaiola a partir do nível 9 e limita as combinações enquanto o personagem está dentro dela. A avaliação salva de `dodge-v8` continua válida.
