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
        ${
          ticket.comment
            ? `<div style="margin-top:16px;text-align:left;background:#F5F6F8;border-radius:14px;padding:12px 14px;font-size:13px;color:#111827;">
                <div style="font-size:11px;font-weight:700;color:#8A8F98;margin-bottom:2px;">호텔 담당자 의견</div>
                ${ticket.comment}
              </div>`
            : ''
        }
      </div>`,
    );
  }

  return shell(
    '조치 승인',
    `
    <div style="font-size:13px;color:#DC2626;font-weight:600;">🚨 긴급 이슈 발생${ticket.requiresApproval === false ? ' (참고용)' : ''}</div>
    <h1 style="font-size:22px;font-weight:700;margin:6px 0 16px;">${ticket.hotelName} · ${ticket.roomLabel}</h1>
    <div style="background:#FFFFFF;border-radius:20px;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <div style="font-size:14px;font-weight:600;">${ticket.itemName}</div>
      <div style="font-size:12px;color:#8A8F98;margin-top:4px;">
        접수: ${new Date(ticket.createdAt).toLocaleString('ko-KR')}
      </div>
      ${
        ticket.problemDescription || ticket.actionDescription
          ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #F5F6F8;font-size:12px;color:#111827;">
              ${ticket.problemDescription ? `<div>문제 내용: ${ticket.problemDescription}</div>` : ''}
              ${ticket.actionDescription ? `<div style="margin-top:2px;">조치 내용: ${ticket.actionDescription}</div>` : ''}
            </div>`
          : ''
      }
      ${
        ticket.repairMaterial || ticket.repairCost || ticket.revisitDate
          ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #F5F6F8;font-size:12px;color:#111827;">
              ${ticket.repairMaterial ? `<div>수리 자재: ${ticket.repairMaterial}</div>` : ''}
              ${ticket.repairCost ? `<div>예상 비용: ${ticket.repairCost.toLocaleString('ko-KR')}원</div>` : ''}
              ${ticket.revisitDate ? `<div>재방문일: ${ticket.revisitDate}</div>` : ''}
            </div>`
          : ''
      }
    </div>

    <form id="ticket-form" style="margin-top:16px;">
      <label style="font-size:12px;font-weight:600;color:#8A8F98;">담당자 의견 또는 답변 (선택)</label>
      <textarea
        name="comment"
        form="ticket-form"
        rows="3"
        placeholder="확인했습니다. 다음 방문 시 재확인 부탁드려요 등"
        style="margin-top:6px;width:100%;box-sizing:border-box;border:1px solid #F5F6F8;background:#F5F6F8;border-radius:14px;padding:12px;font-size:14px;font-family:inherit;resize:vertical;"
      ></textarea>
    </form>

    <div style="margin-top:14px;">
      <button type="submit" form="ticket-form" formmethod="post" formaction="./${ticket.token}/approve"
        style="width:100%;padding:16px;border:none;border-radius:999px;background:#111827;color:#FFFFFF;font-size:15px;font-weight:700;">
        조치 승인
      </button>
    </div>
    <div style="margin-top:10px;">
      <button type="submit" form="ticket-form" formmethod="post" formaction="./${ticket.token}/reinspect"
        style="width:100%;padding:16px;border:1px solid #F5F6F8;border-radius:999px;background:#FFFFFF;color:#111827;font-size:15px;font-weight:700;">
        재점검 요청
      </button>
    </div>
  `,
  );
}
