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
