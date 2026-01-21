import React from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';

export function Toolbar({ onNewFolder, onUpload }: { onNewFolder: () => void; onUpload: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={onNewFolder}>
        <Plus className="w-4 h-4 mr-2" />
        New folder
      </Button>
      <Button variant="primary" onClick={onUpload}>
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>
    </div>
  );
}
