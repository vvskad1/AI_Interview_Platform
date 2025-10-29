import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  closeOnOverlayClick?: boolean;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl'
};

const Modal: React.FC<ModalProps> & {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<ModalBodyProps>;
  Footer: React.FC<ModalFooterProps>;
} = ({ 
  isOpen, 
  onClose, 
  children, 
  size = 'md',
  closeOnOverlayClick = true 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleOverlayClick}>
      <div className={`modal-content ${sizeClasses[size]} w-full`}>
        {children}
      </div>
    </div>
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({ 
  children, 
  onClose, 
  className = '' 
}) => {
  return (
    <div className={`modal-header ${className}`}>
      <div className="modal-title">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  );
};

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  );
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) => {
  const iconMap = {
    danger: <AlertCircle className="text-error" size={24} />,
    warning: <AlertTriangle className="text-warning" size={24} />,
    info: <Info className="text-info" size={24} />,
    success: <CheckCircle className="text-success" size={24} />
  };

  const buttonVariantMap = {
    danger: 'error',
    warning: 'warning',
    info: 'primary',
    success: 'success'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Header onClose={onClose}>
        {title}
      </Modal.Header>
      <Modal.Body>
        <div className="flex items-start gap-4">
          {iconMap[type]}
          <div className="flex-1">
            <p className="text-gray-700">{message}</p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="btn btn-secondary"
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`btn btn-${buttonVariantMap[type]}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            confirmText
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal, ConfirmModal };
export default Modal;