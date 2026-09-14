import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module.js';

/**
 * FR-INSP-05 / FR-REP-01 / FR-REP-02 E2E 시나리오 자동화 (TODO.md Phase 7).
 *
 * 모바일 "체크인"은 로컬 SQLite에서만 일어나는 단계라 서버에서 직접 검증할 수 없지만,
 * 그 결과물(체크인된 세션 + 점검 항목)이 그대로 올라오는 지점부터 — 즉
 * 동기화(sync) → 리포트 생성 → 알림톡 발송(mock) → 1-Click 승인 웹뷰 — 는
 * 전부 HTTP로 관측 가능하므로 여기서 end-to-end로 검증한다.
 *   체크인(모바일 로컬, 범위 밖) → [점검 동기화] → [리포트 생성 확인] → [승인 처리]
 */
describe('체크인 → 점검 동기화 → 리포트 → 승인 플로우 (e2e)', () => {
  let app: INestApplication<App>;
  const sessionId = `e2e_sess_${Date.now()}`;
  const hotelName = 'E2E 테스트 호텔';
  const roomLabel = '999호';
  let approveToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. 점검 완료 데이터를 동기화하면 리포트가 생성되고 URGENT 항목에 대한 승인 티켓이 발급된다', async () => {
    const res = await request(app.getHttpServer())
      .post('/inspections/sync')
      .send({
        clientUuid: sessionId,
        session: {
          id: sessionId,
          hotel_name: hotelName,
          room_label: roomLabel,
          type: 'ROOM_PRO',
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          completed_at: new Date().toISOString(),
        },
        items: [
          { item_name: '침구 오염 및 주름 상태', state: 'NORMAL', photo_count: 0 },
          {
            item_name: '화장실 청결 상태 (BATH PRO 연동)',
            state: 'URGENT',
            photo_count: 1,
            repair_material: '실리콘 코킹재',
            repair_cost: 50000,
            revisit_date: '2026-10-01',
          },
        ],
      })
      .expect(201);

    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.report.webUrl).toMatch(/^\/uploads\/reports\/.+\.html$/);
    expect(res.body.report.pdfUrl).toMatch(/^\/uploads\/reports\/.+\.pdf$/);
    expect(res.body.ticketsCreated).toBe(1);
    expect(res.body.tickets).toHaveLength(1);
    approveToken = res.body.tickets[0].token;
    expect(approveToken).toBeTruthy();
  });

  it('2. 동기화된 세션은 관리자 웹 조회용 엔드포인트에서 그대로 조회된다', async () => {
    const listRes = await request(app.getHttpServer())
      .get(`/inspections?hotelName=${encodeURIComponent(hotelName)}`)
      .expect(200);
    expect(listRes.body.some((r: { session: { id: string } }) => r.session.id === sessionId)).toBe(true);

    const detailRes = await request(app.getHttpServer()).get(`/inspections/${sessionId}`).expect(200);
    expect(detailRes.body.session.room_label).toBe(roomLabel);
    expect(detailRes.body.items).toHaveLength(2);

    const roomRes = await request(app.getHttpServer())
      .get(`/inspections/room?hotelName=${encodeURIComponent(hotelName)}&roomLabel=${encodeURIComponent(roomLabel)}`)
      .expect(200);
    expect(roomRes.body).toHaveLength(1);
  });

  it('3. 생성된 리포트 HTML/PDF 파일이 실제로 uploads 디스크에 저장된다', async () => {
    const inspectionRes = await request(app.getHttpServer()).get(`/inspections/${sessionId}`).expect(200);
    const { reportWebUrl, reportPdfUrl } = inspectionRes.body;

    // NOTE: `GET /uploads/...` 정적 서빙 자체는 실제 빌드된 서버(node dist/main.js)에
    // curl로 수동 검증 완료(200 OK, Content-Type 정상)했지만, vitest+supertest 테스트
    // 하네스에서는 @nestjs/serve-static이 등록한 미들웨어가 (listen()을 명시적으로
    // 호출해도) 적용되지 않는 알려진 마찰이 있어 여기서는 파일 시스템에 실제로
    // 저장됐는지로 검증한다. 정적 서빙 자체의 회귀는 배포 전 수동/스모크 테스트로 확인.
    expect(existsSync(join(process.cwd(), reportWebUrl))).toBe(true);
    expect(existsSync(join(process.cwd(), reportPdfUrl))).toBe(true);
  });

  it('4. 승인 대기 상태의 1-Click 웹뷰는 승인/재점검 버튼을 보여준다 (PENDING)', async () => {
    const res = await request(app.getHttpServer()).get(`/approve/${approveToken}`).expect(200);
    expect(res.text).toContain('조치 승인');
    expect(res.text).toContain(hotelName);
    expect(res.text).toContain(roomLabel);
    // 수리 정보(자재/비용/재방문일)도 웹뷰에 함께 노출되어야 한다
    expect(res.text).toContain('실리콘 코킹재');
    expect(res.text).toContain('50,000원');
    expect(res.text).toContain('2026-10-01');
  });

  it('5. 승인 처리하면 티켓 상태가 APPROVED로 바뀌고, 이후 같은 링크는 완료 화면을 보여준다', async () => {
    const approveRes = await request(app.getHttpServer()).post(`/approve/${approveToken}/approve`).expect(201);
    expect(approveRes.text).toContain('조치 승인 완료');

    const ticketsRes = await request(app.getHttpServer()).get('/tickets').expect(200);
    const ticket = ticketsRes.body.find((t: { token: string }) => t.token === approveToken);
    expect(ticket).toBeDefined();
    expect(ticket.status).toBe('APPROVED');

    const reGetRes = await request(app.getHttpServer()).get(`/approve/${approveToken}`).expect(200);
    expect(reGetRes.text).toContain('조치 승인 완료');
  });

  it('6. 잘못된 토큰으로 승인 웹뷰에 접근하면 404를 반환한다', async () => {
    await request(app.getHttpServer()).get('/approve/존재하지않는토큰').expect(404);
  });

  it('7. 통계 대시보드에 방금 동기화한 점검 데이터가 반영된다', async () => {
    const res = await request(app.getHttpServer()).get('/admin/stats/dashboard').expect(200);
    expect(res.body.totalItemCount).toBeGreaterThanOrEqual(2);
    expect(res.body.byHotel.some((h: { hotelName: string }) => h.hotelName === hotelName)).toBe(true);
  });
});
