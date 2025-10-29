import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'ghost-primary';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size !== 'md' ? `btn-${size}` : '';
  const fullWidthClasses = fullWidth ? 'w-full' : '';
  const disabledClasses = (disabled || loading) ? 'disabled:opacity-50 disabled:cursor-not-allowed' : '';

  const classes = [
    baseClasses,
    variantClasses,
    sizeClasses,
    fullWidthClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  const iconElement = loading ? (
    <Loader2 size={16} className="animate-spin" />
  ) : icon;

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {iconElement && iconPosition === 'left' && iconElement}
      {children && <span>{children}</span>}
      {iconElement && iconPosition === 'right' && iconElement}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;