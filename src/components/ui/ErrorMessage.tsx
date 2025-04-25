import React from "react";

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div style={{
      background: '#ffe0e0',
      color: '#a94442',
      border: '1px solid #f5c6cb',
      borderRadius: '5px',
      padding: '12px 20px',
      margin: '16px 0',
      position: 'relative',
      fontSize: '1rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          aria-label="Close error message"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#a94442',
            fontSize: '1.2rem',
            cursor: 'pointer',
            marginLeft: '16px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
