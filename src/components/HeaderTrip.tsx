import { useEffect, useRef } from "react";
import { Wagon } from "./Wagon";

type Box = { x: number; y: number; r: number; b: number };
type Point = { x: number; y: number };
type Sample = Point & { d: number };
type Rect = { left: number; top: number; right: number; bottom: number };

const OBSTACLES = [
  ".motel-sign",
  ".tagline",
  "[data-testid=progress]",
  "[data-testid=filters-toggle]",
  "[data-testid=list-toggle]",
  ".account",
];

const LOOP_MS = 18000;

/**
 * One soft closed curve through the header's empty parchment.
 * The wagon eases around the loop, pauses to leave a green dot, and goes on.
 */
export function HeaderTrip() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const header = root?.closest(".top");
    if (!root || !(header instanceof HTMLElement)) return;
    const wagon = root.querySelector(".trip-wagon");
    const dots = [...root.querySelectorAll(".trip-dot")];
    if (!(wagon instanceof Element) || dots.length !== 4) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      for (const el of [wagon, ...dots]) {
        for (const animation of el.getAnimations()) animation.cancel();
      }

      const headerBox = header.getBoundingClientRect();
      const wagonW = headerBox.width >= 960 ? 26 : headerBox.height < 80 ? 18 : 20;
      const wagonH = Math.round(wagonW / 2);
      const gap = 5;
      root.style.setProperty("--wagon-w", `${wagonW}px`);
      root.style.setProperty("--wagon-h", `${wagonH}px`);

      const boxes = OBSTACLES.flatMap((selector) => {
        const el = header.querySelector(selector);
        if (!(el instanceof HTMLElement) || getComputedStyle(el).display === "none") return [];
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) return [];
        return [
          {
            x: box.left - headerBox.left,
            y: box.top - headerBox.top,
            r: box.right - headerBox.left,
            b: box.bottom - headerBox.top,
          } satisfies Box,
        ];
      });
      const sign = boxes[0];
      if (!sign) return;

      const blocked = (x: number, y: number) => {
        if (x < 2 || y < 2 || x + wagonW > headerBox.width - 2 || y + wagonH > headerBox.height - 2) return true;
        return boxes.some(
          (box) => x < box.r + gap && x + wagonW > box.x - gap && y < box.b + gap && y + wagonH > box.y - gap,
        );
      };

      const opening = bestOpening(blocked, headerBox.width, headerBox.height, wagonW, wagonH);
      const loop = opening ? fitLoop(opening, blocked) : null;
      const park = loop?.pauses[0] ?? parkBeside(sign, wagonH, blocked);
      root.style.setProperty("--park-x", `${Math.round(park.x)}px`);
      root.style.setProperty("--park-y", `${Math.round(park.y)}px`);
      loop?.pauses.forEach((pause, index) => {
        root.style.setProperty(`--x${index + 1}`, `${pause.x}px`);
        root.style.setProperty(`--y${index + 1}`, `${pause.y}px`);
      });
      root.classList.add("is-ready");
      if (!loop || motion.matches) return;

      const frames = keyframes(loop.samples, loop.pauses);
      wagon.animate(
        frames.map(({ left, top, transform, offset }) => ({ left, top, transform, offset })),
        { duration: LOOP_MS, iterations: Infinity, easing: "linear" },
      );
      dots.forEach((dot, index) => {
        const arrive = frames.find((frame) => frame.pause === index)?.offset ?? index / 4;
        dot.animate(dotFrames(arrive), { duration: LOOP_MS, iterations: Infinity, easing: "linear" });
      });
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    const sign = header.querySelector(".motel-sign");
    if (sign) observer.observe(sign);
    motion.addEventListener("change", apply);
    document.fonts?.ready.then(apply).catch(() => undefined);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", apply);
      for (const el of [wagon, ...dots]) {
        for (const animation of el.getAnimations()) animation.cancel();
      }
    };
  }, []);

  return (
    <div ref={rootRef} className="header-trip" aria-hidden="true">
      <span className="trip-dot" />
      <span className="trip-dot" />
      <span className="trip-dot" />
      <span className="trip-dot" />
      <Wagon className="trip-wagon" />
    </div>
  );
}

function parkBeside(sign: Box, wagonH: number, blocked: (x: number, y: number) => boolean): Point {
  const spot = { x: Math.round(sign.r + 8), y: Math.max(2, Math.round(sign.y + 4)) };
  if (blocked(spot.x, spot.y)) {
    spot.x = 8;
    spot.y = Math.max(2, sign.b - wagonH);
  }
  return spot;
}

function bestOpening(
  blocked: (x: number, y: number) => boolean,
  limitW: number,
  limitH: number,
  wagonW: number,
  wagonH: number,
): Rect | null {
  const step = 4;
  const origin = 2;
  const cols = Math.floor((limitW - wagonW - origin - 2) / step);
  const rows = Math.floor((limitH - wagonH - origin - 2) / step);
  if (cols < 2 || rows < 2) return null;
  const open = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => !blocked(origin + col * step, origin + row * step)),
  );
  const hist = new Array<number>(cols).fill(0);
  let best: { score: number; rect: Rect } | null = null;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) hist[col] = open[row][col] ? hist[col] + 1 : 0;
    const extended = [...hist, 0];
    const stack: number[] = [];
    for (let index = 0; index < extended.length; index += 1) {
      while (stack.length > 0 && extended[stack[stack.length - 1]] > extended[index]) {
        const mid = stack.pop() as number;
        const cellH = extended[mid];
        const leftIndex = stack.length > 0 ? stack[stack.length - 1] : -1;
        const c0 = leftIndex + 1;
        const c1 = index - 1;
        const r0 = row - cellH + 1;
        const w = (c1 - c0) * step;
        const h = (row - r0) * step;
        if (w >= 48 && h >= 18) {
          const score = w * w * h;
          if (!best || score > best.score) {
            best = {
              score,
              rect: {
                left: origin + c0 * step,
                top: origin + r0 * step,
                right: origin + c1 * step,
                bottom: origin + row * step,
              },
            };
          }
        }
      }
      stack.push(index);
    }
  }
  return best?.rect ?? null;
}

function fitLoop(rect: Rect, blocked: (x: number, y: number) => boolean): { samples: Sample[]; pauses: Point[] } | null {
  let current = rect;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const built = sampleLoop(current, attempt > 2 ? 0 : undefined);
    if (!built) return null;
    const hits = built.samples.some((point) => blocked(point.x, point.y));
    if (!hits && built.pauses.length === 4) return built;
    const shrink = 4;
    current = {
      left: current.left + shrink,
      top: current.top + shrink,
      right: current.right - shrink,
      bottom: current.bottom - shrink,
    };
    if (current.right - current.left < 40 || current.bottom - current.top < 16) break;
  }
  return null;
}

function sampleLoop(rect: Rect, ampOverride?: number): { samples: Sample[]; pauses: Point[] } | null {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", loopPath(rect, ampOverride));
  const length = path.getTotalLength();
  if (length < 32) return null;
  const samples: Sample[] = [];
  for (let distance = 0; distance <= length; distance += 5) {
    const point = path.getPointAtLength(Math.min(distance, length));
    samples.push({ x: point.x, y: point.y, d: Math.min(distance, length) });
  }
  const pauses = pauseSpots(rect, ampOverride).map((spot) => nearest(samples, spot));
  const unique = pauses.filter((pause, index) => pauses.findIndex((other) => Math.hypot(other.x - pause.x, other.y - pause.y) < 10) === index);
  if (unique.length < 4) return null;
  const start = unique.reduce((left, pause) => (pause.x < left.x ? pause : left));
  const ordered = unique.slice().sort((a, b) => a.d - b.d);
  const startAt = ordered.findIndex((pause) => pause === start);
  const rotated = [...ordered.slice(startAt), ...ordered.slice(0, startAt)];
  const cut = samples.findIndex((sample) => sample.d >= start.d);
  const track = [...samples.slice(cut), ...samples.slice(1, cut + 1)].map((sample, index) => ({
    ...sample,
    d: index,
  }));
  return { samples: track, pauses: rotated.map(({ x, y }) => ({ x, y })) };
}

function nearest(samples: Sample[], spot: Point): Sample {
  return samples.reduce((best, sample) =>
    Math.hypot(sample.x - spot.x, sample.y - spot.y) < Math.hypot(best.x - spot.x, best.y - spot.y) ? sample : best,
  );
}

function pauseSpots(rect: Rect, ampOverride?: number): Point[] {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const horizontal = width >= height;
  const radius = (horizontal ? height : width) / 2;
  const amp = ampOverride ?? bow(horizontal ? width - height : height - width, radius);
  if (horizontal) {
    const mid = (rect.left + rect.right) / 2;
    const cy = (rect.top + rect.bottom) / 2;
    return [
      { x: mid, y: rect.top + amp },
      { x: rect.right, y: cy },
      { x: mid, y: rect.bottom - amp },
      { x: rect.left, y: cy },
    ];
  }
  const mid = (rect.top + rect.bottom) / 2;
  const cx = (rect.left + rect.right) / 2;
  return [
    { x: cx, y: rect.top },
    { x: rect.right, y: mid },
    { x: cx, y: rect.bottom },
    { x: rect.left, y: mid },
  ];
}

function bow(span: number, radius: number): number {
  if (span < 36) return 0;
  return Math.min(8, radius * 0.28);
}

function loopPath(rect: Rect, ampOverride?: number): string {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  return width >= height ? horizontalLoop(rect, ampOverride) : verticalLoop(rect, ampOverride);
}

function horizontalLoop(rect: Rect, ampOverride?: number): string {
  const radius = round((rect.bottom - rect.top) / 2);
  const top = round(rect.top);
  const bottom = round(top + radius * 2);
  const left = round(rect.left);
  const right = round(rect.right);
  const x0 = round(left + radius);
  const x1 = round(right - radius);
  const mid = round((x0 + x1) / 2);
  const span = Math.max(0, x1 - x0);
  const amp = round(ampOverride ?? bow(span, radius));
  const handle = round(Math.min(span * 0.28, Math.max(10, span * 0.22)));
  const topEdge =
    amp < 1
      ? `L ${x1} ${top}`
      : `C ${round(x0 + handle)} ${top}, ${round(mid - handle)} ${round(top + amp)}, ${mid} ${round(top + amp)} C ${round(mid + handle)} ${round(top + amp)}, ${round(x1 - handle)} ${top}, ${x1} ${top}`;
  const bottomEdge =
    amp < 1
      ? `L ${x0} ${bottom}`
      : `C ${round(x1 - handle)} ${bottom}, ${round(mid + handle)} ${round(bottom - amp)}, ${mid} ${round(bottom - amp)} C ${round(mid - handle)} ${round(bottom - amp)}, ${round(x0 + handle)} ${bottom}, ${x0} ${bottom}`;
  return `M ${x0} ${top} ${topEdge} A ${radius} ${radius} 0 0 1 ${x1} ${bottom} ${bottomEdge} A ${radius} ${radius} 0 0 1 ${x0} ${top}`;
}

function verticalLoop(rect: Rect, ampOverride?: number): string {
  const radius = round((rect.right - rect.left) / 2);
  const left = round(rect.left);
  const right = round(left + radius * 2);
  const top = round(rect.top);
  const bottom = round(rect.bottom);
  const y0 = round(top + radius);
  const y1 = round(bottom - radius);
  const mid = round((y0 + y1) / 2);
  const span = Math.max(0, y1 - y0);
  const amp = round(ampOverride ?? bow(span, radius));
  const handle = round(Math.min(span * 0.28, Math.max(10, span * 0.22)));
  const rightEdge =
    amp < 1
      ? `L ${right} ${y1}`
      : `C ${right} ${round(y0 + handle)}, ${round(right - amp)} ${round(mid - handle)}, ${round(right - amp)} ${mid} C ${round(right - amp)} ${round(mid + handle)}, ${right} ${round(y1 - handle)}, ${right} ${y1}`;
  const leftEdge =
    amp < 1
      ? `L ${left} ${y0}`
      : `C ${left} ${round(y1 - handle)}, ${round(left + amp)} ${round(mid + handle)}, ${round(left + amp)} ${mid} C ${round(left + amp)} ${round(mid - handle)}, ${left} ${round(y0 + handle)}, ${left} ${y0}`;
  return `M ${right} ${y0} ${rightEdge} A ${radius} ${radius} 0 0 1 ${left} ${y1} ${leftEdge} A ${radius} ${radius} 0 0 1 ${right} ${y0}`;
}

type Frame = { left: string; top: string; transform: string; offset: number; pause?: number };

function keyframes(samples: Sample[], pauses: Point[]): Frame[] {
  const hold = 0.1;
  const travel = (1 - hold * pauses.length) / pauses.length;
  const frames: Frame[] = [];
  let time = 0;
  for (let index = 0; index < pauses.length; index += 1) {
    const slice = sliceBetween(samples, pauses[index], pauses[(index + 1) % pauses.length]);
    const face = slice.length > 1 && slice[slice.length - 1].x < slice[0].x - 1 ? -1 : 1;
    frames.push(frame(slice[0], face, time, index));
    time += hold;
    frames.push(frame(slice[0], face, time));
    for (let step = 1; step < slice.length; step += 1) {
      const along = 1 - (2 * step) / (slice.length - 1);
      const eased = Math.acos(Math.min(1, Math.max(-1, along))) / Math.PI;
      frames.push(frame(slice[step], face, time + travel * eased));
    }
    time += travel;
  }
  const first = frames[0];
  frames.push({ ...first, offset: 1 });
  for (let index = 1; index < frames.length; index += 1) {
    if (frames[index].offset <= frames[index - 1].offset) {
      frames[index].offset = Math.min(1, frames[index - 1].offset + 0.0002);
    }
  }
  frames[frames.length - 1].offset = 1;
  return frames;
}

function sliceBetween(samples: Sample[], from: Point, to: Point): Sample[] {
  const start = closestIndex(samples, from);
  const end = closestIndex(samples, to);
  if (start <= end) return samples.slice(start, end + 1);
  return [...samples.slice(start), ...samples.slice(0, end + 1)];
}

function closestIndex(samples: Sample[], spot: Point): number {
  let best = 0;
  let bestDistance = Infinity;
  samples.forEach((sample, index) => {
    const distance = Math.hypot(sample.x - spot.x, sample.y - spot.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

function frame(point: Point, face: number, offset: number, pause?: number): Frame {
  return {
    left: `${point.x}px`,
    top: `${point.y}px`,
    transform: `scaleX(${face})`,
    offset,
    pause,
  };
}

function dotFrames(arrive: number): Keyframe[] {
  const pop = Math.min(0.96, arrive + 0.035);
  return [
    { opacity: 0, transform: "scale(0.25) rotate(-16deg)", offset: 0 },
    { opacity: 0, transform: "scale(0.25) rotate(-16deg)", offset: Math.max(0, arrive) },
    { opacity: 1, transform: "scale(1) rotate(-8deg)", offset: pop },
    { opacity: 1, transform: "scale(1) rotate(-8deg)", offset: 0.94 },
    { opacity: 0, transform: "scale(0.25) rotate(-8deg)", offset: 1 },
  ];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
