import { createTemplateTasks, TASK_TEMPLATES } from '@/domain/templates';

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
