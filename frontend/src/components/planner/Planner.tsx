import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import './planner.css';

/** pencil = proposed, ink = agreed, done = finished, late = past its deadline */
export type PlanState = 'pencil' | 'ink' | 'done' | 'late';

export interface PlanRow {
  id: string;
  title: string;
  sub: ReactNode;
  start: Date;
  end: Date;
  state: PlanState;
  finished?: Date;
  href?: string;
}

interface PlannerProps {
  rows: PlanRow[];
  from: Date;
  weeks: number;
  /** pencil rows whose ink should be drawn in (the agree animation) */
  agreed?: Set<string>;
  onRowClick?: (row: PlanRow) => void;
  note?: { rowId: string; text: string };
}

const DAY = 864e5;
const PEN = '#1D3FD8';

/** A small seeded wobble so pencil lines look drawn, and stay put between renders. */
function wobble(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280 - 0.5;
}

function Stroke({ a, b, color, opacity = 0.92 }: { a: number; b: number; color: string; opacity?: number }) {
  return (
    <path
      d={`M${a * 10} 28 L${b * 10} 28.8`}
      stroke={color} strokeWidth={13} opacity={opacity}
      strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke"
    />
  );
}

function Pencil({ a, b, seed }: { a: number; b: number; seed: number }) {
  const r = wobble(seed);
  return (
    <>
      {[0, 1, 2].map((k) => (
        <path
          key={k}
          d={`M${a * 10} ${23 + k * 4 + r() * 2} L${b * 10} ${24 + k * 4 + r() * 2}`}
          stroke="#8C877D" strokeWidth={1.3} opacity={0.85}
          strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke"
        />
      ))}
    </>
  );
}

export function Planner({ rows, from, weeks, agreed, onRowClick, note }: PlannerProps) {
  const span = weeks * 7 * DAY;
  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - from.getTime()) / span) * 100));
  const now = new Date();
  const todayPct = pct(now);
  const showToday = now.getTime() > from.getTime() && todayPct < 100;

  return (
    <div className="planner">
      <div
        className="planner-in"
        style={{ ['--weeks' as string]: weeks, minWidth: `calc(var(--nc) + ${weeks * 62}px)` }}
      >
        <div className="planner-wk">
          <div>Task</div>
          {Array.from({ length: weeks }, (_, i) => {
            const d = new Date(from.getTime() + i * 7 * DAY);
            return <div key={i}>{d.getDate()} {d.toLocaleDateString('en-GB', { month: 'short' })}</div>;
          })}
        </div>

        {rows.map((row, i) => {
          const a = pct(row.start);
          const end = row.state === 'late' ? now : row.state === 'done' && row.finished ? row.finished : row.end;
          const b = Math.max(pct(end), a + 0.6);
          const isAgreed = row.state === 'pencil' && agreed?.has(row.id);

          const line = (
            <div className="planner-line">
              <svg viewBox="0 0 1000 56" preserveAspectRatio="none">
                {row.state === 'pencil' && <Pencil a={a} b={b} seed={i + 7} />}
                {row.state === 'ink' && <Stroke a={a} b={b} color={PEN} />}
                {row.state === 'done' && <Stroke a={a} b={b} color="#9FB0F2" opacity={0.85} />}
                {row.state === 'late' && (
                  <>
                    <Stroke a={a} b={pct(row.end)} color={PEN} />
                    <Stroke a={pct(row.end)} b={b} color="#D2381F" opacity={1} />
                  </>
                )}
              </svg>
              {row.state === 'pencil' && (
                <div className="planner-ink">
                  <svg viewBox="0 0 1000 56" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <Stroke a={a} b={b} color={PEN} />
                  </svg>
                </div>
              )}
              {row.state === 'done' && (
                <svg className="planner-check" style={{ left: `${b}%` }} viewBox="0 0 22 20">
                  <path d="M2 10 l6 7 l12 -15" stroke={PEN} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {row.state === 'late' && <span className="planner-ring" style={{ left: `${b}%` }} />}
              {note?.rowId === row.id && (
                <span className="planner-note" style={{ right: `calc(${100 - a}% + 10px)`, top: '50%', transform: 'translateY(-50%)' }}>
                  {note.text}
                </span>
              )}
            </div>
          );

          const name = (
            <div className="planner-name">
              <b>{row.title}</b>
              <small>{row.sub}</small>
            </div>
          );

          const cls = cn('planner-row', (row.href || onRowClick) && 'is-link', isAgreed && 'agreed');
          return row.href ? (
            <Link key={row.id} to={row.href} className={cls}>{name}{line}</Link>
          ) : (
            <div key={row.id} className={cls} onClick={onRowClick ? () => onRowClick(row) : undefined}>{name}{line}</div>
          );
        })}

        {showToday && (
          <div className="planner-today" style={{ left: `calc(var(--nc) + (100% - var(--nc)) * ${todayPct / 100})` }}>
            <b>today</b>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlannerLegend() {
  return (
    <div className="planner-legend">
      <span><svg width="30" height="12"><path d="M1 4 L29 5 M1 8 L29 8" stroke="#8C877D" strokeWidth="1.3" strokeLinecap="round" /></svg>Pencil: proposed, not agreed yet</span>
      <span><svg width="30" height="12"><path d="M5 6 L25 6" stroke={PEN} strokeWidth="10" strokeLinecap="round" /></svg>Ink: agreed, locked</span>
      <span><svg width="30" height="12"><path d="M5 6 L25 6" stroke="#9FB0F2" strokeWidth="10" strokeLinecap="round" /></svg>Done</span>
      <span><svg width="30" height="12"><path d="M5 6 L25 6" stroke="#D2381F" strokeWidth="10" strokeLinecap="round" /></svg>Past its deadline</span>
    </div>
  );
}

/** Monday of the week containing d. */
export function mondayOf(d: Date) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}
