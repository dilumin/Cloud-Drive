import React from 'react';
import clsx from 'clsx';

type Props = { message: string; type?: 'info' | 'error' | 'success' };

export function Toast({ message, type = 'info' }: Props) {
  const styles = {
    info: 'bg-zinc-900 text-white',
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white'
  }[type];

  return <div className={clsx('rounded-xl px-4 py-3 text-sm shadow-soft', styles)}>{message}</div>;
}
