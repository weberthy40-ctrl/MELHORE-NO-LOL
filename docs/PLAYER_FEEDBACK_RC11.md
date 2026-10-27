# Revisão rc.11 — mobilidade, tentativas sem cronômetro e prática explicada

Esta revisão trata a esquiva. A foto do jogador informou a referência de enquadramento em 1920 × 1080; o tamanho físico de 24 polegadas não entra na conversão de unidades. A avaliação subjetiva da câmera no computador do jogador continua necessária.

## Movimento e câmera

- Movimento de 5,4 para **5,8 u/s** (+7,4%), constante nos dez níveis.
- A câmera da esquiva usa uma inclinação mais próxima da referência, zoom próprio de 0,75–1,4 e acompanhamento exponencial curto (55 ms). A simulação avança em subpassos, mas o acompanhamento e a sincronização dos efeitos acontecem uma vez por quadro visível. Cliques são projetados pela câmera que estava sendo exibida.
- **E: dash de 1,8 u em 140 ms**, recarga de cinco segundos ativos. Percorre o caminho e pode sofrer dano; pode ser interrompido com Parar. Um comando de movimento durante o dash fica para depois dele.
- Flash mantém 4 u e 15 segundos ativos de recarga. Flash, Dash e Parar podem usar letras diferentes, nas Configurações ou no preparo do laboratório. A e Y são reservados; Espaço centraliza sem mudar o zoom ou travar a câmera.

## Tempo e modos

- Normal: três vidas e **tempo ilimitado**. Sobrevivência: uma vida e tempo ilimitado. Morte encerra, ou o jogador pode usar **Encerrar e analisar**. Sair / abandonar não grava uma tentativa.
- Diagnóstico de esquiva: **até 40 segundos por etapa**, mantendo três vidas e níveis 2, 5 e 8. Versão `dodge-diagnostic-v2`. As outras avaliações mantêm 20 segundos.
- O antigo laboratório era uma prática de 60 segundos sem limite de contatos. A imagem enviada, com 68 contatos, era desse aquecimento; não representava sobrevivência a três vidas.
- O laboratório agora prepara um **Desafio de três vidas** por padrão, ou **Aquecimento sem vidas**, ambos sem cronômetro final. Objetivo, nível e teclas ficam claros; pressão adicional e adaptação ficam em seções opcionais. O aquecimento oculta a barra de vida; desafio e replay exibem a vida restante. Os resultados diferenciam contatos de dano válido e oferecem replay e ações centrais. A rota técnica antiga continua abrindo aquecimento livre. Prática ajustável não gera histórico oficial.

## Habilidades e legibilidade

- Oito ameaças no conjunto completo: disparo arcano, lança de plasma, salva esmeralda, meteoros, feixe solar, bombardeio astral, pilar de fogo e gaiola sombria. O conjunto cresce nos primeiros níveis; salvas e combinações alternam os disparos disponíveis em vez de sempre repetir a flecha azul.
- Flecha azul limitada a **26 u/s**, lança a 18 e disparos verdes a 30, inclusive com pressão extra. O aviso e a distância são combinados para garantir pelo menos **0,85 s entre o início da conjuração e o primeiro contato possível** na posição anunciada. Essa margem não garante fuga de toda combinação nem de movimentos posteriores.
- Origem externa aleatória, distância mínima de nove unidades e mira na posição do personagem na conjuração. Sem dependência do cursor, perseguição ou previsão do destino. Sem trajetória prévia nos níveis 3–10; áreas e feixes conservam aviso.
- Gaiola de raio **4,7 u**, borda de 0,28 u e intervalo mínimo de 2,8 s entre conjurações, com limite de duas simultâneas. O centro continua seguro; apenas a borda causa contato.
- Lança, dardos e meteoros usam formas e cores próprias. As medidas são adaptações do treinador, sem alegação de equivalência ao patch atual do LoL.

## Histórico e nota

A calibração é `dodge-v7`, com `dodge-score-v3`. Tentativas antigas permanecem legíveis e não são recalculadas. Gráficos separam as versões.

Como não existe mais vitória automática aos 60 s, a nota Normal agora soma Tempo (40), Esquivas (35), Consistência (15) e Posicionamento (10). O índice de tempo é `t / (t + 120)`. A Sobrevivência conserva pesos 45/30/15/10. A classificação atual exige três tentativas Normal recentes, duas com pelo menos 30 s e mediana ≥60. Referências anteriores conservam suas regras e ficam separadas até existir amostra nova. A nota continua experimental e não mede elo.

## Validação

Testes cobrem movimento durante dash, parada, bordas, tecla configurável, recarga pausada, distância igual entre câmeras, suavização independente da divisão de quadros, chegada dos projéteis em 180%, espaço/intervalo da gaiola, tentativas além de 120 s, desafio e aquecimento separados, salvamento voluntário e leitura das versões anteriores. Verificação visual usa Chromium com renderização por software; tela cheia real e sensação de movimento precisam de conferência manual no navegador do jogador.
