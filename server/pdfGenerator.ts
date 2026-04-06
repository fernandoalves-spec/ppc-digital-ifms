import PDFDocument from "pdfkit";

interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: string;
  rows: Array<Record<string, string | number>>;
  columns: Array<{ key: string; label: string; width?: number }>;
  summary?: Array<{ label: string; value: string | number }>;
}

export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: data.title,
        Author: "PPC Digital IFMS",
        Subject: data.subtitle ?? "",
        Creator: "PPC Digital IFMS",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const GREEN = "#16a34a";
    const BLUE = "#1d4ed8";
    const DARK = "#1e293b";
    const GRAY = "#64748b";
    const LIGHT_GRAY = "#f1f5f9";
    const WHITE = "#ffffff";
    const PAGE_WIDTH = doc.page.width - 100; // margins

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(GREEN);
    doc.fillColor(WHITE).fontSize(20).font("Helvetica-Bold").text("PPC Digital IFMS", 50, 20);
    doc.fontSize(10).font("Helvetica").text("Instituto Federal de Mato Grosso do Sul", 50, 45);
    doc.fillColor(WHITE).fontSize(8).text(`Gerado em: ${data.generatedAt}`, doc.page.width - 200, 55, { width: 150, align: "right" });

    // ── Title ────────────────────────────────────────────────────────────────
    doc.moveDown(3.5);
    doc.fillColor(DARK).fontSize(16).font("Helvetica-Bold").text(data.title, { align: "center" });
    if (data.subtitle) {
      doc.moveDown(0.3);
      doc.fillColor(GRAY).fontSize(10).font("Helvetica").text(data.subtitle, { align: "center" });
    }
    doc.moveDown(1);

    // ── Summary Cards ────────────────────────────────────────────────────────
    if (data.summary && data.summary.length > 0) {
      const cardWidth = (PAGE_WIDTH - (data.summary.length - 1) * 10) / data.summary.length;
      let cardX = 50;
      const cardY = doc.y;

      for (const item of data.summary) {
        doc.rect(cardX, cardY, cardWidth, 50).fill(LIGHT_GRAY);
        doc.fillColor(GRAY).fontSize(8).font("Helvetica").text(item.label, cardX + 8, cardY + 8, { width: cardWidth - 16 });
        doc.fillColor(DARK).fontSize(16).font("Helvetica-Bold").text(String(item.value), cardX + 8, cardY + 22, { width: cardWidth - 16 });
        cardX += cardWidth + 10;
      }

      doc.moveDown(4);
    }

    // ── Table ────────────────────────────────────────────────────────────────
    doc.moveDown(0.5);
    const tableTop = doc.y;
    const colWidths = data.columns.map((col) => col.width ?? PAGE_WIDTH / data.columns.length);
    let colX = 50;

    // Header row
    doc.rect(50, tableTop, PAGE_WIDTH, 22).fill(BLUE);
    colX = 50;
    for (const col of data.columns) {
      const w = col.width ?? PAGE_WIDTH / data.columns.length;
      doc.fillColor(WHITE).fontSize(9).font("Helvetica-Bold").text(col.label, colX + 5, tableTop + 7, { width: w - 10, ellipsis: true });
      colX += w;
    }

    // Data rows
    let rowY = tableTop + 22;
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const rowHeight = 20;

      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(50, rowY, PAGE_WIDTH, rowHeight).fill(LIGHT_GRAY);
      } else {
        doc.rect(50, rowY, PAGE_WIDTH, rowHeight).fill(WHITE);
      }

      colX = 50;
      for (const col of data.columns) {
        const w = col.width ?? PAGE_WIDTH / data.columns.length;
        const val = row[col.key] ?? "";
        doc.fillColor(DARK).fontSize(8).font("Helvetica").text(String(val), colX + 5, rowY + 6, { width: w - 10, ellipsis: true });
        colX += w;
      }

      rowY += rowHeight;

      // Page break if needed
      if (rowY > doc.page.height - 80) {
        doc.addPage();
        rowY = 50;
        // Repeat header
        doc.rect(50, rowY, PAGE_WIDTH, 22).fill(BLUE);
        colX = 50;
        for (const col of data.columns) {
          const w = col.width ?? PAGE_WIDTH / data.columns.length;
          doc.fillColor(WHITE).fontSize(9).font("Helvetica-Bold").text(col.label, colX + 5, rowY + 7, { width: w - 10, ellipsis: true });
          colX += w;
        }
        rowY += 22;
      }
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, doc.page.width, 40).fill(LIGHT_GRAY);
    doc.fillColor(GRAY).fontSize(8).font("Helvetica")
      .text("PPC Digital IFMS — Sistema de Gestão de Projetos Pedagógicos de Curso", 50, footerY + 14, { align: "center", width: PAGE_WIDTH });

    doc.end();
  });
}

// ─── Memória de Cálculo por Área ─────────────────────────────────────────────
type MemoryAreaData = Awaited<ReturnType<typeof import("./db").getMemoryByArea>>;

export async function generateMemoryPdf(opts: {
  data: MemoryAreaData;
  generatedAt: string;
}): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const GREEN = "#16a34a";
    const DARK = "#1e293b";
    const GRAY = "#64748b";
    const LIGHT = "#f1f5f9";
    const WHITE = "#ffffff";
    const BLUE = "#1d4ed8";
    const PAGE_W = 515; // A4 width minus margins (40 * 2)

    // ── Capa / Cabeçalho ─────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(GREEN);
    doc.fillColor(WHITE).fontSize(20).font("Helvetica-Bold")
      .text("Memória de Cálculo — Aulas por Área", 40, 20, { width: PAGE_W });
    doc.fillColor(WHITE).fontSize(10).font("Helvetica")
      .text(`Instituto Federal de Mato Grosso do Sul — IFMS`, 40, 48, { width: PAGE_W });
    doc.fillColor(WHITE).fontSize(9)
      .text(`Gerado em: ${opts.generatedAt}`, 40, 64, { width: PAGE_W });

    let y = 110;

    const checkPage = (needed = 30) => {
      if (y + needed > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
    };

    for (const area of opts.data) {
      // ── Cabeçalho da Área ──────────────────────────────────────────────────
      checkPage(50);
      doc.rect(40, y, PAGE_W, 28).fill(area.areaColor ?? GREEN);
      doc.fillColor(WHITE).fontSize(13).font("Helvetica-Bold")
        .text(`Área: ${area.areaName}`, 48, y + 8, { width: PAGE_W - 16 });
      y += 34;

      for (const campus of area.campuses) {
        // ── Campus ────────────────────────────────────────────────────────────
        checkPage(40);
        doc.rect(40, y, PAGE_W, 22).fill(DARK);
        doc.fillColor(WHITE).fontSize(10).font("Helvetica-Bold")
          .text(`Campus: ${campus.campusName}`, 48, y + 6, { width: PAGE_W - 16 });
        y += 28;

        // Resumo de aulas por semestre do campus
        if (campus.semesterSummary.length > 0) {
          checkPage(30);
          doc.rect(40, y, PAGE_W, 18).fill(LIGHT);
          doc.fillColor(GRAY).fontSize(8).font("Helvetica-Bold")
            .text("Resumo de Aulas Semanais por Semestre (todos os cursos):", 48, y + 5);
          y += 20;

          // Linha de semestres
          const colW = Math.min(80, PAGE_W / campus.semesterSummary.length);
          let x = 48;
          checkPage(22);
          for (const s of campus.semesterSummary) {
            const semColor = s.calendarSemester === 1 ? BLUE : "#7c3aed";
            doc.rect(x, y, colW - 2, 22).fill(semColor);
            doc.fillColor(WHITE).fontSize(7).font("Helvetica-Bold")
              .text(s.label, x + 2, y + 3, { width: colW - 6, align: "center" });
            doc.fillColor(WHITE).fontSize(9).font("Helvetica")
              .text(`${s.weeklyClasses} aulas/sem`, x + 2, y + 12, { width: colW - 6, align: "center" });
            x += colW;
            if (x > 40 + PAGE_W - colW) break;
          }
          y += 26;
        }

        for (const course of campus.courses) {
          // ── Curso ──────────────────────────────────────────────────────────
          checkPage(30);
          doc.rect(40, y, PAGE_W, 18).fill("#e2e8f0");
          doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold")
            .text(`Curso: ${course.courseName}  |  ${course.courseType ?? ""}  |  Total: ${course.totalWeeklyClasses} aulas/sem  |  ${course.totalSubjects} disciplinas`, 48, y + 5, { width: PAGE_W - 16, ellipsis: true });
          y += 22;

          for (const sem of course.semesters) {
            // ── Semestre ────────────────────────────────────────────────────
            checkPage(30);
            doc.rect(40, y, PAGE_W, 16).fill("#f8fafc");
            doc.rect(40, y, 4, 16).fill(area.areaColor ?? GREEN);
            doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold")
              .text(`${sem.semester}º Semestre  —  ${sem.weeklyClasses} aulas/semana`, 50, y + 4, { width: PAGE_W - 20 });
            y += 18;

            // Tabela de disciplinas
            checkPage(20);
            doc.rect(40, y, PAGE_W, 14).fill("#e2e8f0");
            doc.fillColor(GRAY).fontSize(7.5).font("Helvetica-Bold")
              .text("Unidade Curricular", 48, y + 3, { width: 260 });
            doc.text("Aulas/sem", 310, y + 3, { width: 70, align: "center" });
            doc.text("C.H. Total", 380, y + 3, { width: 70, align: "center" });
            doc.text("Tipo", 450, y + 3, { width: 60, align: "center" });
            y += 16;

            let rowBg = false;
            for (const sub of sem.subjects) {
              checkPage(16);
              doc.rect(40, y, PAGE_W, 14).fill(rowBg ? LIGHT : WHITE);
              doc.fillColor(DARK).fontSize(8).font("Helvetica")
                .text(sub.name, 48, y + 3, { width: 258, ellipsis: true });
              doc.text(String(sub.weeklyClasses), 310, y + 3, { width: 70, align: "center" });
              doc.text(sub.totalHours ? `${sub.totalHours}h` : "—", 380, y + 3, { width: 70, align: "center" });
              doc.fillColor(sub.isElective ? BLUE : GREEN).fontSize(7).font("Helvetica-Bold")
                .text(sub.isElective ? "Optativa" : "Obrigatória", 450, y + 4, { width: 60, align: "center" });
              y += 14;
              rowBg = !rowBg;
            }
            y += 6;
          }
          y += 8;
        }
        y += 10;
      }
      y += 14;
    }

    // ── Rodapé ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, doc.page.width, 40).fill(LIGHT);
    doc.fillColor(GRAY).fontSize(8).font("Helvetica")
      .text("PPC Digital IFMS — Memória de Cálculo de Aulas por Área", 40, footerY + 14, { align: "center", width: PAGE_W });

    doc.end();
  });
}
