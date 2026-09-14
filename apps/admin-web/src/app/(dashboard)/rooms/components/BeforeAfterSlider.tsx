"use client";

import { useRef, useState } from "react";

// FR: "객실 타임라인 피드 + Before/After 스플릿 슬라이더" — TODO.md Phase 6.
// 드래그로 경계선을 움직여 작업 전/후 사진을 한 프레임에서 비교한다.
// clip-path로 잘라내기 때문에 두 이미지 모두 컨테이너 전체 크기로 렌더링되고,
// 별도의 폭 계산(JS 측정) 없이도 리사이즈에 자연스럽게 반응한다.
export function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [position, setPosition] = useState(50); // 0~100, %
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-2xl bg-background-subtle"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          updateFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updateFromClientX(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt="작업 후" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="작업 전"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
          style={{ left: `${position}%` }}
        />
        <div
          className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
          style={{ left: `${position}%` }}
        >
          ⇔
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[11px] font-semibold text-white">작업 전</span>
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[11px] font-semibold text-white">작업 후</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="mt-3 w-full accent-primary"
        aria-label="Before/After 비교 슬라이더"
      />
    </div>
  );
}
