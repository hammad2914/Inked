import type { Task } from '@/types';
import { mondayOf, type PlanRow, type PlanState } from './Planner';

const DAY = 864e5;
const WEEK = 7 * DAY;

/** How a task is drawn on the planner. */
export function taskState(t: Pick<Task, 'status' | 'deadline' | 'timelineAccepted'>): PlanState {
  if (t.status === 'COMPLETED') return 'done';
  if (t.status === 'OVERDUE' || new Date(t.deadline).getTime() < Date.now()) return 'late';
  if (!t.timelineAccepted) return 'pencil';
  return 'ink';
}

export function stateLabel(state: PlanState) {
  return { pencil: 'not agreed yet', ink: 'agreed', done: 'done', late: 'past its deadline' }[state];
}

export function taskRow(t: Task, href?: string): PlanRow {
  const state = taskState(t);
  return {
    id: t.id,
    title: t.title,
    // my-tasks rows come without an assignee: they are all yours
    sub: t.assignee ? `${t.assignee.fullName} · ${stateLabel(state)}` : stateLabel(state),
    start: new Date(t.startDate),
    end: new Date(t.deadline),
    finished: t.completedAt ? new Date(t.completedAt) : undefined,
    state,
    href,
  };
}

/**
 * The weeks the sheet shows: from at most eight weeks back to two weeks past the
 * last deadline, so old finished work doesn't squeeze the current weeks flat.
 */
export function planWindow(tasks: Pick<Task, 'startDate' | 'deadline'>[]) {
  const now = Date.now();
  const starts = tasks.map((t) => new Date(t.startDate).getTime());
  const ends = tasks.map((t) => new Date(t.deadline).getTime());
  const first = Math.max(Math.min(now - 2 * WEEK, ...starts), now - 8 * WEEK);
  const last = Math.max(now + 2 * WEEK, ...ends) + WEEK;
  const from = mondayOf(new Date(first));
  const weeks = Math.min(26, Math.max(10, Math.ceil((last - from.getTime()) / WEEK)));
  return { from, weeks };
}
