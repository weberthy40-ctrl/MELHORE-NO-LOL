# Arquitetura do MOBA Training

## Fundação original — 001–002.1

A aplicação apresenta a página inicial do Prompt 001 e a integra ao núcleo técnico do Prompt 002. O estado contém apenas ciclo de vida e erro técnico. Não há gameplay, renderização 3D, menu definitivo, persistência, jogador, pontuação ou game loop. A etapa 002.1 orienta a seleção de dependências compatíveis e a verificação da segurança sem alterar esses contratos.

## Composição e direção das dependências

```text
index.html → src/main.js → src/app/createApplication.js
                                  ├── src/ui/createFoundationView.js
                                  └── src/core/createCore.js
                                         ├── stateStore.js
                                         ├── eventBus.js
                                         ├── errorReporter.js
                                         └── lifecycle.js
```

`index.html` fornece o contêiner e carrega uma única entrada JavaScript. `src/main.js` importa os estilos globais e inicia a aplicação. `createApplication({ root })` compõe o núcleo com a página; a instância oferece `core`, `start()` e `dispose()`. `createFoundationView(document)` cria o elemento da interface; a aplicação o monta e registra sua remoção como recurso do ciclo de vida. O bootstrap também libera a instância no descarte do Vite e na saída definitiva da página, preservando páginas no cache de navegação.

O núcleo não importa DOM, UI nem Three.js. A interface e os futuros exercícios podem consumir seus contratos públicos. A composição fica em `app/`; módulos irmãos não devem importar detalhes internos uns dos outros. Compartilhe lógica pura quando houver necessidade concreta, evitando dependências circulares e abstrações para sistemas ainda inexistentes.

## Responsabilidade dos módulos

| Módulo | Responsabilidade |
| --- | --- |
| `app/` | Composição e coordenação da aplicação. |
| `core/` | Estado técnico, eventos, ciclo de vida e erros. |
| `ui/` | Página inicial e, futuramente, telas e adaptação de interações. |
| `styles/` | Apresentação e adaptação às dimensões da tela. |
| `game3d/` | Reservado à cena, câmera e recursos gráficos. |
| `training/` | Reservado às regras dos exercícios. |
| `progression/` | Reservado às regras e cálculos de progressão. |
| `persistence/` | Reservado à leitura e escrita de dados locais. |
| `settings/` | Reservado às configurações e sua validação. |

Os módulos reservados contêm apenas `.gitkeep`. Os futuros exercícios devem reutilizar o núcleo compartilhado, sem criar outro gerenciador de estado, sistema de eventos ou ciclo de vida da aplicação.

## Contratos públicos do núcleo

`createCore()` retorna `{ state, events, errors, lifecycle, dispose }`. Cada instância mantém seus próprios dados e inscrições, sem singleton global.

### Estado

O estado inicial é `{ lifecycle: 'created', error: null }`.

- `state.getState()` retorna um snapshot com congelamento profundo.
- `state.subscribe(listener)` observa mudanças e retorna uma função de cancelamento.
- As atualizações são controladas pelos serviços do núcleo. A interface recebe somente a API de leitura e observação; não pode atualizar o estado por mutação direta.
- Mudanças inexistentes não notificam observadores. Os snapshots impedem alteração externa dos campos internos.
- `getState()` continua disponível após descarte; novas inscrições são rejeitadas com `LifecycleError`.

### Eventos

- `events.on(name, listener)` registra um ouvinte e retorna seu cancelamento.
- `events.once(name, listener)` registra uma única execução, removida antes de chamar o ouvinte para tolerar emissões reentrantes.
- `events.off(name, listener)` remove as inscrições correspondentes.
- `events.emit(name, payload)` entrega os dados sincronamente, na ordem das inscrições. A falha de um ouvinte é reportada como recuperável e não impede os demais.
- `events.clear(name?)` remove os ouvintes de um evento ou de todos os eventos.

Não há eventos de gameplay nesta etapa. Inscrições criadas por um consumidor devem ser canceladas quando esse consumidor for desmontado.

Após descarte, `on` e `once` rejeitam novas inscrições com `LifecycleError`. `off`, `clear` e `emit` permanecem seguros; sem ouvintes, `emit` não executa callbacks.

### Ciclo de vida

- `lifecycle.initialize(initializer?)` retorna uma Promise. O inicializador recebe `{ addCleanup }` e pode registrar limpezas parciais ou retornar uma limpeza opcional, inclusive após trabalho assíncrono.
- Chamadas simultâneas de inicialização compartilham a operação em andamento. Após inicializar com sucesso, novas chamadas não repetem os recursos.
- `lifecycle.start()` ativa a aplicação; `lifecycle.stop()` interrompe sua atividade técnica.
- `lifecycle.dispose()` libera os recursos e é idempotente. Invalida a inicialização pendente e também executa uma limpeza que chegue depois do descarte.
- `core.dispose()` oferece o descarte do conjunto. O estado final é comunicado antes de liberar as inscrições.

| Origem | Operação ou resultado | Destino |
| --- | --- | --- |
| `created` | `initialize()` | `initializing` |
| `initializing` | Inicialização concluída | `ready` |
| `ready` ou `stopped` | `start()` | `running` |
| `ready` ou `running` | `stop()` | `stopped` |
| Estado não descartado | Falha fatal | `error` |
| Estado não descartado | `dispose()` | `disposed` |

`start()` em `running` e `stop()` em `stopped` não repetem trabalho. Transições inválidas são rejeitadas. `error` só permite descarte; não há recuperação automática que esconda uma falha fatal. `initialize()` em `error` ou `disposed` rejeita; `start()` e `stop()` após descarte geram erro. Repetir o descarte é seguro.

`running` significa apenas que a aplicação está ativa. Não representa uma sessão de treinamento nem inicia simulação ou renderização contínua.

Notificações de transição preservam a ordem das mudanças mesmo quando um observador solicita outra transição durante um callback. O descarte comunica a transição final antes de limpar os observadores.

### Erros

`errors.report(error, { source, recoverable })` preserva a origem e as informações técnicas e retorna um registro imutável. Os padrões são `source: 'application'` e `recoverable: true`. `errors.getErrors()` fornece o histórico em memória, sem serviço de monitoramento externo.

Erros com a mesma origem, nome, mensagem e classificação são agrupados: o contador `occurrences` aumenta, sem nova notificação duplicada. Erros recuperáveis são registrados e comunicados sem encerrar a aplicação; falhas fatais fazem o controlador entrar em `error`. A interface deve apresentar uma mensagem compreensível, mantendo detalhes técnicos no diagnóstico e sem expor informações desnecessárias ao usuário final.

A proteção contra notificações recursivas não impede o tratamento de uma falha fatal. Em `error`, um erro recuperável de limpeza não substitui a causa fatal no snapshot. Após descarte, diagnósticos ainda podem ser consultados ou registrados em memória, sem emitir eventos nem alterar o estado final.

## Ferramentas e validação

Vite serve os módulos e gera o build de produção. Vitest verifica inicialização, DOM e comportamentos reais do núcleo; jsdom fornece o ambiente de DOM. ESLint analisa o JavaScript. Three.js está declarado para expansão futura, sem cena criada neste bloco.

Na raiz do repositório, execute `npm ci`, `npm run test`, `npm run lint`, `npm run build` e `npm audit`. A inspeção visual da página complementa os testes. Resultados de execução e aprovação de produto são evidências distintas; registre somente verificações efetivamente concluídas.


## Bloco 003–006

Rotas hash nativas em `ui/routes.js`, componentes em `ui/screens.js` e montagem/descarte em `ui/navigation.js`. Histórico voltar/avançar é do navegador. Importação 3D é lazy e cancelada logicamente ao sair da rota. Não há resultados ou avaliações fictícias.

`mountPreview(container, options)` monta cena, arena e personagem e retorna `dispose()` idempotente; aceita renderer e ResizeObserver injetáveis. Renderiza sob demanda, suspende na aba oculta e libera recursos, canvas e observadores na saída. Uma montagem no mesmo contêiner descarta a anterior. WebGL indisponível produz mensagem acessível sem impedir navegação.

`spatial.js` centraliza lane provisória de 18×38 unidades, com Y vertical, chão XZ e comprimento em Z. Centro (0,0,0), bordas inclusivas. Não representa uma medição de mapa oficial. `createCharacter` é somente visual; frente +Z, APIs passivas de pose e descarte, sem hitbox.


## Bloco 007–012

Movimento puro em training/movement.js, câmera em game3d/cameraController.js, input/projeção em game3d/previewControls.js. A prévia usa um único RAF, cancelado ao desmontar ou ocultar a aba; delta limitado a 0,1 s. Clique direito move no chão XZ, Y alterna travada/livre, roda ajusta distância com limites. Bordas só deslocam câmera livre e não alteram o personagem. Escopo de pointer/wheel é apenas canvas; atalhos de navegador e campos editáveis permanecem livres.

settings/cameraSettings.js persiste somente ativação/velocidade de edge pan em localStorage, com defaults seguros e velocidade 50%–200%. A tela usa Salvar; configurações passam a valer na próxima montagem. Falha de armazenamento é visível.

training/session.js define idle → countdown → running ↔ paused → finishing → completed/abandoned → disposed, com identificador único em memória e snapshots protegidos. Tempo por update(delta), sem timers próprios. Pausa afeta countdown e running; perda de foco/visibilidade exige retomada explícita. A rota #/demo compõe sessão, HUD e prévia. Abandono não gera histórico ou resultado.


## Bloco 013–018

`training/dodge` contém geometria de colisão contínua relativa, entidades imutáveis por snapshot, RNG injetável, seletor ponderado com limite de repetição, diretor e dez perfis. Rápido (14 u/s, raio 0,22), lento (7 u/s, raio 0,4), gancho (10 u/s, raio 0,32; cabo sem colisão), AoE (raio 2, ativa por 3 s) têm IDs independentes, TTL/alcance e impacto único. Raio lógico do jogador: 0,45. Esses parâmetros são calibração técnica, não equivalência com outro jogo.

AoE nasce ativa, sem telegraph; até oito candidatos dentro da lane, fora de raio AoE + raio jogador + deslocamento de 0,35 s. Rejeição pula o disparo. Colisão limita o segmento à parcela válida antes de expirar.

`fairness.js` admite candidatas só quando uma das 16 direções retilíneas (ou ficar parado) sobrevive ao horizonte de 1,2 s, com reação de 0,18 s e margem de 0,15. É heurística conservadora limitada, não prova universal. Todos os quatro ataques entram na mesma capacidade/cadência; combos são coexistência de instâncias e têm cooldown, sem backlog ou mais de uma nova ameaça por tick. Perfis 1–10 diminuem intervalo 2,4→1 s, elevam capacidade 2→5 e chance de combo 0,08→0,62. A geometria e a velocidade do personagem permanecem iguais.

O adaptador 3D sincroniza entidades e meshes usando recursos compartilhados, com cabo de buffer reutilizado. A rota `#/dodge-tech/N` é técnica e sem pontuação, vidas ou resultado salvo. Seleção de nível é capturada na criação e não muda na tentativa.


## Bloco 019–020

`dodge/mode.js` compõe regras de modo com a sessão existente. Normal: três vidas, limite explícito de 60 s no relógio da sessão, proteção pós-impacto de 0,75 s. Sobrevivência: uma vida, sem limite (`timeLimit: null`). Impactos têm attemptId, duplicados e callbacks antigos são rejeitados. O primeiro hit de Sobrevivência encerra; Normal perde após três danos aceitos. A ordenação na borda final processa os impactos do último step antes da vitória. Não há precisão sub-frame reivindicada: dano e tempo final usam fim do step lógico, limitado a 0,1 s; projeção de colisão permanece varrida. Não há spawn depois do limite do Normal.

Rotas #/play/dodge/normal/N e #/play/dodge/survival/N usam o mesmo diretor, recursos e RAF. Vitória/derrota/abandono/erro são distintos; replay desmonta a tentativa anterior e cria nova sessão. Falha do loop é reportada e interrompe a tentativa sem vitória falsa. Normal e Sobrevivência continuam sem score ou resultado salvo nesta etapa.


## Bloco 021–022

`dodge/telemetry.js` observa somente tentativas oficiais. Emitido é spawn confirmado. Qualificação exige proximidade geométrica real: segmento relativo do ataque e jogador dentro da soma dos raios + 1 unidade. Cabo não participa. Resolução por TTL/alcance sem impacto qualificado é esquiva; ataque distante não é. Dano aceito é hit válido. Contato durante proteção é categoria `contactsIgnored`, nunca esquiva. Invariante: qualified = dodged + hit + unresolved + ignored. Ameaças ativas ao final ficam pendentes.

Movimento deriva do deslocamento lógico, descartando resets maiores que velocidade × dt. Distância de risco é movimento somente em steps com exposição geométrica; não mede intenção de clique ou câmera. Buckets de 5 s atribuem eventos na borda à janela que termina; passos de movimento são repartidos proporcionalmente. Até 120 buckets; os mais antigos são somados para manter memória limitada em sessões longas, reduzindo resolução temporal nessa região. Não há log por frame. IDs monotônicos de projétil e mapas somente ativos barram duplicações sem histórico de IDs ilimitado. Snapshots finais congelam após o último step do desfecho.

`dodge/score.js`, versão dodge-score-v1, aceita somente métricas v1 coerentes e fim legítimo. Esquiva = dodged/(dodged+hit). Normal: pesos 40/35/15/10, com impacto = 1-hits/3. Sobrevivência: pesos tempo/esquiva/consistência/posicionamento 45/30/15/10; tempo = elapsed/(elapsed+120), referência provisória sem limite de sessão. Consistência = média das taxas de janelas resolvidas × (1-desvio padrão dessas taxas), limitada a [0,1]. Exige duas janelas; insuficiência deixa toda nota indisponível sem redistribuir pesos.

Posicionamento = taxa de esquiva × min(1,distância de risco/(2×ameaças resolvidas)). É heurística limitada a 10%, não distância ideal ou prova de movimento eficiente. Sem exposição não há nota. Derrota prematura Normal limita a soma a 100×elapsed/60; `capFactor` explicita a redução proporcional, preservando contribuições originais em `uncappedContribution`. Arredondamento só no total final. Amostra <5 é sinalizada. Exemplo verificável: 5 esquivas, 0 hits em duas janelas, consistência 1 e distância de risco 4 resultam 40+35+15+4=94. Não há calibração empírica ou equivalência direta com nível de habilidade.


## Blocos 023–028

IndexedDB nativo em persistence/attemptRepository.js, banco moba-training v1, store attempts por attemptId, índices modality/mode/level/completedAt. IDs recebem nonce criptográfico de 128 bits e sequência local, evitando colisões após reload. Validação na fronteira sem recalcular scores históricos. A transação readwrite verifica ID existente: conteúdo canônico igual retorna already_saved; conflito aborta sem sobrescrever. Sucesso só após oncomplete. Abertura/blocked/versionchange são tratados sem reset; evolução deve ser aditiva e manter versões legadas conhecidas.

Histórico usa páginas de dez registros, filtros combinados e ordem data/ID descendente; score salvo não é reavaliado. Scan por cursor alimenta agregação incremental (20 recordistas, 30 amostras de rating e dez primeiras datas por nível), sem guardar toda a base. Normal escolhe maior nota; Sobrevivência maior duração, depois nota; empate preserva data mais antiga e ID. Evolução usa últimas 30 após filtros, ordem cronológica, SVG e tabela; escala Normal 0–100, Sobrevivência duração real; versões diferentes não são ligadas.

Seis conquistas são derivadas em leitura: primeira tentativa, vitória Normal, vitória com hits explícitos zero, Sobrevivência 30/60 s, e três dificuldades distintas. Datas vêm das primeiras evidências reais. Rating v1 só usa Normal: três tentativas mais recentes por dificuldade, duas vitórias e mediana >=60; maior dificuldade demonstrada ou null. Não é recorde máximo, não desbloqueia níveis e não escreve outra fonte de verdade. Todas as telas invalidam respostas antigas por geração; falhas diferem de ausência de dados.

## Blocos 029–030

Avaliação de Esquiva em memória, sem repositório ou score oficial no componente. Três rodadas de 20 s e até três vidas nas dificuldades 2/5/8; transição explícita por Próxima tentativa. O modo diagnostic reutiliza sessão, dano, proteção e diretor. Critério de elegibilidade de escrita e score oficial rejeita esse modo.

Ameaças diagnósticas elegíveis são resolvidas: dodged + hit + contatos imunes; pendentes não são premiadas. qi = round(100×(0,50×tempo/20 + 0,30×esquivas/elegíveis + 0,20×vidas/3)). São necessárias pelo menos três ameaças em cada rodada. Dados inválidos/insuficientes retornam sugestão null. Tabela de recomendação v1, primeira condição verdadeira: 10 se q8>=95,q5>=85,q2>=75 e hits8=0; 9 se 85/75/65; 8 se 70/65/55; 7 se 55/65/55; 6 se q5>=85,q2>=60; 5 se q5>=70,q2>=50; 4 se q5>=55,q2>=45; 3 se q2>=85; 2 se q2>=65; demais 1. Essa sugestão experimental não atualiza rating ou qualquer histórico oficial. Cancelar/recarregar elimina o fluxo.


## Precisão: 031–045

`precision/practice` contém alvos, reposição limitada, trajetórias refletidas, contadores e RNG injetável. Raycast usa a esfera visível; o adaptador rejeita cliques ocluídos por objetos opacos. Spawn verifica limites, espaço de movimento, projeção e separação. Movimento e câmera continuam no único loop de `previewControls`.

Sessões oficiais usam o relógio comum limitado a 60 s e seis janelas de 10 s. `precision-score-v1`: 60% precisão hits/cliques, 25% produtividade limitada pela referência de variante/nível, 15% consistência normalizada e reduzida para menos de 12 acertos. Zero cliques resulta em zero pontos e precisão observada indisponível. Conforme decisão do usuário, mantém-se a fórmula: um único acerto ainda contribui pela precisão; a interface sinaliza poucos acertos, sem cap adicional.

Registros de Precisão usam a mesma store `attempts` e schema 1, discriminados por modality='precision', mode='timed', variante e nível. Não há migração destrutiva nem alteração de registros de Esquiva. Validação recusa origem diagnóstica, duração incompleta, contadores/histogramas inconsistentes e valores não finitos. Snapshot de score é preservado, não recalculado. Transação e ID estável asseguram retry idempotente; conflito não sobrescreve.

Progressão de Precisão lê apenas registros oficiais válidos. Recordes: score, precisão observada, hits, data mais antiga e ID. Se um contexto contém precisão indisponível, omite-se esse critério em todo o contexto para manter ordenação transitiva. Rating: variante single-static, três sessões mais recentes por dificuldade, mediana >=60 e duas notas >=60; maior dificuldade demonstrada, podendo subir/descer. Gráficos usam últimas 30 após filtro; resumo agrega todo o conjunto.

Diagnóstico de Precisão reutiliza alvos estáticos, relógio, câmera e inputs. Presets reais: níveis 2/5/8, raios definidos na dificuldade oficial, velocidade zero e 20 s ativos. Meta20 é referência oficial da mesma variante/nível dividida por três: 44/3, 40/3, 34/3. `precision-diagnostic-v1` preserva origem, ID, preset, contadores e encerramento; `assessmentVersion=1` exige três rodadas distintas, completas e ordenadas. Qi=round(100*(.6*precisão+.4*min(1,hits/meta20))); zero hits =>0. Cada rodada exige >=5 cliques para recomendação. A tabela ordenada 10→1 está em `recommendStartingLevel`; nenhum resultado é rating oficial. A UI não recebe repositório; o validador oficial também rejeita esses dados.

## Kiting: 046–060

`kiting/practice` consome um único delta ativo e posições reais do controlador. Primeiro clique seleciona; outro solicita ataque. Alcance central inclusivo de 5 u; raio visual do alvo 0,65 u; intervalo 0,9 s; windup 0,25 s. Solicitação aceita interrompe o destino anterior do jogador. Comando direito válido durante windup cancela e aplica recuperação mínima de 0,15 s; movimento durante recuperação mantém o hit confirmado. Alcance é revalidado na confirmação. Não há autoattack nem aproximação automática.

Alvo estático permanece fixo; móvel usa destinos sorteados em zona segura, velocidade suavizada e pausas limitadas; perseguidor tem velocidade 2–3,8 u/s, abaixo das 7 u/s do personagem, e separação mínima de 1,3 u. A faixa de spacing não é pontuada: `spacing=null`, sem inventar critério de segurança.

`kiting-score-v1`: eficiência 40%, produtividade 30%, ritmo 20%, consistência 10%; multiplicação por min(1,hits/6). Referências explícitas por variante/nível em `kiting/difficulty` são inferiores ao máximo teórico de 60/0,9. Par consecutivo de hits constitui oportunidade de ritmo; exige >=0,75 u realmente percorridas entre eles. Teleporte e comando sem deslocamento não contam. Consistência = fração de seis janelas de 10 s com hit × min(1,hits/6). Na mecânica atual, disparo confirmado também confirma hit; cancelamento anterior não é disparo, por isso a eficiência pode ser 100% em todas as confirmações legítimas.

Registros oficiais usam o mesmo store attempts. Schema do banco 2 adiciona achievements, sem apagar registros v1. Seis IDs `kiting:*` são persistidos após ler sessões já commitadas; reconcile transacional adiciona apenas desbloqueios ausentes e preserva a data original. Falha das conquistas não transforma sessão salva em falha de salvamento. Rating usa só três oficiais recentes do alvo parado por dificuldade; mediana >=60 demonstra o nível.

Diagnóstico: parado nível 2, móvel 5, spacing 8, três rodadas reais de 20 s. `kiting-diagnostic-v1`, quatro janelas de 5 s, metas das referências reais divididas por três. Qi usa 40/30/20/10, consistência = fração de quatro janelas com hit × min(1,hits/4). Exige >=3 hits em cada rodada para recomendar. Mesma tabela ordenada provisória 10→1, sem efeitos nos dados oficiais.

## Reflexos: 061–075

Motor comum para quatro práticas técnicas e oficiais. Catálogo imutável define teclas, esperas e janelas; bags balanceados sem mais de três sinais iguais consecutivos (exceto simples). Simples: 5 rodadas, 1,5–3,5 s e janela 3 s; escolha: 8, quatro F/quatro J, mesmos tempos; inibição: 12 apresentações, oito GO/quatro NO-GO, espera 0,9–2,1 s e janela 1,2 s; direção: 16, quatro de cada seta, espera 1–2,4 s e janela 1,8 s.

Antecipação consome a rodada nos exercícios simples/escolha/direção. Em inibição, preserva o slot para garantir 12 apresentações e é contada separadamente no denominador de oportunidades. Não há latência de antecipação, omissão ou inibição. Resposta errada após sinal tem tempo factual, mas média/melhor/mediana usam só corretas.

Espera e duração oficial usam o relógio comum da sessão. A reação usa clock monotônico injetado, com pausa descontada. O motor fica cue-pending até o adapter publicar forma/texto no frame corrente e marcar a apresentação; só então aceita resposta. Isso aproxima o commit visual do navegador, sem promessa de precisão física. Teclas repetidas/mantidas, timestamps inválidos, foco em edição/botões e input fora da rota são rejeitados. Não há som de cue antecipando a medição.

Oficiais repetem bags até 60 s ativos. Janela de escolha vai de 1800 a 850 ms pelos dez níveis, com esperas monotônicas; inibição usa 75% dessa janela. Sinal parcial no fim é excluído, sem omissão fictícia. `reflex-score-v1`: 55% acurácia, 25% max(0,1-médiaCorreta/janela), 20% consistência. Consistência = max(0,1-desvioPadrão/janela) × min(1,nCorretas/5), somente com >=2 tempos. Sem apresentações legítimas, a nota é inválida. NO-GO correto melhora acurácia, não velocidade.

Histórico e snapshots suportam a quarta modalidade, sem alterar notas das anteriores. Seis conquistas são derivadas. Rating usa só Reação Simples, três recentes por dificuldade e mediana >=60. Diagnóstico reutiliza o próprio adapter oficial com origem diagnóstica e duração 20 s, níveis 3/6/9, sem acesso a repositório. Indicador 70% acurácia +30% velocidade; etapa demonstrada exige >=3 oportunidades visuais completas, ao menos uma resposta correta e indicador >=65. Recomenda maior referência demonstrada ou 1; se todas insuficientes, null. Nunca extrapola 10.

## DPI, Perfil e backup: 076–081

DPI manual inteiro 100–32000; sensibilidade 0,1–10 com até três decimais e parsing estrito de vírgula/ponto. Produto relativo e equivalência preservam precisão interna. Preferências ficam na chave versionada de mouse, sem afetar gameplay.

Teste 2D usa dez alvos dentro das margens, hitbox circular de raio 22 pixels CSS, posições aleatórias limitadas e intervalo mínimo. Cada alvo precisa de publicação real via RAF antes do clique; miss não avança e clique duplicado não atravessa dois alvos. Blur pausa, resize invalida. Tempo é monotônico com pausa descontada. Sumário exige dez amostras finitas; mediana, desvio padrão populacional e coeficiente de variação (desvio/média) são descritivos. Retém no máximo duas rodadas na visita. Contexto de viewport/painel/DPR e referência manual identifica condições diferentes; não mede hardware nem recomenda DPI.

Perfil consulta uma agregação bounded por modalidade, sem cópia persistida ou nota global. Cada painel lida independentemente com loading/erro e ignora respostas obsoletas. Data e nota do último treino mantêm contexto; recordes de Sobrevivência conservam tempo separado.

Backup v1 exporta apenas attempts, conquistas persistidas e três namespaces de preferências. Rejeita protótipos, versões futuras, tipos/ranges/IDs/datas inválidos; máximo 10 MiB/10.000 tentativas. Prévia é readonly. Mesclagem revalida durante uma transação attempts+achievements, preservando conflitos. Não oferece replace. Preferências ausentes são uma etapa opcional posterior em LocalStorage; como não há atomicidade entre APIs, falha parcial é informada. Valores existentes nunca são substituídos. Dados temporários não são exportados.

## Preferências, feedback e recursos: 082–096

Preferências de interface/gráficos/áudio têm schema 1. Contraste e fonte só alteram CSS. Reduced motion segue o sistema ou override. Presets Leve/Médio/Alto aplicam DPR máximo 1/1,4/1,75; antialias e VFX são opcionais. Resize reaplica DPR e mantém dimensão CSS e raycast. Preferência vale no próximo mount; não reinicia sessão.

Áudio: um contexto lazy por aplicação, liberado por gesto, um master gain, até quatro vozes com envelope curto original; mute/volume atualizam sons ativos. Pausa/saída interrompem vozes; falhas opcionais não quebram a aplicação. Feedback segue somente eventos confirmados de hit/dano/resposta, sem telegraph.

VFX: quatro anéis reutilizáveis, sem raycast e sem loop próprio, atualizados no delta ativo; Leve desativa. Membros do personagem têm animação procedural consumindo movimento/windup/recuperação. Proxies de raycast na pose neutra isolam animação de oclusão lógica. Pose raiz, alcance, colisão e timestamps permanecem sob domínio do treinamento.

Ownership: um renderer e um RAF por cena; listeners e recursos exclusivos são liberados em dispose. O frame verifica descarte após callbacks, pois um resultado pode desmontar a própria cena. Falha ou perda de WebGL deixa saída funcional. Teste de dez remontagens mede callbacks, canvas e heap, sem afirmar FPS ou memória de GPU não medidos.


## Habilidades e grupos a partir da rc.6

A esquiva usa `createAttackData` para normalizar o ataque antes de testar a admissão e inseri-lo na simulação. As formas `bolt`, `beam`, `circle` e `ring` compartilham as funções de geometria com a telemetria. `config.ttl` é a duração ativa; o snapshot normalizado armazena `ttl` como duração total, incluindo `windup`. Colisão e medição são recortadas ao intervalo ativo, e o evento de aviso qualifica a ameaça sem aplicar dano. A posição de `caster` fica fora da arena; o alvo e a direção anunciados são fixos no mundo.

Precisão mista usa `sequenceVersion: clear-group-v2`: acertos retiram alvos, e apenas zerar o grupo sorteia o padrão seguinte. O prazo marca `overdue` uma vez sem retirar o alvo; `misses` continua contando cliques errados, separado de `expiredTargets`. Registros anteriores permanecem válidos. Ondas de kiting usam `configVersion: kiting-waves-v2` para registrar as novas velocidades; o validador ainda aceita a configuração anterior sem esse campo. Veja [feedback e validação rc.6](PLAYER_FEEDBACK_RC6.md).
