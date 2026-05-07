import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { axiosAuth } from '../../../shared/api/api.js';
import '../../../styles/registerForm.css';

export default function VerificationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [manualToken, setManualToken] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    
    const tokenToUse = token || manualToken;
    
    if (!tokenToUse.trim()) {
      toast.error('Por favor ingresa el token de verificación');
      return;
    }

    setIsLoading(true);
    try {
      await axiosAuth.post('/auth/verify-email', { token: tokenToUse });
      
      toast.success('¡Email verificado correctamente!', { duration: 3000 });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const msg = error.response?.data?.msg
        || error.response?.data?.message
        || error.message
        || 'Error al verificar el email';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-frame">
        <div className="auth-split">
          {/* Left Side */}
          <div className="auth-left">
            <div className="auth-left-logo">
              <img src="/src/assets/img/Logo.jpg" alt="NexusBank" style={{ width: '96px' }} />
            </div>
            <div>
              <div className="auth-brand">NexusBank</div>
              <div className="auth-tagline">Verificar Email</div>
              <div className="auth-hero">
                ¡Casi listo!
              </div>
              <p className="auth-copy">
                Te hemos enviado un código de verificación a tu email. Ingresa el código para completar tu registro.
              </p>
              <ul className="auth-bullets">
                <li>Token válido por 24 horas</li>
                <li>Seguridad garantizada</li>
                <li>Proceso rápido y fácil</li>
              </ul>
            </div>
            <div className="auth-foot">
              © 2024 NexusBank
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-right">
            <div className="auth-card">
              <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#1a2e52' }}>Verifica tu Email</h2>
              <p style={{ color: 'rgba(26, 46, 82, 0.7)', marginBottom: '24px', fontSize: '14px' }}>
                Ingresa el token que recibiste
              </p>

              <form onSubmit={handleVerify}>
                <div className="form-group">
                  <label className="form-label">Token de Verificación</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={token ? 'Token pre-llenado' : 'Pega el token aquí'}
                    value={token || manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    disabled={isLoading || !!token}
                  />
                </div>

                <button 
                  type="submit" 
                  className="auth-button-primary"
                  disabled={isLoading}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  {isLoading ? 'Verificando...' : 'Verificar Email'}
                </button>
              </form>

              <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #edf2fa', paddingTop: '16px' }}>
                <p style={{ fontSize: '14px', color: 'rgba(26, 46, 82, 0.7)', margin: '8px 0' }}>
                  ¿Ya verificaste tu email? <a href="/login" style={{ color: '#C8A84B', textDecoration: 'none', fontWeight: '700' }}>Inicia sesión</a>
                </p>
                <p style={{ fontSize: '14px', color: 'rgba(26, 46, 82, 0.7)', margin: '8px 0' }}>
                  <a href="/register" style={{ color: '#C8A84B', textDecoration: 'none', fontWeight: '700' }}>Volver al registro</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
