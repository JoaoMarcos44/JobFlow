# 📊 Relatório de Desenvolvimento e Refatoração — JobFlow

Este relatório apresenta um resumo detalhado de todas as implementações, melhorias de segurança, arquitetura de testes e refatorações de código realizadas no projeto **JobFlow** (Frontend Angular + Backend Spring Boot).

---

## 📑 Índice
1. [Backend: Testes de Integração e Segurança](#1-backend-testes-de-integração-e-segurança)
2. [Frontend Angular: Refatorações e Modernização](#2-frontend-angular-refatorações-e-modernização)
3. [Alinhamento com Boas Práticas (SOLID, Clean Code e POO)](#3-alinhamento-com-boas-práticas-solid-clean-code-e-poo)
4. [Tabela de Arquivos Modificados / Criados](#4-tabela-de-arquivos-modificados--criados)

---

## 1. Backend: Testes de Integração e Segurança

Foi projetada e implementada uma suite robusta de testes automatizados no backend Spring Boot para garantir a confiabilidade da aplicação e blindar a API contra vulnerabilidades de segurança comuns.

### 🧪 Testes de Integração da API de Autenticação
* **Arquivo:** [`AuthApiIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/AuthApiIntegrationTest.java)
* **Objetivo:** Garante que o fluxo de autenticação (cadastro, login com sucesso/falha e rejeição de e-mails duplicados) funcione integrado à base de dados.
* **Detalhes:** Utiliza `@SpringBootTest` e `MockMvc` para testar requisições reais aos endpoints `/api/auth/register` e `/api/auth/login`.

### 🛡️ Testes de Pentest Automatizados (Segurança)
* **Arquivo:** [`SecurityPentestIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/SecurityPentestIntegrationTest.java)
* **Objetivo:** Valida se a API do backend está protegida contra ataques e vazamento de informações confidenciais.
* **Verificações Implementadas:**
  * **Controle de Acesso (AuthN/Z):** Bloqueio de acessos não autenticados a rotas protegidas (perfil, candidaturas).
  * **Validação de JWT:** Rejeição de tokens malformados, assinados com chaves inválidas ou expirados.
  * **Segurança de Payload:** Confirma que dados sensíveis como `passwordHash` nunca vazam nos payloads JSON (seja no cadastro ou no retorno do perfil).
  * **Prevenção de IDOR:** Garante que o *Utilizador B* não consiga acessar ou modificar as vagas salvas do *Utilizador A* (retornando HTTP 404 em vez de 200).
  * **Prevenção de SQL Injection:** Garante que tentativas de bypass de senha com caracteres de escape SQL no login sejam barradas (HTTP 401).
  * **CORS (Preflight):** Validação de que cabeçalhos CORS corretos são injetados para a origem permitida do Angular (`http://localhost:4200`).

### 🩺 Testes de Fumaça (Smoke Tests)
* **Arquivo:** [`SmokeApiTest.java`](../backend/src/test/java/com/jobflow/backend/SmokeApiTest.java)
* **Objetivo:** Validações de integridade básica (healthcheck, endpoints públicos e integridade de formato dos payloads de entrada) recomendadas para pipelines de CI/CD.

---

## 2. Frontend Angular: Refatorações e Modernização

O frontend passou por um processo sistemático de refatoração para simplificar o estado dos componentes, modernizar a testabilidade e adotar padrões atuais de desenvolvimento com Angular.

### 🔄 Unificação e DRY (Don't Repeat Yourself)
* **Extração de Validação de Token:** No [`AuthService`](../jobflow/src/app/core/services/auth.service.ts), a lógica de ler, verificar e salvar tokens JWT que antes estava duplicada em `login` e `register` foi extraída para o método privado `handleTokenResponse()`.
* **Endpoints no Interceptor:** No [`auth.interceptor.ts`](../jobflow/src/app/core/http/auth.interceptor.ts), expressões booleanas inline complexas foram substituídas por uma lista explícita de endpoints públicos (`PUBLIC_AUTH_ENDPOINTS`) mapeados via `.some()`.

### 🚨 Tratamento de Erros HTTP Centralizado
* Criação e uso do utilitário `readApiErrorMessage` para padronizar e unificar o tratamento de mensagens de falha HTTP em todos os serviços principais: `AuthService`, `ResumesService`, `UserSettingsService` e `SavedJobsService`. Isso impede que o frontend exponha erros brutos de rede ou de banco de dados diretamente ao usuário.

### ⚡ Reatividade Moderna com Angular Signals
* Substituição de propriedades mutáveis soltas e múltiplos sinalizadores booleanos (como `msgPassword`, `msgPasswordSuccess`, `msgEmail`, etc.) por **Signals** tipados unificados (do tipo `{ text, success } | null`) nas seguintes visões:
  * [`definicoes.view.ts`](../jobflow/src/app/features/dashboard/views/definicoes.view.ts)
  * [`curriculos.view.ts`](../jobflow/src/app/features/dashboard/views/curriculos.view.ts)
* Isso elimina o risco de estados dessincronizados e reduz a verbosidade do template HTML.

### 📍 Acesso Seguro ao DOM
* Remoção de acessos nativos ao DOM através de seletores globais (como `document.getElementById('resume-file')`) na view de currículos, substituindo-os pelo decorator `@ViewChild('fileInput')` controlado pelo ciclo de vida do Angular.

---

## 3. Alinhamento com Boas Práticas (SOLID, Clean Code e POO)

### 🧱 DRY & Separação de Responsabilidades
* **Eliminação de estado duplicado:** Na view de Analytics ([`analytics.view.ts`](../jobflow/src/app/features/dashboard/views/analytics.view.ts)), o array redundante `charts: Chart[]` que precisava ser atualizado manualmente em paralelo com os gráficos individuais foi removido. Em seu lugar, foi implementado o getter reativo `allCharts` que deriva a lista de gráficos diretamente do estado ativo.

### 🧪 Modernização de Testes Unitários
* Atualização da inicialização do contexto de testes em specs como [`user-settings.service.spec.ts`](../jobflow/src/app/core/services/user-settings.service.spec.ts), abandonando o uso do antigo e depreciado `HttpClientTestingModule` em favor de `provideHttpClient()` e `provideHttpClientTesting()`.

---

## 4. Tabela de Arquivos Modificados / Criados

| Componente | Arquivo | Descrição das Modificações |
|---|---|---|
| **Backend (Testes)** | [`AuthApiIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/AuthApiIntegrationTest.java) | **[Criado]** Testes de fluxo de login/registro reais com MockMvc. |
| **Backend (Testes)** | [`SecurityPentestIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/SecurityPentestIntegrationTest.java) | **[Criado]** Testes de segurança da API (IDOR, SQLi, CORS, vazamento JSON). |
| **Backend (Testes)** | [`SmokeApiTest.java`](../backend/src/test/java/com/jobflow/backend/SmokeApiTest.java) | **[Criado]** Validação mínima do healthcheck e payloads de entrada. |
| **Frontend (Serviço)** | [`auth.service.ts`](../jobflow/src/app/core/services/auth.service.ts) | **[Modificado]** Extração de `handleTokenResponse()` e uso do centralizador de erros. |
| **Frontend (Filtro)** | [`auth.interceptor.ts`](../jobflow/src/app/core/http/auth.interceptor.ts) | **[Modificado]** Refatoração da checagem de rotas públicas para usar constante explícita. |
| **Frontend (Serviço)** | [`resumes.service.ts`](../jobflow/src/app/core/services/resumes.service.ts) | **[Modificado]** Padronização de endpoints e novo tratador de erros de upload. |
| **Frontend (View)** | [`analytics.view.ts`](../jobflow/src/app/features/dashboard/views/analytics.view.ts) | **[Modificado]** Eliminação do array duplicado de gráficos e uso do getter `allCharts`. |
| **Frontend (View)** | [`curriculos.view.ts`](../jobflow/src/app/features/dashboard/views/curriculos.view.ts) | **[Modificado]** Adotado `@ViewChild` em vez de `getElementById` e unificado mensagens via Signals. |
| **Frontend (View)** | [`definicoes.view.ts`](../jobflow/src/app/features/dashboard/views/definicoes.view.ts) | **[Modificado]** Estados de erro/sucesso convertidos para Signals tipados e estruturados. |
