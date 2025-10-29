import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  icon,
  iconPosition = 'left',
  className = '',
  required = false,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputClasses = [
    'form-input',
    error ? 'error' : '',
    icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label 
          htmlFor={inputId} 
          className={`form-label ${required ? 'required' : ''}`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
      </div>
      
      {error && (
        <div className="form-error">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div className="form-help">
          {helpText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;