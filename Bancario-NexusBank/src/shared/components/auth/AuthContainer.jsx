export const AuthContainer = ({ children }) => {
  return (
    <div className="auth-root">
      <div className="auth-frame">
        <div className="auth-split">
          <div className="auth-left">
            <div>
              <img className="auth-left-logo" src="/src/assets/img/Logo.jpg" alt="NexusBank" />
              <h2 className="auth-brand">NexusBank</h2>

              <h3 className="auth-hero">
                Tu banco,
                <br />
                a un solo <span>clic</span>
              </h3>

              <p className="auth-copy">
                Administra tus cuentas, realiza transferencias y controla tus inversiones desde un solo lugar.
              </p>

              <ul className="auth-bullets">
                <li>Transferencias en tiempo real</li>
                <li>Gestión de múltiples cuentas</li>
                <li>Reportes y estados de cuenta</li>
                <li>Autenticación de dos factores</li>
              </ul>
            </div>

            <p className="auth-foot">
              © 2026 NexusBank - Protegido por cifrado AES-256
            </p>
          </div>

          <div className="auth-right">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
