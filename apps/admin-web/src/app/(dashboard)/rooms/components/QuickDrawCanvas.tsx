"use client";

import { useEffect, useRef, useState } from "react";

type Tool = "arrow" | "circle";
type Shape = { tool: Tool; x1: number; y1: number; x2: number; y2: number };

const STROKE_COLOR = "#DC2626";
const STROKE_WIDTH = 4;

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const headLength = 14;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawCircle(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 4), Math.max(ry, 4), 0, 0, Math.PI * 2);
  ctx.stroke();
}

// FR: "Quick-Draw 마킹 도구 (사진 위 화살표/원 오버레이)" — TODO.md Phase 6.
// 캔버스 2장(이미지 배경 + 드로잉 오버레이)을 겹쳐 화살표/원으로 이슈 부위를 표시한다.
export function QuickDrawCanvas({ imageUrl }: { imageUrl: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<Tool>("arrow");
  const [drawing, setDrawing] = useState<{ x1: number; y1: number } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function measure() {
      const el = wrapRef.current;
      if (!el) return;
      setSize({ width: el.clientWidth, height: el.clientHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = size.width;
    canvas.height = size.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    for (const shape of shapes) {
      if (shape.tool === "arrow") drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2);
      else drawCircle(ctx, shape.x1, shape.y1, shape.x2, shape.y2);
    }
  }, [shapes, size]);

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTool("arrow")}
          className={tool === "arrow" ? "rounded-full bg-nav-active-bg px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full bg-background-subtle px-3 py-1.5 text-xs font-medium text-foreground-secondary"}
        >
          ↗ 화살표
        </button>
        <button
          type="button"
          onClick={() => setTool("circle")}
          className={tool === "circle" ? "rounded-full bg-nav-active-bg px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full bg-background-subtle px-3 py-1.5 text-xs font-medium text-foreground-secondary"}
        >
          ○ 원
        </button>
        <button
          type="button"
          onClick={() => setShapes((prev) => prev.slice(0, -1))}
          disabled={shapes.length === 0}
          className="rounded-full bg-background-subtle px-3 py-1.5 text-xs font-medium text-foreground-secondary disabled:opacity-40"
        >
          ↩ 실행 취소
        </button>
        <button
          type="button"
          onClick={() => setShapes([])}
          disabled={shapes.length === 0}
          className="rounded-full bg-background-subtle px-3 py-1.5 text-xs font-medium text-foreground-secondary disabled:opacity-40"
        >
          전체 지우기
        </button>
      </div>

      <div ref={wrapRef} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-background-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="점검 사진" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            const p = pointFromEvent(e);
            setDrawing({ x1: p.x, y1: p.y });
          }}
          onPointerMove={(e) => {
            if (!drawing) return;
            const p = pointFromEvent(e);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = STROKE_COLOR;
            ctx.lineWidth = STROKE_WIDTH;
            ctx.lineCap = "round";
            for (const shape of shapes) {
              if (shape.tool === "arrow") drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2);
              else drawCircle(ctx, shape.x1, shape.y1, shape.x2, shape.y2);
            }
            if (tool === "arrow") drawArrow(ctx, drawing.x1, drawing.y1, p.x, p.y);
            else drawCircle(ctx, drawing.x1, drawing.y1, p.x, p.y);
          }}
          onPointerUp={(e) => {
            if (!drawing) return;
            const p = pointFromEvent(e);
            setShapes((prev) => [...prev, { tool, x1: drawing.x1, y1: drawing.y1, x2: p.x, y2: p.y }]);
            setDrawing(null);
          }}
        />
      </div>
      <p className="mt-2 text-xs text-foreground-secondary">사진 위를 드래그해서 이슈 부위에 화살표/원을 표시하세요.</p>
    </div>
  );
}
