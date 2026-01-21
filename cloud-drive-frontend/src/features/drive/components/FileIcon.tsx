import React from 'react';
import { FileText, Folder } from 'lucide-react';
import type { NodeType } from '../drive-api';

export function FileIcon({ type }: { type: NodeType }) {
  if (type === 'FOLDER') return <Folder className="w-4 h-4 text-blue-600" />;
  return <FileText className="w-4 h-4 text-zinc-600" />;
}
