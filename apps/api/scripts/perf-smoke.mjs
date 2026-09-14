#!/usr/bin/env node
// FR: "성능 테스트: 3G/LTE 환경 2초 이내 응답 확인" (TODO.md Phase 7).
//
// 이 스크립트는 서버가 이미 떠 있다고 가정하고(`npm run start` 또는 `node dist/main.js`)
// 핵심 엔드포인트의 서버측 응답 시간을 반복 측정해 p50/p95/max를 리포트한다.
// 주의: 이건 "서버 처리 시간" 예산 검증이며, 실제 3G/LTE 회선의 왕복 지연(RTT)까지
// 포함한 검증은 이 개발 환경(에뮬레이터/네트워크 스로틀링 불가)에서는 할 수 없다.
// 따라서 여기서는 서버 처리 시간이 2초 예산에서 충분히 여유(<500ms)를 갖는지를 보고,
// 실제 3G/LTE 조건 검증은 Chrome DevTools Network Throttling 또는 실기기 테스트로
// 별도 진행해야 한다 (docs/QA_CHECKLIST.md 참고).

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const ITERATIONS = Number(process.env.PERF_ITERATIONS ?? 20);
const BUDGET_MS = Number(process.env.PERF_BUDGET_MS ?? 2000);

async function time(fn) {
  const start = performance.now();
  const res = await fn();
  const elapsed = performance.now() - start;
  if (!res.ok) throw new Error(`요청 실패: ${res.status} ${res.url}`);
  return elapsed;
}

function percentile(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function measure(name, fn) {
  const samples = [];
  for (let i = 0; i < ITERATIONS; i += 1) {
    samples.push(await time(fn));
  }
  samples.sort((a, b) => a - b);
  const p50 = percentile(samples, 50);
  const p95 = percentile(samples, 95);
  const max = samples[samples.length - 1];
  const pass = p95 < BUDGET_MS;
  console.log(
    `${pass ? '✅' : '❌'} ${name}: p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms max=${max.toFixed(1)}ms (예산 ${BUDGET_MS}ms)`,
  );
  return pass;
}

async function main() {
  console.log(`대상 서버: ${BASE_URL} (반복 ${ITERATIONS}회, 예산 ${BUDGET_MS}ms)\n`);

  let sessionCounter = 0;
  const results = [];

  results.push(
    await measure('GET /hotels', () => fetch(`${BASE_URL}/hotels`)),
  );
  results.push(
    await measure('GET /admin/stats/dashboard', () => fetch(`${BASE_URL}/admin/stats/dashboard`)),
  );
  results.push(
    await measure('GET /schedules', () => fetch(`${BASE_URL}/schedules`)),
  );
  results.push(
    await measure('POST /inspections/sync (2개 항목, URGENT 1건)', () => {
      sessionCounter += 1;
      const id = `perf_${Date.now()}_${sessionCounter}`;
      return fetch(`${BASE_URL}/inspections/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUuid: id,
          session: {
            id,
            hotel_name: '성능테스트호텔',
            room_label: '101호',
            type: 'ROOM_PRO',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
          items: [
            { item_name: '침구 상태', state: 'NORMAL', photo_count: 0 },
            { item_name: '화장실 청결 상태', state: 'URGENT', photo_count: 1, repair_cost: 30000 },
          ],
        }),
      });
    }),
  );

  const allPass = results.every(Boolean);
  console.log(allPass ? '\n전체 통과 ✅' : '\n일부 항목이 예산을 초과했어요 ❌');
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error('perf-smoke 실행 실패:', err.message);
  console.error('서버가 실행 중인지 확인하세요: npm run start --workspace=apps/api');
  process.exit(1);
});
