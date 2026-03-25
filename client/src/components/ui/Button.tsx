import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gradient';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'default', size = 'default', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
        {
          'bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md': variant === 'default',
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 border border-gray-200': variant === 'secondary',
          'border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-primary/50 hover:text-primary': variant === 'outline',
          'hover:bg-primary/10 hover:text-primary text-gray-600': variant === 'ghost',
          'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:from-red-600 hover:to-pink-600': variant === 'destructive',
          'gradient-btn text-white shadow-lg hover:shadow-xl': variant === 'gradient',
        },
        {
          'h-11 px-6 py-2.5 text-sm': size === 'default',
          'h-9 rounded-lg px-4 text-xs': size === 'sm',
          'h-12 rounded-xl px-8 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
