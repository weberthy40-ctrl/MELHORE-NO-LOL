# Revisão rc.8 — dificuldade e acabamento visual

Pedido: elevar bastante o desafio para um jogador Platina e melhorar mapa, personagens e habilidades, com dimensões de referência quando possível.

## Entrega

- Escala explícita de 100 unidades de referência por unidade da arena; movimento da esquiva reduzido de 8 u/s para 3,85–4,345, raio do jogador de 0,45 para 0,65. Velocidade deixa de permitir contornar quase todo ataque apenas correndo continuamente.
- Maior cadência, até 14 ameaças, combos em várias direções e previsão crescente de movimento. Feixes e áreas continuam avisando antes do dano; conjuradores permanecem externos e distantes. Admitir um ataque continua exigindo uma rota de escape amostrada.
- Kite com perseguidores quase tão rápidos quanto o jogador, tiros com antecipação, dano maior, preparação menor e até oito inimigos nos níveis altos. Ataque e movimento manuais, cancelamento, S, Flash, alcance, vida, morte e reposição permanecem funcionais. Nível 1 mantém reposição individual.
- Precisão com 4–10 alvos, mais velocidade e maior frequência de grupos ordenados nos níveis altos. O grupo não muda antes de ser concluído. Reflexo mantém as regras aprovadas pelo jogador.
- Piso original texturizado com relevo sutil, vegetação pintada com transparência e instâncias, paleta e iluminação revistas. Personagens animados com cabeça menor, silhueta mais estreita e proporções de tronco/pernas ajustadas. Equipamentos e animações CC0 KayKit preservados.
- Feixes com filamentos animados, núcleo luminoso, projéteis com leitura no chão, gaiola com energia e cristais. Materiais e efeitos reutilizam a simulação e os pools existentes; a pausa e a redução de movimento continuam respeitadas.
- HUD de precisão/kite em indicadores compactos, com atualização apenas quando o texto exibido muda. Configurações inclui tabela das medidas efetivas e link da fonte histórica. Calibrações de classificação pessoal ficam separadas; histórico e backup anteriores continuam aceitos.

As dimensões são adaptações documentadas, não uma alegação de paridade com o LoL atual. Veja [fonte, tabela e fórmulas](LOL_REFERENCE_CALIBRATION.md) e [procedência das texturas](../public/assets/arena/ASSETS.md).

## Verificação

- 214 testes em 44 arquivos passaram; lint sem avisos e build de produção concluído. O bundle 3D continua acima de 500 kB e é carregado sob demanda; permanece o aviso informativo de tamanho do Vite.
- Uma trajetória circular contínua, com velocidade real por nível e semente 43, recebeu 9 contatos no nível 1, 21 no nível 5 e 187 no nível 10 em 60 s de modo técnico. Foram admitidos 52/88/249 ataques. Esse experimento mede pressão sobre um comportamento simples; não mede o elo ou a taxa de vitória de jogadores.
- A verificação independente das rotas de fuga passou nos dez níveis. Os testes também cobrem colisão nas bordas, travessias em quadros lentos, pausas, compatibilidade de combate v3 e isolamento das amostras novas de classificação nas três modalidades.
- Jogabilidade em Chromium: três ataques, um cancelamento, um abate, dano e Flash no kite; derrota nível 10 por cem de dano, resumo salvo com ações visíveis e reinício com vida cheia. Câmera livre, S e Espaço passaram sem erros de execução.
- Precisão: quatro grupos concluídos por cliques nativos, 16 acertos e o único erro de chão solicitado pelo teste. O teste controla conjuntamente o relógio de simulação e os timestamps de RAF, avançando 100 ms entre cliques, para que a latência da captura de tela não desloque o alvo antes do clique. Limites de sessenta segundos e cliques após quadros atrasados são verificados pelos testes de regressão. Na primeira execução com capturas em tempo real, o robô de pixels não concluiu os grupos antes do prazo; isso não foi usado como avaliação da capacidade de jogadores.
- Reflexo em tempo real: 22 respostas corretas, zero erros de escolha e quatro inibições corretas. Suas regras permanecem iguais.
- Cinco rotas, quarenta níveis, quatro diagnósticos, três tamanhos de menu e três modos gráficos passaram. Dez reentradas em Leve deixaram zero canvases e zero RAFs após a saída. Heap após aquecimento: 11.588.276 → 12.229.684 bytes nesta sequência.
- Armazenamento nativo: migração, upgrade bloqueado, round-trip de quatro registros anteriores, conflito preservado, rollback e seis conquistas permanentes passaram.
- Bundle de produção rc.8 abriu a nova arena e a tabela de cinco habilidades, com console sem erros. Uma cena controlada com cinco habilidades carregou as texturas e shaders: 155 chamadas de desenho e 34.807 triângulos nessa captura. Isso não é uma medição de FPS em computadores de jogadores.
- Texturas WebP somam aproximadamente 655 kB. Um teste de ownership confirma que os clones de textura são liberados uma vez por arena, sem descartar os originais em cache.
- Fullscreen nativo permanece sem confirmação neste Chromium headless: a solicitação fica pendente também em página mínima. O teste de jogabilidade usa `QA_SKIP_FULLSCREEN=1` explicitamente; o ciclo de vida tem cobertura unitária. Aceitação visual, desempenho e tela cheia em Windows continuam pendentes de validação manual.

## Sugestões para uma próxima revisão

1. Pressão adaptativa opcional: aumentar combinações após uma sequência consistente de esquivas e reduzir após vários impactos, mantendo o treino fixo para comparações.
2. Repetição por semente e replay curto: repetir a mesma sequência para treinar uma falha específica.
3. Resumo de erros mais acionável: distinguir movimento antes do disparo no kite, erro de ordem na precisão e impactos por tipo de habilidade.

São sugestões, não funcionalidades incluídas nesta revisão. Calibrar com jogadores reais continua necessário; não há equivalência validada entre nível de treino e elo.
