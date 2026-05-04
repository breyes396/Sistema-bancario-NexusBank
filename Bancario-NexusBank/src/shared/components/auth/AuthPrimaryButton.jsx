export const AuthPrimaryButton = ({ type = 'button', loading = false, loadingText, children, disabled = false }) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
      disabled={isDisabled}
    >
      {loading ? loadingText : children}
    </button>
  );
};
