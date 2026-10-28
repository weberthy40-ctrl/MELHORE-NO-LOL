# Instruções para o Codex

## Fontes e escopo

- Trabalhe no checkout atual. Cada tarefa Cloud já é isolada; não crie worktree sem pedido explícito.
- Preserve o produto funcional. Faça mudanças pequenas dentro do pedido, sem reconstrução ou refatoração ampla incidental.
- Siga [DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md). Para comportamento vigente, consulte [CURRENT_SCOPE.md](docs/CURRENT_SCOPE.md), a revisão nele indicada e o [README](README.md).
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) registra contratos e evolução por blocos. Etapas antigas são históricas: não reintroduza regras substituídas. Se código, teste e documento divergirem, investigue e registre a divergência antes de mudar comportamento.

## Arquitetura

- SPA JavaScript ES Modules, DOM próprio, rotas hash e Three.js, sem backend obrigatório. Use a organização do README e os contratos de ARCHITECTURE.md.
- Preserve núcleo independente de DOM/Three.js, regras de treino/progressão separadas da renderização e entradas adaptadas pela UI. Reutilize os serviços existentes.
- Preserve descarte de cenas, listeners e recursos; não duplique loops ou serviços globais. Não altere mecânicas, curvas, métricas ou pontuação fora do escopo autorizado.

## Persistência e backups

- Leia os contratos em ARCHITECTURE.md e os módulos/testes correspondentes antes de alterar dados. Preserve registros legados, snapshots de pontuação e versões de contexto; não recalcule nem sobrescreva histórico para acomodar regras novas.
- Mantenha migrações não destrutivas, validação nas fronteiras, retry idempotente e sucesso somente após commit. Conflitos de ID não podem sobrescrever dados.
- Preserve formatos de backup aceitos, limites e validação. Importação é por mesclagem com prévia; preferências existentes não são substituídas. Evolução de esquema exige compatibilidade explícita e testes de dados legados, round-trip, conflitos e falhas.
- Use perfil separado conforme [QA.md](docs/QA.md). Nunca apague dados pessoais para fazer um teste passar; scripts de gameplay podem gravar tentativas oficiais no perfil usado.

## Execução e validação

- Use Node de `.nvmrc` e dependências do lockfile. Quando necessário, instale com `npm ci`, preservando lockfile e verificação TLS/integridade. Respeite exigências de autorização da tarefa.
- Comandos existentes: `npm run dev`, `npm run preview`, `npm test`, `npm run lint`, `npm run build`, `npm audit`. Preparação e comandos/cenários de navegador estão em [QA.md](docs/QA.md); não duplique o roteiro aqui.
- Para código, execute testes de comportamento afetados e gates aplicáveis de teste/lint/build; para dependências, inclua auditoria. UI, cenas e persistência exigem checks correspondentes em navegador quando disponíveis. Para documentação, confira referências e coerência com código/scripts.
- Não enfraqueça assertions nem use mocks como evidência de WebGL/IndexedDB nativos. Headless não comprova DPI físico, FPS em hardware real, tela cheia no Windows, sensação de controle ou calibração competitiva.

## Colaboração e conclusão

- Quando disponíveis e úteis, use subagentes para investigação ou revisão independente. Defina responsabilidade por arquivo antes de edições paralelas; o agente principal integra e verifica.
- Antes de encerrar, revise `git diff` e `git status`; remova apenas artefatos indevidos criados pela tarefa e confira que produto, lockfile e workflows não mudaram incidentalmente.
- Informe arquivos alterados, comandos efetivamente executados/resultados, falhas, skips, verificações não executadas e bloqueios. [VALIDATION.md](docs/VALIDATION.md) contém evidência histórica, não execução atual; zero testes não valida uma suíte.
- Conclua apenas o escopo pedido, com regressões relevantes verificadas ou limitações explícitas. Não declare release aprovada, CI remoto, publicação ou restauração sem evidência. Não faça commit, push ou deploy sem autorização da tarefa.

## Evolução contínua

- Para tarefas de desenvolvimento, aplique proporcionalmente ao escopo a [skill rift-lab-evolution](.agents/skills/rift-lab-evolution/SKILL.md), consulte a [visão/backlog](docs/EVOLUTION.md) e retome o [registro](docs/EVOLUTION_LOG.md).
- Registre o prompt específico e o aceite antes da implementação; conclua e valide um ciclo antes do próximo. Guarde resultados reais, limites e próxima tarefa no registro, sem duplicar os contratos de QA/arquitetura.
- Autonomia depende do pedido atual: a evolução não amplia um escopo futuro restrito. Respeite autorizações humanas e o limite de três rodadas por problema definido na skill.
