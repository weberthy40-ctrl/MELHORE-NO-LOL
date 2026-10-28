# QA reproduzível

Este roteiro verifica o comportamento de [CURRENT_SCOPE.md](CURRENT_SCOPE.md) e da revisão nele indicada. Os blocos antigos de [ARCHITECTURE.md](ARCHITECTURE.md) e os resultados de [VALIDATION.md](VALIDATION.md) são históricos, não instruções para restaurar regras anteriores nem evidência de nova execução.

## Preparação e gates básicos

Na raiz do checkout, use o Node fixado em `.nvmrc` e navegador desktop atualizado. Se faltarem dependências, instale com `npm ci`, respeitando as autorizações da tarefa. Não atualize dependências apenas para executar QA.

```sh
npm test
npm run lint
npm run build
npm audit
```

Registre versões, comandos, códigos de saída e cenário. Separe aprovado, falhou, ignorado e não executado; resultados parciais não aprovam uma suíte completa. Para produção, após build use `npm run preview` e passe a URL exibida como argumento ao script de navegador. Não abra `index.html` diretamente.

## Navegador automatizado

Inicie `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`. Em outro terminal, use perfil separado e novo/vazio para cada rodada completa de QA; escolha um novo diretório de perfil se já houver dados. Nunca use perfil pessoal: gameplay e esquiva salvam tentativas oficiais na origem testada. Execute `test:dodge` antes de `test:gameplay`: o primeiro espera cobertura de apenas uma modalidade no perfil. O snapshot do ambiente Cloud não sincroniza progresso do navegador.

Linux em ambiente Cloud isolado, com Chromium disponível:

```sh
chromium --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/workspace/.cache/chromium-qa about:blank
```

O sandbox interno é dispensado somente nessa máquina já isolada. Em Windows/PowerShell, mantenha o sandbox normal:

```powershell
& "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir="$env:TEMP\moba-qa-chrome" about:blank
```

Ajuste o caminho se necessário. Antes dos scripts, confirme resposta HTTP do Vite e de `http://127.0.0.1:9222/json/version`. Execute um script por vez, sem páginas de treino competindo pelo foco. Os scripts não instalam nem iniciam servidor/navegador.

```sh
npm run test:browser
npm run test:storage
npm run test:dodge
npm run test:gameplay
npm run test:replay
npm run test:profile
```

| Comando | Evidência produzida |
| --- | --- |
| `test:browser` | Navegação; 30 níveis das outras modalidades e seletor de 20 de esquiva; quatro diagnósticos; dez entradas/saídas, RAF/canvas e heap após GC; presets pelo buffer real e ausência do fallback removido de sombras (console.warn preservado); menus em 1366×768, 1920×1080 e 390×844. |
| `test:storage` | IndexedDB nativo: migração v1→v2, upgrade bloqueado, quatro modalidades, backup, conflitos, idempotência, rollback de quota e seis conquistas permanentes. Usa e remove somente seu banco temporário. |
| `test:dodge` | Sobrevivência 20 com início manual e derrota salva; bloqueio de Normal sem avaliação; cinco etapas adaptativas e entrada no nível atribuído; movimento, dash, Flash remapeado, câmera, revisão com contato fatal e último quadro no mesmo timestamp exibido em Normal/Sobrevivência, perfil e descarte; briefing com Flash remapeado e ação de iniciar alcançável em 390×600. |
| `test:gameplay` | Ataque, cancelamento, abate e Flash de kiting; quatro grupos de precisão por cliques nativos com relógio controlado; reflexos com teclado e três cores; derrota de kiting salva/reinício; tentativa de tela cheia real por padrão. |
| `test:replay` | Composição controlada de gravação com WebGL real: quatro contatos, teclado nativo, avanço de reprodução, seek e fechamento sem canvas em 1366 e 390 px. Usa imports de fonte no Vite dev; não é tentativa oficial nem benchmark. |
| `test:profile` | Composição controlada de registros válidos em IndexedDB temporário nativo; quatro leituras e nenhuma escrita da UI, conselhos/CTAs seguros, teclado e 1366/390 px. Exige Vite dev por importar fixtures; mantém o smoke de produção separado. Inclui resumos das três avaliações com motores reais/renderer controlado, restauração/cancelar e rolagem nativa em altura 600 px (não é WebGL/gameplay oficial). |

Opções existentes, sem modificar scripts:

- URL alternativa: `npm run test:browser -- http://127.0.0.1:4173/` para preview nessa porta. `CDP_URL` troca o endpoint DevTools.
- `CDP_TIMEOUT_MS`: timeout por comando de protocolo entre 1.000 e 60.000 ms; não elimina limites próprios dos cenários. Registre valores usados e timeouts em renderização por software.
- `QA_ARTIFACT_DIR`: capturas; prefira diretório fora do checkout.
- `QA_MENUS_ONLY=1`: limita `test:browser` a navegação/menus/perfil; não valida heap, remontagens, presets nem o modo de sombras; a exclusão aparece no resultado.
- `QA_SKIP_FULLSCREEN=1`: exclui explicitamente tela cheia de `test:gameplay` se o headless não concluir a chamada; registre a exclusão, sem aprovar tela cheia.
- `QA_GAMEPLAY_CASE=kiting-defeat`: limita `test:gameplay` à derrota/reinício de kiting, sem aprovar os demais cenários.

Sem servidor, Chrome/CDP ou dependências, registre o check como não executado/bloqueado. Mocks do renderer não atestam GPU física. Ao terminar, encerre apenas os processos iniciados para a tarefa e preserve logs/resultados necessários.

## Aceitação manual em Windows e hardware real

Use dados de QA e registre versão, navegador, equipamento e qualidade gráfica. Estes cenários são um roteiro, não uma declaração de execução ou aprovação.

1. **Navegação:** confira quatro modalidades, 30 níveis entre Precisão/Kiting/Reflexos e 20 na seleção livre de Sobrevivência. Normal depende de avaliação salva e abre no nível atribuído; URL direta não contorna esse acesso. Laboratório e treino sem pontuação de esquiva não devem reaparecer.
2. **Preparação da esquiva:** em Normal, Sobrevivência e cada etapa diagnóstica, aguarde recursos; antes de **Iniciar desafio**, tempo zero, sem movimento ou ataques. Não há countdown nessa entrada. Confira câmera ampla antes/próxima após iniciar, HUD compacto, pausa e tela cheia acessíveis.
3. **Esquiva ativa:** três vidas no Normal e uma em Sobrevivência, ambos sem limite de tempo. Confira nove famílias ao longo dos níveis, avisos de áreas e trajetória prévia nos níveis iniciais conforme escopo; dano único, proteção, limites e combinações de gaiola. Teste direito, parada, Flash, dash configurável, Y, Espaço e zoom. Confira resultado, reinício, menu e revisão dos últimos seis segundos quando houver amostra. Na revisão, selecione um contato por mouse ou teclado: pausa a reprodução e busca cerca de um segundo antes, limitado aos quadros capturados; scrub manual limpa a seleção. Sem contatos no trecho, há estado vazio explícito. Em derrota com amostra, confira que o último contato aparece na lista e que o fim do slider mostra o mesmo instante, sem retomar a sessão original. Encerrar e analisar pode salvar amostra válida; abandonar não equivale a concluir.
4. **Precisão:** esquerdo acerta o alvo exibido; erro e atraso são distintos. Grupo só muda após todos os alvos serem removidos. Confira movimento e ordem numérica quando apresentada: clicar fora da ordem não remove o alvo. Câmera/zoom não mudam hitbox lógica.
5. **Kiting:** um clique esquerdo, inclusive no chão, solicita ataque a inimigo em alcance próximo do cursor. Direito move; mover, parar ou usar Flash antes do disparo cancela preparação. A apenas exibe alcance. Confira dano, abates, reposição, perseguidores/atiradores e derrota salva; dificuldade altera velocidades/cadência, sem exigir tempos fixos de versões antigas.
6. **Reflexos:** no desafio integrado, responda às teclas apresentadas Q/W/E/R, Espaço, F/J; verde pede esquerdo, azul direito, vermelho inibição. Confira texto/símbolos, acerto, erro, antecipação, omissão e tecla segurada. Inibição correta não recebe latência zero. Campos e botões não devem disparar resposta de gameplay.
7. **Pausa/foco:** pause nas fases disponíveis de cada modalidade; troque de aba e retorne. Tempo ativo, ataques e recargas congelam; retomada por perda de foco é explícita. Sair/recarregar não salva conclusão oficial. Não exija countdown na esquiva.
8. **Avaliações:** esquiva usa cinco etapas adaptativas de até 30 s, podendo terminar antes por vidas, com início manual em cada etapa. Confira sequência, evidência e recomendação segundo [rc.14](PLAYER_FEEDBACK_RC14.md), salvamento e acesso ao Normal. Avaliações antigas continuam legíveis. Nas demais, complete três etapas de 20 s e teste Refazer/Cancelar; resultados completos permanecem consultáveis ao sair/voltar nesta sessão; refazer/cancelar preserva o último completo. Reload/descarte limpa esses resumos, sem gravar tentativa oficial. Diagnósticos não criam tentativas oficiais nem pontos de treino.
9. **Resultados/progressão:** complete oficiais de 60 s nas demais modalidades ou derrota de kiting antes disso; esquiva termina por derrota ou Encerrar e analisar com amostra válida. Confira commit, reload, retry sem duplicata e falha sem falso sucesso. Progressão do Normal só ocorre após gravação confirmada e desempenho elegível. Compare contextos/versões compatíveis, sem recalcular notas históricas.
10. **Perfil/histórico:** confira filtros, paginação, recordes, evolução, conquistas e erros de leitura independentes. Patentes usam pontos de habilidade com janela das últimas 20 tentativas, não XP acumulado nem a regra histórica de três sessões. Média geral explicita cobertura parcial e ausência de amostra; avaliação não equivale à patente ou elo do LoL.
11. **DPI físico/comparação:** use régua e três passagens de mesma distância com entrada bruta confirmada; teste cancelamento e indisponibilidade. Para comparar, altere DPI no software do mouse e faça três rodadas de dez alvos em pelo menos dois valores. Mantenha área, DPR e referência LoL constantes; esta referência usa 0–100 e não altera velocidade do navegador. Confira erros, pausa, empate e condições diferentes; resize invalida a rodada. Não use a antiga conversão de sensibilidade como critério da tela atual.
12. **Backup:** exporte, confira prévia e round-trip em perfil separado, inclusive avaliação de esquiva. Importe novamente e provoque conflito em dados de QA: IDs existentes não podem ser sobrescritos. Preferências/avaliação ausentes só entram mediante opção; existentes são preservadas. Teste arquivo inválido/versão incompatível e falha de gravação; não anuncie sucesso falso nem substitua/apague progresso.
13. **Acessibilidade/gráficos/áudio:** contraste, texto ampliado, foco/tabulação, modal e redução de movimento; presets mudam renderização, não regras. Teste mute/volume após gesto e sons ativos. Confira tela cheia real, entrada/saída, câmera e ações do resultado em resoluções diferentes.
14. **Falhas/recursos:** simule WebGL indisponível/context loss e armazenamento negado. Menu/saída continuam acessíveis, sem resultado falso. Repita entradas/saídas, verificando ausência de cenas, listeners ou input duplicados.

Fluidez, percepção de áudio, DPI físico, controles e calibração com jogadores exigem teste humano. Chromium por software não comprova FPS no equipamento do jogador nem transferência de habilidade para LoL.

## Registro da execução

Registre separadamente ambiente/instalação; checks executados/resultados; falhas e investigação; checks não executados/exclusões; problemas do repositório versus limitações do ambiente. Não atualize gate histórico para PASSOU com base apenas em leitura. Registros por execução: [Fase 1](PHASE1_VALIDATION.md), [Fase 2](PHASE2_VALIDATION.md) e [ciclos de evolução](EVOLUTION_LOG.md).

## GitHub Actions — Fases 2 a 4

O job existente de `.github/workflows/ci.yml` mantém Node de `.nvmrc`, instalação pelo lockfile e gates básicos; acrescenta `bash scripts/ci-browser.sh`. O helper usa `google-chrome` disponível no runner Ubuntu (override local `CHROME_BIN=chromium`), inicia Vite/CDP, espera prontidão e executa os seis scripts na ordem acima com perfil novo. Falta do navegador ou falha de prontidão interrompe o gate.

O helper limpa `QA_MENUS_ONLY`, `QA_GAMEPLAY_CASE` e `CDP_URL` herdados para impedir execução parcial/acesso a outro perfil. Usa timeout CDP de 45 s e até 360 s por suíte; preserva saída não zero em falhas/timeouts e marca as posteriores como não executadas. Tela cheia é explicitamente excluída via `QA_SKIP_FULLSCREEN=1`, sem alterar as demais assertions. Logs e capturas ficam em `QA_ARTIFACT_DIR` e são coletados mesmo em falha, com retenção de sete dias. O resumo aparece na UI do job por `GITHUB_STEP_SUMMARY`; fora do GitHub, é salvo em `QA_ARTIFACT_DIR/summary.md`. O passo tem limite global de 45 minutos. Processos/perfil próprios são limpos ao sair.

Essa configuração ainda precisa ser executada no GitHub Actions para confirmar compatibilidade com o Chrome do runner. O workflow de Pages permanece independente: o novo gate não impede o deploy existente. Alterar essa relação exige outra etapa autorizada. Resultados locais e investigação de tela cheia: [PHASE2_VALIDATION.md](PHASE2_VALIDATION.md).
