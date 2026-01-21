import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRoot } from '../drive-api';
import { useNavigate } from 'react-router-dom';

export function RootRedirect() {
  const nav = useNavigate();
  const q = useQuery({ queryKey: ['root'], queryFn: getRoot });

  useEffect(() => {
    if (q.data?.id) {
      nav(`/drive/folders/${q.data.id}`, { replace: true });
    }
  }, [q.data?.id, nav]);

  return <div className="text-sm text-zinc-600">{q.isLoading ? 'Loading root…' : q.isError ? 'Failed to load root' : 'Redirecting…'}</div>;
}
