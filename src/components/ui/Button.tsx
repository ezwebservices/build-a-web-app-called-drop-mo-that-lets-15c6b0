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
    'bg-gradient-to-r from-drop-500 to-drop-600 text-white hover:brightness-105 shadow-md shadow-drop-600/20',
  secondary: 'bg-ink-900 text-white hover:bg-ink-700',
  ghost: 'bg-transparent text-ink-700 hover:bg-drop-50',
  outline: 'border border-drop-200 text-drop-700 hover:bg-drop-50 bg-white',
  danger: 'bg-red-600 text-white hover:bg-red-700',
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
