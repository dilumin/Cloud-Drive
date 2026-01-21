import React from 'react';
import { Download, Pencil, MoveRight, Trash2 } from 'lucide-react';
import type { NodeItem } from '../drive-api';
import { FileIcon } from './FileIcon';

export function ItemTable({
  items,
  onOpenFolder,
  onDownload,
  onRename,
  onMove,
  onDelete
}: {
  items: NodeItem[];
  onOpenFolder: (item: NodeItem) => void;
  onDownload: (item: NodeItem) => void;
  onRename: (item: NodeItem) => void;
  onMove: (item: NodeItem) => void;
  onDelete: (item: NodeItem) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-soft overflow-hidden">
      <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold text-zinc-500 border-b border-zinc-100">
        <div className="col-span-7">Name</div>
        <div className="col-span-3">Type</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-600">This folder is empty.</div>
      ) : (
        <ul>
          {items.map((it) => (
            <li key={it.id} className="grid grid-cols-12 px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50">
              <button
                className="col-span-7 flex items-center gap-3 text-left"
                onClick={() => it.type === 'FOLDER' && onOpenFolder(it)}
                title={it.type === 'FOLDER' ? 'Open folder' : it.name}
              >
                <FileIcon type={it.type} />
                <div className="truncate">
                  <div className="text-sm font-medium text-zinc-900 truncate">{it.name}</div>
                  {it.type === 'FILE' && it.latest?.sizeBytes && (
                    <div className="text-xs text-zinc-500">{Number(it.latest.sizeBytes).toLocaleString()} bytes</div>
                  )}
                </div>
              </button>

              <div className="col-span-3 flex items-center text-sm text-zinc-600">
                {it.type === 'FOLDER' ? 'Folder' : 'File'}
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                {it.type === 'FILE' && (
                  <button className="p-2 rounded-lg hover:bg-zinc-100" onClick={() => onDownload(it)} title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 rounded-lg hover:bg-zinc-100" onClick={() => onRename(it)} title="Rename">
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-zinc-100" onClick={() => onMove(it)} title="Move">
                  <MoveRight className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-zinc-100" onClick={() => onDelete(it)} title="Delete">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
