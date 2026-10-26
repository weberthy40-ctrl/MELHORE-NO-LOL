# Candidato 1.0.0-rc.1

| Gate | Estado | Evidência |
| --- | --- | --- |
| Instalação pelo lockfile | PASSOU | `npm ci`, Node 24.19.0/npm 11.9.0 |
| Testes automatizados | PASSOU | Suite Vitest completa, sem testes desativados |
| Lint | PASSOU | ESLint, zero avisos |
| Build | PASSOU | Vite; Three.js sob demanda mantém aviso de chunk >500 kB |
| Auditoria | PASSOU | Zero vulnerabilidades na execução registrada |
| IndexedDB real e migração | PASSOU | `npm run test:storage` |
| Navegação/viewport/10 remontagens | PASSOU | `npm run test:browser` |
| Gameplay real em Chromium/Linux | PASSOU nos cenários registrados | Ver VALIDATION e relatórios 100–104 |
| Windows/Chrome/Edge e hardware real | NÃO VERIFICADO | Roteiro QA pendente |
| Calibração e fairness humana | NÃO VERIFICADO | Heurísticas documentadas; teste independente de rota não é validação universal |
| ZIP íntegro e instalação extraída | PASSOU | CRC e equivalência; npm ci, 158 testes, lint, build e audit na extração isolada; smoke do build de produção |
| CI remoto | NÃO VERIFICADO | Workflow fornecido; só a execução remota pode confirmá-lo |
| Novo ambiente após Publish | NÃO VERIFICADO | Scripts salvos não equivalem à publicação/restauração |

Decisão: **manter RC**, sem afirmar aprovação 1.0.0. Nenhum P0/P1 foi reproduzido nos checks executados; isso não certifica cenários não testados.
