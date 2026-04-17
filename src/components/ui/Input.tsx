import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const base =
  'w-full bg-ink-800 border border-ink-600 rounded-xl px-4 py-3 text-base text-white placeholder:text-ink-400 focus:border-drop-400 focus:ring-0 transition min-h-[44px]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={cn(base, className)} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} {...rest} className={cn(base, 'min-h-[120px]', className)} />;
});

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
};

export function Field({ label, hint, error, children, optional }: FieldProps): React.ReactElement {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-ink-100">{label}</span>
        {optional && <span className="text-xs text-ink-400">optional</span>}
      </div>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-drop-300">{error}</p>}
    </label>
  );
}
