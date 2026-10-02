import { t as translateActive, type MessageKey, type Translator } from '@/i18n';
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
  const wedding = new Date(`${dateString}T12:00:00`);
  wedding.setMonth(wedding.getMonth() - months);
  return wedding.toISOString().slice(0, 10);
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
