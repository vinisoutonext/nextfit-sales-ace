

## Plano de Implementação

### 1. Estruturar respostas da IA (resposta rápida + explicação)

Atualizar o `SYSTEM_PROMPT` na Edge Function para instruir a IA a sempre responder em dois blocos:
- **TL;DR** (resposta rápida em 1-3 bullets para uso em call)
- **Detalhamento** (explicação completa com formatação rica)

Arquivo: `supabase/functions/nextfit-chat/index.ts`

### 2. Reduzir sugestões na tela inicial para 2

Atualizar o array `SUGGESTIONS` em `ChatPage.tsx` para conter apenas:
- "Quais são os principais diferenciais da Next Fit?"
- "O que falar no começo de uma ligação?"

### 3. Sistema de login (identificação de usuários)

**Banco de dados:**
- Criar tabela `profiles` (id UUID ref auth.users, nome, email, created_at) com RLS
- Adicionar coluna `user_id` (UUID, nullable) na tabela `logs` referenciando auth.users
- Habilitar auto-confirm de email para simplificar o fluxo (login interno, não público)

**Frontend:**
- Criar página de login/cadastro (`src/pages/AuthPage.tsx`) com email + senha
- Criar hook `useAuth` ou context para gerenciar sessão
- Proteger a rota `/` — redirecionar para `/auth` se não logado
- Salvar `user_id` junto com cada log ao enviar pergunta no chat

Arquivos: nova migração SQL, `src/pages/AuthPage.tsx` (novo), `src/App.tsx`, `src/pages/ChatPage.tsx`

### 4. Histórico de perguntas paginado (10 por página)

Na seção "Histórico de perguntas" do `AdminPage.tsx`:
- Exibir 10 registros por página (em vez dos 50 atuais)
- Adicionar navegação com setas (anterior/próximo) e indicador de página
- Manter busca por texto funcionando com a paginação

### 5. Dashboard com filtros por pessoa

No `AdminPage.tsx`, adicionar:
- **Filtro por usuário**: dropdown/select com lista de usuários que fizeram perguntas
- **Card de métricas por pessoa**: ao selecionar um usuário, mostrar total de perguntas dele, categorias mais frequentes
- **Coluna "Usuário"** na tabela de histórico mostrando o nome de quem perguntou
- Join com tabela `profiles` para exibir nomes

### Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/nextfit-chat/index.ts` | Atualizar SYSTEM_PROMPT com formato TL;DR + Detalhamento |
| Migração SQL | Criar tabela `profiles`, adicionar `user_id` em `logs`, RLS |
| `src/pages/AuthPage.tsx` | Criar — tela de login/cadastro |
| `src/pages/ChatPage.tsx` | Reduzir sugestões para 2; salvar `user_id` nos logs |
| `src/pages/AdminPage.tsx` | Paginação 10/página; filtro por pessoa; coluna usuário |
| `src/App.tsx` | Adicionar rota `/auth`, proteger rota `/` |

