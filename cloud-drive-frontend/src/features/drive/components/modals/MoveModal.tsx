import React, { useState } from 'react';
import { Modal } from '../../../../shared/ui/Modal';
import { Input } from '../../../../shared/ui/Input';
import { Button } from '../../../../shared/ui/Button';

export function MoveModal({
  open,
  onClose,
  onMove
}: {
  open: boolean;
  onClose: () => void;
  onMove: (parentId: string) => Promise<void>;
}) {
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      await onMove(parentId.trim());
      setParentId('');
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to move');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Move item" open={open} onClose={onClose}>
      <div className="space-y-3">
        <div className="text-sm text-zinc-600">
          Enter destination folder id. (Minimal UI; can be upgraded to a folder picker.)
        </div>
        <Input label="Destination folder id" value={parentId} onChange={(e) => setParentId(e.target.value)} placeholder="e.g., 1" />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !parentId.trim()}>
            {loading ? 'Moving…' : 'Move'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
