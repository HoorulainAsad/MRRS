const variants = {
  primary: 'bg-sage-800 text-white shadow-sm hover:bg-sage-900 disabled:bg-sage-200 disabled:text-sage-700',
  secondary: 'border border-line bg-white text-ink-900 shadow-sm hover:border-sage-400 hover:bg-sage-50 disabled:bg-sage-50 disabled:text-ink-500',
  ghost: 'text-ink-600 hover:bg-sage-100 hover:text-sage-900 disabled:text-ink-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const sizes = {
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-11 px-4 py-2.5 text-sm',
  lg: 'min-h-12 px-5 py-3 text-base',
  icon: 'h-11 w-11 p-0',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
