import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../drive-api';
import { Toolbar } from '../components/Toolbar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ItemTable } from '../components/ItemTable';
import { NewFolderModal } from '../components/modals/NewFolderModal';
import { RenameModal } from '../components/modals/RenameModal';
import { MoveModal } from '../components/modals/MoveModal';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { uploadFileMultipart, UploadProgress } from '../upload';
import { Toast } from '../../../shared/ui/Toast';

export function FolderPage() {
  const { id } = useParams();
  const folderId = id!;
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' | 'success' } | null>(null);

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<api.NodeItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<api.NodeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<api.NodeItem | null>(null);

  const [uploading, setUploading] = useState<UploadProgress | null>(null);

  const listing = useQuery({
    queryKey: ['folder', folderId],
    queryFn: () => api.listFolder(folderId, 100)
  });

  const items = listing.data?.items ?? [];
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, filter]);

  const createFolderMut = useMutation({
    mutationFn: async (name: string) => api.createFolder(folderId, name),
    onSuccess: async () => {
      setToast({ msg: 'Folder created', type: 'success' });
      await qc.invalidateQueries({ queryKey: ['folder', folderId] });
    }
  });

  const renameMut = useMutation({
    mutationFn: async ({ nodeId, name }: { nodeId: string; name: string }) => api.renameNode(nodeId, name),
    onSuccess: async () => {
      setToast({ msg: 'Renamed', type: 'success' });
      await qc.invalidateQueries({ queryKey: ['folder', folderId] });
    }
  });

  const moveMut = useMutation({
    mutationFn: async ({ nodeId, parentId }: { nodeId: string; parentId: string }) => api.moveNode(nodeId, parentId),
    onSuccess: async () => {
      setToast({ msg: 'Moved', type: 'success' });
      await qc.invalidateQueries({ queryKey: ['folder', folderId] });
    }
  });

  const deleteMut = useMutation({
    mutationFn: async ({ nodeId, cascade }: { nodeId: string; cascade: boolean }) => api.deleteNode(nodeId, cascade),
    onSuccess: async () => {
      setToast({ msg: 'Deleted', type: 'success' });
      await qc.invalidateQueries({ queryKey: ['folder', folderId] });
    }
  });

  async function onDownload(it: api.NodeItem) {
    try {
      const { url } = await api.downloadLatest(it.id);
      window.open(url, '_blank');
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.message || 'Download failed', type: 'error' });
    }
  }

  function onUploadClick() {
    fileInput.current?.click();
  }

  async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      setUploading({ stage: 'INIT', percent: 0, message: 'Starting…' });
      await uploadFileMultipart(f, folderId, (p) => setUploading(p));
      setToast({ msg: 'Upload complete', type: 'success' });
      await qc.invalidateQueries({ queryKey: ['folder', folderId] });
    } catch (err: any) {
      setToast({ msg: err?.message || 'Upload failed', type: 'error' });
    } finally {
      e.target.value = '';
      setTimeout(() => setUploading(null), 1000);
    }
  }

  const crumbs = [
    { id: 'root', name: 'My Drive' },
    { id: folderId, name: `Folder ${folderId}` }
  ];

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 cursor-pointer" onClick={() => setToast(null)}>
          <Toast message={toast.msg} type={toast.type} />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs
            crumbs={crumbs}
            onCrumbClick={(c) => {
              if (c.id === 'root') window.location.href = '/drive';
            }}
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-sm h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            placeholder="Filter by name"
          />
        </div>

        <div className="shrink-0">
          <Toolbar onNewFolder={() => setNewFolderOpen(true)} onUpload={onUploadClick} />
          <input ref={fileInput} type="file" className="hidden" onChange={onSelectFile} />
        </div>
      </div>

      {uploading && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-soft p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium">Uploading…</div>
            <div className="text-zinc-600">{uploading.percent}%</div>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-blue-600 h-2" style={{ width: `${uploading.percent}%` }} />
          </div>
          {uploading.message && <div className="text-xs text-zinc-500 mt-2">{uploading.message}</div>}
        </div>
      )}

      {listing.isLoading ? (
        <div className="text-sm text-zinc-600">Loading folder…</div>
      ) : listing.isError ? (
        <div className="text-sm text-red-600">Failed to load folder</div>
      ) : (
        <ItemTable
          items={filtered}
          onOpenFolder={(it) => (window.location.href = `/drive/folders/${it.id}`)}
          onDownload={onDownload}
          onRename={(it) => setRenameTarget(it)}
          onMove={(it) => setMoveTarget(it)}
          onDelete={(it) => setDeleteTarget(it)}
        />
      )}

      <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreate={(name) => createFolderMut.mutateAsync(name)} />

      <RenameModal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        initialName={renameTarget?.name || ''}
        onRename={(name) => renameMut.mutateAsync({ nodeId: renameTarget!.id, name })}
      />

      <MoveModal open={!!moveTarget} onClose={() => setMoveTarget(null)} onMove={(parentId) => moveMut.mutateAsync({ nodeId: moveTarget!.id, parentId })} />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        name={deleteTarget?.name || ''}
        onDelete={(cascade) => deleteMut.mutateAsync({ nodeId: deleteTarget!.id, cascade })}
      />
    </div>
  );
}
