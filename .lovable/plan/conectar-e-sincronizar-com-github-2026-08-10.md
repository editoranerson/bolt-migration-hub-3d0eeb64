# Conectar e sincronizar com GitHub

## Situação atual

- O projeto Lovable **não está conectado** ao GitHub.
- Os remotes configurados são apenas os internos da plataforma (`origin` e `secondary`).
- Não existe remote apontando para `github.com/qrddante/querido-dante`.

## Objetivo

Conectar o projeto Lovable ao repositório `qrddante/querido-dante` no GitHub e deixar o site no Lovable alinhado à versão atual armazenada no GitHub.

## Passos

1. **Conectar o Git sync via interface do Lovable**
   - No editor, clicar em **Plus (+)** → **GitHub** → **Connect project**.
   - Autorizar o app do Lovable no GitHub.
   - Selecionar a conta/organização e o repositório `querido-dante`.
   - Confirmar que o remote `github.com/qrddante/querido-dante` aparece em `git remote -v`.

2. **Decidir qual versão deve prevalecer**
   - O repositório do GitHub contém a versão original do Bolt (SPA com hash-router).
   - O projeto atual no Lovable já foi migrado para TanStack Start (estrutura diferente).
   - Escolher uma das opções:
     - **Opção A:** Manter a versão Lovable atual e sobrescrever o conteúdo do GitHub.
     - **Opção B:** Trazer a versão do GitHub para o Lovable, substituindo o projeto atual.
     - **Opção C:** Usar branches separadas (ex.: `main` com a versão Lovable e `legacy` com a versão original do Bolt).

3. **Sincronizar conforme a escolha**
   - Se escolher **Opção A**: o Lovable fará push automático da versão atual para o GitHub.
   - Se escolher **Opção B**: fazer pull da versão do GitHub para o Lovable, substituindo os arquivos atuais.
   - Se escolher **Opção C**: configurar branches no GitHub e no Lovable para manter as duas versões.

4. **Validar a sincronização**
   - Verificar `git log` e `git remote -v` para confirmar que o sync está ativo.
   - Fazer uma alteração pequena no Lovable e confirmar que reflete no GitHub (ou vice-versa).

## Resultado esperado

- Projeto Lovable conectado ao repositório `github.com/qrddante/querido-dante`.
- Versão desejada (Lovable ou GitHub) definida como principal.
- Sync bidirecional funcionando entre Lovable e GitHub.

## Notas importantes

- O Lovable não importa repositórios do GitHub automaticamente; a conexão deve ser feita pelo usuário na interface.
- O Supabase próprio (BYO) continua sendo gerenciado manualmente: schema, tabelas, RLS e policies não sincronizam automaticamente.
- Se a versão do GitHub for trazida para o Lovable, a estrutura TanStack Start atual será substituída pela estrutura original do Bolt.
