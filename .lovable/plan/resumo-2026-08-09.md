Migração do site do Bolt para o Lovable com Supabase próprio

## Resumo
Trazer o site construído no Bolt (React + Vite + Tailwind + shadcn/ui, código no GitHub, Supabase próprio) para dentro deste projeto Lovable. Como o Lovable não importa repositórios do GitHub existentes automaticamente, a migração será manual: reaproveitar componentes e telas do Bolt e adaptá-las à estrutura TanStack Start usada pelo Lovable, mantendo o Supabase já configurado.

## Estado atual
- Projeto Lovable recém-criado no template TanStack Start.
- Nenhuma integração com Supabase ativada ainda.
- Usuário possui projeto Supabase próprio com auth, banco e storage.
- Site no Bolt usa React + Vite + Tailwind CSS + shadcn/ui.
- Será necessário criar tabela de perfis (`profiles`) vinculada a `auth.users`.

## Escopo aprovado
- Migrar o site completo.
- Manter o Supabase próprio (BYO).
- Reaproveitar Tailwind + shadcn/ui.
- Implementar login/cadastro, banco de dados e storage.
- Criar tabela `profiles` para dados extras do usuário.

## Abordagem técnica

```text
Bolt (React + Vite)
  │
  ├── Copiar componentes visuais (shadcn/ui, Tailwind) ──► Lovable (TanStack Start)
  │
  ├── Converter páginas do Bolt em rotas do TanStack Router
  │
  ├── Substituir chamadas diretas ao Supabase por:
  │     • Browser client (componentes)
  │     • createServerFn (lógica server-side)
  │     • requireSupabaseAuth (rotas autenticadas)
  │
  └── Manter banco/storage existente no Supabase próprio
```

## Etapas

### 1. Conectar o Supabase próprio
- Configurar variáveis de ambiente no Lovable:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente)
  - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (servidor)
- Solicitar ao usuário as credenciais do Supabase (URL + anon key + service role key).
- Não ativar Lovable Cloud; usar o Supabase existente.

### 2. Estruturar autenticação e perfis
- Criar tabela `public.profiles` com FK para `auth.users(id)` e `ON DELETE CASCADE`.
- Criar trigger para inserir perfil automaticamente no cadastro.
- Configurar RLS para que usuários leiam/alterem apenas seu próprio perfil.
- Criar rotas:
  - `/auth` — login/cadastro
  - `/reset-password` — redefinição de senha
  - Área protegida sob `/_authenticated/*`
- Implementar fluxo de sign-out com limpeza de cache e navegação.

### 3. Migrar telas e componentes
- Copiar componentes do repositório Bolt para `src/components/`.
- Adaptar imports e caminhos para a estrutura do Lovable.
- Converter páginas do Bolt em arquivos de rota do TanStack Router em `src/routes/`.
- Preservar estilos Tailwind; ajustar tokens se necessário.

### 4. Migrar lógica de dados
- Mapear queries/mutations do Bolt:
  - Leituras públicas → `createServerFn` com cliente publicável
  - Leituras/escritas autenticadas → `createServerFn` com `requireSupabaseAuth`
  - Operações privilegiadas → `supabaseAdmin` dentro do handler
- Revisar RLS das tabelas existentes para garantir compatibilidade.

### 5. Migrar storage
- Verificar buckets existentes no Supabase.
- Ajustar políticas de RLS de `storage.objects` se necessário.
- Reimplementar upload/download no padrão do Lovable.

### 6. Ajustar layout raiz e rotas
- Atualizar `src/routes/__root.tsx` com navegação, Toaster e listener de auth.
- Substituir placeholder `src/routes/index.tsx` pela landing page ou home do Bolt.
- Criar layout autenticado em `src/routes/_authenticated/route.tsx`.

### 7. Verificação
- Build sem erros.
- Fluxo de login/cadastro funcional.
- Criação automática de perfil confirmada.
- Leitura/escrita de dados e upload de arquivos testados.

## O que precisarei do usuário
- URL do Supabase, anon key e service role key.
- Acesso ao repositório GitHub do Bolt (para leitura/cópia de componentes).
- Lista das tabelas e buckets existentes no Supabase (para revisar RLS e políticas).

## Riscos e ressalvas
- Não é importação automática: componentes e rotas precisarão ser copiados e adaptados manualmente.
- Diferenças entre Vite puro e TanStack Start podem exigir ajustes em roteamento, data fetching e server functions.
- Tabelas e políticas do Supabase não serão migradas automaticamente; serão recriadas/revisadas conforme necessário.
