# 105 — Critérios de lançamento

**Decisão: candidata 1.0.0-rc.1; não promover para 1.0.0 aprovada.**

PASSOU no ambiente Linux/Chromium: instalação pelo lockfile, suíte Vitest completa, lint sem avisos, build, auditoria, migração e rollback nativos, navegação, sessões reais registradas, quatro diagnósticos, backup e dez remontagens. A evidência está nos relatórios 099–104 e em VALIDATION.md.

Não foram reproduzidos P0/P1 conhecidos nesses checks. A classificação de severidade usada é: P0 perda de dados/impede jogar; P1 mecânica ou fluxo principal incorreto; P2 problema recuperável; P3 cosmético. Não tratar cenários não executados como ausência comprovada de defeitos.

| Pendência | Estado / impacto |
| --- | --- |
| Aceitação humana Windows/Chrome/Edge, áudio e GPU | PENDENTE DE TESTE REAL; seguir QA.md |
| Calibração de metas, pesos e fairness com jogadores | Provisória; sem validação científica ou equivalência competitiva |
| Estabilidade longa e FPS em hardware alvo | NÃO VERIFICADO; dez ciclos curtos não substituem teste sustentado |
| Chunk Three.js sob demanda >500 kB | Aviso conhecido; build funciona; otimização futura depende de medição |
| CI no GitHub | Workflow entregue; resultado remoto não foi presumido |
| Ambiente publicado e nova tarefa restaurada | Configuração salva é distinta de Publish e de teste em nova tarefa |

A entrega deve conter fontes, assets originais usados, testes, scripts, documentação e lockfile. Exclui dependências instaladas, dist, .git, caches, logs, perfis de navegador e dados do jogador. CRC e equivalência dos arquivos foram conferidos. A extração isolada passou por instalação limpa, 158 testes, lint, build e audit; o build extraído também passou pelo smoke de produção em Chromium. Os mesmos fontes/scripts validados compõem o ZIP final; os últimos ajustes foram apenas estes registros de documentação. Nenhum diagnóstico ou teste de DPI é incluído como progresso oficial.
