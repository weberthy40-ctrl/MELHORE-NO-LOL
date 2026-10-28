# Autoevolução recorrente do RIFT LAB

O mecanismo está implementado; **agendamento e uso da API não estão comprovados**.
O fluxo não faz merge, release nem deploy. CI e Pages existentes não foram alterados.
Estado e evidências desta implantação: [EVOLUTION_LOG.md](EVOLUTION_LOG.md).

## Ativação única

1. Revise e mescle **somente a infraestrutura** da branch `rift-lab/autoevolution-infra`
   na branch padrão. O scheduler do GitHub só reconhece o workflow nessa branch.
   A base de produto `25acaf9` está publicada em `rift-lab/product-journey`; não precisa
   ser mesclada na main para a automação continuar nela. O novo fluxo cria/retoma
   `rift-lab/evolution` a partir desse seed imutável.
2. Na OpenAI Platform, use um projeto dedicado, configure os controles de faturamento,
   limites de uso e alertas disponíveis. Confira também a franquia/limites de cobrança
   do GitHub Actions (minutos e armazenamento podem ter custo). Crie a chave desse projeto. **A API é cobrada
   separadamente do ChatGPT.** Orçamentos/alertas do projeto podem ser limites suaves;
   confirme no seu plano antes de assumir bloqueio rígido. Não coloque a chave no chat.
3. No GitHub, Settings → Secrets and variables → Actions → Secrets, confirme ou adicione
   `OPENAI_API_KEY`. Em Variables, defina `RIFT_AUTOMATION_ENABLED=true` somente depois
   de revisar custos e controles. Nenhum segredo/configuração da conta foi criado aqui.
4. Actions → **RIFT LAB autoevolution** → Run workflow → `dry-run` primeiro, na branch
   padrão. Essa opção verifica controladores, histórico/orçamento e origem sem chamar
   modelo nem publicar produto. Depois execute `live` e confira todos os jobs.
   A execução manual live só usa API se a variável estiver true e o segredo existir.
5. Confira o primeiro evento `schedule` posterior, suas evidências e o commit em
   `rift-lab/evolution`. Só isso comprova a recorrência. Não é suficiente ver o cron
   escrito, um dry-run verde ou uma chamada de modelo concluída.

O workflow pede `contents:write` **somente no publicador**. Se a política da organização
recusar esse job, um administrador terá de permitir essa operação na branch de evolução;
não se deve ampliar permissões do agente ou trocar credenciais para contornar a recusa.
O bot não precisa poder mesclar PRs. Recomenda-se manter a main protegida por revisão.

**Atenção ao merge humano:** o Pages atual já reage a pushes na main. Mesclar a
infraestrutura executará esse workflow existente conforme suas regras; este PR não
altera seu mecanismo nem transporta as mudanças de produto anteriores. Nenhum merge
ou deploy é realizado pela autoevolução. Branches de produto/evolução não são a main.

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
  (jobs têm margens limitadas). Não há wrapper de retry; rerun de uma execução é recusado.
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
| `RIFT_AUTOMATION_ENABLED` | ausente/desligado | `true` habilita admissão live; remover/false é o interruptor. |
| `RIFT_MAX_MONTHLY_ROUNDS` | 10 | Pode reduzir o teto da policy; histórico UTC inclui jobs implement iniciados, mesmo falhos/cancelados. |
| `RIFT_MONTHLY_BUDGET_USD` | 20 | Estimativa; reserva de 4 USD/rodada limita admissão a 5 rodadas/mês por padrão. |

A contagem usa a API do GitHub e falha fechada se histórico estiver incompleto/negado.
A concorrência serializa admissões. **20 USD não é teto rígido de gastos:** uma única
rodada pode exceder a reserva estimada, retries internos da API não são medidos e o
preço/modelo/tokens variam. Configure faturamento/alertas reais antes de ativar.
O modelo é o default da CLI fixada em 0.165.0; acesso/custo efetivo só é confirmado
na conta e na primeira execução real. Nenhuma chamada paga foi feita nesta implantação.

## Validação e classificação

`verify` reutiliza npm test, lint, build, audit e `scripts/ci-browser.sh` (seis suítes),
seguido do smoke de produção. Instalação respeita lockfile e não executa lifecycle hooks.
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
