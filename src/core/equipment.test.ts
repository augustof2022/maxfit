import { describe, expect, it } from 'vitest';
import { CATEGORIES, EQUIPMENT, EQUIPMENT_BY_ID, PRESETS, equipmentName, libraryOf } from './equipment';
import { EXERCISES } from './exercises';

describe('equipment library', () => {
  it('every exercise only needs built-in equipment', () => {
    for (const e of EXERCISES) for (const id of e.equipment) expect(EQUIPMENT_BY_ID[id], `${e.id} needs ${id}`).toBeDefined();
  });
  it('ids are unique and every item has a known category', () => {
    expect(new Set(EQUIPMENT.map((e) => e.id)).size).toBe(EQUIPMENT.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const e of EQUIPMENT) expect(cats.has(e.category)).toBe(true);
  });
  it('presets only use real items', () => {
    for (const p of PRESETS) for (const id of p.equipment) expect(EQUIPMENT_BY_ID[id]).toBeDefined();
  });
  it('library = built-ins + the user’s own items, deleted ones hidden', () => {
    const custom = [
      { id: 'custom-1', name: 'Hip abductor', category: 'machines' as const },
      { id: 'custom-2', name: 'Old thing', category: 'basics' as const, deleted: true },
    ];
    const lib = libraryOf(custom);
    expect(lib.length).toBe(EQUIPMENT.length + 1);
    expect(lib.find((e) => e.id === 'custom-1')?.custom).toBe(true);
    expect(equipmentName('custom-1', custom)).toBe('Hip abductor');
    expect(equipmentName('dumbbell')).toBe('Dumbbells');
  });
});
