import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';


interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

type ToastVariant = 'success' | 'danger' | 'warning' | 'info' | 'error';

const toastVariants: Record<ToastVariant, { bg: string; icon: JSX.Element }> = {
  success: { bg: 'bg-success text-white', icon: <FaCheckCircle /> },
  danger: { bg: 'bg-danger text-white', icon: <FaTimesCircle /> },
  error: { bg: 'bg-danger text-white', icon: <FaTimesCircle /> },
  warning: { bg: 'bg-warning text-dark', icon: <FaExclamationCircle /> },
  info: { bg: 'bg-info text-white', icon: <FaInfoCircle /> },
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    setToasts((prevToasts) => [
      ...prevToasts,
      { id: Date.now(), message, variant },
    ]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            className={`d-flex align-items-center ${toastVariants[toast.variant].bg}`}
            delay={3000}
            autohide
          >
            <Toast.Header closeButton={false}>
              <div className="me-2">{toastVariants[toast.variant].icon}</div>
              <strong className="me-auto">{toast.variant.charAt(0).toUpperCase() + toast.variant.slice(1)}</strong>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => removeToast(toast.id)} />
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};