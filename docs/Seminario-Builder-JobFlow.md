# Apresentação: Padrão Builder no JobFlow

## 1. Capa

**Título:** Padrão de Projeto GoF Builder: Aplicação no JobFlow  
**Apresentador:** João Marcos Dias Barros  
**Disciplina:** Seminários de Padrões de Projeto  
**Data:** 26 de Abril de 2026

---

## 2. Introdução ao Padrão Builder (~2 min)

### Problema que o Builder resolve

**Roteiro de Fala:**

> Bom dia a todos. Meu nome é João Marcos Dias Barros e hoje vamos explorar o padrão de projeto GoF Builder, com foco em sua aplicação prática no nosso projeto JobFlow.

> O padrão Builder é uma solução para um problema comum no desenvolvimento de software: a criação de objetos complexos. Imagine que você precisa construir um objeto que possui muitas propriedades, algumas obrigatórias e outras opcionais. Se usarmos um construtor tradicional, teríamos um construtor com uma lista enorme de parâmetros, o que o torna difícil de ler, manter e propenso a erros, especialmente quando muitos parâmetros são do mesmo tipo e a ordem importa.

> Outro problema é a imutabilidade. Muitas vezes, queremos que nossos objetos sejam imutáveis após a criação para garantir a consistência do estado. No entanto, se o objeto é construído passo a passo, como garantir que ele só seja acessível em um estado válido e finalizado?

> O Builder resolve esses desafios ao separar a construção de um objeto complexo de sua representação, permitindo que o mesmo processo de construção crie diferentes representações. Ele oferece uma forma fluida e legível de construir objetos, especialmente aqueles com muitos parâmetros opcionais, e facilita a criação de objetos imutáveis.

**Slides (Tópicos):**

* **Título:** Introdução ao Padrão Builder
* **Bullet 1:** Criação de objetos complexos
  * Muitos parâmetros (obrigatórios e opcionais)
  * Construtores gigantes e ilegíveis
  * Dificuldade de manutenção e erros
* **Bullet 2:** Imutabilidade de objetos
  * Garantir estado consistente e finalizado
* **Bullet 3:** Solução do Builder
  * Construção passo a passo e fluida
  * Criação de objetos imutáveis

---

## 3. Descrição Detalhada do Padrão Builder (~3–4 min)

### Estrutura do Padrão com Diagrama UML

**Roteiro de Fala:**

> Agora, vamos mergulhar na estrutura do padrão Builder. Ele é composto por quatro participantes principais: o **Builder**, o **ConcreteBuilder**, o **Director** e o **Product**.

> O **Product** é o objeto complexo que está sendo construído. Ele não precisa saber nada sobre o processo de construção. No nosso contexto do JobFlow, um `Job` ou um `SavedJob` poderia ser um Product.

> O **Builder** é uma interface abstrata que define os passos para construir as partes do objeto Product. Ele declara métodos para criar cada parte e um método para obter o Product final. Por exemplo, teríamos métodos como `buildTitle()`, `buildDescription()`, `buildRequirements()`.

> O **ConcreteBuilder** implementa a interface Builder. Ele constrói e monta as partes do Product, mantendo o estado da construção. Um `JobBuilderImpl` seria um ConcreteBuilder, responsável por construir um objeto `Job` específico.

> Finalmente, o **Director** é opcional, mas muito útil. Ele constrói o objeto usando a interface Builder. Ele sabe a sequência de passos para construir um Product, mas não sabe os detalhes de como as partes são construídas. Isso permite que o Director reutilize o mesmo processo de construção para diferentes ConcreteBuilders, resultando em diferentes Products. No JobFlow, um `JobCreator` poderia ser um Director, orquestrando a criação de um `Job` a partir de diferentes fontes, como o payload da Codante.

> A interação ocorre da seguinte forma: o cliente cria um objeto Director e um objeto ConcreteBuilder. O Director então usa o ConcreteBuilder para construir o Product, chamando os métodos de construção definidos na interface Builder. No final, o cliente obtém o Product completo do ConcreteBuilder.

**Slides (Tópicos):**

* **Título:** Descrição Detalhada do Padrão Builder
* **Bullet 1:** Participantes do Padrão
  * **Product:** Objeto complexo a ser construído (ex: `Job`, `SavedJob` no JobFlow)
  * **Builder:** Interface para construir partes do Product (ex: `JobBuilder`)
  * **ConcreteBuilder:** Implementa Builder, constrói e monta o Product (ex: `JobBuilderImpl`)
  * **Director (Opcional):** Constrói o Product usando a interface Builder (ex: `JobDirector`)
* **Bullet 2:** Interação entre os participantes
  * Cliente cria Director e ConcreteBuilder
  * Director orquestra a construção via Builder
  * Cliente obtém Product final do ConcreteBuilder
* **Bullet 3:** Diagrama UML (representação textual; alinhado ao JobFlow real)

```text
class Job {
    -UUID id
    -Integer codanteId
    -String title
    -String company
    -String location
    -String description
    -String requirements
    -LocalDate postedDate
    -String sourceUrl
    +Job(title, company)
}

interface JobBuilder {
    +withCodanteId(Integer id)
    +withTitle(String title)
    +withCompany(String company)
    +withLocation(String location)
    +withDescription(String description)
    +withRequirements(String requirements)
    +withSourceUrl(String url)
    +withPostedDate(LocalDate date)
    +build(): Job
}

class JobBuilderImpl {
    -Job job
    +withCodanteId(Integer id): JobBuilderImpl
    +withTitle(String title): JobBuilderImpl
    ...
    +build(): Job
}

class JobDirector {
    +buildFromCodante(CodanteJobPayload p, JobBuilder b): Job
}

class CodanteJobPayload <<record>> {
    +Integer id
    +String title
    +String company
    +String companyWebsite
    +String city
    +String schedule
    +Integer salary
    +String description
    +String requirements
    +String createdAt
    +String updatedAt
}

// Congruente com o codigo: SavedJobService chama JobService.upsertJobFromCodante(CodanteJobPayload).
// Hoje o upsert usa varios setters; o Builder seria refatoracao para o mesmo fluxo.

// Relacoes:
// JobBuilder <|.. JobBuilderImpl
// JobDirector ..> JobBuilder
// JobDirector ..> CodanteJobPayload
// JobBuilderImpl ..> Job
```

---

## 4. Exemplo Prático: Aplicação do Builder no JobFlow (~10 min)

### Cenário: Montagem Complexa de Vaga (Job) a partir do Payload Codante

**Congruência com o código (JobFlow):** O fluxo real é `SavedJobService.saveFromCodante` → `JobService.upsertJobFromCodante(CodanteJobPayload p)`, que preenche `Job` (título, empresa, cidade como `location`, descrição, requisitos, `sourceUrl` a partir de `companyWebsite`, `postedDate` a partir de `createdAt`, etc.). O exemplo abaixo ilustra o **mesmo problema** usando o padrão Builder.

**Roteiro de Fala:**

> Agora, vamos aplicar o padrão Builder no nosso contexto do JobFlow. O cenário que escolhi é a montagem complexa de um objeto `Job` a partir de um payload da Codante, que pode ter muitos campos opcionais. Atualmente, o JobFlow importa ou faz upsert de vagas a partir do feed da Codante, e essa é uma funcionalidade perfeita para o Builder.

> Imagine que o payload da Codante é um DTO (Data Transfer Object) com muitos campos, e nem todos são obrigatórios ou vêm preenchidos. Além disso, podemos ter a necessidade de aplicar lógicas de negócio ou transformações em alguns desses campos antes de persistir o `Job` no nosso banco de dados. Usar um construtor com todos esses campos seria inviável.

> Com o Builder, podemos construir o objeto `Job` passo a passo, de forma mais legível e controlada. Vamos criar um `JobBuilder` que nos permitirá definir cada atributo do `Job` de maneira encadeada.

> Primeiro, definiremos a interface `JobBuilder` com métodos para cada atributo que queremos construir, e um método `build()` para retornar o `Job` final. Em seguida, teremos uma implementação concreta, `JobBuilderImpl`, que manterá uma instância de `Job` e implementará os métodos de construção. Cada método retornará a própria instância do `JobBuilderImpl`, permitindo o encadeamento de chamadas.

> Opcionalmente, podemos ter um `JobDirector` que encapsula a lógica de como construir um `Job` a partir do record **`CodanteJobPayload`** (o mesmo DTO usado hoje no endpoint `POST /api/saved-jobs/from-codante`). Este Director receberia o payload e um `JobBuilder`, e chamaria os métodos apropriados do Builder para construir o `Job`. No código atual, essa montagem já existe em `JobService.upsertJobFromCodante(CodanteJobPayload p)` com vários `set`; apresento o Builder como **refatoração** mais legível e com validação centralizada no `build()`.

> Vamos ver um exemplo de código Java que ilustra essa implementação, coerente com o Spring Boot e a estrutura do JobFlow.

**Slides (Tópicos):**

* **Título:** Exemplo Prático: Builder no JobFlow
* **Bullet 1:** Cenário: Montagem de `Job` a partir de `CodanteJobPayload`
  * Payload Codante com muitos campos opcionais
  * Necessidade de lógica de negócio/transformação
  * Evitar construtores gigantes
* **Bullet 2:** Implementação do Padrão Builder
  * **`Job` (Product):** Entidade principal da vaga
  * **`JobBuilder` (Builder):** Interface para construção de `Job`
  * **`JobBuilderImpl` (ConcreteBuilder):** Implementação concreta do Builder
  * **`JobDirector` (Director - Opcional):** Orquestra a construção a partir do DTO
* **Bullet 3:** Exemplo de Código Java (próximo slide)
  * `Job` Entity
  * `JobBuilder` Interface
  * `JobBuilderImpl` Class
  * `CodanteJobPayload` (record real no projeto)
  * `JobDirector` Class (opcional)
  * Uso no serviço de importação/upsert

**Exemplo de código Java (proposta alinhada ao `JobService.upsertJobFromCodante`):**

```java
// Director: traduz CodanteJobPayload -> chamadas ao builder (mesmas regras de negócio do upsert)
public final class JobFromCodanteDirector {
    public Job build(CodanteJobPayload p, JobBuilder b) {
        b.withTitle(p.title()).withCompany(p.company()).withCodanteId(p.id());
        b.withLocation(p.city() != null ? p.city() : "");
        b.withDescription(p.description() != null ? p.description() : "");
        b.withRequirements(p.requirements() != null ? p.requirements() : "");
        if (p.companyWebsite() != null && !p.companyWebsite().isBlank()) {
            b.withSourceUrl(p.companyWebsite());
        }
        // postedDate: mesmo parse de substring(0,10) que o serviço faz hoje
        if (p.createdAt() != null && p.createdAt().length() >= 10) {
            try {
                b.withPostedDate(java.time.LocalDate.parse(p.createdAt().substring(0, 10)));
            } catch (Exception ignored) { /* mantém default */ }
        }
        return b.build();
    }
}

// No JobService (ideia): Job j = director.build(p, new JobBuilderImpl(existingOrNew));
// depois jobRepository.save(j);
```

---

## 5. Vantagens e Desvantagens do Padrão Builder (~2–3 min)

### Princípios SOLID Relevantes, Prós e Contras

**Roteiro de Fala:**

> O padrão Builder, como qualquer padrão de projeto, traz consigo um conjunto de vantagens e desvantagens. Vamos analisá-los, e também ver como ele se alinha a alguns princípios SOLID.

> Em termos de **princípios SOLID**, o Builder se destaca principalmente em:
> * **Princípio da Responsabilidade Única (SRP):** A construção do objeto é separada da sua representação. O `JobBuilder` é responsável apenas por construir o `Job`, e o `Job` é responsável por representar a vaga.
> * **Princípio Aberto/Fechado (OCP):** Podemos adicionar novos `ConcreteBuilders` para criar diferentes representações do `Product` sem modificar o `Director` ou a interface `Builder` existente. Por exemplo, se tivéssemos que construir um `Job` de uma fonte diferente, poderíamos criar um novo `ConcreteBuilder` sem alterar o código existente.

> As **vantagens** do Builder incluem:
> * **Legibilidade e Clareza:** A construção passo a passo torna o código mais fácil de ler e entender, especialmente para objetos com muitos parâmetros.
> * **Flexibilidade:** Permite construir diferentes representações do Product usando o mesmo processo de construção.
> * **Imutabilidade:** Facilita a criação de objetos imutáveis, pois o objeto só é retornado em seu estado final e válido.
> * **Controle sobre a Construção:** Permite validar os parâmetros em cada etapa da construção, garantindo que o objeto final seja sempre válido.
> * **Evita Construtores Telescópicos:** Elimina a necessidade de múltiplos construtores com diferentes combinações de parâmetros.

> No entanto, o Builder também possui **desvantagens**:
> * **Aumento da Complexidade:** Introduz mais classes (Builder, ConcreteBuilder, Director) no projeto, o que pode ser um over-engineering para objetos simples.
> * **Custo Inicial:** O esforço inicial para implementar o Builder pode ser maior do que simplesmente usar um construtor direto.
> * **Over-engineering:** Para objetos com poucos parâmetros ou que não exigem uma construção complexa, o Builder pode ser excessivo e adicionar complexidade desnecessária.

> É crucial saber quando aplicar o Builder. Ele é ideal para objetos complexos com muitos parâmetros opcionais, onde a ordem de construção pode variar, ou quando se deseja garantir a imutabilidade e a validação durante a construção. Evite-o para objetos simples, onde um construtor direto ou um Factory Method seria mais apropriado.

**Slides (Tópicos):**

* **Título:** Vantagens e Desvantagens do Padrão Builder
* **Bullet 1:** Princípios SOLID Relevantes
  * **SRP (Single Responsibility Principle):** Separação da construção da representação.
  * **OCP (Open/Closed Principle):** Extensibilidade para novos `ConcreteBuilders` sem modificar o código existente.
* **Bullet 2:** Vantagens
  * Melhora a legibilidade e clareza do código.
  * Maior flexibilidade na construção de objetos.
  * Facilita a criação de objetos imutáveis.
  * Permite validação passo a passo.
  * Evita construtores telescópicos.
* **Bullet 3:** Desvantagens
  * Aumento da complexidade para objetos simples (over-engineering).
  * Custo inicial de implementação.
* **Bullet 4:** Quando usar?
  * Objetos complexos com muitos parâmetros opcionais.
  * Necessidade de imutabilidade e validação durante a construção.
  * Evitar para objetos simples.

---

## 6. Conclusão (~2–3 min)

### Relação com Outros Padrões GoF, Resumo e Importância dos Padrões

**Roteiro de Fala:**

> Para concluir, vamos contextualizar o Builder com outros padrões de projeto e reforçar sua importância.

> O Builder é um padrão criacional, assim como o Factory Method e o Abstract Factory. Ele se diferencia por focar na construção passo a passo de um objeto complexo, enquanto os outros se preocupam mais em encapsular a lógica de criação de famílias de objetos ou de instâncias de classes específicas. O Builder pode, inclusive, ser usado em conjunto com o Abstract Factory, onde o Abstract Factory retorna um Builder que, por sua vez, constrói o Product.

> Em resumo, o padrão Builder nos oferece uma maneira elegante e robusta de construir objetos complexos, promovendo a legibilidade, flexibilidade e imutabilidade. Ele é particularmente útil em cenários como o nosso no JobFlow, onde precisamos montar objetos `Job` a partir de fontes externas com dados variados e opcionais.

> A importância dos padrões de projeto, como o Builder, reside na sua capacidade de fornecer soluções comprovadas para problemas recorrentes no desenvolvimento de software. Eles promovem um vocabulário comum entre os desenvolvedores, facilitam a manutenção, aumentam a reusabilidade do código e, em última instância, nos ajudam a construir sistemas mais robustos e escaláveis. Dominar esses padrões é fundamental para qualquer engenheiro de software.

> Muito obrigado pela atenção. Estou aberto a perguntas.

**Slides (Tópicos):**

* **Título:** Conclusão
* **Bullet 1:** Relação com Outros Padrões GoF
  * Padrão Criacional (como Factory Method, Abstract Factory)
  * Pode ser combinado com Abstract Factory
* **Bullet 2:** Resumo do Builder
  * Construção passo a passo de objetos complexos.
  * Promove legibilidade, flexibilidade e imutabilidade.
  * Ideal para cenários como `Job` no JobFlow.
* **Bullet 3:** Importância dos Padrões de Projeto
  * Soluções comprovadas para problemas recorrentes.
  * Vocabulário comum, manutenção, reusabilidade.
  * Sistemas robustos e escaláveis.

---

## Sugestão de Demo Narrativa no Produto

**Roteiro de Fala:**

> Para ilustrar o impacto do Builder no JobFlow, podemos simular uma demo narrativa. Não se trata de uma demo ao vivo, mas de uma explicação de como a funcionalidade se encaixaria no fluxo do usuário.

> Imagine que um usuário está navegando pelo feed de vagas da Codante, que é integrado ao JobFlow. Ele encontra uma vaga interessante e decide salvá-la. Ao clicar em 'Salvar Vaga', o sistema recebe o payload dessa vaga da Codante. É nesse momento que o nosso `JobDirector`, em conjunto com o `JobBuilder`, entra em ação.

> O `JobDirector` orquestra a construção do objeto `Job` a partir do `CodanteJobPayload`. Ele garante que todos os campos necessários sejam preenchidos e que as transformações de dados sejam aplicadas. Por exemplo, se a descrição da vaga da Codante for muito longa, o Builder pode truncá-la ou formatá-la de uma maneira específica para o JobFlow.

> Uma vez que o objeto `Job` é construído de forma consistente e validada, ele é persistido no banco de dados. Em seguida, uma entrada em `SavedJob` é criada, relacionando o `User` que salvou a vaga com o `Job` recém-criado ou atualizado. Tudo isso acontece de forma transparente para o usuário, que apenas vê a vaga sendo salva com sucesso.

> Essa narrativa demonstra como o Builder nos permite gerenciar a complexidade da criação de objetos de forma eficaz, mantendo o código limpo e a lógica de negócio encapsulada, mesmo quando lidamos com dados externos e variáveis.

**Slides (Tópicos):**

* **Título:** Sugestão de Demo Narrativa no Produto
* **Bullet 1:** Fluxo do Usuário
  * Navegar no feed de vagas da Codante (integrado ao JobFlow).
  * Clicar em 'Salvar Vaga'.
* **Bullet 2:** Ação do Sistema (com Builder)
  * Recebimento do `CodanteJobPayload`.
  * `JobDirector` e `JobBuilder` constroem o objeto `Job`.
  * Aplicação de regras de negócio e transformações.
  * Persistência do `Job` no banco de dados.
  * Criação de `SavedJob` (User ↔ Job).
* **Bullet 3:** Benefício
  * Gerenciamento eficaz da complexidade.
  * Código limpo e lógica de negócio encapsulada.
  * Experiência do usuário fluida.
