export type Space = 'yokohama' | 'ofuna';

export const SPACES: Record<Space, { name: string; shortName: string }> = {
  yokohama: { name: '横浜中華街店', shortName: '横浜' },
  ofuna: { name: '大船店', shortName: '大船' },
};

export const SPACE_KEYS = Object.keys(SPACES) as Space[];

export function isSpace(value: unknown): value is Space {
  return typeof value === 'string' && value in SPACES;
}
