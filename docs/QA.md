# QA reproduzível

Use Node 24.19.0, `npm ci` e o navegador desktop atualizado. Execute primeiro `npm test`, `npm run lint`, `npm run build` e `npm audit`. Registre versões, resultado e cenário; não transforme uma etapa não executada em aprovação.

## Navegador automatizado

Inicie o Vite com `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`. Em outro terminal, use um perfil separado do Chrome para QA.

Linux no ambiente isolado desta tarefa:

```sh
chromium --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/workspace/.cache/chromium-qa about:blank
```

O sandbox interno é dispensado somente nessa máquina já isolada. Em Windows/PowerShell, mantenha o sandbox normal:

```powershell
& "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir="$env:TEMP\moba-qa-chrome" about:blank
```

Ajuste o caminho se o Chrome estiver instalado em outro local. Não use o perfil pessoal padrão. Com o navegador e o Vite ativos:

```sh
npm run test:browser
npm run test:storage
```

O primeiro verifica navegação, 40 níveis, quatro diagnósticos, dez entradas/saídas da cena, um RAF ativo por cena, nenhum canvas/RAF retido no menu, heap após GC e ausência de overflow em 1366×768, 1920×1080 e 390×844. Também confere os três presets em DPR 2 pelo tamanho real do buffer, restaurando a preferência anterior no final. `QA_ARTIFACT_DIR` opcional grava screenshots fora do código.

O segundo usa **IndexedDB nativo**, cria banco de QA com nome único, verifica v1→v2 não destrutivo, upgrade bloqueado, quatro modalidades, backup, conflitos, idempotência, quota simulada com rollback e seis conquistas permanentes. Fecha conexões e remove somente esse banco criado pelo próprio teste.

Sem Chrome/CDP, esses dois checks ficam **NÃO VERIFICADOS**, não aprovados por substituição com mocks. Os testes Vitest de renderer usam mocks para ownership e regras; não atestam GPU física.

## Gameplay manual no Windows — pendente

1. Abra Todos os níveis. Entre em cada modalidade nos níveis 1 e 10 e teste todas as variantes. Confira seleção antes do início e imutabilidade durante o oficial.
2. Esquiva: Normal 60 s/3 vidas e Sobrevivência 1 vida/sem limite; quatro ataques; tangência, gancho sem colisão do cabo, áreas já ativas sem aviso, dano único e prioridade do impacto fatal no frame final.
3. Precisão: esquerdo acerta somente a esfera visível; erros permanecem; reposição preserva os outros alvos. Câmera/zoom e níveis não alteram a hitbox lógica.
4. Kiting: primeiro clique seleciona; outro inicia preparação de 0,25 s; movimento antes da confirmação cancela; depois dela preserva hit. Intervalo 0,9 s, alcance central inclusivo de 5 u, A somente exibe alcance. Móvel e perseguidor usam posição vigente.
5. Reflexos: responda corretamente, erre, antecipe, segure tecla e deixe omitir em todos os quatro exercícios. NO-GO corretamente inibido não tem latência zero. Foco em campos/botões não dispara resposta de gameplay.
6. Pause em countdown, ação e recuperação. Troque de aba e retorne. Tempo, alvo, cooldown e animações congelam. Retome explicitamente; abandono e atualização não geram resultado oficial.
7. Complete três rodadas reais em cada diagnóstico. Confira 20 s ativos, transição por ação, resumos, recomendação apenas quando há evidência, Refazer e Cancelar. Compare contagem do histórico antes/depois.
8. Complete oficiais de 60 s com e sem atividade. Confira componentes, amostra pequena, commit e reload. Sobrevivência pode encerrar antes. Compare somente o mesmo contexto.
9. Perfil/histórico: filtros combinados, paginação, notas originais, rating com três recentes, data da primeira conquista e falha de leitura independente por modalidade.
10. DPI: 800 × 1,5 = 1200; novo DPI 1600 → sensibilidade 0,75. Faça dois testes de dez alvos, com miss e pausa; comparação tem unidades e ressalvas; resize invalida a rodada.
11. Backup: exporte, confira prévia, importe repetidamente, crie conflito em cópia de QA; nunca sobrescreva ID conflitante. Falha não pode aparecer como sucesso. Preferências existentes não são substituídas.
12. Acessibilidade e gráficos: contraste, texto ampliado, tabulação e reduced motion; Leve/Médio/Alto alteram renderização, não dificuldade. Mute/volume devem afetar sons atuais e novos após gesto.
13. Simule WebGL indisponível/context loss e armazenamento negado. O menu deve continuar utilizável, sem registros falsos. Repita dez entradas/saídas e confira ausência de duplicação de input ou cena.

A revisão Linux/Chromium executada nesta tarefa está registrada nos relatórios. Percepção de áudio, adequação dos controles, calibração humana das metas e desempenho em Windows/GPU real exigem o teste acima.
