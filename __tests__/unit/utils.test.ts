import { cn, isValidUUID } from '@/shared/lib/utils';

describe('utils.ts', () => {
  describe('cn()', () => {
    it('merges conditional classes and removes duplicates', () => {
      const condition = false;
      const result = cn('p-4', 'text-center', condition && 'hidden', 'p-4');
      // Tailwind-merge should dedupe the duplicated padding class
      expect(result.split(' ')).toEqual(expect.arrayContaining(['p-4', 'text-center']));
      expect(result.split(' ')).not.toEqual(expect.arrayContaining(['hidden']));
      // ensure only one instance of p-4
      expect(result.match(/p-4/g)?.length).toBe(1);
    });
  });

  describe('isValidUUID()', () => {
    it('returns true for valid v4 uuid', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('returns false for invalid uuid', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });
  });
}); 