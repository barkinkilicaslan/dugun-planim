import type { AppData, BudgetItem, CurrencyCode, DateFormatPreference, Guest, SeatingTable, TaskItem } from './models';

const DAY_MS = 86_400_000;

export function localDateStart(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function isValidDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
}

export function daysUntil(dateString: string, now = new Date()): number {
  if (!isValidDateString(dateString)) return 0;
  const [year, month, day] = dateString.split('-').map(Number);
  const targetDay = Date.UTC(year, month - 1, day) / DAY_MS;
  const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS;
  return targetDay - currentDay;
}

export function formatDate(value: string, preference: DateFormatPreference): string {
  if (!isValidDateString(value) || preference === 'YYYY-MM-DD') return value;
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

export function taskProgress(tasks: TaskItem[]): { completed: number; remaining: number; percentage: number } {
  const completed = tasks.filter((task) => task.completed).length;
  const remaining = tasks.length - completed;
  const percentage = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
  return { completed, remaining, percentage };
}

export function isTaskOverdue(task: TaskItem, now = new Date()): boolean {
  return !task.completed && Boolean(task.dueDate) && daysUntil(task.dueDate, now) < 0;
}

export function guestSummary(guests: Guest[]) {
  return guests.reduce(
    (summary, guest) => {
      summary.invitations += 1;
      summary.people += guest.partySize;
      summary.children += guest.childCount;
      if (guest.rsvp === 'attending') summary.attending += guest.partySize;
      if (guest.rsvp === 'pending') summary.pending += guest.partySize;
      if (guest.rsvp === 'declined') summary.declined += guest.partySize;
      return summary;
    },
    { invitations: 0, people: 0, children: 0, attending: 0, pending: 0, declined: 0 },
  );
}

export function tableOccupancy(tableId: string, guests: Guest[]): number {
  return guests
    .filter((guest) => guest.tableId === tableId && guest.rsvp !== 'declined')
    .reduce((total, guest) => total + guest.partySize, 0);
}

export function canAssignGuest(table: SeatingTable, guest: Guest, guests: Guest[]): boolean {
  const current = tableOccupancy(
    table.id,
    guests.filter((item) => item.id !== guest.id),
  );
  return current + guest.partySize <= table.capacity;
}

export function budgetSummary(items: BudgetItem[], totalBudgetCents: number) {
  const plannedCents = items.reduce((sum, item) => sum + item.plannedCents, 0);
  const actualCents = items.reduce((sum, item) => sum + item.actualCents, 0);
  const paidCents = items.reduce((sum, item) => sum + item.paidCents, 0);
  const remainingPaymentsCents = items.reduce((sum, item) => sum + Math.max(0, item.actualCents - item.paidCents), 0);
  return {
    totalBudgetCents,
    plannedCents,
    actualCents,
    paidCents,
    remainingPaymentsCents,
    availableCents: totalBudgetCents - actualCents,
    overBudgetCents: Math.max(0, actualCents - totalBudgetCents),
  };
}

export function categoryDistribution(items: BudgetItem[]) {
  const grouped = new Map<string, number>();
  for (const item of items) grouped.set(item.category, (grouped.get(item.category) ?? 0) + item.actualCents);
  return [...grouped.entries()].map(([category, cents]) => ({ category, cents })).sort((a, b) => b.cents - a.cents);
}

export function formatMoney(cents: number, currency: CurrencyCode, locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(cents / 100);
}

export function dashboardSummary(data: AppData) {
  return {
    days: daysUntil(data.profile.weddingDate),
    tasks: taskProgress(data.tasks),
    guests: guestSummary(data.guests),
    budget: budgetSummary(data.budgetItems, data.profile.estimatedBudgetCents),
  };
}
