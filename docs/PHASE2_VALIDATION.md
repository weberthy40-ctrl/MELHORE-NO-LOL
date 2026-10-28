# RIFT LAB — Fase 2: automação segura de QA

Data: 27/10/2026. Versão rc.14. Trabalho no checkout atual, preservando as alterações documentais da Fase 1.

## Implementação

- `.github/workflows/ci.yml`: estende o job existente após test/lint/build/audit; mesmo Node via `.nvmrc`, mesmos gatilhos. Executa helper com limite de 35 minutos e coleta evidências com `always()`, retenção de sete dias.
- `scripts/ci-browser.sh`: orquestra Vite e Chrome/CDP com perfil temporário, prontidão limitada, timeout de 360 s por suíte, pipefail, logs, resumo e cleanup. Reutiliza browser/storage/dodge/gameplay, sem novas dependências. Limpa opções herdadas que reduziriam o escopo. Somente fullscreen é excluído explicitamente no headless.
- `docs/QA.md`: documenta o comando de orquestração e comportamento novo de CI.
- Este relatório: separa execução local da configuração remota futura.

Antes, somente instalação, Vitest, lint, build e audit eram automáticos em ci.yml. As suítes CDP dependiam de preparação manual. Pages possui outro workflow, que não foi alterado: continua com seus gatilhos, permissões, build e deploy originais. **Falha do novo QA não bloqueia o Pages atual.** Vincular publicação ao gate exige autorização para outra etapa.

O Chrome já fornecido pelo runner Ubuntu é utilizado; não há download extra nem instalação de dependências do projeto nesta fase. Ausência/incompatibilidade do navegador causa falha visível. A versão efetiva é registrada; execução no runner remoto ainda é necessária para comprovar compatibilidade.

## Validação local desta fase

Ambiente: Node 24.19.0, npm 11.9.0, Chromium 154.0.8037.57. Dependências da Fase 1 reaproveitadas.

- `bash -n scripts/ci-browser.sh`: saída 0.
- YAML analisado com PyYAML disponível no ambiente (BaseLoader); gatilhos preservados, helper e upload always confirmados. Não equivale a execução remota.
- Teste negativo `CHROME_BIN=false ... bash scripts/ci-browser.sh`: saída 1 antes das suítes; não passa silenciosamente sem navegador.
- `npm run lint`: saída 0.
- Rodada inicial: os quatro scripts emitiram PASSOU, mas editar o helper durante sua execução invalidou o resumo (linha contraditória FAILED exit 0). Essa rodada não é usada como aprovação do orquestrador. A versão final foi reexecutada sem edição concorrente, com artefatos separados; resultados abaixo.
- `git diff --check`: sem erros durante revisão. Diff de produto, lockfile e Pages vazio.
- Revisão independente por subagente: preservação de saída não zero, readiness, isolamento, ordem, timeout, cleanup e publicação. Sugestão incorporada: limpar opções herdadas de recorte/CDP. A rodada final injeta deliberadamente QA_MENUS_ONLY=1, QA_GAMEPLAY_CASE=kiting-defeat e CDP_URL=http://invalid para verificar que o helper os ignora e executa o escopo completo no perfil próprio.

## Investigação de fullscreen

O timeout do cenário de produto na Fase 1 permanece como falha registrada, sem nova declaração de aprovação nesta fase. A Fase 2 usa a exclusão existente para executar os demais cenários.

Sondagem separada em Chromium headless, porta 9223, perfil exclusivo, página `about:blank` com um botão criado somente em memória: clique nativo CDP nas coordenadas medidas do botão solicita `document.documentElement.requestFullscreen()`. Após três segundos: `fullscreenEnabled=true`, ativação do usuário=true, foco=true, handler iniciado=true, `fullscreenElement=false`; a Promise não havia resolvido nem rejeitado. Browser encerrado após coleta.

Tentativas preliminares do diagnóstico não entregaram clique ao botão por problema na página/nome do elemento e foram descartadas como evidência de fullscreen. O diagnóstico final confirmou clique e ativação. Não foi alterado código do produto, usado fullscreen simulado nem concluído que a API está universalmente quebrada. O resultado mostra ausência de transição também sem aplicação neste ambiente; causa exata, comportamento em Chrome do GitHub e Windows permanecem abertos. Evidência temporária em `/tmp/rift-phase2/fullscreen-result.json`.

## Limites e não executados

- GitHub Actions remoto, upload real de artefatos e compatibilidade com a versão do Chrome hospedado: configurados, não executados.
- Fullscreen no gate: SKIPPED explicitamente; não aprovado. Aceite humano Windows, GPU/FPS, áudio e DPI físico permanecem pendentes.
- Vitest/build/audit não repetidos nesta fase de orquestração; resultados da Fase 1 não são novas execuções. CI mantém esses comandos.
- Sem instalação, dependências novas, mudanças no lockfile/produto, serviços, segredos, commits, pushes ou deploy. Sistema de auto-prompt não iniciado.

## Evidências da rodada final

Comando: `CHROME_BIN=chromium QA_ARTIFACT_DIR=/tmp/rift-phase2/final QA_MENUS_ONLY=1 QA_GAMEPLAY_CASE=kiting-defeat CDP_URL=http://invalid bash scripts/ci-browser.sh`. As três últimas variáveis foram removidas pelo helper; não reduziram os testes.

- `test:browser`: PASSOU com `scope: full`, dez remontagens, presets e viewports.
- `test:storage`: PASSOU com migração de um registro, três adicionados, round-trip de quatro, um conflito, rollback e seis conquistas.
- `test:dodge`: PASSOU com as cinco etapas, entrada no Normal e mobilidade nativa.

Artefatos temporários locais: `/tmp/rift-phase2/final/`; não demonstram upload no GitHub. Nenhuma dessas verificações aprova fullscreen ou aceite de hardware.
- `test:gameplay`: PASSOU com fullscreen explicitamente SKIPPED; quatro grupos de precisão, reflexos integrados, kiting e derrota/reinício. As demais assertions originais foram mantidas.
- Helper final: saída 0, resumo coerente com quatro PASSED e uma exclusão de fullscreen, sem linhas contraditórias. Perfil/processos próprios removidos pelo trap.

Conferência final: sintaxe shell e diff sem erros; produto, dependências e Pages sem alterações. As mudanças de AGENTS e relatório Fase 1 já existiam ao iniciar esta fase e foram preservadas. Autorização adicional só seria necessária para ampliar escopo (por exemplo, vincular Pages ao gate, mudar produto/dependências ou iniciar auto-prompt).
