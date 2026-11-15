import { useEffect, useRef } from "react";
import { Wagon } from "./Wagon";

type Box = { x: number; y: number; r: number; b: number };
type Point = { x: number; y: number };

const OBSTACLES = [
  ".motel-sign",
  ".tagline",
  "[data-testid=progress]",
  "[data-testid=filters-toggle]",
  "[data-testid=list-toggle]",
  ".account",
];

/**
 * A looping drive through the header's empty parchment.
 * The wagon starts tucked behind the title, drives out, then zig-zags
 * between stops that stay clear of the title, the counter, and Filters.
 */
export function HeaderTrip() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const header = root?.closest(".top");
    if (!root || !(header instanceof HTMLElement)) return;

    const apply = () => {
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
          },
        ];
      });
      const sign = boxes[0];
      if (!sign) return;

      const blocked = (x: number, y: number, allowSign = false) => {
        if (x < 2 || y < 2 || x + wagonW > headerBox.width - 2 || y + wagonH > headerBox.height - 2) return true;
        return boxes.some((box, index) => {
          if (allowSign && index === 0) return false;
          return x < box.r + gap && x + wagonW > box.x - gap && y < box.b + gap && y + wagonH > box.y - gap;
        });
      };

      const segmentClear = (from: Point, to: Point, allowSign = false) => {
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const steps = Math.max(2, Math.ceil(distance / 4));
        for (let step = 0; step <= steps; step += 1) {
          const t = step / steps;
          if (blocked(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, allowSign)) return false;
        }
        return true;
      };

      const cells: Point[] = [];
      for (let y = 2; y <= headerBox.height - wagonH - 2; y += 6) {
        for (let x = 2; x <= headerBox.width - wagonW - 2; x += 8) {
          if (!blocked(x, y)) cells.push({ x, y });
        }
      }

      let start: Point | null = null;
      let exit: Point | null = null;
      const driveOut = headerBox.width >= 960 ? 36 : 18;
      for (let y = sign.y + 4; y <= sign.b - wagonH - 4; y += 4) {
        const tucked = { x: Math.max(2, Math.round(sign.r - wagonW + 6)), y };
        for (const reach of [driveOut, 10]) {
          const out = { x: Math.round(sign.r + reach), y };
          if (!blocked(tucked.x, tucked.y, true) && !blocked(out.x, out.y) && segmentClear(tucked, out, true)) {
            start = tucked;
            exit = out;
            break;
          }
        }
        if (start && exit) break;
      }

      const route = start && exit ? planRoute(start, exit, cells, segmentClear) : null;
      const points = route ?? parkedFallback(sign, wagonH, blocked);
      const face = (from: Point, to: Point) => (to.x >= from.x ? 1 : -1);
      points.forEach((point, index) => {
        const previous = points[(index + points.length - 1) % points.length];
        root.style.setProperty(`--x${index}`, `${Math.round(point.x)}px`);
        root.style.setProperty(`--y${index}`, `${Math.round(point.y)}px`);
        root.style.setProperty(`--f${index}`, String(face(previous, point)));
      });
      root.style.setProperty("--park-x", `${Math.round(points[1].x)}px`);
      root.style.setProperty("--park-y", `${Math.round(points[1].y)}px`);
      root.classList.add("is-ready");
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    const sign = header.querySelector(".motel-sign");
    if (sign) observer.observe(sign);
    document.fonts?.ready.then(apply).catch(() => undefined);
    return () => observer.disconnect();
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

function parkedFallback(sign: Box, wagonH: number, blocked: (x: number, y: number) => boolean): Point[] {
  const spot = { x: Math.round(sign.r + 8), y: Math.max(2, Math.round(sign.y + 4)) };
  if (blocked(spot.x, spot.y)) {
    spot.x = 8;
    spot.y = Math.max(2, sign.b - wagonH);
  }
  return [spot, spot, spot, spot, spot];
}

function planRoute(
  start: Point,
  exit: Point,
  cells: Point[],
  segmentClear: (from: Point, to: Point, allowSign?: boolean) => boolean,
): Point[] | null {
  const pool: Point[] = [];
  const buckets = new Map<number, Point[]>();
  for (const cell of cells) {
    if (Math.hypot(cell.x - exit.x, cell.y - exit.y) < 20) continue;
    const key = Math.round(cell.x / 18) * 18;
    const column = buckets.get(key);
    if (column) column.push(cell);
    else buckets.set(key, [cell]);
  }
  for (const column of buckets.values()) {
    column.sort((a, b) => a.y - b.y);
    pool.push(column[0], column[Math.floor(column.length / 2)], column[column.length - 1]);
  }

  let best: Point[] | null = null;
  let bestScore = -1;
  const incoming = Math.sign(exit.x - start.x) || 1;

  const search = (path: Point[], dir: number, turns: number) => {
    if (path.length === 5) {
      if (!segmentClear(path[4], start, true)) return;
      const ys = path.map((point) => point.y);
      const xs = path.map((point) => point.x);
      const ySpan = Math.max(...ys) - Math.min(...ys);
      const xSpan = Math.max(...xs) - Math.min(...xs);
      if (turns < 1 || ySpan < 16) return;
      const score = turns * 160 + ySpan * 2 + xSpan * 1.6;
      if (score > bestScore) {
        bestScore = score;
        best = path.slice();
      }
      return;
    }
    const here = path[path.length - 1];
    const options = pool
      .filter((point) => !path.some((kept) => Math.hypot(kept.x - point.x, kept.y - point.y) < 24))
      .map((point) => {
        const nextDir = Math.sign(point.x - here.x) || dir;
        const turn = path.length > 2 && nextDir !== dir ? 1 : 0;
        const distance = Math.hypot(point.x - here.x, point.y - here.y);
        return {
          point,
          nextDir,
          turn,
          score: turn * 28 + Math.abs(point.y - here.y) * 0.35 + Math.min(distance, 480) * 0.62,
        };
      })
      .filter((option) => segmentClear(here, option.point))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    for (const option of options) search([...path, option.point], option.nextDir, turns + option.turn);
  };

  search([start, exit], incoming, 0);
  return best;
}
