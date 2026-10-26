# Regras de desenvolvimento

1. Respeitar o escopo solicitado e as tecnologias definidas pelo usuário. Não antecipar funcionalidades de prompts futuros.
2. Preservar funcionalidades aprovadas; mudanças de comportamento precisam estar autorizadas pelo pedido em andamento. Não remover sistemas existentes por conveniência.
3. Manter alterações pequenas, rastreáveis e compatíveis sempre que possível. Documentar decisões técnicas que afetem contratos, dependências ou comportamento.
4. Separar coordenação, interface, núcleo, renderização, treinamento, progressão, persistência e configurações. Evitar dependências circulares e duplicação de serviços compartilhados.
5. Manter diretórios futuros vazios com `.gitkeep` enquanto não houver código necessário. Não preencher o projeto com implementações fictícias.
6. Corrigir a causa dos problemas; não esconder erros, desabilitar verificações ou enfraquecer testes para obter uma aprovação aparente.
7. Criar testes que verifiquem comportamentos reais. Preservar os testes anteriores e registrar a razão de qualquer adaptação necessária de contrato.
8. Não declarar instalação, servidor, build, testes, lint ou auditoria aprovados sem executar a verificação correspondente. Informar falhas, verificações não executadas e limitações com precisão.
9. Usar dependências estáveis e compatíveis. Gerar o lockfile pelo gerenciador de pacotes e manter a instalação reproduzível; não fabricar arquivos de lock.
10. Usar identidade visual e recursos originais. Não copiar personagens, mapas, logotipos ou ativos de outros jogos.
11. Não incluir credenciais, `node_modules/`, `dist/`, cobertura, caches ou temporários no código entregue em ZIP. Incluir os arquivos necessários à instalação, execução e validação do projeto.

O bloco 001–002.1 inclui fundação, página inicial, estado técnico, eventos, ciclo de vida e tratamento de erros. `running` indica a aplicação ativa, sem sessão de treinamento ou game loop. Gameplay e demais funcionalidades serão implementados em seus respectivos escopos.

Atualização da candidata: o parágrafo anterior registra apenas o marco histórico inicial. Para o escopo atual, consulte CURRENT_SCOPE.md. Os blocos foram autorizados em sequência pelo usuário; testes/documentos de aceitação não substituem a validação humana pendente. A versão permanece candidata.
