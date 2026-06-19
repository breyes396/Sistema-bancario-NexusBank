export const AuthSwitchLink = ({ prefixText, actionText, onClick }) => {
  const hasPrefix = Boolean(prefixText);

  return (
    <p className="auth-switch">
      {hasPrefix ? `${prefixText} ` : ''}
      <button type="button" onClick={onClick}>
        {actionText}
      </button>
    </p>
  );
};
