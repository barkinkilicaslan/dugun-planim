import { TASK_SUGGESTIONS } from '@/domain/task-suggestions';

describe('wedding task suggestions', () => {
  it('offers a large bilingual catalogue with stable unique identifiers', () => {
    expect(TASK_SUGGESTIONS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(TASK_SUGGESTIONS.map((item) => item.id)).size).toBe(TASK_SUGGESTIONS.length);
    expect(TASK_SUGGESTIONS.every((item) => item.title && item.titleEn && item.description && item.descriptionEn)).toBe(
      true,
    );
  });
});
