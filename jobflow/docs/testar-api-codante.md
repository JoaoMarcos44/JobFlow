# Comandos para testar a API Codante (job-board)

Base URL: `https://apis.codante.io/api/job-board`  
A API **não requer autenticação**.

**Importante no Windows:** No PowerShell, `curl` é um *alias* de `Invoke-WebRequest` e **não aceita** a opção `-G`. Use os comandos **Invoke-RestMethod** abaixo, ou então chame o cURL real: `curl.exe -G "URL"`.

---

## PowerShell (Windows) – use estes

### Listar vagas (página 1)
```powershell
Invoke-RestMethod -Uri "https://apis.codante.io/api/job-board/jobs?page=1" -Method GET
```

### Listar vagas com busca (ex.: "desenvolvedor")
```powershell
Invoke-RestMethod -Uri "https://apis.codante.io/api/job-board/jobs?search=desenvolvedor&page=1" -Method GET
```

### Ver uma vaga por ID (ex.: ID 1)
```powershell
Invoke-RestMethod -Uri "https://apis.codante.io/api/job-board/jobs/1" -Method GET
```

### Ver resposta em JSON (primeiros 500 caracteres)
```powershell
$r = Invoke-WebRequest -Uri "https://apis.codante.io/api/job-board/jobs?page=1" -UseBasicParsing
$r.StatusCode
$r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
```

---

## cURL (Linux / Mac, ou no Windows use `curl.exe`)

No PowerShell do Windows use `curl.exe` em vez de `curl`, senão dá erro com `-G`.

### Listar vagas
```bash
curl.exe -G "https://apis.codante.io/api/job-board/jobs"
```

### Com paginação
```bash
curl.exe -G "https://apis.codante.io/api/job-board/jobs?page=2"
```

### Vaga por ID
```bash
curl.exe -G "https://apis.codante.io/api/job-board/jobs/1"
```

---

## Resposta esperada (listagem)

- **200** – JSON com `data` (array de vagas), `links` (first, last, prev, next) e `meta` (current_page, last_page, total, etc.).
- **422** – Parâmetros inválidos.
- **429** – Limite de taxa (100 req/min).

Cada vaga tem: `id`, `title`, `company`, `company_website`, `city`, `schedule`, `salary`, `description`, `requirements`, `created_at`, `updated_at`.
