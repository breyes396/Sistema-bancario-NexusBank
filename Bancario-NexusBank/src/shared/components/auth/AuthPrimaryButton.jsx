export const AuthPrimaryButton = ({ type = 'button', loading = false, loadingText, children, disabled = false }) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className="auth-button auth-button-primary"
      style={{ opacity: isDisabled ? 0.6 : 1 }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.target.style.backgroundColor = '#1F3D70';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.target.style.backgroundColor = '#2D5899';
        }
      }}
      disabled={isDisabled}
    >
      {loading ? loadingText : children}
    </button>
  );
};
