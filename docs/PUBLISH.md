# Abrir o site para testar

A publicação manual está preparada em `.github/workflows/pages.yml`. Ela gera o build estático e o envia ao GitHub Pages. O Vite usa caminhos relativos, compatíveis com a subpasta do repositório. Não precisa instalar Node no computador de quem vai jogar.

Na conta que administra o repositório:

1. Abra [Settings → Pages](https://github.com/weberthy40-ctrl/MELHORE-NO-LOL/settings/pages). Em **Build and deployment → Source**, selecione **GitHub Actions**.
2. Abra [Actions → Publicar site de teste](https://github.com/weberthy40-ctrl/MELHORE-NO-LOL/actions/workflows/pages.yml), clique em **Run workflow**, escolha `main` e confirme.
3. Aguarde os jobs `build` e `deploy` ficarem verdes. A etapa de deployment mostra o link efetivamente publicado.

O endereço esperado após publicação bem-sucedida é `https://weberthy40-ctrl.github.io/MELHORE-NO-LOL/`. A presença deste arquivo não significa que a publicação já foi executada. O fluxo é manual e não publica automaticamente cada push.

A ativação de Pages e a execução remota não foram realizadas pelo ambiente de desenvolvimento: o acesso à API de configuração do GitHub está bloqueado nesta sessão. O código e o build foram preparados e verificados localmente.

Para baixar os fontes sem usar o anexo do chat, use [Code → Download ZIP](https://github.com/weberthy40-ctrl/MELHORE-NO-LOL/archive/refs/heads/main.zip). Para executar localmente, siga o README.

O progresso continua salvo no navegador usado para acessar o site. A publicação serve a interface e o jogo estático, sem contas ou banco remoto.
