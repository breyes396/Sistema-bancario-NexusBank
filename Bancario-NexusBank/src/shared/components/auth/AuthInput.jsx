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
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          borderColor: error ? '#d63a3a' : '#cad7eb',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2D5899';
          e.target.style.boxShadow = '0 0 0 2px rgba(45, 88, 153, 0.12)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#d63a3a' : '#cad7eb';
          e.target.style.boxShadow = 'none';
        }}
        {...register(id, rules)}
      />

      {error && <p className="auth-error">{error.message}</p>}
    </div>
  );
};
