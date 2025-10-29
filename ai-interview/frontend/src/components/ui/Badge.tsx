import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'badge';
  const variantClasses = `badge-${variant}`;
  const sizeClasses = size === 'sm' ? 'px-1 py-0.5 text-xs' : '';
  
  const classes = [
    baseClasses,
    variantClasses,
    sizeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    const lowerStatus = status.toLowerCase();
    
    switch (lowerStatus) {
      case 'active':
      case 'published':
      case 'approved':
      case 'completed':
      case 'success':
        return 'success';
      
      case 'pending':
      case 'draft':
      case 'processing':
        return 'warning';
      
      case 'inactive':
      case 'disabled':
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return 'error';
      
      case 'sent':
      case 'delivered':
      case 'in-progress':
        return 'info';
      
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {status}
    </Badge>
  );
};

export { Badge, StatusBadge };
export default Badge;