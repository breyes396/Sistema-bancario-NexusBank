export const AuthCard = ({ title, subtitle, children }) => {
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <p className="auth-meta">BANCA EN LÍNEA</p>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
      </div>

      {children}
    </div>
  );
};
