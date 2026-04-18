import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const base =
  'w-full bg-white border border-ink-200 rounded-xl px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-drop-500 focus:ring-0 transition min-h-[44px] disabled:bg-ink-100 disabled:text-ink-500 disabled:cursor-not-allowed';

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
        <span className="text-sm font-medium text-ink-900">{label}</span>
        {optional && <span className="text-xs text-ink-500">optional</span>}
      </div>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </label>
  );
}
