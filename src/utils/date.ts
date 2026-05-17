import { format, parseISO, isValid, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Formats an ISO date string to "dd/MM/yyyy" */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'dd/MM/yyyy', { locale: ptBR }) : '—';
}

/** Formats an ISO date string to "dd MMM yyyy" */
export function formatDateShort(iso: string): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd 'de' MMM yyyy", { locale: ptBR }) : '—';
}

/** Formats an ISO datetime string to "dd/MM/yyyy HH:mm" */
export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—';
}

/** Returns today's date as ISO string "yyyy-MM-dd" */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Returns true if the given ISO date is overdue (before today) */
export function isOverdue(iso: string): boolean {
  if (!iso) return false;
  const d = parseISO(iso);
  return isValid(d) && isAfter(new Date(), d);
}

/** Generates an ISO datetime string for now */
export function nowISO(): string {
  return new Date().toISOString();
}
