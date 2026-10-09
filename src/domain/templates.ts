import { createTranslator, t as translateActive, type MessageKey, type Translator } from '@/i18n';
import type { TaskItem, TaskPriority } from './models';

interface TaskTemplate {
  categoryKey: MessageKey;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  monthsBeforeWedding: number;
  priority: TaskPriority;
}

/** Başlangıç görevleri: metinler görevlerin oluşturulduğu andaki dilde üretilir ve kullanıcının kendi verisi olarak saklanır. */
export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    categoryKey: 'starter.planning',
    titleKey: 'starter.t1.title',
    descriptionKey: 'starter.t1.desc',
    monthsBeforeWedding: 12,
    priority: 'high',
  },
  {
    categoryKey: 'starter.venue',
    titleKey: 'starter.t2.title',
    descriptionKey: 'starter.t2.desc',
    monthsBeforeWedding: 11,
    priority: 'high',
  },
  {
    categoryKey: 'starter.guests',
    titleKey: 'starter.t3.title',
    descriptionKey: 'starter.t3.desc',
    monthsBeforeWedding: 10,
    priority: 'medium',
  },
  {
    categoryKey: 'starter.vendor',
    titleKey: 'starter.t4.title',
    descriptionKey: 'starter.t4.desc',
    monthsBeforeWedding: 9,
    priority: 'medium',
  },
  {
    categoryKey: 'starter.vendor',
    titleKey: 'starter.t5.title',
    descriptionKey: 'starter.t5.desc',
    monthsBeforeWedding: 8,
    priority: 'medium',
  },
  {
    categoryKey: 'starter.attire',
    titleKey: 'starter.t6.title',
    descriptionKey: 'starter.t6.desc',
    monthsBeforeWedding: 7,
    priority: 'medium',
  },
  {
    categoryKey: 'starter.guests',
    titleKey: 'starter.t7.title',
    descriptionKey: 'starter.t7.desc',
    monthsBeforeWedding: 5,
    priority: 'medium',
  },
  {
    categoryKey: 'starter.seating',
    titleKey: 'starter.t8.title',
    descriptionKey: 'starter.t8.desc',
    monthsBeforeWedding: 2,
    priority: 'medium',
  },
  {
    categoryKey: 'starter.final',
    titleKey: 'starter.t9.title',
    descriptionKey: 'starter.t9.desc',
    monthsBeforeWedding: 1,
    priority: 'high',
  },
  {
    categoryKey: 'starter.final',
    titleKey: 'starter.t10.title',
    descriptionKey: 'starter.t10.desc',
    monthsBeforeWedding: 0,
    priority: 'high',
  },
];

function shiftMonths(dateString: string, months: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const targetMonthIndex = month - 1 - months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDayOfTargetMonth);
  return new Date(Date.UTC(targetYear, normalizedMonth, targetDay)).toISOString().slice(0, 10);
}

export function createTemplateTasks(
  weddingDate: string,
  idFactory: () => string,
  t: Translator = translateActive,
): TaskItem[] {
  const now = new Date().toISOString();
  return TASK_TEMPLATES.map((template) => ({
    id: idFactory(),
    category: t(template.categoryKey),
    title: t(template.titleKey),
    description: t(template.descriptionKey),
    dueDate: shiftMonths(weddingDate, template.monthsBeforeWedding),
    priority: template.priority,
    completed: false,
    createdAt: now,
    updatedAt: now,
  }));
}

/** Finds only untouched auto-seeded tasks from the old onboarding batch; personal tasks are never inferred by title alone. */
export function findLegacyAutoTaskIds(
  tasks: TaskItem[],
  weddingDate: string,
  today = new Date().toISOString().slice(0, 10),
): string[] {
  const signatures = new Map<string, string>();
  for (const locale of ['tr', 'en'] as const) {
    for (const task of createTemplateTasks(weddingDate, () => '', createTranslator(locale))) {
      signatures.set(
        [task.category, task.title, task.description, task.dueDate, task.priority].join('\u0000'),
        task.dueDate,
      );
    }
  }
  const matched = tasks.filter((task) => {
    if (
      task.completed ||
      task.notificationId ||
      task.updatedAt !== task.createdAt ||
      !task.dueDate ||
      task.dueDate >= today
    )
      return false;
    return signatures.has([task.category, task.title, task.description, task.dueDate, task.priority].join('\u0000'));
  });
  const batches = new Map<string, TaskItem[]>();
  for (const task of matched) batches.set(task.createdAt, [...(batches.get(task.createdAt) ?? []), task]);
  return [...batches.values()].filter((batch) => batch.length >= 2).flatMap((batch) => batch.map((task) => task.id));
}
