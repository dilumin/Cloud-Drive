import React from 'react';
import clsx from 'clsx';

export type Crumb = { id: string; name: string; href?: string };

export function Breadcrumbs({
  crumbs,
  onCrumbClick
}: {
  crumbs: Crumb[];
  onCrumbClick: (c: Crumb) => void;
}) {
  return (
    <div className="flex items-center flex-wrap gap-2 text-sm">
      {crumbs.map((c, i) => (
        <button
          key={c.id}
          onClick={() => onCrumbClick(c)}
          className={clsx(
            'rounded-lg px-2 py-1 hover:bg-zinc-100',
            i === crumbs.length - 1 ? 'text-zinc-900 font-medium' : 'text-zinc-600'
          )}
        >
          {c.name}
          {i < crumbs.length - 1 && <span className="text-zinc-400 ml-2">/</span>}
        </button>
      ))}
    </div>
  );
}
