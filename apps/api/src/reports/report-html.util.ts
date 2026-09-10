import { ReportItemInput, ReportSessionInput } from './report.types.js';

const STATE_LABEL: Record<string, string> = {
  UNSET: '미점검',
  NORMAL: '정상',
  CAUTION: '주의',
  URGENT: '긴급',
};

const STATE_COLOR: Record<string, { bg: string; fg: string }> = {
  UNSET: { bg: '#F5F6F8', fg: '#8A8F98' },
  NORMAL: { bg: '#DCFCE7', fg: '#16A34A' },
  CAUTION: { bg: '#FEF3C7', fg: '#B45309' },
  URGENT: { bg: '#FEE2E2', fg: '#DC2626' },
};

export function renderReportHtml(session: ReportSessionInput, items: ReportItemInput[]): string {
  const urgentCount = items.filter((i) => i.state === 'URGENT').length;
  const cautionCount = items.filter((i) => i.state === 'CAUTION').length;
  const normalCount = items.filter((i) => i.state === 'NORMAL').length;

  const rows = items
    .map((item) => {
      const c = STATE_COLOR[item.state] ?? STATE_COLOR.UNSET;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid #F5F6F8;">
          <div>
            <div style="font-size:14px;font-weight:600;color:#111827;">${item.item_name}</div>
            ${item.comment ? `<div style="font-size:12px;color:#8A8F98;margin-top:2px;">${item.comment}</div>` : ''}
          </div>
          <span style="background:${c.bg};color:${c.fg};font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;">
            ${STATE_LABEL[item.state] ?? item.state}
          </span>
        </div>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${session.hotel_name} ${session.room_label} 점검 리포트</title>
</head>
<body style="margin:0;background:#FFFFFF;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;color:#111827;">
  <div style="max-width:480px;margin:0 auto;padding:24px 20px 60px;">
    <div style="font-size:13px;color:#8A8F98;">${session.type === 'BATH_PRO' ? 'BATH PRO' : 'ROOM PRO'} 점검 리포트</div>
    <h1 style="font-size:24px;font-weight:700;margin:4px 0 2px;">${session.hotel_name} · ${session.room_label}</h1>
    <div style="font-size:13px;color:#8A8F98;">
      ${session.completed_at ? new Date(session.completed_at).toLocaleString('ko-KR') : ''}
      ${session.inspector_name ? ` · ${session.inspector_name}` : ''}
    </div>

    <div style="display:flex;gap:8px;margin-top:20px;">
      <div style="flex:1;background:#FFFFFF;border-radius:20px;padding:16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <div style="font-size:20px;font-weight:700;">${normalCount}</div>
        <div style="font-size:12px;color:#8A8F98;">정상</div>
      </div>
      <div style="flex:1;background:#FFFFFF;border-radius:20px;padding:16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <div style="font-size:20px;font-weight:700;color:#B45309;">${cautionCount}</div>
        <div style="font-size:12px;color:#8A8F98;">주의</div>
      </div>
      <div style="flex:1;background:#FFFFFF;border-radius:20px;padding:16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <div style="font-size:20px;font-weight:700;color:#DC2626;">${urgentCount}</div>
        <div style="font-size:12px;color:#8A8F98;">긴급</div>
      </div>
    </div>

    <div style="margin-top:24px;background:#FFFFFF;border-radius:20px;padding:8px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      ${rows}
    </div>
  </div>
</body>
</html>`;
}
