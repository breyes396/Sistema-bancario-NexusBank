import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { axiosAdmin } from '../../api/api.js';
import { showError, showSuccess } from '../../utils/toast.js';

const AdminAddUserModal = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
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
      tipoCuenta: 'MONETARIA'
    }
  });

  const passwordValue = watch('contrasena');

  const onSubmit = async (data) => {
    if (data.contrasena !== data.confirmarContrasena) {
      showError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        fullName: data.nombre,
        username: data.username,
        documentNumber: data.dpi,
        documentType: 'DPI',
        address: data.direccion,
        phoneNumber: data.celular,
        email: data.correo,
        password: data.contrasena,
        jobName: data.trabajo,
        income: parseFloat(data.ingresos),
        accountType: data.tipoCuenta
      };

      await axiosAdmin.post('/admin/register', userData);
      
      showSuccess('Usuario registrado exitosamente. Cuenta activa.');
      reset();
      onSuccess();
      onClose();
      
    } catch (error) {
      showError(error.response?.data?.msg || error.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative max-h-screen overflow-y-auto mt-10 mb-10">
        <div className="sticky top-0 bg-white z-10 px-8 py-5 border-b border-gray-100 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-[#1A2E52]">Agregar Nuevo Usuario</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition"
          >
            ✕
          </button>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Nombre y Username */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">Nombre Completo *</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="Ej. Juan Pérez"
                  {...register('nombre', { required: 'Requerido', minLength: { value: 3, message: 'Min 3 caracteres' }})}
                />
                {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">Nombre de Usuario *</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="juanperez123"
                  {...register('username', { required: 'Requerido', minLength: { value: 4, message: 'Min 4 caracteres' }})}
                />
                {errors.username && <span className="text-red-500 text-xs">{errors.username.message}</span>}
              </div>

              {/* DPI y Dirección */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">DPI *</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="13 dígitos"
                  {...register('dpi', { required: 'Requerido', pattern: { value: /^\d{13}$/, message: '13 dígitos numéricos' }})}
                />
                {errors.dpi && <span className="text-red-500 text-xs">{errors.dpi.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">Dirección *</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="Ciudad, Zona..."
                  {...register('direccion', { required: 'Requerido' })}
                />
                {errors.direccion && <span className="text-red-500 text-xs">{errors.direccion.message}</span>}
              </div>

              {/* Correo y Celular */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">Correo Electrónico *</label>
                <input
                  type="email"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="correo@ejemplo.com"
                  {...register('correo', { required: 'Requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' }})}
                />
                {errors.correo && <span className="text-red-500 text-xs">{errors.correo.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">Celular *</label>
                <input
                  type="tel"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="12345678"
                  {...register('celular', { required: 'Requerido' })}
                />
                {errors.celular && <span className="text-red-500 text-xs">{errors.celular.message}</span>}
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-2 relative">
                <label className="font-semibold text-sm text-[#1A2E52]">Contraseña Temporal *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78] w-full"
                  placeholder="Mínimo 8 caracteres"
                  {...register('contrasena', { required: 'Requerido', minLength: { value: 8, message: 'Min 8 caracteres' }})}
                />
                <button type="button" className="absolute right-3 top-10" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
                {errors.contrasena && <span className="text-red-500 text-xs">{errors.contrasena.message}</span>}
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="font-semibold text-sm text-[#1A2E52]">Confirmar Contraseña *</label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78] w-full"
                  placeholder="Confirma la contraseña"
                  {...register('confirmarContrasena', { required: 'Requerido' })}
                />
                <button type="button" className="absolute right-3 top-10" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
                {errors.confirmarContrasena && <span className="text-red-500 text-xs">{errors.confirmarContrasena.message}</span>}
              </div>

              {/* Trabajo e Ingresos */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">Trabajo / Ocupación *</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="Ej. Ingeniero"
                  {...register('trabajo', { required: 'Requerido' })}
                />
                {errors.trabajo && <span className="text-red-500 text-xs">{errors.trabajo.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#1A2E52]">Ingresos (Q) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  placeholder="Ej. 5000"
                  {...register('ingresos', { required: 'Requerido', min: 100 })}
                />
                {errors.ingresos && <span className="text-red-500 text-xs">{errors.ingresos.message}</span>}
              </div>

              {/* Tipo de Cuenta - IMPORTANT */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-bold text-sm text-[#163c78] bg-[#f1f5f9] p-2 rounded inline-block w-fit">Tipo de Cuenta Inicial *</label>
                <select
                  className="p-3 border-2 border-[#163c78] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78] font-semibold text-[#1A2E52]"
                  {...register('tipoCuenta', { required: 'Requerido' })}
                >
                  <option value="AHORRO">Cuenta de Ahorro</option>
                  <option value="MONETARIA">Cuenta Monetaria</option>
                  <option value="AHORRO_PROGRAMADO">Ahorro Programado</option>
                  <option value="INFANTIL">Cuenta Infantil</option>
                </select>
                {errors.tipoCuenta && <span className="text-red-500 text-xs">{errors.tipoCuenta.message}</span>}
              </div>

            </div>

            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-[#163c78] text-white rounded-lg font-bold hover:bg-[#112a53] transition shadow-lg flex items-center justify-center min-w-[200px]"
              >
                {isLoading ? 'Registrando...' : '✓ Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAddUserModal;
