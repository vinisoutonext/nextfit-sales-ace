

## Admin Dashboard — Página dedicada `/admin`

### O que muda

Hoje o dashboard admin é um modal acessado por easter egg. O plano é criar uma **página completa `/admin`** protegida por senha (`123456`), com dashboards ricos para análise de perguntas e planejamento de treinamentos.

O easter egg na sidebar continuará funcionando, mas agora redirecionará para `/admin` em vez de abrir o modal.

### Estrutura

**1. Rota `/admin` com proteção por senha**
- Nova página `src/pages/AdminPage.tsx`
- Tela de login com campo de senha (senha: `123456`)
- Senha validada em estado local (sessionStorage para manter durante a sessão)
- Após autenticar, exibe o dashboard completo full-page (sem modal)

**2. Dashboard com seções analíticas**

Reaproveitando a lógica existente do `AdminDashboardModal` mas como página full-screen:

- **Header:** "Painel de Inteligência Comercial" + botão exportar CSV + filtro de período (Hoje / Semana / Mês / Tudo)
- **Cards de métricas:** Total de perguntas, Perguntas hoje, Tópicos únicos, % bem avaliadas
- **Distribuição por categoria:** Barras horizontais com tags coloridas (Objeção, Produto, Concorrência, Processo, Outro) — classificação automática por regex + campo `categoria` salvo
- **Top 10 perguntas mais frequentes:** Ranking com barra proporcional, tag de categoria, contador, e alerta "⚠ Revisar no playbook" para perguntas com 3+ avaliações negativas
- **Tabela de histórico recente:** Lista paginada com pergunta, resposta (truncada), categoria, avaliação, data — com busca por texto

**3. Atualizar navegação**
- Adicionar rota `/admin` no `App.tsx`
- Easter egg na sidebar agora faz `navigate('/admin')` em vez de abrir modal
- Remover dependência do `AdminDashboardModal` da sidebar (ou manter como fallback)

### Arquivos modificados

| Arquivo | Ação |
|---|---|
| `src/pages/AdminPage.tsx` | Criar — página completa com login + dashboard |
| `src/App.tsx` | Adicionar rota `/admin` |
| `src/components/AppSidebar.tsx` | Easter egg redireciona para `/admin` |

