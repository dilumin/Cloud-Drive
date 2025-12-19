import { decodeCursor, encodeCursor } from '../src/nodes/utils/cursor';

describe('cursor', () => {
  it('encodes and decodes', () => {
    const c = encodeCursor({ createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(), id: '123' });
    const d = decodeCursor(c);
    expect(d.createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(d.id).toBe('123');
  });

  it('rejects invalid cursor', () => {
    expect(() => decodeCursor('not-base64')).toThrow();
  });
});
