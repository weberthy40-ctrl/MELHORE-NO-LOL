# 102 — Scores, banco e backup

PASSOU: scores finitos/contextuais 0–100; dados inválidos, abandonos e origens diagnósticas rejeitados. Precisão mantém 60/25/15 e aviso de poucos acertos conforme decisão do usuário. Kiting usa gate de amostra e ritmo de movimento real; Reflexos não trata inibição como reação zero.

IndexedDB schema 2 mantém `attempts` e acrescenta `achievements` sem apagar dados. Um snapshot versionado por ID, commit antes do status de sucesso, retry idempotente e conflito explícito. A leitura não recalcula notas históricas; valida identidade, contadores, componentes e versões. Teste nativo confirmou upgrade bloqueado, v1 preservado, quatro modalidades e seis conquistas permanentes.

Backup v1: app/schema/versão/ISO/data/IDs/ranges/serialização/limites validados, sem executar conteúdo. Até 10 MiB e 10.000 tentativas; campos de protótipo e variantes herdadas rejeitados. Prévia é somente leitura. Mescla adiciona ausentes e preserva conflitos. Teste com quota simulada abortou e reverteu inclusive o registro inserido antes da falha.

Limite explícito: preferências locais ausentes são aplicadas em etapa separada, opcional, após commit do IndexedDB. LocalStorage não compartilha transação com IndexedDB; falhas parciais de preferências são informadas e valores existentes nunca são substituídos. Não existe opção de substituição completa ou apagamento.
