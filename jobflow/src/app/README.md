# Estrutura do Frontend (Angular)

Organização no padrão Angular por camadas e features.

## Estrutura de pastas

- **core/** – Serviços singleton e guards
  - `services/auth.service.ts` – Autenticação (token)
  - `guards/auth.guard.ts` – Guard para rotas protegidas

- **features/dashboard/** – Feature do dashboard
  - `dashboard-layout.component.ts` – Layout (sidebar + área de conteúdo)
  - `dashboard.routes.ts` – Rotas filhas (feed, candidaturas, analytics, curriculos, definicoes)
  - `views/*.view.ts` – Componentes de vista (placeholders para migração)

- **shared/** – Componentes, pipes e directivas partilhados (a preencher)

## Rotas

- `/` → redireciona para `/dashboard`
- `/dashboard` → layout com sidebar e `<router-outlet>`
- `/dashboard/feed`, `/dashboard/candidaturas`, etc. → vistas filhas

## Dashboard estático

O dashboard completo (com gráficos, Kanban, etc.) está em **`public/dashboard.html`**.  
Após o login, o utilizador é redirecionado para `/dashboard.html`.  
As vistas em `features/dashboard/views/` podem ser gradualmente preenchidas com o conteúdo de `dashboard.html`.
