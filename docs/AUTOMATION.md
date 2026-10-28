# Autoevolução recorrente do RIFT LAB

## Política vigente: orçamento adicional R$ 0

A integração de API paga está bloqueada por `paid_api_allowed:false` e orçamento0
na política confiável. Nem `RIFT_AUTOMATION_ENABLED=true` nem uma variável de orçamento
maior pode ultrapassar esse bloqueio. Não configure chave API nem ative serviços pagos
para esta missão. O restante deste documento descreve a infraestrutura existente, não
uma promessa de retomada incluída na assinatura ChatGPT.

O mandato vigente está na issue2: https://github.com/weberthy40-ctrl/MELHORE-NO-LOL/issues/2 .

O mecanismo está implementado; **agendamento e uso da API não estão comprovados**.
O fluxo não faz merge, release nem deploy. CI e Pages existentes não foram alterados.
Estado da implantação (28/10/2026):

| Etapa | Situação comprovada |
| --- | --- |
| Implementado no repositório | Sim, controladores/prompt/workflow e testes locais. |
| Enviado ao remoto | Sim: branches `rift-lab/autoevolution-infra` (infra somente) e `rift-lab/product-journey` (seed25acaf9). Main intacta. |
| Segredo configurado | Não verificado; nenhuma chave foi criada ou lida nesta tarefa. |
| Primeira execução remota do orquestrador | Não comprovada. API do GitHub nesta sessão retornou Forbidden; nenhum modelo/API foi chamado. |
| Agendamento comprovado | Não. Workflow ainda fora da branch padrão; nenhum merge/ativação foi feito. |

Abertura automática do PR foi recusada pela API (`Forbidden`), apesar de o push Git
funcionar. [Abra o PR de infraestrutura para main](https://github.com/weberthy40-ctrl/MELHORE-NO-LOL/compare/main...rift-lab/autoevolution-infra?expand=1)
e confira os18 arquivos de infraestrutura antes de mesclar. Não use a branch de
produto para esse PR. Evidências locais completas estão em EVOLUTION_LOG.md na
branch de checkpoint do desenvolvimento; o PR de infraestrutura não transporta
esse histórico de produto para main.

## Retomada gratuita: conclusão verificável

| Caminho | Evidência e limite | Decisão atual |
| --- | --- | --- |
| A — ChatGPT/Codex app ou CLI | README oficial confirma login ChatGPT e uso incluído nos planos. Isso não comprova scheduler nem evento público de renovação da franquia. Nenhuma ferramenta nativa de Automations/Goals foi exposta nesta sessão. | Continuar com a franquia existente; checkpoint pronto. Retomada automática não configurada. |
| B — Ollama/OpenCode local no Windows | Não há hardware/instalação local observável nesta sessão; qualidade, RAM/VRAM e custo de energia não medidos. | Não instalar nem prometer desempenho; alternativa depende de validação do computador. |
| C — Cotas gratuitas de provedores | Nenhuma cota/modelo externo foi comprovado disponível para esta conta. “Free tier” divulgado não prova direito atual nem ausência de cobrança. | Nenhum provedor, token ou serviço ativado. |
| D — CI apenas para testes | Workflows existentes podem validar código enviado sem gerar novas melhorias; franquia/limite de minutos do GitHub depende da conta. | Reutilizar CI existente, sem ativar uso adicional cobrado. Não é agente de desenvolvimento. |

Pesquisa limitada em fontes oficiais: README do Codex consultado com sucesso em
https://github.com/openai/codex#using-codex-with-your-chatgpt-plan confirma autenticação
ChatGPT; chamadas API são outro caminho. As páginas oficiais do app/Automations e ajuda
foram bloqueadas pelo proxy desta sessão (403 no CONNECT). Isso impede confirmar
capacidade/condições atuais por essas páginas; não prova que o recurso inexista em
outra interface. Não há ferramenta aqui para instalar um agendamento nativo.

Não foi encontrado nesta sessão um mecanismo verificável para observar a renovação
da franquia ChatGPT e iniciar automaticamente uma rodada com custo adicional zero.
Não se implementou polling, cópia de OAuth para CI, scraping de franquia ou contorno
de limites. Se uma interface suportada expuser Automations incluídas no plano, a
configuração deve usar esse recurso legítimo e comprovar uma execução antes de afirmar
retomada. Nenhum mecanismo assim está ativo nesta entrega.

A issue2 informa um PR de infraestrutura draft #1; a API desta sessão continuou403.
Uma falha da API não deve ser usada como prova de ausência de PR. A infraestrutura
API antiga não deve ser ativada pelo PR enquanto o mandato de orçamentoR$0 vigorar.
O Pages existente não foi alterado nem acionado por merge nesta tarefa.

## Arquitetura e fonte de confiança

`.github/workflows/rift-lab-autoevolution.yml` executa seis jobs sequenciais:

- **preflight:** exige schedule/dispatch na ref padrão e primeira tentativa; verifica
  histórico mensal, policy e ancestralidade/paths da fonte; sem chave API.
- **implement:** checkout sem credenciais persistidas, GitHub somente leitura;
  manifests imutáveis verificados e `npm ci --ignore-scripts` antes da action.
  A action oficial fixada por SHA é a **última etapa**, usa `:workspace` e `drop-sudo`.
  Só ela recebe a chave via input/proxy oficial. O agente devolve JSON com patch como
  output; nenhum exportador executa depois dele naquele host.
- **verify:** runner novo, sem chave API ou credencial Git persistida. Revalida patch
  em índice temporário e aplica só arquivos permitidos. Os gates rodam como outro
  usuário de SO, com ambiente vazio e sem `.git`; controlador root-owned fora da
  fonte candidata. Mata processos residuais daquele usuário antes da coleta.
  O coletor copia somente bytes de arquivos regulares com limites; rejeita symlinks,
  hardlinks, FIFOs/dispositivos e traversal, inclusive em corrida stat/open.
- **review:** novo runner/contexto, sem Git write; baixa patch e evidências, revalida
  sem executar código candidato e chama Codex em `:read-only`/`drop-sudo`, última etapa.
  A revisão é independente da implementação; não é uma garantia semântica infalível.
- **publish:** único job Git write. Sem chave API. Revalida base/hash/paths/modos e
  aprovação; não instala nem executa código candidato. Cria um commit e faz push
  **normal/fast-forward, sem force/tags**, exclusivamente para `rift-lab/evolution`.
  Mudança concorrente da branch faz a rodada falhar, preservando o estado remoto.
- **report:** registra decisões e estados reais. Jobs skipped não são testes aprovados.

Os controles vêm do SHA do workflow na branch padrão. A fonte de produto vem do último
commit aceito em `rift-lab/evolution`, ou do seed fixado em policy.json. A fonte deve
continuar descendente do seed e não alterar seus controles, manifests ou instruções.
Cada rodada escreve seu autoprompt, resultados e próximo contrato no registro existente.
A branch aceita é o checkpoint durável; falha/não mudança não força um commit artificial.

Um push com `GITHUB_TOKEN` normalmente não dispara outro workflow de push/PR. A prova
interna de QA são os gates do job verify, **não** a suposição de que o CI de push rodou.
Nenhum PR de produto é mesclado automaticamente. Um PR de candidata pode ser criado
posteriormente para revisão humana; o contínuo não depende de um novo prompt humano.

## Limites operacionais e custo

A política confiável está em `.github/automation/policy.json`:

- Agenda diária: `0 12 * * *`, 09:00 America/Sao_Paulo. Cron é alterável por PR confiável;
  GitHub pode atrasar/pular agendas e pode desativar schedules por inatividade conforme
  suas regras. Não há garantia de execução pontual nem processo contínuo nesta sessão.
- Uma rodada por vez; timeout do implementador 15 min, revisor 8 min e QA 50 min
  (jobs têm margens limitadas). Não há wrapper de retry; rerun de uma execução é recusado
  tanto na admissão quanto nos jobs, inclusive rerun parcial que reutilize outputs antigos.
- Até uma implementação e uma revisão Codex por rodada; **cada invocação pode fazer
  várias requisições à API**. O custo real não é medido por este workflow.
- Um ciclo e três correções por problema são instruções ao modelo e critérios de
  revisão, não contadores semânticos garantidos fora dele. Timeouts, número de etapas,
  limite de rodadas e tamanho/caminhos do patch são impostos externamente.
- Patch máximo de 12.000 bytes/30 arquivos, arquivos regulares de até 1 MB; somente
  src/, tests/, public/ e docs/, exceto docs/QA.md e este documento. Instruções AGENTS
  em subdiretórios, qualquer componente oculto, symlinks/gitlinks/executáveis são recusados.
  `.github`, `.agents`, `.codex`, AGENTS.md, scripts, manifests, lockfile e configurações
  não podem ser alterados pelo agente. Evolução da infraestrutura/dependências exige
  outro PR confiável; não é uma limitação criativa do produto.

Variables opcionais (nunca secrets) ajustam a admissão:

| Variable | Padrão | Efeito |
| --- | --- | --- |
| `RIFT_AUTOMATION_ENABLED` | ausente/desligado | `true` não habilita API enquanto paid_api_allowed for false. |
| `RIFT_MAX_MONTHLY_ROUNDS` | 10 | Pode reduzir o teto da policy; histórico UTC inclui jobs implement iniciados, mesmo falhos/cancelados. |
| `RIFT_MONTHLY_BUDGET_USD` | 0 | Ignorada para habilitação enquanto a política R$0 bloqueia API paga. |

Com a política paga explicitamente autorizada em outro mandato, a contagem usa a API do GitHub e falha fechada se histórico estiver incompleto/negado.
A concorrência serializa admissões. **20 USD não é teto rígido de gastos:** uma única
rodada pode exceder a reserva estimada, retries internos da API não são medidos e o
preço/modelo/tokens variam. Não ativar no mandato atual de R$0.
O modelo é o default da CLI fixada em 0.165.0; acesso/custo efetivo só é confirmado
na conta e na primeira execução real. Nenhuma chamada paga foi feita nesta implantação.

## Validação e classificação

`verify` reutiliza npm test, lint, build, audit e `scripts/ci-browser.sh` (seis suítes),
seguido do smoke de produção. Até cinco cenários novos de produto em
`tests/browser/*.mjs` também são executados nesse job sem chave, com limite90s cada,
URL de produção no primeiro argumento e CDP disponível. Assim novas telas/modos podem
obter evidência nativa sem permitir ao agente alterar os controladores. Casos ausentes
não são inventados; falha/timeout ou mais de cinco cenários bloqueia a rodada. Instalação respeita lockfile e não executa lifecycle hooks.
A action instala CLI/proxy como ferramentas do runner, não dependências do produto.
O Node dos testes é `.nvmrc`; a action tem seu próprio bootstrap Node24 documentado.

Fullscreen headless fica **EXCLUÍDO COM JUSTIFICATIVA**. Windows/GPU/FPS físicos, DPI,
áudio percebido, sensação de controle e calibração são **NÃO EXECUTADOS**, não PASS.
Uma chamada de modelo bem-sucedida com `decision=block` bloqueia a publicação.
Ausência de chave live é falha antes da chamada; disabled/dry-run/budget skip não são QA.

Checks locais, sem chave/modelo:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s .github/automation/tests -v
node --test .github/automation/tests/check_preflight.mjs
bash -n .github/automation/qa.sh
python3 .github/automation/control.py dry-run
# Deve falhar com saída 2, sem chamar modelo:
RIFT_KEY_PRESENT=false python3 .github/automation/control.py dry-run --live
```

Os testes usam remotes Git **bare locais** para comprovar criação/retomada de duas
rodadas, main intacta, rejeição de base obsoleta/corrida e hooks/fsmonitor inertes.
Isso é simulação de transporte, não comprova GitHub nem revisão de modelo real.
A sintaxe YAML também foi analisada localmente com PyYAML disponível, sem adicioná-lo
como dependência. Guardas estruturais verificam triggers, permissões, actions finais,
pins, budget, coleta e ausência de execução candidata no publicador.

Artefatos: `validated-patch` (30 dias) e `qa-evidence` (14 dias), preservados conforme
condições de sucesso/falha do job. Retenção de artifacts não substitui checkpoint Git.
Se o reviewer bloquear, preserve/consulte o artefato; a próxima agenda reavalia a
última versão aceita. Não há retry automático do patch rejeitado nem modelo externo.

## Referências oficiais consultadas

- [Codex Action README](https://github.com/openai/codex-action/tree/c05cfd74ad95c626cdf05c6685e62becc3bf7813)
- [Segurança da action](https://github.com/openai/codex-action/blob/c05cfd74ad95c626cdf05c6685e62becc3bf7813/docs/security.md)
- [SDK TypeScript oficial](https://github.com/openai/codex/tree/main/sdk/typescript): envolve CLI/JSONL;
  foi avaliado e não adotado, pois exigiria manter execução/proxy/segurança próprios.
- [CLI oficial](https://github.com/openai/codex); npm confirmou CLI/proxy 0.165.0 publicados.
- [Agendamento GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

As referências descrevem capacidades; não são evidência de que este workflow remoto
já rodou. O pin do topo do repositório oficial foi conferido diretamente; o tag v1
apontava para outra revisão, por isso foi usado SHA explícito compatível com os inputs.
