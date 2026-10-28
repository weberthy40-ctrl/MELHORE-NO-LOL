# RIFT LAB — Fase 1: documentação e instruções

Data: 27/10/2026. Checkout atual `MELHORE-NO-LOL`, versão `1.0.0-rc.14`. Este registro documenta esta execução; não substitui os resultados históricos de VALIDATION.md nem aprova uma release.

## Alterações e revisão

- `docs/QA.md`: alinhado com escopo/revisão atuais e implementação. Corrigidos contagem de níveis, início manual e duração ilimitada de esquiva, avaliação adaptativa, clique de kiting, patentes e DPI. Incluídos os quatro scripts de navegador existentes, suas opções/exclusões e isolamento de perfil.
- `AGENTS.md`: instruções de escopo, referências normativas, limites arquiteturais, proteção da persistência/backups, validação e critérios de conclusão.
- Este arquivo: resultados atuais separados das pendências e dos achados.

Foram inspecionados README, ARCHITECTURE, CURRENT_SCOPE, DEVELOPMENT_RULES, QA, revisão rc.14, documentação de validação/ambiente, package.json, lockfile, configurações e os scripts/workflows existentes. Dois subagentes revisaram independentemente AGENTS e QA, sem editar. A observação de precondição de perfil vazio/ordem esquiva→gameplay foi incorporada.

Nenhuma mudança em aplicação, mecânicas, balanceamento, pontuação, persistência funcional, interface, dependências declaradas, lockfile, scripts ou workflows. Sem commit, push ou deploy. Sem atualização do rascunho de configuração Cloud.

## Ambiente e instalação

- Node `v24.19.0`, npm `11.9.0`, Chromium `154.0.8037.57`, Linux.
- `node_modules` ausente no início. Instalação realizada somente após autorização explícita do usuário.
- `npm ci --cache /workspace/.cache/npm --no-fund`: primeira tentativa falhou com `EPERM` ao conectar ao proxy; repetição com permissão de execução de rede concluiu com saída 0, 150 pacotes. Sem desativar TLS ou integridade.
- `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort` e Chromium inicialmente bloqueados pelo sandbox (listen/socket `EPERM`). Repetidos com permissão apropriada, iniciaram. Respostas HTTP 200 confirmadas em `/` do Vite e `/json/version` do DevTools.
- Chromium com perfil exclusivo desta execução em `/tmp/rift-lab-phase1-chromium`, CDP em loopback. Avisos de D-Bus ausente são do ambiente; não constituem falhas de assertions da aplicação.
- `node_modules/`, `dist/` e cache npm são saídas locais ignoradas; não são alterações de fonte.

## Verificações efetivamente executadas

| Comando/verificação | Resultado desta execução |
| --- | --- |
| `npm test` | Saída 0; 259 testes em 54 arquivos passaram, sem skips reportados; duração 9,88 s. |
| `npm run lint` | Saída 0, sem erros ou avisos. |
| `npm run build` | Saída 0; 117 módulos transformados. Aviso de chunk 3D de 714,70 kB minificado (187,52 kB gzip), acima de 500 kB. |
| `npm audit --cache /workspace/.cache/npm` | Saída 0; zero vulnerabilidades conhecidas na consulta. |
| `npm run test:browser` | Saída 0, `scope: full`: seis rotas, 30 níveis + seletor de 20, quatro diagnósticos, dez remontagens em Leve, sem RAF/canvas restantes; heap do ciclo 2 ao 10 cresceu 658.772 bytes (limite 5 MiB). Três presets e viewports passaram. |
| `npm run test:storage` | Saída 0: bloqueio confirmado, um registro migrado, três adicionados, quatro no round-trip, um conflito preservado, rollback confirmado, seis conquistas permanentes. |
| `CDP_TIMEOUT_MS=45000 npm run test:dodge` | Saída 0: Sobrevivência 20 e derrota real salva; cinco etapas 5→2→1→1→1, avaliação persistida e Normal 1 com início manual; direito, dash E, Flash F, câmera livre/Espaço e perfil parcial conferidos. |
| `CDP_TIMEOUT_MS=45000 npm run test:gameplay` | Saída 1, antes do combate: `Condição não atingida: Boolean(document.fullscreenElement)`. Página em kiting 1, estado idle, zero ataques. Não aprova a suíte nem tela cheia. |
| `QA_SKIP_FULLSCREEN=1 CDP_TIMEOUT_MS=45000 npm run test:gameplay` | Saída 0, com tela cheia explicitamente excluída: kiting com três ataques/um cancelamento/um abate e Flash; quatro grupos de precisão completos (16 acertos, um erro); reflexos com 22 respostas corretas, zero erros de escolha/omissões/antecipações e quatro inibições; derrota de kiting 10 salva e reinício confirmado. |
| Referências Markdown locais | 12 destinos existentes nos três documentos. |
| `git diff --check` | Sem erros nas verificações realizadas durante a edição. |

Os scripts de navegador apontaram para Vite dev, executados sequencialmente no perfil isolado. Nenhum recorte `QA_MENUS_ONLY` ou `QA_GAMEPLAY_CASE` foi usado. A única exclusão foi tela cheia na repetição de gameplay. O texto fixo emitido pelo script menciona uma página mínima de tela cheia; essa investigação histórica não foi repetida nesta fase e não é evidência nova.

Conferência final: referências locais existentes, `git diff --check` sem erros e diff vazio para `src`, `tests`, `scripts`, `.github`, `package.json` e `package-lock.json`. O estado Git contém somente os três arquivos de documentação listados acima. Servidor e navegador de QA encerrados após os testes; dependências/build locais permanecem ignorados.

## Problemas encontrados na inspeção

1. **Corrigidos no QA:** critérios antigos contradiziam a rc.14 (40 níveis, Normal 60 s/quatro ataques, dois cliques de kite, três etapas universais de diagnóstico, classificação histórica e conversão de sensibilidade).
2. **Histórico arquitetural:** ARCHITECTURE.md acumula contratos antigos por blocos. Foi preservado; AGENTS e QA orientam usar CURRENT_SCOPE e a revisão vigente para comportamento atual, investigando divergências sem reintroduzir regras antigas.
3. **Precondição de testes:** test:dodge espera somente uma modalidade avaliada no perfil; test:gameplay grava kiting. Reutilização de perfil pode gerar falso diagnóstico de regressão. Documentados perfil novo e ordem correta, sem alterar scripts.
4. **CI/publicação:** CI executa instalação, testes, lint, build e audit, sem suítes de navegador. Pages repete teste/lint/build, mas não depende do job de auditoria. Apenas inspecionado; workflows preservados conforme escopo.
5. **Desempenho:** aviso de bundle permanece. Não houve refatoração nem ajuste de limite para ocultá-lo.
6. **Documentação de ambiente:** ENVIRONMENT.md declara scripts salvos em rascunho; a leitura da configuração nesta conversa retornou install_script/start_skill nulos. O documento não comprova configuração desta instância; não foi alterado nem houve novo salvamento Cloud nesta fase.
7. **Tela cheia headless:** o cenário padrão não obteve `document.fullscreenElement` no prazo de 15 s próprio desse check (distinto do timeout CDP de 45 s). A causa exata da recusa/ausência de transição não foi determinada; não foi reproduzido em Windows nem tratado como defeito confirmado de gameplay. A opção existente `QA_SKIP_FULLSCREEN=1` permite testar os demais cenários sem alterar assertions ou código.
8. **Aviso Three.js:** o servidor registrou `PCFSoftShadowMap has been removed. Using PCFShadowMap instead.` durante o navegador. Os cenários concluíram, mas existe uso de uma opção removida com fallback; correção de renderização fica fora desta fase documental.

## Verificações não executadas e limites

- Aceitação humana em Windows/Chrome/Edge, tela cheia real em Windows, GPU/FPS físicos, áudio percebido, DPI com régua e calibração com jogadores.
- Servidor `npm run preview` e smoke específico do build de produção não executados nesta fase; build e navegador foram verificados separadamente, com os scripts apontando para Vite dev.
- CI remoto, publicação GitHub Pages e restauração de nova tarefa após Publish.
- Nenhuma equivalência entre patentes/diagnóstico do treinador e elo ou desempenho real no LoL foi validada.

A fase altera documentação e instruções. Testes de código aprovados não substituem estes aceites nem significam aprovação 1.0.
