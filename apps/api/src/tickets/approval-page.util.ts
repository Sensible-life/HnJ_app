import { TicketRecord } from './tickets.store.js';

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;background:#FFFFFF;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;color:#111827;">
  <div style="max-width:420px;margin:0 auto;padding:32px 20px;">
    ${body}
  </div>
</body>
</html>`;
}

export function renderApprovalPage(ticket: TicketRecord): string {
  if (ticket.status !== 'PENDING') {
    const label = ticket.status === 'APPROVED' ? '조치 승인 완료' : '재점검 요청됨';
    const color = ticket.status === 'APPROVED' ? '#16A34A' : '#B45309';
    return shell(
      '처리 완료',
      `
      <div style="background:#FFFFFF;border-radius:20px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,0.06);text-align:center;">
        <div style="font-size:18px;font-weight:700;color:${color};">${label}</div>
        <div style="font-size:13px;color:#8A8F98;margin-top:8px;">
          ${ticket.hotelName} · ${ticket.roomLabel} · ${ticket.itemName}
        </div>
      </div>`,
    );
  }

  return shell(
    '조치 승인',
    `
    <div style="font-size:13px;color:#DC2626;font-weight:600;">🚨 긴급 이슈 발생</div>
    <h1 style="font-size:22px;font-weight:700;margin:6px 0 16px;">${ticket.hotelName} · ${ticket.roomLabel}</h1>
    <div style="background:#FFFFFF;border-radius:20px;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <div style="font-size:14px;font-weight:600;">${ticket.itemName}</div>
      <div style="font-size:12px;color:#8A8F98;margin-top:4px;">
        접수: ${new Date(ticket.createdAt).toLocaleString('ko-KR')}
      </div>
    </div>

    <form method="post" action="./${ticket.token}/approve" style="margin-top:20px;">
      <button type="submit" style="width:100%;padding:16px;border:none;border-radius:999px;background:#111827;color:#FFFFFF;font-size:15px;font-weight:700;">
        조치 승인
      </button>
    </form>
    <form method="post" action="./${ticket.token}/reinspect" style="margin-top:10px;">
      <button type="submit" style="width:100%;padding:16px;border:1px solid #F5F6F8;border-radius:999px;background:#FFFFFF;color:#111827;font-size:15px;font-weight:700;">
        재점검 요청
      </button>
    </form>
  `,
  );
}
