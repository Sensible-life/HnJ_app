import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ReportItemInput, ReportSessionInput } from './report.types.js';
import { renderReportHtml } from './report-html.util.js';
import { generateReportPdf } from './report-pdf.util.js';

const REPORTS_DIR = join(process.cwd(), 'uploads', 'reports');

export interface SavedReport {
  id: string;
  webUrl: string;
  pdfUrl: string;
}

@Injectable()
export class ReportsService {
  async generateAndSave(session: ReportSessionInput, items: ReportItemInput[]): Promise<SavedReport> {
    await mkdir(REPORTS_DIR, { recursive: true });

    const id = randomUUID();
    const html = renderReportHtml(session, items);
    const pdfBuffer = await generateReportPdf(session, items);

    await writeFile(join(REPORTS_DIR, `${id}.html`), html, 'utf-8');
    await writeFile(join(REPORTS_DIR, `${id}.pdf`), pdfBuffer);

    return {
      id,
      webUrl: `/uploads/reports/${id}.html`,
      pdfUrl: `/uploads/reports/${id}.pdf`,
    };
  }
}
