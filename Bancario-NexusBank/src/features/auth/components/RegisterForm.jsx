import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { axiosAuth } from '../../../shared/api/api.js';
import { AuthContainer, AuthCard } from '../../../shared/components/auth/index.js';
import '../../../styles/registerForm.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    reset
  } = useForm({
    defaultValues: {
      nombre: '',
      username: '',
      dpi: '',
      direccion: '',
      celular: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      trabajo: '',
      ingresos: '',
      tipoCuenta: 'ahorro',
      terms: false
    }
  });

  const passwordValue = watch('contrasena');

  const onSubmit = async (data) => {
    if (data.contrasena !== data.confirmarContrasena) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: data.nombre,
        username: data.username,
        documentNumber: data.dpi,
        documentType: 'DPI',
        address: data.direccion,
        phoneNumber: data.celular.replace(/\D/g, '').slice(-8), // strip non-numeric, take last 8 digits
        email: data.correo,
        password: data.contrasena,
        jobName: data.trabajo,
        income: parseFloat(data.ingresos),
        accountType: data.tipoCuenta
      };

      await axiosAuth.post('/auth/register', payload);

      toast.success('¡Solicitud enviada! Espera a que un administrador apruebe tu cuenta.', { duration: 4000 });
      reset();
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      const msg = error.response?.data?.msg
        || error.response?.data?.message
        || error.response?.data?.errors?.[0]?.msg
        || 'Error al enviar la solicitud';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-step form state
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = async () => {
    // define required fields per step
    const stepFields = {
      1: ['nombre', 'username', 'dpi', 'direccion'],
      2: ['celular', 'correo'],
      3: ['contrasena', 'confirmarContrasena'],
      4: ['trabajo', 'ingresos', 'tipoCuenta', 'terms']
    };

    const fields = stepFields[step] || [];
    const valid = await trigger(fields);
    if (!valid) {
      toast.error('Debe llenar todos los campos.');
      return;
    }

    if (step < totalSteps) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <AuthContainer mode="register">
      <AuthCard title="Únete a NexusBank" subtitle="Completa el formulario para crear tu cuenta">

        <div className="register-form-wrapper">
          <span className="register-badge">CREAR CUENTA</span>

          <form onSubmit={handleSubmit(onSubmit)} className={isLoading ? 'form-loading' : ''}>
            {/* Step panels */}
            {step === 1 && (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.nombre ? 'error' : ''}`}
                      placeholder="Juan Pérez García"
                      {...register('nombre', {
                        required: 'El nombre es requerido',
                        minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                      })}
                    />
                    {errors.nombre && <span className="form-error">{errors.nombre.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nombre de Usuario *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.username ? 'error' : ''}`}
                      placeholder="juanperez123"
                      {...register('username', {
                        required: 'El usuario es requerido',
                        minLength: { value: 4, message: 'Mínimo 4 caracteres' }
                      })}
                    />
                    {errors.username && <span className="form-error">{errors.username.message}</span>}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">DPI/Cédula *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.dpi ? 'error' : ''}`}
                      placeholder="1234567890123"
                      {...register('dpi', {
                        required: 'El DPI es requerido',
                        pattern: { value: /^\d{13}$/, message: 'DPI debe tener 13 dígitos' }
                      })}
                    />
                    {errors.dpi && <span className="form-error">{errors.dpi.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dirección *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.direccion ? 'error' : ''}`}
                      placeholder="Calle 5, Avenida Principal..."
                      {...register('direccion', {
                        required: 'La dirección es requerida',
                        minLength: { value: 10, message: 'Mínimo 10 caracteres' }
                      })}
                    />
                    {errors.direccion && <span className="form-error">{errors.direccion.message}</span>}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Celular *</label>
                  <input
                    type="tel"
                    className={`form-input ${errors.celular ? 'error' : ''}`}
                    placeholder="77778888"
                    {...register('celular', {
                      required: 'El celular es requerido',
                      pattern: { value: /^\+?[\d\s\-()]{8,15}$/, message: 'Formato de teléfono inválido' }
                    })}
                  />
                  {errors.celular && <span className="form-error">{errors.celular.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico *</label>
                  <input
                    type="email"
                    className={`form-input ${errors.correo ? 'error' : ''}`}
                    placeholder="juan@example.com"
                    {...register('correo', {
                      required: 'El correo es requerido',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' }
                    })}
                  />
                  {errors.correo && <span className="form-error">{errors.correo.message}</span>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-grid">
                <div className="form-group password-group">
                  <label className="form-label">Contraseña *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.contrasena ? 'error' : ''}`}
                    placeholder="••••••••"
                    {...register('contrasena', {
                      required: 'La contraseña es requerida',
                      minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                      validate: {
                        hasUpper: v => /[A-Z]/.test(v) || 'Debe tener al menos una mayúscula',
                        hasLower: v => /[a-z]/.test(v) || 'Debe tener al menos una minúscula',
                        hasNumber: v => /[0-9]/.test(v) || 'Debe tener al menos un número',
                        hasSymbol: v => /[@$!%*?&#]/.test(v) || 'Debe tener al menos un símbolo (@$!%*?&#)'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEye className="w-5 h-5 text-gray-500" /> : <FaEyeSlash className="w-5 h-5 text-gray-500" />}
                  </button>
                  {errors.contrasena && <span className="form-error">{errors.contrasena.message}</span>}
                </div>

                <div className="form-group password-group">
                  <label className="form-label">Confirmar Contraseña *</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input ${errors.confirmarContrasena ? 'error' : ''}`}
                    placeholder="••••••••"
                    {...register('confirmarContrasena', {
                      required: 'Debe confirmar la contraseña',
                      validate: (value) => value === passwordValue || 'Las contraseñas no coinciden'
                    })}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEye className="w-5 h-5 text-gray-500" /> : <FaEyeSlash className="w-5 h-5 text-gray-500" />}
                  </button>
                  {errors.confirmarContrasena && <span className="form-error">{errors.confirmarContrasena.message}</span>}
                </div>
              </div>
            )}

            {step === 4 && (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Ocupación/Trabajo *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.trabajo ? 'error' : ''}`}
                      placeholder="Ingeniería / Comercio..."
                      {...register('trabajo', {
                        required: 'La ocupación es requerida',
                        minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                      })}
                    />
                    {errors.trabajo && <span className="form-error">{errors.trabajo.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ingresos Mensuales (Q) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-input ${errors.ingresos ? 'error' : ''}`}
                      placeholder="5000.00"
                      {...register('ingresos', {
                        required: 'Los ingresos son requeridos',
                        min: { value: 0, message: 'Ingrese un valor válido' }
                      })}
                    />
                    {errors.ingresos && <span className="form-error">{errors.ingresos.message}</span>}
                  </div>
                </div>

                <div className="form-grid full">
                  <div className="form-group">
                    <label className="form-label">Tipo de Cuenta *</label>
                    <select
                      className={`form-select ${errors.tipoCuenta ? 'error' : ''}`}
                      {...register('tipoCuenta', {
                        required: 'Selecciona un tipo de cuenta'
                      })}
                    >
                      <option value="ahorro">Cuenta de Ahorros</option>
                      <option value="corriente">Cuenta Corriente</option>
                    </select>
                    {errors.tipoCuenta && <span className="form-error">{errors.tipoCuenta.message}</span>}
                  </div>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="terms"
                    className="checkbox-input"
                    {...register('terms', { required: 'Debes aceptar los términos' })}
                  />
                  <label htmlFor="terms" className="checkbox-label">
                    Acepto los términos y condiciones de NexusBank
                  </label>
                  {errors.terms && <span className="form-error">{errors.terms.message}</span>}
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              {step > 1 ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  Atrás
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/login')}
                >
                  ¿Ya tienes cuenta? Inicia Sesión
                </button>
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={nextStep}
                  disabled={isLoading}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Enviando...
                    </>
                  ) : (
                    'Solicitar cuenta'
                  )}
                </button>
              )}
            </div>
          </form>

        </div>
      </AuthCard>
    </AuthContainer>
  );
}
