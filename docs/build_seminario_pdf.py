"""Gera Seminario-Builder-JobFlow.pdf a partir do .md (texto simplificado)."""
from __future__ import annotations

import re
from pathlib import Path

from fpdf import FPDF


def md_to_plain_lines(md: str) -> list[str]:
    lines: list[str] = []
    in_code = False
    for raw in md.splitlines():
        if raw.strip().startswith("```"):
            in_code = not in_code
            if in_code:
                lines.append("")
                lines.append("[Codigo]")
            else:
                lines.append("")
            continue
        if in_code:
            lines.append("    " + raw.rstrip())
            continue
        s = raw.strip()
        if not s:
            lines.append("")
            continue
        if s.startswith("# "):
            lines.append("")
            lines.append(s[2:].upper())
            lines.append("")
        elif s.startswith("## "):
            lines.append("")
            lines.append(s[3:])
            lines.append("")
        elif s.startswith("### "):
            lines.append(s[4:])
        elif s.startswith("|") and "---" in s:
            continue
        elif s.startswith("|"):
            cells = [c.strip() for c in s.split("|")[1:-1]]
            lines.append("  * " + " | ".join(cells))
        elif s.startswith("- "):
            lines.append("  * " + s[2:])
        else:
            lines.append(s)
    return lines


class PDF(FPDF):
    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 9)
        self.cell(0, 10, f"Pagina {self.page_no()}", align="C")


def main() -> None:
    base = Path(__file__).resolve().parent
    md_path = base / "Seminario-Builder-JobFlow.md"
    out_path = base / "Seminario-Builder-JobFlow.pdf"

    text = md_path.read_text(encoding="utf-8")
    plain = md_to_plain_lines(text)

    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_left_margin(18)
    pdf.set_right_margin(18)
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)

    for line in plain:
        safe = line
        if safe:
            safe = re.sub(r"[^\x00-\xff]", "?", safe)
        pdf.set_x(pdf.l_margin)
        if not safe:
            pdf.ln(4)
            continue
        pdf.multi_cell(0, 6, safe, new_x="LMARGIN", new_y="NEXT")

    pdf.output(out_path)
    print(f"OK: {out_path}")


if __name__ == "__main__":
    main()
