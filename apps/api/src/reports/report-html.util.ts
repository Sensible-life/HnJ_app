import { ReportItemInput, ReportSessionInput } from './report.types.js';

const STATE_LABEL: Record<string, string> = {
  UNSET: '미점검',
  NORMAL: '정상',
  CAUTION: '주의',
  URGENT: '긴급',
  NOT_APPLICABLE: '해당 없음',
};

const STATE_COLOR: Record<string, { bg: string; fg: string }> = {
  UNSET: { bg: '#F5F6F8', fg: '#8A8F98' },
  NORMAL: { bg: '#DCFCE7', fg: '#16A34A' },
  CAUTION: { bg: '#FEF3C7', fg: '#B45309' },
  URGENT: { bg: '#FEE2E2', fg: '#DC2626' },
  NOT_APPLICABLE: { bg: '#F5F6F8', fg: '#8A8F98' },
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  INITIAL_RENEWAL: '최초 리뉴얼',
  REGULAR: '정기점검',
  EMERGENCY: '긴급출동',
  REINSPECTION: '재점검',
};

export function renderReportHtml(session: ReportSessionInput, items: ReportItemInput[]): string {
  const urgentCount = items.filter((i) => i.state === 'URGENT').length;
  const cautionCount = items.filter((i) => i.state === 'CAUTION').length;
  const normalCount = items.filter((i) => i.state === 'NORMAL').length;

  const rows = items
    .map((item) => {
      const c = STATE_COLOR[item.state] ?? STATE_COLOR.UNSET;
      const detailLines = [
        item.comment ? `메모: ${item.comment}` : '',
        item.issue_type ? `유형: ${item.issue_type}` : '',
        item.problem_description ? `문제 내용: ${item.problem_description}` : '',
        item.action_description ? `조치 내용: ${item.action_description}` : '',
      ].filter(Boolean);
      return `
        <div style="padding:12px 0;border-top:1px solid #F5F6F8;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:14px;font-weight:600;color:#111827;">
              ${item.item_name}
              ${item.requires_hotel_approval ? '<span style="margin-left:6px;font-size:11px;color:#DC2626;">● 호텔 승인 필요</span>' : ''}
            </div>
            <span style="background:${c.bg};color:${c.fg};font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;white-space:nowrap;">
              ${STATE_LABEL[item.state] ?? item.state}
            </span>
          </div>
          ${detailLines.map((line) => `<div style="font-size:12px;color:#8A8F98;margin-top:4px;">${line}</div>`).join('')}
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
      ${session.service_type ? ` · ${SERVICE_TYPE_LABEL[session.service_type] ?? session.service_type}` : ''}
      ${session.room_type ? ` · ${session.room_type}` : ''}
    </div>
    ${
      session.cleaning_team || session.cleaning_completed_at
        ? `<div style="font-size:12px;color:#8A8F98;margin-top:2px;">
            ${session.cleaning_team ? `청소팀: ${session.cleaning_team}` : ''}
            ${session.cleaning_completed_at ? ` · 청소 완료: ${new Date(session.cleaning_completed_at).toLocaleString('ko-KR')}` : ''}
          </div>`
        : ''
    }
    ${
      session.lost_item_found
        ? `<div style="margin-top:8px;background:#FEF3C7;border-radius:12px;padding:8px 14px;font-size:12px;color:#B45309;">
            🎒 분실물 발견${session.lost_item_location ? ` · 보관장소: ${session.lost_item_location}` : ''}
          </div>`
        : ''
    }
    ${
      session.inspector_opinion
        ? `<div style="margin-top:12px;background:#EAF2FF;border-radius:16px;padding:12px 16px;font-size:13px;color:#111827;">
            <div style="font-size:11px;font-weight:700;color:#2F6FED;margin-bottom:2px;">담당자 의견</div>
            ${session.inspector_opinion}
          </div>`
        : ''
    }

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
