export const AuthSwitchLink = ({ prefixText, actionText, onClick }) => {
  const hasPrefix = Boolean(prefixText);

  return (
    <p className="text-center text-sm text-gray-600">
      {hasPrefix ? `${prefixText} ` : ''}
      <button type="button" onClick={onClick} className="text-blue-600 font-medium hover:opacity-80 hover:underline">
        {actionText}
      </button>
    </p>
  );
};
