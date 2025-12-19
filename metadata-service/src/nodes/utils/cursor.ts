export interface CursorPayload {
  createdAt: string; // ISO
  id: string;        // bigint string
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  let raw: any;
  try {
    raw = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid cursor');
  }

  if (!raw || typeof raw.createdAt !== 'string' || typeof raw.id !== 'string') {
    throw new Error('Invalid cursor');
  }
  return raw as CursorPayload;
}
