export const AuthInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  register,
  rules,
  error,
  autoComplete,
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800 mb-1.5">
        {label}
      </label>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...register(id, rules)}
      />

      {error && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
};
