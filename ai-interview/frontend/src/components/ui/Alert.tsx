import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  description?: string;
  children?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  description,
  children,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const iconMap = {
    success: <CheckCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const alertClasses = [
    'alert',
    `alert-${type}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={alertClasses}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {iconMap[type]}
        </div>
        
        <div className="flex-1 ml-3">
          {title && (
            <h4 className="alert-title">
              {title}
            </h4>
          )}
          
          {description && (
            <p className="alert-description">
              {description}
            </p>
          )}
          
          {children && (
            <div className={title || description ? 'mt-2' : ''}>
              {children}
            </div>
          )}
        </div>
        
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-4 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors"
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;