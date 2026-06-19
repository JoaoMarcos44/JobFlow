# 📋 Análise de Código — JobFlow (Problemas Identificados)

> **Disciplina:** Seminários de Padrões de Projeto / Engenharia de Software
> **Data da análise:** 18 de Junho de 2026
> **Stack:** Java 21 + Spring Boot 4 (backend) · Angular 21 + TypeScript (frontend)
> **Referência SOLID:** Ramachandrappa, N. C. *"SOLID Design Principles in Software Engineering"*, IJCTT, vol. 72, no. 9, pp. 18–23, 2024. DOI: [10.14445/22312803/IJCTT-V72I9P104](https://doi.org/10.14445/22312803/IJCTT-V72I9P104)

---

## 📑 Índice

1. [Requisitos Analisados](#1-requisitos-analisados)
2. [Violações de Boas Práticas de POO](#2-violações-de-boas-práticas-de-poo)
3. [Violações dos Princípios SOLID](#3-violações-dos-princípios-solid)
4. [Violações de Clean Code](#4-violações-de-clean-code)
5. [Padrões de Projeto Ausentes ou Incompletos](#5-padrões-de-projeto-ausentes-ou-incompletos)
6. [Problemas Arquiteturais](#6-problemas-arquiteturais)
7. [Resumo dos Problemas](#7-resumo-dos-problemas)
8. [Melhorias e Refatorações Implementadas](#8-melhorias-e-refatorações-implementadas)

---

## 1. Requisitos Analisados

| # | Requisito Esperado | Estado no Código | Problema / Detalhe no Código |
|---|--------------------|------------------|------------------------------|
| NI-01 | **Envio real de e-mail** na recuperação de senha | ❌ Não Implementado | [`AuthService.java#L65`](../backend/src/main/java/com/jobflow/backend/service/AuthService.java) — retorna HTTP 200 sem enviar nada: `// opcional: mailService.send(...)` |
| NI-02 | **Filtro de vagas por tecnologia** no feed | ❌ Não Implementado | Parâmetro `technology` recebido em [`JobController`](../backend/src/main/java/com/jobflow/backend/controller/JobController.java#L32) mas **completamente ignorado** em [`JobService.getFeed()`](../backend/src/main/java/com/jobflow/backend/service/JobService.java#L31) |
| NI-03 | **Actualização real do perfil** do utilizador | ❌ Não Implementado | [`UserService.updateProfile()`](../backend/src/main/java/com/jobflow/backend/service/UserService.java#L39) retorna o perfil sem aplicar nenhuma alteração do `ProfileUpdateRequest` |
| NI-04 | **Campos de nome/foto** na entidade `User` | ❌ Não Implementado | [`User.java`](../backend/src/main/java/com/jobflow/backend/model/User.java) só tem `email`, `passwordHash`, `createdAt` — sem `name`, `avatarUrl`, `phone` |
| NI-05 | **`ProfileResponse` com dados corretos** | ❌ Não Implementado | [`UserService.toProfileResponse()`](../backend/src/main/java/com/jobflow/backend/service/UserService.java#L90) usa `email` no campo `name` e dois campos `null` sem conteúdo |
| NI-06 | **Status de candidatura tipado** | ❌ Não Implementado | `SavedJob.status` é `String` livre sem validação — aceita qualquer valor além de "saved", "applied", "archived" |
| NI-07 | **Tecnologias na vaga importada da Codante** | ❌ Não Implementado | `CodanteJobPayload` não tem campo `technologies` → `Job.technologies` fica sempre vazio após importação |
| NI-08 | **Paginação de currículos** | ❌ Não Implementado | [`ResumeService.listByUser()`](../backend/src/main/java/com/jobflow/backend/service/ResumeService.java#L33) retorna lista completa sem paginação |
| NI-09 | **Testes de integração** (backend) |  **Implementado** | Identificados testes `@SpringBootTest` com chamadas HTTP reais via MockMvc e verificação de fluxo completo nos arquivos [`AuthApiIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/AuthApiIntegrationTest.java), [`SecurityPentestIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/SecurityPentestIntegrationTest.java) e [`SmokeApiTest.java`](../backend/src/test/java/com/jobflow/backend/SmokeApiTest.java). |
| NI-10 | **Internacionalização (i18n)** | ❌ Não Implementado | Mensagens de erro misturadas em PT e EN nos mesmos serviços |

---

## 2. Violações de Boas Práticas de POO

### ❌ Problema 2.1 — `UserService.toProfileResponse()` retorna dados errados

**Ficheiro:** [`UserService.java`](../backend/src/main/java/com/jobflow/backend/service/UserService.java) · Linha 90–98

O campo `name` do `ProfileResponse` recebe o e-mail do utilizador porque a entidade `User` não tem campo `name`. O contrato do DTO não é honrado.

```java
private ProfileResponse toProfileResponse(User user) {
    return new ProfileResponse(
            user.getId(),
            user.getEmail(),   // campo "id" ← ok
            user.getEmail(),   // campo "name" ← deveria ser o nome, mas User não tem nome!
            null,              // campo não preenchido
            null,              // campo não preenchido
            skillNamesFor(user.getId())
    );
}
```

---

### ❌ Problema 2.2 — `SavedJob.status` como `String` livre sem validação

**Ficheiro:** [`SavedJob.java`](../backend/src/main/java/com/jobflow/backend/model/SavedJob.java) · Linha 32

`status` aceita qualquer string. Não há garantia de que só os valores `"saved"`, `"applied"` ou `"archived"` sejam persistidos. Qualquer chamada mal formada corromperia o estado da candidatura.

```java
// PROBLEMA: String livre — sem segurança de tipo, sem validação
private String status = "saved"; // saved, applied, archived
```

**Solução óbvia que não foi implementada:**
```java
public enum JobStatus { SAVED, APPLIED, ARCHIVED }

@Enumerated(EnumType.STRING)
private JobStatus status = JobStatus.SAVED;
```

---

### ❌ Problema 2.3 — `DashboardLayoutComponent` decifra o JWT diretamente na View

**Ficheiro:** [`dashboard-layout.component.ts`](../JobFlow/src/app/features/dashboard/dashboard-layout.component.ts) · Linha 56–68

Um componente de interface gráfica conhece o formato interno do token JWT (detalhe de infraestrutura). Isso viola o princípio de separação de camadas — a View não deve saber que o utilizador é identificado por um JWT.

```typescript
private loadProfile(): void {
    const token = this.authService.getToken();
    if (token) {
        try {
            // O componente conhece o formato interno do JWT — errado
            const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string; email?: string };
            this.userEmail = payload.email ?? payload.sub;
            this.userName = email ? email.split('@')[0] : 'Utilizador';
        } catch {
            this.userInitials = '?';
        }
    }
}
```

---

## 3. Violações dos Princípios SOLID

> Definições conforme: Ramachandrappa, N. C. *"SOLID Design Principles in Software Engineering"*, IJCTT V72I9P104, 2024.

---

### ❌ S — SRP: `ResumeService` tem três responsabilidades distintas

**Ficheiro:** [`ResumeService.java`](../backend/src/main/java/com/jobflow/backend/service/ResumeService.java) · Linhas 79–131

> **Definição SRP:** *"A class should have only one reason to change."*

O `ResumeService` acumula três razões de mudança independentes:

```java
// Responsabilidade 1 → regras de negócio de currículo (CRUD)
public ResumeSummaryResponse upload(User user, MultipartFile file) { ... }

// Responsabilidade 2 → política de tipos de ficheiro aceites
private void assertValidFile(MultipartFile file, boolean includeReceivedTypeInError) {
    if (file.isEmpty()) throw new IllegalArgumentException("Ficheiro vazio");
    if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Ficheiro demasiado grande");
    if (!isAllowedType(contentType)) throw new IllegalArgumentException("Apenas PDF e DOCX");
}

// Responsabilidade 3 → regras de segurança de nomes de path
private static String sanitizeFileName(String name) {
    return name.replaceAll("[^a-zA-Z0-9._\\-\\s]", "_").trim();
}
```

Qualquer mudança na política de ficheiros aceites ou nas regras de sanitização obriga a modificar `ResumeService`, aumentando o risco de regressão no CRUD de currículos.

---

### ❌ O — OCP: `MatchService.generateMatchFeedback()` não é extensível

**Ficheiro:** [`MatchService.java`](../backend/src/main/java/com/jobflow/backend/service/MatchService.java) · Linhas 48–63

> **Definição OCP:** *"Software entities should be open for extension but closed for modification."*

Para adicionar uma nova faixa de score (ex.: `>= 90` = "Match excelente"), é obrigatório **modificar** um método já testado:

```java
// Para adicionar nova faixa → MODIFICAR este método (viola OCP)
public String generateMatchFeedback(List<String> userSkillNames,
                                    List<String> jobTechnologies,
                                    int matchScore) {
    if (matchScore >= 70) {     // threshold hard-coded
        return "Ótimo match! Você possui " + matchScore + "% das tecnologias exigidas.";
    }
    if (matchScore >= 40) {     // threshold hard-coded
        return "Match intermediário (" + matchScore + "%). Faltam: " + ...;
    }
    return "Match baixo (" + matchScore + "%). A vaga exige: " + ...;
}
```

---

### ❌ I — ISP: Todos os Services são classes concretas sem interfaces

**Ficheiros:** [`SavedJobService.java`](../backend/src/main/java/com/jobflow/backend/service/SavedJobService.java), [`JobService.java`](../backend/src/main/java/com/jobflow/backend/service/JobService.java), [`UserService.java`](../backend/src/main/java/com/jobflow/backend/service/UserService.java), etc.

> **Definição ISP:** *"Clients should not be forced to depend upon methods that they do not use."*

Os controllers dependem diretamente das classes concretas dos services. Não há nenhuma interface que permita ao cliente depender apenas do subconjunto de métodos que ele realmente usa:

```java
// SavedJobController é forçado a depender de TODA a classe SavedJobService,
// incluindo métodos que nunca usa (ex.: saveFromCodante)
@RestController
public class SavedJobController {
    private final SavedJobService savedJobService; // classe concreta — sem interface ❌
}
```

```java
// JobController também depende diretamente da implementação concreta
@RestController
public class JobController {
    private final JobService jobService;  // sem interface ❌
}
```

Não há nenhuma interface em nenhum dos 6 services do projeto.

---

### ❌ D — DIP: `DashboardLayoutComponent` depende de detalhe de implementação

**Ficheiro:** [`dashboard-layout.component.ts`](../JobFlow/src/app/features/dashboard/dashboard-layout.component.ts) · Linha 60

> **Definição DIP:** *"High-level modules should not depend on low-level modules; both should depend on abstractions."*

O componente (módulo de alto nível) depende diretamente do **formato interno do JWT** (detalhe de baixo nível). Se o token mudar de formato (ex.: de JWT para opaque token), o componente Angular quebra:

```typescript
// Componente de alto nível depende de detalhe de infraestrutura — viola DIP ❌
const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string; email?: string };
```

O `AuthService` deveria expor uma abstração (signal ou observable) com os dados do utilizador, e o componente dependeria apenas dessa abstração.

---

## 4. Violações de Clean Code

### ❌ Problema 4.1 — Bug silencioso: resultado descartado em `requestPasswordReset()`

**Ficheiro:** [`AuthService.java`](../backend/src/main/java/com/jobflow/backend/service/AuthService.java) · Linha 65–68

O email normalizado é computado mas o resultado nunca é usado. A função retorna sem fazer nada útil com o parâmetro:

```java
public void requestPasswordReset(String email) {
    normalizeEmail(email);  // ← resultado descartado — bug silencioso!
    // opcional: userRepository.findByEmailIgnoreCase(email).ifPresent(user -> mailService.send(...));
}
```

O email recebido *não é normalizado* para nenhuma operação real porque `normalizeEmail` é pura (retorna novo valor sem side-effect) e o retorno é ignorado.

---

### ❌ Problema 4.2 — Código duplicado: `skillNamesFor()` existe em dois services

**Ficheiros:** [`UserService.java#L101`](../backend/src/main/java/com/jobflow/backend/service/UserService.java#L101) e [`MatchService.java#L82`](../backend/src/main/java/com/jobflow/backend/service/MatchService.java#L82)

Código **idêntico** copiado entre dois services — viola DRY directamente:

```java
// UserService.java — linha 101
private List<String> skillNamesFor(UUID userId) {
    return userSkillRepository.findByUserIdOrderBySkillNameAsc(userId).stream()
            .map(UserSkill::getSkillName)
            .toList();
}

// MatchService.java — linha 82 — CÓPIA EXACTA
private List<String> skillNamesFor(UUID userId) {
    return userSkillRepository.findByUserIdOrderBySkillNameAsc(userId).stream()
            .map(UserSkill::getSkillName)
            .toList();
}
```

Se a query mudar (ex.: ordenação diferente), é preciso lembrar de alterar **dois lugares**.

---

### ❌ Problema 4.3 — Erro silencioso sem logging

**Ficheiro:** [`JobService.java`](../backend/src/main/java/com/jobflow/backend/service/JobService.java) · Linha 88–93

Exceção capturada e descartada sem qualquer registo. Erros de parsing de data passam silenciosamente, impossibilitando diagnóstico em produção:

```java
try {
    job.setPostedDate(LocalDate.parse(payload.createdAt().substring(0, 10)));
} catch (Exception ignored) {
    // mantém postedDate  ← nenhum log, nenhum alerta — falha invisível
}
```

---

### ❌ Problema 4.4 — Números mágicos sem constantes nomeadas

**Ficheiro:** [`MatchService.java`](../backend/src/main/java/com/jobflow/backend/service/MatchService.java) · Linhas 54 e 57

Os valores `70` e `40` são thresholds de negócio críticos que aparecem sem nenhuma explicação ou nome:

```java
if (matchScore >= 70) {  // ← o que significa 70? por que não 75? quem decide?
    ...
}
if (matchScore >= 40) {  // ← idem
    ...
}
```

Deveriam ser constantes nomeadas:
```java
private static final int HIGH_MATCH_THRESHOLD = 70;
private static final int MEDIUM_MATCH_THRESHOLD = 40;
```

---

### ❌ Problema 4.5 — Mensagens de erro inconsistentes (PT ↔ EN)

**Ficheiros:** [`UserService.java`](../backend/src/main/java/com/jobflow/backend/service/UserService.java), [`ResumeService.java`](../backend/src/main/java/com/jobflow/backend/service/ResumeService.java), [`SavedJobService.java`](../backend/src/main/java/com/jobflow/backend/service/SavedJobService.java)

Mensagens de erro misturadas no mesmo projecto, no mesmo arquivo e às vezes no mesmo método:

```java
// UserService.java
throw new IllegalArgumentException("User not found");        // inglês
throw new IllegalArgumentException("Skill name required");   // inglês
throw new IllegalArgumentException("Skill already added");   // inglês

// ResumeService.java
throw new IllegalArgumentException("Ficheiro vazio");                // português
throw new IllegalArgumentException("Ficheiro demasiado grande");     // português
throw new IllegalArgumentException("Apenas PDF e DOCX são permitidos"); // português

// SavedJobService.java
throw new IllegalArgumentException("Job not found");   // inglês
throw new IllegalArgumentException("Job already saved"); // inglês
```

---

### ❌ Problema 4.6 — `updateProfile()` não actualiza nada

**Ficheiro:** [`UserService.java`](../backend/src/main/java/com/jobflow/backend/service/UserService.java) · Linha 39–41

O método recebe um `ProfileUpdateRequest` com dados para actualizar, mas simplesmente os ignora e retorna o perfil actual sem mudança:

```java
public Optional<ProfileResponse> updateProfile(String email, ProfileUpdateRequest request) {
    return getProfileByEmail(email); // ← ignora completamente o `request`!
}
```

O endpoint `PUT /api/users/profile` existe e retorna HTTP 200, mas os dados enviados pelo cliente nunca são persistidos.

---

### ❌ Problema 4.7 — Filtro por tecnologia declarado mas não implementado

**Ficheiro:** [`JobService.java`](../backend/src/main/java/com/jobflow/backend/service/JobService.java) · Linha 31–33

O parâmetro `technology` é recebido pelo controller e passado para o service, mas nunca utilizado na query:

```java
/** {@code technology} reservado para filtro futuro; hoje a lista vem completa da base. */
public Page<JobResponse> getFeed(User user, String technology, Pageable pageable) {
    Page<Job> page = jobRepository.findAll(pageable); // ← technology é ignorado
    ...
}
```

O utilizador pode enviar `?technology=Java` e o resultado será exactamente o mesmo que sem o parâmetro.

---

## 5. Padrões de Projeto Ausentes ou Incompletos

### ❌ Problema 5.1 — Builder Pattern não implementado formalmente

**Ficheiro:** [`JobService.java`](../backend/src/main/java/com/jobflow/backend/service/JobService.java) · Linha 79–95

O seminário académico do projecto ([`Seminario-Builder-JobFlow.md`](./Seminario-Builder-JobFlow.md)) propõe explicitamente o padrão Builder para a construção de `Job` a partir do `CodanteJobPayload`. O que existe actualmente é uma cadeia de setters directos — **Builder implícito sem interface, sem Director, sem validação centralizada no `build()`**:

```java
// Estado actual: setters directos — sem Builder formal
private static void applyCodantePayload(Job job, CodanteJobPayload payload) {
    job.setTitle(payload.title());
    job.setCompany(payload.company());
    job.setLocation(payload.city() != null ? payload.city() : "");
    job.setDescription(payload.description() != null ? payload.description() : "");
    job.setRequirements(payload.requirements() != null ? payload.requirements() : "");
    // ...
}
```

O padrão proposto (`JobBuilder` interface + `JobBuilderImpl` + `JobDirector`) **nunca foi implementado** — existe apenas na documentação do seminário.

---

### ❌ Problema 5.2 — Strategy Pattern ausente no cálculo de feedback de match

**Ficheiro:** [`MatchService.java`](../backend/src/main/java/com/jobflow/backend/service/MatchService.java) · Linhas 48–63

A lógica de feedback de match é uma cadeia de `if-else` hard-coded. Não existe nenhuma abstração (`MatchFeedbackStrategy`) que permita adicionar ou alterar faixas de match sem modificar a classe:

```java
// Sem Strategy — lógica presa dentro do service, não extensível
public String generateMatchFeedback(..., int matchScore) {
    if (matchScore >= 70) { return "Ótimo match! ..."; }
    if (matchScore >= 40) { return "Match intermediário ..."; }
    return "Match baixo ...";
}
```

---

### ❌ Problema 5.3 — Observer/Signal ausente para perfil do utilizador (Frontend)

**Ficheiro:** [`dashboard-layout.component.ts`](../JobFlow/src/app/features/dashboard/dashboard-layout.component.ts) · Linha 56–68

Não existe nenhum mecanismo reactivo (Observable ou Signal) no `AuthService` que notifique os componentes sobre o utilizador actual. Cada componente que precisa dos dados do utilizador precisa re-implementar o parsing do JWT, resultando na violação identificada no Problema 2.3.

---

## 6. Problemas Arquiteturais

### ❌ Problema 6.1 — Acoplamento directo entre `SavedJobService` e `JobService`

**Ficheiro:** [`SavedJobService.java`](../backend/src/main/java/com/jobflow/backend/service/SavedJobService.java) · Linhas 24–26

Dois services de domínio distintos estão acoplados directamente por classe concreta (não por interface). Qualquer mudança na assinatura de `JobService` quebra `SavedJobService`:

```java
public class SavedJobService {
    private final SavedJobRepository savedJobRepository;
    private final JobService jobService;      // ← acoplamento directo a classe concreta
    private final MatchService matchService;  // ← acoplamento directo a classe concreta
}
```

---

### ❌ Problema 6.2 — Currículos armazenados como `BLOB` no banco de dados

**Ficheiro:** [`Resume.java`](../backend/src/main/java/com/jobflow/backend/model/Resume.java) · Linha 28–30

Os ficheiros PDF/DOCX são armazenados directamente como bytes no PostgreSQL. Para projectos com volume real de currículos, isso degrada a performance da base de dados e torna o backup mais pesado. A prática recomendada é armazenar os ficheiros num sistema de ficheiros externo (S3, MinIO, sistema local) e guardar apenas o path/URL no banco:

```java
@JdbcTypeCode(SqlTypes.VARBINARY)
@Column(name = "file_content", nullable = false)
private byte[] fileContent; // ← ficheiro inteiro na tabela do PostgreSQL
```

---

### ❌ Problema 6.3 — `StringListConverter` usa delimitador frágil (`||`)

**Ficheiro:** [`StringListConverter.java`](../backend/src/main/java/com/jobflow/backend/model/StringListConverter.java) · Linha 13

A lista de tecnologias (`Job.technologies`) e skills em falta (`MatchAnalysis.missingSkills`) são serializadas como texto com `||` como separador. Se um nome de tecnologia contiver `||` (improvável mas possível), o dado seria corrompido na deserialização:

```java
private static final String DELIMITER = "||";

@Override
public String convertToDatabaseColumn(List<String> list) {
    return String.join(DELIMITER, list); // ← "Java||C++||React"
}

@Override
public List<String> convertToEntityAttribute(String dbData) {
    return Arrays.stream(dbData.split("\\|\\|")) // ← split por "||"
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
}
```

A solução standard é usar uma coluna JSON nativa do PostgreSQL (`@Column(columnDefinition = "jsonb")`).

---

## 7. Resumo dos Problemas

### 🔴 Críticos (quebram funcionalidade)

| # | Problema | Ficheiro | Linha |
|---|----------|----------|-------|
| C1 | `updateProfile()` ignora o request — não actualiza nada | [`UserService.java`](../backend/src/main/java/com/jobflow/backend/service/UserService.java) | 39–41 |
| C2 | Bug silencioso: email normalizado descartado em `requestPasswordReset()` | [`AuthService.java`](../backend/src/main/java/com/jobflow/backend/service/AuthService.java) | 65–66 |
| C3 | Filtro por tecnologia declarado mas completamente ignorado | [`JobService.java`](../backend/src/main/java/com/jobflow/backend/service/JobService.java) | 31–33 |
| C4 | Recuperação de senha não envia e-mail — retorna 200 sem acção | [`AuthService.java`](../backend/src/main/java/com/jobflow/backend/service/AuthService.java) | 65–68 |

### 🟡 Importantes (degradam qualidade e manutenibilidade)

| # | Problema | Categoria |
|---|----------|-----------|
| I1 | `skillNamesFor()` duplicado em `UserService` e `MatchService` | Clean Code / DRY |
| I2 | Nenhum service tem interface — viola ISP e DIP | SOLID |
| I3 | `SavedJob.status` como `String` livre sem validação | POO / Type Safety |
| I4 | `DashboardLayoutComponent` faz parsing de JWT na View | POO / DIP |
| I5 | `ResumeService` com 3 responsabilidades distintas | SOLID / SRP |
| I6 | `generateMatchFeedback()` com thresholds hard-coded, não extensível | SOLID / OCP |
| I7 | Números mágicos `70` e `40` sem constantes nomeadas | Clean Code |
| I8 | Mensagens de erro inconsistentes (PT ↔ EN) | Clean Code / i18n |
| I9 | Builder Pattern documentado no seminário mas não implementado | Design Patterns |

### 🔵 Melhorias recomendadas

| # | Problema | Categoria | Estado |
|---|----------|-----------|--------|
| M1 | `catch (Exception ignored)` sem logging em `JobService` | Clean Code | Em aberto |
| M2 | Currículos armazenados como BLOB no banco — deveria ser storage externo | Arquitetura | Em aberto |
| M3 | `StringListConverter` com delimitador frágil — deveria ser JSON nativo | Arquitetura | Em aberto |
| M4 | Strategy Pattern ausente no cálculo de feedback de match | Design Patterns | Em aberto |
| M5 | Signal/Observable ausente para utilizador actual no frontend | Design Patterns | Em aberto |
| M6 | Sem testes de integração no backend | Qualidade |  **Resolvido** (Implementado em `AuthApiIntegrationTest`, etc.) |

---

## 8. Melhorias e Refatorações Implementadas

Com base nas análises do projeto e revisões efetuadas, as seguintes melhorias e refatorações foram implementadas no código:

### 🧪 Backend: Testes de Integração e Pentest (Resolução de NI-09 e M6)
*   **Testes de Integração com `@SpringBootTest`**: Criação de testes de fluxo completo usando `MockMvc` para simular chamadas de API reais. Implementado nas classes [`AuthApiIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/AuthApiIntegrationTest.java) e [`SmokeApiTest.java`](../backend/src/test/java/com/jobflow/backend/SmokeApiTest.java).
*   **Testes de Segurança e Pentest**: Implementação de verificações detalhadas em [`SecurityPentestIntegrationTest.java`](../backend/src/test/java/com/jobflow/backend/SecurityPentestIntegrationTest.java) para garantir a segurança da API contra CORS mal configurado, ataques de IDOR (tentativa de leitura de dados de outros utilizadores), vazamento de senhas hasheadas em respostas JSON e SQL Injection.

### 🖥️ Frontend Angular: Refatoração, Padronização e Reatividade
*   **Eliminação de Duplicação (DRY)**: Centralização da lógica de persistência e validação de token através do método privado `handleTokenResponse()` em [`auth.service.ts`](../jobflow/src/app/core/services/auth.service.ts), além de padronizar endpoints públicos no interceptor.
*   **Centralização de Erros HTTP**: Uso do utilitário `readApiErrorMessage` para centralizar a leitura e exibição de mensagens de falhas da API em todos os serviços do Angular (`AuthService`, `ResumesService`, `SavedJobsService` e `UserSettingsService`).
*   **Modernização do Angular (Signals e DOM)**:
    *   Migração de campos mutáveis clássicos de mensagem e status para **Angular Signals** tipados (como `msgPassword` e `msgEmail`) para garantir reatividade e consistência no estado de definições e upload de currículos.
    *   Substituição de busca manual de ID no DOM (`document.getElementById`) pelo decorator `@ViewChild('fileInput')` em [`curriculos.view.ts`](../jobflow/src/app/features/dashboard/views/curriculos.view.ts), preservando o ciclo de vida do Angular.
    *   Modernização da configuração de injeção nos testes unitários e specs com `provideHttpClientTesting`.

---

*Análise gerada por Antigravity AI (Google DeepMind) — repositório `c:\JobFlow`, branch `main`*
