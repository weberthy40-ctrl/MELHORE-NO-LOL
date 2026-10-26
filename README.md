# MOBA Training

Treinador web de mecânicas de MOBA, em português, com arena e personagens originais. **Versão candidata 1.0.0-rc.1**: implementações dos blocos 001–088 e revisão dos blocos 089–105. A aceitação manual no Windows e a calibração com jogadores permanecem pendentes; esta entrega não declara uma versão 1.0 aprovada.

- **Esquiva:** quatro ataques nos dez níveis; Normal com 60 segundos e três vidas; Sobrevivência com uma vida e tempo ilimitado.
- **Precisão:** um ou três alvos, estáticos ou móveis; prática técnica e sessões oficiais de 60 segundos.
- **Kiting:** alvo parado, móvel e perseguidor; seleção e ataques manuais, preparação, cancelamento por movimento, recuperação e alcance.
- **Reflexos:** Espaço, F/J, Go/No-Go e setas; práticas de 5/8/12/16 rodadas e treinos oficiais de 60 segundos.
- **DPI:** calculadora manual e teste local de dez alvos, com comparação entre duas rodadas. Não mede DPI físico.

Todos os níveis 1–10 estão disponíveis. Cada modalidade tem histórico local, recordes por contexto, evolução, seis conquistas, classificação pessoal e avaliação guiada de três etapas de 20 segundos. A recomendação diagnóstica é provisória, fica em memória e não altera o Perfil. Não há score global, contas, backend, API Riot ou sincronização.

## Executar no Windows ou Linux

Instale **Node.js 24 LTS >=24.15.0 e <25**; a versão validada está em `.nvmrc` (24.19.0). Extraia o ZIP, abra o terminal na pasta que contém `package.json` e execute:

```sh
npm ci
npm run dev
```

Abra no navegador o endereço mostrado pelo Vite. O terminal precisa continuar aberto. O gameplay é otimizado para PC com teclado e mouse; menus e relatórios se adaptam a telas estreitas. Use um navegador com WebGL e IndexedDB.

Para a distribuição de produção:

```sh
npm run build
npm run preview
```

Não abra `index.html` diretamente pelo explorador de arquivos. O projeto usa ES Modules e requer o servidor. O lockfile contém as versões reais; não é necessário atualizar dependências para executar.

## Controles

| Ação | Controle |
| --- | --- |
| Mover o personagem | Clique direito na arena |
| Câmera travada/livre | Y |
| Aproximar/afastar | Roda do mouse |
| Mover câmera livre | Bordas da arena, conforme preferência |
| Pausar/retomar | ESC ou botão; perda de foco pausa |
| Acertar alvos de Precisão | Clique esquerdo |
| Selecionar / solicitar ataque de Kiting | Primeiro clique esquerdo seleciona; outro prepara ataque |
| Cancelar preparação de Kiting | Comando de movimento com clique direito |
| Ver alcance de Kiting | Segurar A |
| Responder em Reflexos | Espaço, F/J, F ou setas, conforme exercício |

Pausa, preparação e tempo sem foco não contam como tempo ativo. A retomada após perda de foco é explícita. Saída antecipada não salva conclusão oficial.

## Dados e configurações

O progresso fica no **IndexedDB deste navegador e origem**. Trocar de porta, navegador ou dispositivo cria outro contexto de dados. No resultado, “Salvo neste dispositivo” aparece somente após commit; falhas oferecem nova tentativa com o mesmo ID.

Configurações inclui câmera, contraste, tamanho do texto, redução de movimento, qualidade gráfica, áudio e backup. Leve/Médio/Alto mudam somente renderização; qualidade é aplicada na próxima abertura da arena. Áudio é original, opcional e liberado por gesto do usuário.

Exporte o backup JSON deliberadamente em Configurações. Importação aceita até 10 MiB, mostra prévia e mescla IDs ausentes, preservando conflitos. Não oferece substituição ou apagamento. Preferências ausentes podem ser importadas mediante opção explícita; valores locais existentes permanecem. Resultados temporários de diagnóstico e DPI não entram no backup.

## Validação

```sh
npm test
npm run lint
npm run build
npm audit
```

Há verificações adicionais em Chromium real, sem dependências de automação extras:

```sh
npm run test:browser
npm run test:storage
```

Elas exigem servidor de desenvolvimento ativo e Chromium/Chrome com DevTools na porta 9222. Consulte [QA.md](docs/QA.md) para preparar o navegador, executar as verificações e testar os fluxos de gameplay no Windows. Os comandos não iniciam ou instalam o navegador automaticamente. A suíte de armazenamento usa e remove apenas seu próprio banco temporário; não apaga progresso oficial.

A evidência e os limites estão em [VALIDATION.md](docs/VALIDATION.md), [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) e [critérios finais](docs/validacao/105-criterios-lancamento.md). A existência de um roteiro não significa que tenha sido executado.

## Organização

| Pasta | Responsabilidade |
| --- | --- |
| `src/core`, `src/app` | Estado, eventos, lifecycle, erros e composição |
| `src/ui` | Navegação, telas e adapters de entrada |
| `src/game3d` | Arena, personagem, câmera, visuais e ownership de recursos |
| `src/training` | Sessões, exercícios, métricas, scores e diagnósticos |
| `src/progression` | Agregação de histórico, recordes, conquistas e rating |
| `src/persistence` | Snapshots, IndexedDB, migração e backup |
| `src/settings`, `src/audio`, `src/tools` | Preferências, áudio e ferramenta de mouse |
| `tests`, `scripts` | Testes puros, de interface e de navegador |

A arte é procedural e original, sem assets oficiais de outros jogos ou downloads em runtime. Consulte [ARCHITECTURE.md](docs/ARCHITECTURE.md) para fórmulas, versões e contratos.

## Distribuir

O ZIP inclui fontes, testes, scripts, documentos e lockfile; não inclui node_modules, dist, .git, caches ou dados do jogador. Em um clone Git, o mesmo conjunto rastreado pode ser empacotado com:

```sh
git archive --format=zip --prefix=moba-training/ HEAD -o MOBA_Training_Prompt_105.zip
```
