# Sincronização com GitHub e Supabase

## Situação atual

- O projeto Lovable possui apenas repositórios internos (origin/secondary) apontando para storage da própria plataforma.
- O repositório `qrddante/querido-dante` no GitHub **não está configurado como remote deste projeto**.
- O Supabase usado pela aplicação é o próprio do usuário (BYO), não o Lovable Cloud.

## Objetivo

Deixar claro e, se desejado, configurar a sincronização de código com o GitHub, além de explicar os limites de sincronização com o Supabase próprio.

## Passos

1. **Verificar/confirmar ausência de Git sync**
   - Confirmar via `git remote -v` que não existe remote apontando para `github.com/qrddante/querido-dante`.

2. **Conectar o projeto ao GitHub do usuário**
   - Usar o fluxo do Lovable: menu Plus (+) → GitHub → Connect project.
   - Selecionar/criar o repositório `qrddante/querido-dante`.
   - Após a conexão, o Lovable passa a fazer push automático das alterações para o GitHub e pull de alterações feitas por lá.

3. **Avaliar conflitos de estrutura**
   - O repositório original do Bolt tem uma estrutura diferente da estrutura TanStack Start do Lovable.
   - Decidir se o GitHub será substituído pela versão Lovable ou se será mantido um branch separado.

4. **Documentar limites do Supabase**
   - Como o Supabase é próprio (BYO), o Lovable não aplica migrations, RLS, policies ou functions automaticamente.
   - Qualquer alteração no schema do banco precisará ser replicada manualmente no painel do Supabase ou via migrations próprias.

## Resultado esperado

- Código do projeto sincronizado com `github.com/qrddante/querido-dante`.
- Usuário ciente de que o banco de dados continua sendo gerenciado manualmente no Supabase próprio.

## Notas técnicas

- O Git sync do Lovable é bidirecional: alterações no editor refletem no GitHub e vice-versa.
- O Supabase configurado com `MEU_SUPABASE_URL`, `MEU_SUPABASE_ANON_KEY` e `MEU_SUPABASE_SERVICE_KEY` é apenas leitura/escrita em runtime; não há deploy automático de schema.
