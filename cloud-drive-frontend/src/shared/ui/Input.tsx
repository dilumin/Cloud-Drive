import React from 'react';
import clsx from 'clsx';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: Props) {
  return (
    <label className="block">
      {label && <div className="text-sm font-medium text-zinc-700 mb-1">{label}</div>}
      <input
        className={clsx(
          'w-full h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          error && 'border-red-300 focus:ring-red-500/20 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </label>
  );
}
