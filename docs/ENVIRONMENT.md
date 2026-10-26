# Ambiente de desenvolvimento na nuvem

Checkout: `/workspace/MELHORE-NO-LOL`. Cada tarefa já tem isolamento; não é necessário criar worktree. Node 24.19.0 e npm 11.9.0 foram usados na validação. Não há backend, banco externo, API Riot ou credenciais de aplicação.

Instalação reutilizável salva no rascunho do ambiente:

```sh
cd /workspace/MELHORE-NO-LOL
npm ci --cache /workspace/.cache/npm --no-fund
npm test
npm run lint
npm run build
npm audit --cache /workspace/.cache/npm
```

O script também valida Node 24 LTS >=24.15.0. Início: `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`. O `start_skill` salvo registra checkout, comandos, requests internos de prontidão, checks do DOM, Chromium/CDP e preview de produção. Não contém segredos e não altera a política de rede.

O navegador real é opcional para o desenvolvimento básico, mas obrigatório para declarar os gates `test:browser`/`test:storage` aprovados. Veja QA.md. Os scripts de teste estão no checkout, sem depender de arquivos de scratch retidos.

**Salvar o rascunho não publica o ambiente.** Review/Save/Publish nas configurações é uma etapa distinta; restauração em nova tarefa após Publish não foi verificada. A aplicação e o banco do navegador também têm persistências distintas: publicar o ambiente não sincroniza o progresso local entre dispositivos.
