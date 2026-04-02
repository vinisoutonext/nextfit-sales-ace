

## Upgrade Profissional — Escalar para 80 Colaboradores

### Visão Geral

O app atual funciona, mas precisa de polish, features de equipe e UX profissional para 80 pessoas usarem no dia a dia. O plano cobre: sidebar com logout e info do usuário, chat redesenhado com nova conversa, tela de login polida, admin dashboard completo, e melhorias gerais de UX.

---

### 1. Sidebar Profissional com Contexto do Usuário

**Arquivo:** `src/components/AppSidebar.tsx`

- Adicionar seção no footer com avatar (iniciais), nome e email do usuário logado
- Botão de logout integrado
- Botão "Nova conversa" no topo (limpa mensagens do chat)
- Visual mais rico: ícones refinados, hover states, divisores sutis

### 2. Chat — Nova Conversa + UX Polida

**Arquivo:** `src/pages/ChatPage.tsx`

- Botão "Nova conversa" (pode ser acionado pela sidebar) que reseta o estado
- Tela de boas-vindas mais impactante: ícone maior com glow animado, subtítulo mais confiante, chips de sugestão com hover mais rico (scale + shadow sutil)
- Área de mensagens com max-width maior (3xl) para aproveitar telas grandes
- Scroll suave automático com `scrollIntoView({ behavior: 'smooth' })`

### 3. ChatMessage — Cards Mais Ricos

**Arquivo:** `src/components/ChatMessage.tsx`

- Card de resposta rápida com borda lateral colorida (accent bar à esquerda)
- Botão de copiar resposta rápida (ícone clipboard, feedback "Copiado!")
- Detalhamento com transição mais suave e ícone animado
- Bolha do usuário com gradiente sutil ao invés de cor flat
- Feedback (thumbs) sempre visível em mobile, hover em desktop

### 4. ChatInput — Mais Profissional

**Arquivo:** `src/components/ChatInput.tsx`

- Shadow sutil no container quando focado
- Indicador de "digitando..." quando IA está respondendo (prop `isTyping`)
- Placeholder rotativo (ex: a cada 5s muda entre dicas de uso)

### 5. Tela de Login Polida

**Arquivo:** `src/pages/AuthPage.tsx`

- Layout split: lado esquerdo com branding (logo grande, tagline, 3 bullet points de valor), lado direito com formulário
- Em mobile: stacked (branding em cima, form embaixo)
- Animação sutil de fade-in nos elementos
- Mensagens de erro mais claras e amigáveis

### 6. Admin Dashboard — Completo e Profissional

**Arquivo:** `src/pages/AdminPage.tsx`

- **Header redesenhado**: título maior, breadcrumb sutil, badge com período selecionado
- **Cards de métricas**: com mini trend indicator (seta pra cima/baixo comparando com período anterior), ícones com background colorido
- **Distribuição por categoria**: barras com tooltip ao hover mostrando detalhes
- **Top 10**: expandir pergunta ao clicar para ver a resposta completa inline
- **Tabela de histórico**: linhas com hover mais rico, modal ao clicar numa linha para ver pergunta e resposta completas
- **Filtro por usuário**: visual de select mais bonito com avatar/iniciais
- **Ranking de usuários**: nova seção mostrando os 5 usuários mais ativos com total de perguntas e categoria mais frequente

### 7. CSS e Design System

**Arquivo:** `src/index.css`

- Adicionar variáveis CSS para gradientes e shadows reutilizáveis
- Animação de fade-in para páginas (page transition)
- Hover states mais ricos globalmente
- Melhorar tipografia dos headers (letter-spacing, line-height)

---

### Arquivos Modificados

| Arquivo | Ação |
|---|---|
| `src/components/AppSidebar.tsx` | Logout, info usuário, botão nova conversa |
| `src/pages/ChatPage.tsx` | Nova conversa, tela boas-vindas premium, scroll suave |
| `src/components/ChatMessage.tsx` | Accent bar, copiar, gradiente, feedback mobile |
| `src/components/ChatInput.tsx` | Shadow focus, placeholder rotativo |
| `src/pages/AuthPage.tsx` | Layout split com branding |
| `src/pages/AdminPage.tsx` | Redesign completo, ranking usuários, modal detalhes |
| `src/index.css` | Variáveis, animações, hover states |

### Resultado

Uma ferramenta que parece um produto SaaS profissional, pronta para 80 pessoas usarem diariamente com confiança.

