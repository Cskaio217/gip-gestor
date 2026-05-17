import type { Project, Column, Card } from '../types';

/** Calculates the percentage of non-archived cards that are in the last column */
export function calcProjectProgress(project: Project): number {
  if (!project.columns.length) return 0;
  const sorted = [...project.columns].sort((a, b) => a.order - b.order);
  const doneColumn = sorted[sorted.length - 1];
  const allCards = project.columns.flatMap((c) => c.cards.filter((k) => !k.archived));
  if (!allCards.length) return 0;
  const doneCards = doneColumn.cards.filter((k) => !k.archived).length;
  return Math.round((doneCards / allCards.length) * 100);
}

/** Calculates checklist progress for a single card */
export function calcChecklistProgress(card: Card): { done: number; total: number; pct: number } {
  const total = card.checklist.length;
  const done = card.checklist.filter((i) => i.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}

/** Returns the total active card count across all columns */
export function countActiveCards(columns: Column[]): number {
  return columns.flatMap((c) => c.cards).filter((k) => !k.archived).length;
}
