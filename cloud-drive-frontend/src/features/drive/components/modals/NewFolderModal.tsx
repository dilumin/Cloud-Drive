import React, { useState } from 'react';
import { Modal } from '../../../../shared/ui/Modal';
import { Input } from '../../../../shared/ui/Input';
import { Button } from '../../../../shared/ui/Button';

export function NewFolderModal({
  open,
  onClose,
  onCreate
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      await onCreate(name.trim());
      setName('');
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="New folder" open={open} onClose={onClose}>
      <div className="space-y-3">
        <Input label="Folder name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Projects" />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !name.trim()}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
