import React, { useEffect, useState } from 'react';
import { Modal } from '../../../../shared/ui/Modal';
import { Input } from '../../../../shared/ui/Input';
import { Button } from '../../../../shared/ui/Button';

export function RenameModal({
  open,
  onClose,
  initialName,
  onRename
}: {
  open: boolean;
  onClose: () => void;
  initialName: string;
  onRename: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setName(initialName), [initialName]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      await onRename(name.trim());
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to rename');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Rename" open={open} onClose={onClose}>
      <div className="space-y-3">
        <Input label="New name" value={name} onChange={(e) => setName(e.target.value)} />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !name.trim()}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
