'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from './Icons';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, checked, ...props }, ref) => {
    const checkboxId = id || React.useId();

    return (
      <label htmlFor={checkboxId} className="flex items-center gap-2.5 cursor-pointer select-none group">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-md border border-slate-300 bg-white transition-all duration-150',
              'group-hover:border-slate-400',
              'peer-checked:bg-brand-600 peer-checked:border-brand-600',
              'peer-focus:ring-2 peer-focus:ring-brand-500/30',
              className
            )}
          />
          <CheckIcon className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        {label && <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
