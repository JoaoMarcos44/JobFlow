"""Gera PDF de apresentacao em formato de slides (1 pagina por slide)."""
from __future__ import annotations

from pathlib import Path

from fpdf import FPDF


def safe(s: str) -> str:
    return "".join(c if ord(c) < 256 else "?" for c in s)


class SlidesPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="A4", orientation="landscape")
        self.set_auto_page_break(auto=False)
        self.slide_h = self.h
        self.slide_w = self.w

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, safe(f"JobFlow | Builder (GoF) | {self.page_no()}"), align="C")


def slide_title(pdf: SlidesPDF, title: str, subtitle: str | None = None) -> None:
    pdf.set_xy(pdf.l_margin, 22)
    pdf.set_font("Helvetica", "B", 26)
    pdf.set_text_color(20, 40, 80)
    pdf.multi_cell(pdf.w - 2 * pdf.l_margin, 14, safe(title))
    if subtitle:
        pdf.ln(4)
        pdf.set_font("Helvetica", "", 13)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(pdf.w - 2 * pdf.l_margin, 8, safe(subtitle))
    pdf.set_text_color(0, 0, 0)


def slide_bullets(pdf: SlidesPDF, items: list[str], start_y: float = 58) -> None:
    pdf.set_xy(pdf.l_margin, start_y)
    pdf.set_font("Helvetica", "", 15)
    for item in items:
        line = safe(item)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(pdf.w - 2 * pdf.l_margin, 9, f"- {line}")
        pdf.ln(2)


def new_slide(pdf: SlidesPDF) -> None:
    pdf.add_page()


def main() -> None:
    out = Path(__file__).resolve().parent / "Seminario-Builder-JobFlow-Slides.pdf"
    pdf = SlidesPDF()
    pdf.set_left_margin(22)
    pdf.set_right_margin(22)
    pdf.set_top_margin(18)

    # --- Slide 1: Capa ---
    new_slide(pdf)
    pdf.set_y(55)
    pdf.set_font("Helvetica", "B", 32)
    pdf.set_text_color(20, 40, 80)
    pdf.cell(0, 18, safe("Padrão Builder (GoF)"), ln=True, align="C")
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 20)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 12, safe("Aplicação no projeto JobFlow"), ln=True, align="C")
    pdf.ln(35)
    pdf.set_font("Helvetica", "", 16)
    pdf.cell(0, 10, safe("João Marcos Dias Barros"), ln=True, align="C")
    pdf.set_font("Helvetica", "", 14)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 9, safe("Seminários de Padrões de Projeto"), ln=True, align="C")
    pdf.cell(0, 9, safe("26 de abril de 2026"), ln=True, align="C")

    # --- Slide 2: Objetivo ---
    new_slide(pdf)
    slide_title(pdf, "Objetivo desta apresentação", "Padrão criacional Builder no contexto JobFlow")
    slide_bullets(
        pdf,
        [
            "Explicar o problema que o Builder resolve",
            "Mostrar estrutura (UML) e papéis do padrão",
            "Conectar ao JobFlow: importação de vaga (Codante → Job)",
            "Vantagens, riscos (over-engineering) e SOLID",
        ],
    )

    # --- Slide 3: Problema ---
    new_slide(pdf)
    slide_title(pdf, "Problema", "Objetos complexos com muitos campos opcionais")
    slide_bullets(
        pdf,
        [
            "Construtores com dezenas de parâmetros: difíceis de ler e manter",
            "Ordem dos argumentos propícia a erros",
            "Lógica de montagem espalhada dificulta validação e evolução",
            "Queremos um objeto consistente antes de persistir no PostgreSQL",
        ],
    )

    # --- Slide 4: Solução Builder ---
    new_slide(pdf)
    slide_title(pdf, "Solução: Builder", "Separar construção e representação final")
    slide_bullets(
        pdf,
        [
            "Montagem passo a passo com API fluente (withX / encadeamento)",
            "Validação concentrada em build()",
            "Director (opcional) orquestra a sequência a partir de um DTO",
            "Product: o objeto final (ex.: entidade Job)",
        ],
    )

    # --- Slide 5: Participantes ---
    new_slide(pdf)
    slide_title(pdf, "Estrutura do padrão", "Quatro papéis principais")
    slide_bullets(
        pdf,
        [
            "Product — objeto construído (ex.: Job)",
            "Builder — contrato dos passos de montagem",
            "ConcreteBuilder — implementação e estado intermediário",
            "Director — opcional; define ordem ao montar a partir de uma fonte (ex.: Codante)",
        ],
    )

    # --- Slide 6: Interação ---
    new_slide(pdf)
    slide_title(pdf, "Interação", "Fluxo típico")
    slide_bullets(
        pdf,
        [
            "Cliente obtém Director + ConcreteBuilder (ou só o Builder)",
            "Director chama os passos no Builder conforme o DTO de entrada",
            "build() valida e devolve o Product pronto",
            "Cliente persiste ou usa o Product (ex.: jobRepository.save)",
        ],
    )

    # --- Slide 7: JobFlow (UML resumido) ---
    new_slide(pdf)
    slide_title(pdf, "JobFlow — onde encaixa", "Fluxo real hoje no backend")
    slide_bullets(
        pdf,
        [
            "POST /api/saved-jobs/from-codante recebe CodanteJobPayload",
            "SavedJobService → JobService.upsertJobFromCodante(payload)",
            "Montagem do Job: título, empresa, cidade, descrição, requisitos, URL, datas…",
            "Builder aqui seria refatoração dessa montagem (hoje: vários setters)",
        ],
    )

    # --- Slide 8: Congruência código ---
    new_slide(pdf)
    slide_title(pdf, "Congruência com o código", "Tipos e nomes reais do projeto")
    slide_bullets(
        pdf,
        [
            "DTO: record CodanteJobPayload (id, title, company, city, …)",
            "Entidade Job: UUID id, Integer codanteId, campos de vaga",
            "Serviço: JobService.upsertJobFromCodante(CodanteJobPayload p)",
            "Proposta: JobBuilder + JobFromCodanteDirector (mesmas regras, mais claro)",
        ],
    )

    # --- Slide 9: Exemplo código (resumo) ---
    new_slide(pdf)
    slide_title(pdf, "Exemplo (Java)", "Director + Builder — ideia central")
    pdf.set_xy(pdf.l_margin, 52)
    pdf.set_font("Courier", "", 11)
    code_lines = [
        "JobFromCodanteDirector dir = new JobFromCodanteDirector();",
        "Job j = dir.build(payload, new JobBuilderImpl(base));",
        "return jobRepository.save(j);",
    ]
    for ln in code_lines:
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(pdf.w - 2 * pdf.l_margin, 7, safe(ln))
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 14)
    pdf.multi_cell(
        pdf.w - 2 * pdf.l_margin,
        8,
        safe(
            "build() concentra validação; Director traduz CodanteJobPayload → chamadas ao builder."
        ),
    )

    # --- Slide 10: SOLID ---
    new_slide(pdf)
    slide_title(pdf, "SOLID", "O que o Builder costuma reforçar")
    slide_bullets(
        pdf,
        [
            "SRP — construção separada da regra de negócio / persistência",
            "OCP — novos ConcreteBuilders ou Directors sem quebrar o núcleo",
            "Cuidado: builder “gigante” viola SRP de novo — manter focado",
        ],
    )

    # --- Slide 11: Vantagens ---
    new_slide(pdf)
    slide_title(pdf, "Vantagens")
    slide_bullets(
        pdf,
        [
            "Legibilidade na criação de objetos complexos",
            "Menos construtores telescópicos",
            "Ponto único de validação (build)",
            "Facilita evoluir campos opcionais (Codante muda, builder isola impacto)",
        ],
    )

    # --- Slide 12: Desvantagens ---
    new_slide(pdf)
    slide_title(pdf, "Desvantagens e quando evitar")
    slide_bullets(
        pdf,
        [
            "Mais classes — pode ser over-engineering para POJOs pequenos",
            "Curva inicial: time precisa seguir o mesmo padrão",
            "Para 2-3 campos, construtor ou factory simples pode bastar",
        ],
    )

    # --- Slide 13: Outros padrões GoF ---
    new_slide(pdf)
    slide_title(pdf, "Relação com outros padrões GoF")
    slide_bullets(
        pdf,
        [
            "Abstract Factory — famílias de objetos; Builder — um objeto, muitos passos",
            "Factory Method — cria uma instância; Builder — monta partes nomeadas",
            "Prototype — clonar; Builder — construir do zero com passos explícitos",
        ],
    )

    # --- Slide 14: Demo narrativa ---
    new_slide(pdf)
    slide_title(pdf, "Demo (narrativa)", "Feed → Salvar vaga")
    slide_bullets(
        pdf,
        [
            "Utilizador guarda vaga no Feed (Codante)",
            "Backend recebe CodanteJobPayload",
            "Director/Builder monta Job válido → persiste",
            "Cria SavedJob (ligação User ↔ Job) no PostgreSQL",
        ],
    )

    # --- Slide 15: Conclusão ---
    new_slide(pdf)
    slide_title(pdf, "Conclusão")
    slide_bullets(
        pdf,
        [
            "Builder resolve montagem complexa com clareza e validação",
            "No JobFlow, o caso natural é materializar Job a partir da Codante",
            "Padrões = vocabulário compartilhado + soluções com trade-offs conhecidos",
            "Obrigado — perguntas?",
        ],
    )

    pdf.output(out)
    print(f"OK: {out}")


if __name__ == "__main__":
    main()
