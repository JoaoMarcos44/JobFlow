# Testes: smoke manual e automatizados (JobFlow front-end)

## Comandos

| Comando | Descrição |
|--------|-----------|
| `npm run test` | Testes unitários em modo watch |
| `npm run test:ci` | Uma execução completa (CI / antes de commit) |

Todos os ficheiros `*.spec.ts` em `src/` são executados pelo `ng test` (Vitest + TestBed).

---

## Testes automatizados — mapa de casos de uso

Cada teste importante está nomeado com **“caso de uso:”** quando valida comportamento de produto.

| Área | Ficheiro | O que valida (OK = esperado) |
|------|-----------|------------------------------|
| **SMOKE** | `src/app/smoke.spec.ts` | Rotas críticas do dashboard; `filterJobs` com lista vazia; GET à API Codante (`/codante-api/api/job-board/jobs`) |
| **Feed** | `feed.view.spec.ts` | Carrega vagas e sai de loading; erro API → estado de erro; limpar filtros; painel habilidades; **Anterior** disabled na pág. 1; estado vazio **sem** segundo botão Limpar |
| **Filtros (regras)** | `feed-filters.spec.ts` | Modo remoto/presencial/híbrido; estágio/emprego; skills; combinação de filtros |
| **Vagas HTTP** | `job-board.service.spec.ts` | URL, query `search`/`page`, erro → `null` |
| **Guardar vagas** | `saved-jobs.service.spec.ts` | Adicionar, duplicado, remover, estado Kanban |
| **Auth HTTP** | `auth.service.spec.ts` | Login, registo, forgot password |
| **Login UI** | `login.component.spec.ts` | Validação antes de chamar API |
| **Rotas** | `app.routes.spec.ts` | welcome, login, register, recuperar-conta, dashboard e filhos |
| **App** | `app.spec.ts` | Componente raiz e `router-outlet` |
| **Tema / motion / welcome** | `theme`, `motion-prefs`, `welcome-animation-flag`, `full-reload-welcome-redirect` | Comportamento auxiliar |

**Critério “está OK”:** `npm run test:ci` termina com **exit code 0** e todos os testes em verde.

---

## Smoke manual (checklist rápida)

Executar com `npm start` e proxy ativo. Marcar cada linha após verificar.

### Autenticação e entrada

- [ ] `/welcome` ou `/` mostra boas-vindas sem erro
- [ ] `/login` — login inválido mostra mensagem sem rebentar
- [ ] `/register` e `/recuperar-conta` abrem e formulários reagem

### Dashboard — Feed de vagas

- [ ] `/dashboard/feed` — lista ou estado vazio carrega sem erro de consola
- [ ] Pesquisa + **Buscar** atualiza resultados (rede OK)
- [ ] Chips **Vínculo** e **Modo** na mesma linha (scroll horizontal se necessário)
- [ ] **Limpar** aparece só com filtros ativos; repõe tudo
- [ ] Seta ao lado abre **Habilidades**; chips filtram; badge com contagem se várias skills
- [ ] Paginação: na página 1, **Anterior** cinzento/desabilitado; **Próxima** ativa se houver mais páginas
- [ ] Estado “nenhuma vaga com filtros” **sem** segundo botão Limpar no rodapé da mensagem

### Dashboard — restantes

- [ ] **Candidaturas** abre; clicar numa vaga no feed navega com estado (se aplicável)
- [ ] **Currículos** — coluna centrada (480px como Definições); upload + lista coerentes
- [ ] **Definições** — inputs escuros consistentes; autofill não fica “branco” no tema escuro
- [ ] **Analytics** carrega sem erro

### Tema e layout

- [ ] Toggle sol/lua no topo altera tema claro/escuro sem quebrar layout
- [ ] Sidebar e topbar visíveis em resoluções habituais

---

## Falhou um teste automatizado?

1. Ler a mensagem do Vitest (ficheiro + nome do teste).
2. Reproduzir o **caso de uso** na tabela acima manualmente.
3. Se for HTTP, confirmar proxy (`proxy.conf.json`) e se a API Codante está acessível para testes manuais (opcional para unitários — estes usam mocks).

---

## Selenium

O projeto inclui `selenium-webdriver` em `devDependencies`; não há suite E2E configurada neste repositório. Para E2E futuro, recomenda-se Playwright ou Cypress alinhados com `ng e2e` ou script dedicado.
