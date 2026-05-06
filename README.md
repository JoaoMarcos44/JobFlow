# JobFlow

Aplicação web para acompanhar **vagas de emprego**, **guardar ofertas** (incluindo integração com a API pública da **Codante**), gerir **candidaturas**, **currículos** e **perfil** (skills, dados pessoais), com área autenticada tipo dashboard.

O repositório é um monólito em duas partes: **frontend Angular** e **backend Spring Boot** com **PostgreSQL**.

### Repositório público (projeto universitário)

Como este repositório é **público**, trate qualquer valor em `application.yaml` como **apenas exemplo / desenvolvimento local**. O ficheiro passou a ler **variáveis de ambiente** (lista em `backend/env.example`). Para trabalho na tua máquina podes usar os valores por defeito; **antes de alojar algures na internet**, define um `JWT_SECRET` forte e credenciais de base de dados tuas (`openssl rand -base64 48` é um exemplo comum para o segredo). O histórico do Git pode ainda conter segredos antigos — há que **substituí-los por novos valores** se alguma vez foram considerados válidos.

---

## O que o projeto faz

- **Autenticação** com JWT: registo, login, recuperação de palavra-passe (fluxo exposto pela API).
- **Feed de vagas** consumido via proxy para a Codante no desenvolvimento; o backend também expõe endpoints para listar feed, detalhe e **análise de match** entre vaga e perfil.
- **Vagas guardadas** (`SavedJob`): CRUD e endpoint dedicado para **importar/guardar a partir do payload Codante** (montagem do modelo `Job` no backend, com padrão **Builder** para construção consistente a partir de dados externos).
- **Currículos**: upload e gestão de ficheiros (multipart) associados ao utilizador.
- **Perfil**: dados do utilizador, lista de competências, alteração de email e palavra-passe.
- **Dashboard** no Angular (feed, candidaturas, analytics, currículos, definições), com rotas protegidas por guard de autenticação.

Documentação adicional no repositório:

- `docs/Seminario-Builder-JobFlow.md` — contexto académico do padrão Builder no JobFlow.
- `jobflow/docs/` — notas de testes smoke e testes da API Codante.
- `jobflow/src/app/README.md` — estrutura do frontend Angular.

---

## Estrutura do repositório

| Pasta | Conteúdo |
| -------- | -------- |
| `backend/` | API REST Spring Boot 4, JPA, segurança e JWT |
| `jobflow/` | SPA Angular 21 (CLI), proxy de desenvolvimento |
| `docs/` | Materiais de apoio (ex.: seminário) |

---

## Tecnologias

- **Backend:** Java 21, Spring Boot 4, Spring Security, JJWT, Spring Data JPA, PostgreSQL  
- **Frontend:** Angular 21, RxJS, Chart.js, GSAP, Vitest (testes unitários)  
- **Base de dados:** PostgreSQL 16 (recomendado via Docker)

---

## Pré-requisitos

- Java 21 e Maven (ou `./mvnw` / `mvnw.cmd` na pasta `backend`)
- Node.js e npm (versão alinhada com `packageManager` em `jobflow/package.json`)
- Docker (opcional mas recomendado para PostgreSQL)

---

## Base de dados (PostgreSQL)

Na pasta `backend`:

```bash
docker compose up -d
```

Isto sobe o Postgres com base `jobflow`, utilizador e palavra-passe configurados para desenvolvimento (ver `backend/docker-compose.yaml`).

Os valores de ligação da aplicação vêm das variáveis `SPRING_DATASOURCE_*` (ver `backend/env.example`); por defeito coincidem com o `docker-compose.yaml`. Ajuste env ou Compose se mudar utilizador, palavra-passe ou host.

O Hibernate está configurado com `ddl-auto: update` para desenvolvimento (esquema evolui com as entidades).

---

## Backend

Na pasta `backend`:

```bash
./mvnw spring-boot:run
```

(no Windows PowerShell pode usar `.\mvnw.cmd spring-boot:run`)

A API fica por defeito em **http://localhost:8080**.

### Variáveis de ambiente

Consulte **`backend/env.example`**. Um padrão simples é copiar para **`backend/.env`** (ignored pelo Git), carregar esse ficheiro na shell que corre o Maven, ou definir as variáveis manualmente antes de `./mvnw spring-boot:run`.

### Utilizador de desenvolvimento

Com `JOBFLOW_DEV_SEED_ADMIN=true` (valor por defeito), o projeto cria/atualiza um utilizador de demo (`JOBFLOW_DEV_ADMIN_EMAIL` / `JOBFLOW_DEV_ADMIN_PASSWORD`). Adequado para clone local público — **troque sempre o `JWT_SECRET` e estas credenciais** se montar algo acessível fora da tua máquina.

### Endpoints principais (prefixo `/api`)

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `GET /api/auth/me`
- `GET /api/jobs/feed`, `GET /api/jobs/{id}`, `GET /api/jobs/{id}/match`
- `GET|POST|PUT|DELETE /api/saved-jobs` e `POST /api/saved-jobs/from-codante`
- `GET|POST|PUT|DELETE /api/resumes` (multipart onde aplicável)
- `GET|PUT /api/users/...` (perfil, skills, password, email)

---

## Frontend

Na pasta `jobflow`:

```bash
npm install
npm start
```

O comando `npm start` corre `ng serve` com **proxy** (`proxy.conf.json`):

- `/api` → backend em `http://localhost:8080`
- `/codante-api` → `https://apis.codante.io` (com rewrite de path)

Abra **http://localhost:4200**. Fluxo típico: página inicial → login/registo → dashboard (rotas sob `/dashboard/*` protegidas).

---

## Testes

- **Frontend** (`jobflow`): `npm test` ou `npm run test:ci`
- **Backend** (`backend`): `./mvnw test`

---

## Licença

Não especificada neste repositório; confirme com os autores antes de redistribuir.
