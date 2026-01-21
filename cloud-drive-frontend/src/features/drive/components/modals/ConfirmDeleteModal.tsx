import React, { useState } from 'react';
import { Modal } from '../../../../shared/ui/Modal';
import { Button } from '../../../../shared/ui/Button';

export function ConfirmDeleteModal({
  open,
  onClose,
  name,
  onDelete
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  onDelete: (cascade: boolean) => Promise<void>;
}) {
  const [cascade, setCascade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      await onDelete(cascade);
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Delete" open={open} onClose={onClose}>
      <div className="space-y-3">
        <div className="text-sm text-zinc-700">
          Delete <span className="font-semibold">{name}</span>?
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={cascade} onChange={(e) => setCascade(e.target.checked)} />
          Cascade delete (folders)
        </label>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={submit} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
