import toast from 'react-hot-toast';

const baseStyle = {
  borderRadius: '12px',
  fontWeight: 600,
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  padding: '14px 18px',
};

export const showSuccess = (message) =>
  toast.success(message, {
    style: {
      ...baseStyle,
      color: '#ffffff',
      background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },
  });

export const showError = (message) =>
  toast.error(message, {
    style: {
      ...baseStyle,
      color: '#ffffff',
      background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },
  });