import { createTemplateTasks, findLegacyAutoTaskIds, TASK_TEMPLATES } from '@/domain/templates';

describe('starter task date calculation', () => {
  it.each([
    ['2027-07-31', 5, '2027-02-28'],
    ['2028-07-31', 5, '2028-02-29'],
    ['2027-03-31', 1, '2027-02-28'],
    ['2027-01-31', 1, '2026-12-31'],
    ['2027-08-31', 0, '2027-08-31'],
  ])('clamps month-end dates without overflowing the target month', (weddingDate, monthsBefore, expected) => {
    const index = TASK_TEMPLATES.findIndex((template) => template.monthsBeforeWedding === monthsBefore);
    const task = createTemplateTasks(weddingDate, () => 'task-id')[index];
    expect(task.dueDate).toBe(expected);
  });
});

describe('legacy starter task cleanup matching', () => {
  it('matches only intact overdue seeded tasks in a shared onboarding batch', () => {
    const seeded = createTemplateTasks(
      '2027-08-15',
      (() => {
        let i = 0;
        return () => `seed-${i++}`;
      })(),
    );
    expect(findLegacyAutoTaskIds(seeded, '2027-08-15', '2026-10-09')).toEqual(['seed-0', 'seed-1']);
  });

  it('preserves completed, edited, reminded, and individually matching personal tasks', () => {
    const seeded = createTemplateTasks(
      '2027-08-15',
      (() => {
        let i = 0;
        return () => `seed-${i++}`;
      })(),
    );
    const tasks = [
      { ...seeded[0], completed: true },
      { ...seeded[1], updatedAt: '2026-10-08T00:00:00.000Z' },
      { ...seeded[0], id: 'reminded', notificationId: 'n1' },
      { ...seeded[0], id: 'personal', createdAt: 'later' },
    ];
    expect(findLegacyAutoTaskIds(tasks, '2027-08-15', '2026-10-09')).toEqual([]);
  });
});
