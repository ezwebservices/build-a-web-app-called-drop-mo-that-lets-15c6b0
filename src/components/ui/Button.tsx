import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-drop-400 to-drop-600 text-white hover:brightness-110 shadow-lg shadow-drop-900/40',
  secondary: 'bg-ink-700 text-white hover:bg-ink-600',
  ghost: 'bg-transparent text-ink-200 hover:bg-ink-700',
  outline: 'border border-ink-500 text-white hover:bg-ink-700',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm rounded-full min-h-[44px]',
  md: 'px-5 py-2.5 text-sm rounded-full min-h-[44px]',
  lg: 'px-7 py-3.5 text-base rounded-full min-h-[52px]',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'primary', size = 'md', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    />
  );
});
