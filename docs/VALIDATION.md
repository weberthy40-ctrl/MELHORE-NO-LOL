# Validação — bloco 001–002.1

Verificações executadas em 25/10/2026 no ambiente de desenvolvimento em nuvem.

## Escopo entregue

Fundação e página inicial do Prompt 001, núcleo técnico do Prompt 002 e seleção/revisão de segurança das dependências prevista em 002.1. A implementação começou em um repositório vazio; as afirmações de aprovação prévia contidas nos prompts não foram usadas como evidência.

## Resultados

| Verificação | Resultado |
| --- | --- |
| Instalação e reinstalação pelo lockfile | `npm install` e `npm ci` concluídos; lockfile gerado pelo npm. |
| `npm run test` | 47 testes aprovados em 5 arquivos, sem testes ignorados ou falhas. |
| `npm run lint` | Aprovado, sem erros ou avisos. |
| `npm run build` | Build de produção concluído pelo Vite. |
| `npm audit` | Nenhuma vulnerabilidade conhecida reportada na consulta realizada. |
| Execução com `npm run dev` | Página funcional verificada em Chromium. |
| Execução com `npm run preview` | Build de produção funcional verificado em Chromium. |
| Viewports 1440×900 e 360×800 | Título/mensagem corretos, CSS carregado, um único `main` e sem overflow horizontal. |
| Recarregamento da página | Interface reinicializada corretamente, sem duplicação ou erros de JavaScript. |

Versões verificadas: Node.js 24.19.0, npm 11.9.0, Vite 8.3.5, Three.js 0.186.1, Vitest 5.0.5, ESLint 10.13.0 e jsdom 30.1.3. A auditoria representa a base de vulnerabilidades conhecida na data da consulta.

Os testes cobrem estado imutável, atualizações sem alteração, cancelamento de inscrições, isolamento de listeners, execução única reentrante, deduplicação de erros, falha fatal, transições, inicialização simultânea, recursos parciais/tardios e descarte. A revisão corrigiu falha fatal reentrante, ordem de notificações, preservação da causa fatal e inscrições após descarte; esses casos têm regressões automatizadas.

## Limites

Este bloco ainda não contém menu, arena, personagem, exercícios ou salvamento. A verificação no navegador cobre a fundação atual; não valida gameplay futuro nem todos os navegadores. A instalação e execução em uma nova tarefa após publicação do ambiente ainda não foram verificadas. Aprovação de produto e publicação no GitHub são etapas distintas destas verificações técnicas.


## Bloco 003–006

56 testes passaram em 7 arquivos; lint aprovado; build aprovado. O build informa chunk 3D de aproximadamente 533 kB, carregado apenas na rota da prévia, sem aumentar o carregamento inicial pela mesma quantidade. Chromium verificou 40 níveis selecionáveis, contexto WebGL2 real, navegação de entrada/saída da prévia três vezes com exatamente um canvas, desktop/mobile, reload e ausência de erros JS. Nenhum pacote foi alterado. Estes resultados não constituem validação das etapas seguintes.


## Bloco 007–012

62 testes aprovados em 8 arquivos. Build, lint e npm audit aprovados (0 vulnerabilidades reportadas). Regressão de 003–006 preservada. Novos testes verificam movimento em diferentes FPS, raycast com canvas deslocado, rejeição de input inválido, zoom/modos, preferências, countdown/pausa/abandono, listeners e RAF removidos. Chromium verificou countdown real, ESC pausa, tempo congelado, Retomar, armazenamento e recarga das preferências, WebGL e ausência de erros JS. O aviso de tamanho do chunk Three.js persiste; carregamento é lazy.


## Bloco 013–018

73 testes aprovados em 10 arquivos; lint e build aprovados. Testes novos cobrem colisão relativa contínua, tangência, quase erro, TTL/alcance, hit único, cabo sem colisão, área ativa, tentativas finitas de spawn seguro, seed, limites, combos reais, perfis e rejeição de ameaça sem fuga. Chromium voltou a verificar a navegação, WebGL real, countdown, disparos técnicos, pausa sem novos disparos e preferências persistentes. Não há modos Normal/Sobrevivência nesta versão técnica. O aviso de tamanho do chunk 3D permanece documentado.


## Bloco 019–020

78 testes aprovados em 11 arquivos; lint e build aprovados. Simulações verificam Normal nos dez níveis, vitória em 60 s, derrota por três danos, imunidade/pausa, sobrevivência acima de 120 s, primeiro hit terminal, evento antigo e borda fatal antes da vitória. Chromium verificou HUD Normal 3/3 e 60 s, Sobrevivência até derrota por ataques reais com RNG de fixture do teste, replay limpo com 1/1 vida e countdown, retorno e configurações. A fixture altera apenas a fonte de seed no navegador de teste, sem cheats ou botões de dano na aplicação.


## Bloco 021–022

85 testes passaram em 12 arquivos; lint e build aprovados. Cobrem disparos distantes, pendências, contato imune, dano aceito, movimento/reset, congelamento, nota conhecida 94/100, versões inválidas, janelas inconsistentes, amostra única e monotonicidade do componente temporal. Simulação completa com seed 1 gerou tentativa elegível e score real (33/100, sobrevivência 16,05 s no step de 1/60 s). Chromium verificou resultado com métricas reais e motivo de indisponibilidade por amostra curta, preservando replay. Ainda não há persistência nesta etapa.


## Blocos 023–030

Salvamento real de uma tentativa de Sobrevivência elegível, com score 33/100, foi confirmado pelo commit e pela mensagem na interface. IndexedDB real verificou save/get/list/count, repetição sem duplicata, conflito sem overwrite e reabertura. A revisão encontrou e corrigiu um guard de geração da UI; regressão testa a mensagem pós-commit e gravação única. Erros de abertura, indisponibilidade, retry e resposta tardia têm testes.

Histórico, filtros, recordes, SVG+tabela, seis conquistas e rating sem amostra foram verificados com registros reais no Chromium. Domínio e UI têm testes de paginação/corrida, data/ID, três resultados recentes, queda do rating, conquistas fora de amostra limitada e gráfico após filtro.

102 testes passaram em 18 arquivos antes do último ajuste defensivo de importação e metadado gameVersion; build/lint aprovados. Avaliação guiada real completa percorreu 2/5/8, com duas rodadas de 20 s e terceira encerrada por vidas aos ~17 s; exibiu dados reais e sugestão experimental 7/10. Contagem de registros oficiais ficou igual antes/depois. Refazer limpou o fluxo. Nova regressão final após os ajustes está registrada na continuação do trabalho.


## Bloco 031–045

Vitest: **121 testes em 23 arquivos passaram**. ESLint sem avisos. Build de produção passou; permanece aviso de tamanho do chunk Three.js carregado sob demanda (aproximadamente 550 kB minificado). Testes novos verificam snapshots de Precisão, nota zero, isolamento de modalidades, rating recente e rebaixamento, seis conquistas, ordenação de recordes, filtros e evolução; diagnóstico puro, tabela, dados inválidos/amostra insuficiente, três rodadas com relógio real do domínio, pausa, reset e imports tardios.

Chromium real: completou tentativa oficial de 60 s com nota zero, confirmou commit e leitura pelo histórico de Precisão. Completou 3×20 s diagnósticos sem cliques: mostrou amostra insuficiente, sem recomendação numérica; o total de registros oficiais não mudou, e Refazer restaurou a introdução. Verificações automatizadas não atestam sensibilidade física do mouse, calibração humana das metas ou aprovação no Windows.

## Candidata 1.0.0-rc.1 — blocos 046–105

Instalação limpa pelo lockfile executada novamente: 150 pacotes, Node 24.19.0/npm 11.9.0. **158 testes em 35 arquivos passaram**, sem skips ou assertions desativadas. ESLint sem avisos; build passou; auditoria apontou **zero vulnerabilidades**. O chunk Three.js sob demanda mantém aviso de tamanho (aproximadamente 556 kB minificado).

Chromium/Linux real executou:

- Kiting: seleção sem ataque no primeiro clique, windup, cancelamento por direito, confirmação única, tecla A e troca das três variantes; oficial real de 60 s com zero e commit; três diagnósticos reais de 20 s, insuficiência, Refazer e isolamento.
- Reflexos: cinco respostas reais ao sinal, latências corretas, oficial real de 60 s com omissões e zero salvo; três diagnósticos reais de 20 s sem resposta, insuficiência e isolamento. Recomendação positiva 9/10 foi verificada na integração determinística com o motor real e clock injetado.
- DPI: proxy 1200 e equivalência 0,75; duas rodadas reais de dez cliques, comparação com unidades e quatro cartões do Perfil.
- IndexedDB/backup: upgrade v1→v2 bloqueado e recuperado, preservação, snapshots das quatro modalidades, export/import, idempotência, conflito e falha de quota com rollback. Conquistas de Kiting foram verificadas também com 25 sessões de fixture em banco separado e reabertura, sem contaminar o banco oficial.
- Dez entradas/saídas de arena: um RAF na cena, nenhum RAF/canvas no menu. Heap observado de ~8,75 MB no segundo ciclo a ~9,45 MB no décimo após GC; não foi medido FPS ou memória de GPU. Screenshots de 1366×768, 1920×1080 e 390×844 foram inspecionadas sem overflow nos menus.

A suíte acrescentou uma checagem independente de rota: dez níveis por 120 s de simulação, quatro ataques admitidos em todos, concorrência limitada e rota amostrada a cada 5 ms no horizonte de 1,2 s. Isso não prova fairness humana universal. Animação e VFX têm testes de raycast neutro, limite de recursos, pausa e remoção de assinaturas. Áudio usa mocks de Web Audio para testar unlock/volume/mute/concorrência; a percepção sonora em hardware real não foi homologada.

A página inicial deixou os textos de placeholder da fundação durante o polimento; o teste semântico foi atualizado para a identidade atual, preservando as mesmas verificações de inicialização, acessibilidade e ownership. Nenhuma fórmula oficial foi recalculada retroativamente.

Relatórios finais: [099](validacao/099-linha-de-base.md), [100](validacao/100-fluxos.md), [101](validacao/101-gameplay-3d.md), [102](validacao/102-integridade-dados.md), [103](validacao/103-diagnosticos-perfil.md), [104](validacao/104-estabilidade.md), [105](validacao/105-criterios-lancamento.md). Permanecem pendentes Windows, calibração com jogadores, estabilidade longa, CI remoto e restauração de uma nova tarefa após publicação do ambiente. A decisão é **RC**, sem declarar 1.0 aprovada.


### Verificação da distribuição

O ZIP foi extraído em diretório separado, sem node_modules ou dist. Nessa extração, npm ci instalou 150 pacotes; os mesmos 158 testes passaram, assim como lint, build e audit (zero vulnerabilidades). O preview do build extraído passou pelo teste real de navegador, inclusive dez remontagens e os três viewports. Em DPR 2, o mesmo canvas de 1168,75 pixels CSS usou larguras internas 1169/1636/2045 em Leve/Médio/Alto, confirmando diferenças reais sem alteração da área CSS. A preferência anterior foi restaurada ao terminar o teste. CRC e comparação byte a byte validam o pacote final; os últimos ajustes de documentação não alteram os fontes testados.

## Revisão da experiência — 1.0.0-rc.2

- `npm test -- --maxWorkers=2`: **165 testes em 37 arquivos**, todos passaram.
- `npm run lint`: passou, sem avisos. `npm run build`: passou; chunk Three continua carregado sob demanda e gera o aviso de tamanho já conhecido.
- `npm run test:browser`: passou em Chromium. Cinco rotas principais, 40 níveis, quatro avaliações; dez reentradas com um RAF em cena e nenhum RAF/canvas após sair. Heap após GC foi de aproximadamente 9,1 para 9,7 MB entre ciclos 2 e 10. Presets gráficos respeitaram DPR 1/1,4/1,75; menus verificados em 1366×768, 1920×1080 e 390×844.
- `npm run test:storage`: passou; upgrade bloqueado recuperado, migração, quatro modalidades no round-trip, conflitos preservados, rollback de quota e seis conquistas permanentes.
- Interação Chromium real em 1024×768: kiting abriu no perseguidor; primeiro clique confirmou um ataque; A + clique no terreno próximo confirmou o segundo. Precisão aceitou clique real no alvo; reflexo abriu na variante mista; perfil exibiu quatro cartões; dez cliques no teste DPI produziram uma rodada real, sem recomendar com apenas uma amostra. Início, perfil, DPI e configurações também ficaram sem overflow horizontal em 390×844. Nenhum erro JS foi registrado nesse roteiro.
- Inspeção visual dos novos início, arena, precisão e perfil. Uma falha de integração no cartão de Esquiva, causada por esquemas diferentes dos resumos, foi corrigida e coberta por teste.
- O passo físico do DPI depende de régua e hardware e permanece pendente de teste humano; as fórmulas, rejeições e repetição são testadas automaticamente. Balanceamento e aceitação artística continuam sujeitos ao próximo teste do jogador.

Detalhes funcionais e fórmulas: `ARENA_REVISION.md`. Resultados oficiais antigos permanecem salvos; o rebalanceamento limita comparações entre versões.

## Visual e combate — 1.0.0-rc.3

- **174 testes / 38 arquivos**, todos passaram (`npm test -- --maxWorkers=2`); lint sem avisos e build de produção aprovados. Inclui origens nos oito setores, tentativas limitadas, trajetórias fixas, escape independente nos dez níveis, escolha de um alvo por clique, preparação sem redirecionamento, perseguição de todos os inimigos, legado sem população e aplicação imediata da pose Idle.
- Chromium: cliques reais em chão vazio confirmaram ataques nos níveis 1 (dois inimigos) e 10 (seis). A pressionado não gerou ataques; direito não acrescentou ataques. Esquiva com origens aleatórias foi renderizada sem erro JS. Capturas inspecionadas para mapa, personagens e alcance.
- Smoke: cinco rotas principais, 40 níveis e quatro avaliações passaram. Dez reentradas em **Leve**, aguardando modelos prontos: um RAF em cena e zero RAF/canvas após sair; heap após GC passou de 11,1 para 11,7 MB entre ciclos 2 e 10. Presets Leve/Médio/Alto renderizaram com DPR 1/1,4/1,75. Sem overflow nos menus em 1366×768, 1920×1080 e 390×844.
- A primeira sequência de reentradas em Alto excedeu o timeout de 15 s do CDP no Chromium por software desta máquina. O smoke final fixa Leve para o teste de recursos e verifica os três presets separadamente. Isso não é um benchmark de FPS ou de memória da GPU.
- IndexedDB: bloqueio/upgrade, migração, round-trip das quatro modalidades, conflito, rollback de quota e seis conquistas permanentes passaram.
- Build servido estaticamente em **`/MELHORE-NO-LOL/`**: versão rc.3, JS/CSS, sete GLBs e seis inimigos carregaram sem erro JS. Confirma os caminhos relativos usados pelo GitHub Pages.
- Balanceamento com jogadores e desempenho no computador do usuário continuam sujeitos ao teste humano. Os modelos são CC0 com fontes, hashes e licenças incluídas; detalhes em `VISUAL_COMBAT_REVISION.md`.

## Projéteis e resumo — 1.0.0-rc.4

- `npm test -- --maxWorkers=2`: **177 testes em 38 arquivos**, todos aprovados. Lint e build também passaram.
- Cobertura nova: halo com diâmetro mínimo de 26 pixels quando a câmera afasta, recursos visuais liberados uma vez, dados físicos preservados; derrota Normal e Sobrevivência com replay/menu no diálogo, foco no replay e nova sessão ao reiniciar.
- Chromium real em 1366×768: após morrer nos dois modos, o resumo abriu na camada modal, HUD atrás oculto, foco inicial correto e Tab restrito ao painel. Hit test e cliques reais confirmaram Jogar novamente iniciando outra tentativa e Voltar ao menu retornando ao início.
- Em 390×640, as ações permaneceram inteiramente dentro da tela, com rolagem separada para o conteúdo. Capturas inspecionadas para projéteis e resumo. Nenhum erro JS registrado no roteiro.
- Raios, velocidades, colisão e pontuação não foram modificados nesta revisão. O rastro, o contorno e o halo são somente apresentação.
