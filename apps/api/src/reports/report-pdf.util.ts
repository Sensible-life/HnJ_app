import PDFDocument from 'pdfkit';
import { ReportItemInput, ReportSessionInput } from './report.types.js';

const STATE_LABEL: Record<string, string> = {
  UNSET: '미점검',
  NORMAL: '정상',
  CAUTION: '주의',
  URGENT: '긴급',
};

const STATE_COLOR: Record<string, string> = {
  UNSET: '#8A8F98',
  NORMAL: '#16A34A',
  CAUTION: '#B45309',
  URGENT: '#DC2626',
};

/**
 * PDF 렌더링은 원래 BUILD_PLAN에서 Puppeteer(HTML→PDF)로 계획했으나, 이 개발 환경은
 * 네트워크 정책상 Chromium 바이너리 다운로드가 막혀 있어 순수 JS 라이브러리인 pdfkit으로 대체했다.
 * 운영 환경에서 Puppeteer 사용이 가능하다면 report-html.util.ts의 HTML을 그대로 렌더링해도 된다.
 */
export function generateReportPdf(
  session: ReportSessionInput,
  items: ReportItemInput[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(10).fillColor('#8A8F98').text(session.type === 'BATH_PRO' ? 'BATH PRO 점검 리포트' : 'ROOM PRO 점검 리포트');
    doc.moveDown(0.3);
    doc.fontSize(20).fillColor('#111827').text(`${session.hotel_name} · ${session.room_label}`);
    doc.fontSize(10).fillColor('#8A8F98').text(
      session.completed_at ? new Date(session.completed_at).toLocaleString('ko-KR') : '',
    );
    doc.moveDown(1);

    const urgentCount = items.filter((i) => i.state === 'URGENT').length;
    const cautionCount = items.filter((i) => i.state === 'CAUTION').length;
    const normalCount = items.filter((i) => i.state === 'NORMAL').length;
    doc.fontSize(12).fillColor('#111827').text(`정상 ${normalCount}  |  주의 ${cautionCount}  |  긴급 ${urgentCount}`);
    doc.moveDown(1);

    items.forEach((item, idx) => {
      const color = STATE_COLOR[item.state] ?? STATE_COLOR.UNSET;
      doc
        .fontSize(11)
        .fillColor('#111827')
        .text(`${idx + 1}. ${item.item_name}`, { continued: true })
        .fillColor(color)
        .text(`   [${STATE_LABEL[item.state] ?? item.state}]`);
      if (item.comment) {
        doc.fontSize(9).fillColor('#8A8F98').text(`   ${item.comment}`);
      }
      doc.moveDown(0.3);
    });

    doc.end();
  });
}
