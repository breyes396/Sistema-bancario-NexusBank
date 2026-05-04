export const AuthSecondaryButton = ({ type = 'button', children, onClick }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="auth-button auth-button-secondary"
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#F7F9FC';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#FFFFFF';
      }}
    >
      {children}
    </button>
  );
};
