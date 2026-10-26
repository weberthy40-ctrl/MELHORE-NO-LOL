# 099 — Linha de base

Data: 26/10/2026. Base criada no repositório inicialmente vazio a partir dos prompts anexados; o texto dos anexos não foi usado como evidência de aprovação. Release candidata 1.0.0-rc.1, ES Modules/Vite/Three.js, Node 24.19.0/npm 11.9.0.

| Requisitos | Implementação e verificação |
| --- | --- |
| 001–012 | Núcleo, lifecycle, navegação, arena/personagem, câmera e sessão compartilhada; testes de reentrada, erros e cleanup |
| 013–030 | Esquiva completa e diagnóstico; modos, colisão swept, telemetria, score, histórico e progressão |
| 031–045 | Quatro variantes de Precisão e diagnóstico isolado; fórmula preservada conforme escolha do usuário |
| 046–060 | Três variantes de Kiting, ataque manual, progressão e diagnóstico |
| 061–075 | Quatro Reflexos técnicos/oficiais, medição visual monotônica e diagnóstico 3/6/9 |
| 076–080 | DPI manual, teste em memória, Perfil e painel dos quatro diagnósticos |
| 081–088 | Backup, preferências, gráficos reais, áudio, VFX e animação consumindo eventos |
| 089–098 | Regressão, ownership, testes de navegador e gates de candidato |
| 099–105 | Aceitação complementar e limites documentados nestes arquivos |

Correções concretas durante a revisão: guarda de salvamento contra renderização obsoleta, desempate estável de rating, aplicação da seleção antes do início, encerramento do RAF quando a própria atualização desmonta a cena, recusa de variantes herdadas e componentes contraditórios de backup. Os testes preservam os comportamentos anteriores; a identidade da página inicial foi atualizada para remover o placeholder da fundação, mantendo suas verificações semânticas.

Não foram reproduzidos P0 (perda de dados/impede jogar) nem P1 (mecânica principal incorreta) nas verificações concluídas. Pendências humanas e Windows estão nos critérios finais, sem aprovação implícita.
