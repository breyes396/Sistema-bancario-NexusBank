import AnimatedLogo from './AnimatedLogo.jsx';

export const AuthContainer = ({ children, mode = 'auth' }) => {
  const splitClassName = mode === 'forgot' ? 'auth-split auth-split--forgot' : 'auth-split';
  const rightClassName = mode === 'forgot' ? 'auth-right auth-right--centered' : 'auth-right';

  const renderLeftContent = () => {
    if (mode === 'forgot') {
      return (
        <div>
          <AnimatedLogo />
          <h2 className="auth-brand">NexusBank</h2>

          <h3 className="auth-hero">
            Tu acceso,
            <br />
            a un solo <span>clic</span>
          </h3>

          <p className="auth-copy">
            Ingresa tu correo y te enviaremos un enlace seguro para recuperar tu contraseña y volver a entrar a tu cuenta.
          </p>

          <ul className="auth-bullets">
            <li>Enlace seguro y verificado</li>
            <li>Proceso rápido en pocos minutos</li>
            <li>Solo necesitas tu correo registrado</li>
            <li>Soporte si no recibes el mensaje</li>
          </ul>
        </div>
      );
    }

    if (mode === 'contact') {
      return (
        <div>
          <AnimatedLogo />
          <h2 className="auth-brand">NexusBank Soporte</h2>

          <h3 className="auth-hero">
            ¿Necesitas ayuda?
            <br />
            Estamos para <span>apoyarte</span>
          </h3>

          <p className="auth-copy">
            Cuéntanos lo sucedido y nuestro equipo de soporte te responderá lo antes posible. Adjunta detalles y pasos para reproducir el problema.
          </p>

          <ul className="auth-bullets">
            <li>Respuesta en 24-48 horas</li>
            <li>Soporte seguro y confidencial</li>
            <li>Seguimiento personalizado</li>
            <li>Escalamiento a equipo técnico</li>
          </ul>
        </div>
      );
    }

    if (mode === 'register') {
      return (
        <div>
          <AnimatedLogo />
          <h2 className="auth-brand">Bienvenido a <span>NexusBank</span></h2>

          <h3 className="auth-hero">
            Tu solución bancaria
            <br />
            digital <span>confiable</span>
          </h3>

          <p className="auth-copy">
            Crea tu cuenta y comienza a gestionar tus finanzas de forma segura. Nuestro proceso es rápido y confiable.
          </p>

          <ul className="auth-bullets">
            <li>Transacciones seguras y rápidas</li>
            <li>Gestión de múltiples cuentas</li>
            <li>Soporte 24/7</li>
            <li>Aplicación móvil disponible</li>
          </ul>
        </div>
      );
    }

    return (
      <div>
        <AnimatedLogo />
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
    );
  };

  return (
    <div className="auth-root">
      <div className="auth-frame">
        <div className={splitClassName}>
          <div className="auth-left">{renderLeftContent()}</div>

          <div className={rightClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
};
