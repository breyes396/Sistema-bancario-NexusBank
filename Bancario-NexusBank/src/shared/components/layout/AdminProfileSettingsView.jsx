import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout.jsx';
import AdminPageHeader from './AdminPageHeader.jsx';
import { adminProfileService } from '../../api/adminProfile.service.js';
import { axiosClient } from '../../api/api.js';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import { showError, showSuccess } from '../../utils/toast.js';
import '../../../styles/adminDashboard.css';

const roleLabelMap = {
	Admin: 'Administrador',
	Administrador: 'Administrador',
	Employee: 'Empleado',
	Empleado: 'Empleado',
	Client: 'Cliente',
	Cliente: 'Cliente',
};

const inputBaseStyle = {
	width: '100%',
	border: '1px solid rgba(255,255,255,0.12)',
	background: 'rgba(8, 26, 53, 0.55)',
	color: '#fff',
	borderRadius: 10,
	padding: '12px 14px',
	fontSize: 14,
	outline: 'none',
	transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
};

const readOnlyInputStyle = {
	...inputBaseStyle,
	opacity: 0.78,
	cursor: 'not-allowed',
};

const fieldLabelStyle = {
	fontSize: 13,
	fontWeight: 600,
	color: '#d7e6ff',
	marginBottom: 8,
};

const cardStyle = {
	background: 'linear-gradient(180deg, rgba(10, 28, 56, 0.96), rgba(14, 42, 84, 0.94))',
	border: '1px solid rgba(255,255,255,0.12)',
	borderRadius: 18,
	boxShadow: '0 18px 40px rgba(6, 14, 28, 0.26)',
	color: '#fff',
};

const accentButtonStyle = {
	background: 'linear-gradient(135deg, #C8A84B, #d7bb70)',
	color: '#132746',
	border: 'none',
	borderRadius: 12,
	padding: '12px 20px',
	fontWeight: 700,
	boxShadow: '0 10px 22px rgba(200, 168, 75, 0.28)',
};

const secondaryButtonStyle = {
	background: 'transparent',
	color: '#d7e6ff',
	border: '1px solid rgba(215, 230, 255, 0.35)',
	borderRadius: 12,
	padding: '12px 20px',
	fontWeight: 700,
};

export const AdminProfileSettingsView = () => {
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [profileData, setProfileData] = useState({ user: null, profile: null });
	const fileInputRef = useRef(null);

	const { register, handleSubmit, reset, formState: { errors } } = useForm({
		defaultValues: {
			fullName: '',
			username: '',
			phoneNumber: '',
			email: '',
			address: '',
			jobName: '',
			income: '',
		},
	});

	const profile = profileData.profile || {};
	const currentUser = profileData.user || {};

	const displayName = useMemo(() => {
		return profile.Name || currentUser.name || user?.name || user?.username || 'Usuario';
	}, [currentUser.name, profile.Name, user?.name, user?.username]);

	const displayUsername = useMemo(() => {
		return profile.Username || currentUser.username || user?.username || 'Usuario';
	}, [currentUser.username, profile.Username, user?.username]);

	const roleLabel = roleLabelMap[user?.role] || user?.role || 'Administrador';
	const isAdmin = user?.role === 'Admin' || user?.role === 'Administrador';

	useEffect(() => {
		let active = true;

		const loadProfile = async () => {
			try {
				setLoading(true);
				const response = await adminProfileService.getOwnProfile();
				if (!active) return;

				const nextUser = response.user || null;
				const nextProfile = response.profile || null;

				setProfileData({ user: nextUser, profile: nextProfile });
				reset({
					fullName: nextProfile?.Name || '',
					username: nextProfile?.Username || '',
					phoneNumber: nextProfile?.PhoneNumber || '',
					email: nextUser?.email || '',
					address: nextProfile?.Address || '',
					jobName: nextProfile?.JobName || '',
					income: nextProfile?.Income ?? '',
				});
			} catch (error) {
				showError(error.response?.data?.msg || error.response?.data?.message || 'No se pudo cargar el perfil');
			} finally {
				if (active) setLoading(false);
			}
		};

		loadProfile();

		return () => {
			active = false;
		};
	}, [reset]);

	const handlePhotoUpload = async (file) => {
		if (!file) return;

		try {
			setUploadingPhoto(true);
			const formData = new FormData();
			formData.append('photo', file);

			const response = await axiosClient.post('/auth/profile/photo', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});

			// add cache-busting query param so browser fetches the new file
			const returnedUrl = response.data.data.photoUrl || '';
			const cacheBusted = returnedUrl.includes('?') ? `${returnedUrl}&t=${Date.now()}` : `${returnedUrl}?t=${Date.now()}`;
			setProfileData(prev => ({
				...prev,
				profile: { ...prev.profile, ProfilePhotoUrl: cacheBusted }
			}));

			// Refresh global user profile so navbar and other components update
			try {
				await refreshUserProfile();
			} catch (e) {
				// ignore refresh errors here; UI already updated locally
			}

			showSuccess('Foto de perfil actualizada correctamente');
		} catch (error) {
			showError(error.response?.data?.msg || error.message || 'Error al subir la foto de perfil');
		} finally {
			setUploadingPhoto(false);
		}
	};

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = e.dataTransfer.files;
		if (files && files[0]) {
			handlePhotoUpload(files[0]);
		}
	};

	const handleFileInputChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			handlePhotoUpload(e.target.files[0]);
		}
	};

	const onSubmit = async (data) => {
		try {
			setSaving(true);
			await adminProfileService.updateOwnProfile({
				name: data.fullName,
				username: data.username,
				address: data.address,
				jobName: data.jobName,
				income: data.income === '' ? undefined : Number(data.income),
			});

			await refreshUserProfile();
			showSuccess('Perfil actualizado correctamente');
		} catch (error) {
			showError(error.response?.data?.msg || error.response?.data?.message || 'No se pudo actualizar el perfil');
		} finally {
			setSaving(false);
		}
	};

	const formatRegistrationDate = () => {
		if (!profile?.createdAt) return '—';
		const date = new Date(profile.createdAt);
		const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
		return `${months[date.getMonth()]} ${date.getFullYear()}`;
	};

	const getUserCode = () => {
		return `USR-${String(profileData.user?.id || '000000').slice(0, 6).padEnd(6, '0')}`.toUpperCase();
	};

	return (
		<AdminLayout>
			<div className="admin-section" style={{ gap: 20 }}>
				<AdminPageHeader
					title="Ajustes de Perfil"
					breadcrumbs={[
						{ label: 'Inicio', to: '/AdminDashboard' },
						{ label: 'Ajustes', to: '/AdminDashboard/profile-settings' },
						{ label: 'Perfil' },
					]}
					description="Actualiza tu información personal sin cambiar la identidad visual del sistema."
				/>

				<div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
					{/* Tarjeta de Perfil */}
					<div style={cardStyle} className="p-6 lg:p-7">
						<div className="flex flex-col items-center text-center gap-4">
							{/* Foto de Perfil */}
							<div className="relative group">
								<div
									className="w-28 h-28 rounded-full border-4 border-[#C8A84B] bg-gradient-to-br from-[#102b55] to-[#163c78] flex items-center justify-center shadow-xl overflow-hidden cursor-pointer relative"
									style={{ 
										backgroundColor: dragActive ? 'rgba(200, 168, 75, 0.1)' : undefined,
										borderColor: dragActive ? '#d7bb70' : '#C8A84B',
										transition: 'all 0.3s ease'
									}}
									onDragEnter={isAdmin ? handleDrag : undefined}
									onDragLeave={isAdmin ? handleDrag : undefined}
									onDragOver={isAdmin ? handleDrag : undefined}
									onDrop={isAdmin ? handleDrop : undefined}
								>
									{profile?.ProfilePhotoUrl ? (
										<img
											alt={displayName}
											className="w-full h-full object-cover"
											src={(() => {
												const url = profile.ProfilePhotoUrl || '';
												if (!url) return '';
												if (url.startsWith('http')) return url;
												const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';
												// derive origin without /api/v1 so static /uploads is served at root
												const authOrigin = authUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
												// If the stored path already points to /uploads (public static), serve from origin
												if (url.startsWith('/uploads')) {
													return `${authOrigin}${url}`;
												}
												// If path accidentally contains /api/v1/uploads, remove the prefix
												if (url.startsWith('/api/v1/uploads')) {
													return `${authOrigin}${url.replace(/^\/api\/v1/, '')}`;
												}
												// otherwise, join with origin
												return `${authOrigin}/${url.replace(/^\//, '')}`;
											})()}
										/>
									) : (
										<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
											<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
											<circle cx="12" cy="7" r="4"></circle>
										</svg>
									)}
									
									{/* Overlay de Hover */}
									{isAdmin && (
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<span className="text-white text-xs font-bold">Cambiar foto</span>
										</div>
									)}
								</div>

								{/* Botón Edit */}
								{isAdmin && (
									<div 
										className="absolute -right-1 bottom-2 w-9 h-9 rounded-full border-2 border-[#0f2344] bg-[#C8A84B] flex items-center justify-center text-[#102b55] shadow-lg cursor-pointer hover:brightness-110 transition"
										onClick={() => fileInputRef.current?.click()}
									>
										<span className="text-sm font-black">✎</span>
									</div>
								)}

								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileInputChange}
									accept="image/*"
									style={{ display: 'none' }}
									disabled={uploadingPhoto}
								/>
							</div>

							{/* Info Principal */}
							<div>
								<h2 className="text-2xl font-bold text-white">{loading ? 'Cargando...' : displayName}</h2>
								<p className="mt-1 text-[#C8A84B] font-semibold">{roleLabel}</p>
								{uploadingPhoto && <p className="mt-1 text-xs text-slate-400">Subiendo foto...</p>}
							</div>

							{/* Card Info */}
							<div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left">
								<div className="flex items-center justify-between text-sm">
									<span className="text-slate-300">Usuario</span>
									<span className="font-semibold text-white">{displayUsername}</span>
								</div>
								<div className="mt-2 flex items-center justify-between text-sm">
									<span className="text-slate-300">Estado</span>
									<span className="font-semibold text-emerald-400">Activo</span>
								</div>
								<div className="mt-2 flex items-center justify-between text-sm">
									<span className="text-slate-300">Miembro desde</span>
									<span className="font-semibold text-white">{formatRegistrationDate()}</span>
								</div>
							</div>

							{/* Estado Card */}
							<div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 mt-2">
								<div className="flex flex-col gap-3">
									<div>
										<p className="text-xs text-slate-400 font-medium">Código</p>
										<p className="mt-1 text-sm font-bold text-[#C8A84B]">{getUserCode()}</p>
									</div>
									<div>
										<p className="text-xs text-slate-400 font-medium">Rol</p>
										<p className="mt-1 text-sm font-bold text-white uppercase">{user?.role}</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Tarjeta de Formulario */}
					<div style={cardStyle} className="p-6 lg:p-7">
						<div className="flex items-center justify-between flex-wrap gap-4 mb-5">
							<div>
								<h3 className="text-2xl font-bold text-white">Información Personal</h3>
								<div className="mt-2 h-px w-24 bg-[#C8A84B]" />
							</div>
							<div className="text-sm text-slate-300 font-medium">Mantén tu perfil actualizado para el equipo de administración.</div>
						</div>

						{loading ? (
							<div className="py-20 flex items-center justify-center">
								<div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-[#C8A84B] animate-spin" />
							</div>
						) : (
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div>
										<label style={fieldLabelStyle}>Nombre completo</label>
										<input type="text" style={inputBaseStyle} {...register('fullName', { required: 'Este campo es obligatorio' })} />
										{errors.fullName && <p className="mt-2 text-sm text-red-300">{errors.fullName.message}</p>}
									</div>

									<div>
										<label style={fieldLabelStyle}>Username</label>
										<input type="text" style={inputBaseStyle} {...register('username', { required: 'El username es obligatorio' })} />
										{errors.username && <p className="mt-2 text-sm text-red-300">{errors.username.message}</p>}
									</div>

									<div>
										<label style={fieldLabelStyle}>Teléfono</label>
										<input type="text" readOnly style={readOnlyInputStyle} {...register('phoneNumber')} />
										<p className="mt-2 text-xs text-slate-400">Solo lectura desde el perfil actual.</p>
									</div>

									<div>
										<label style={fieldLabelStyle}>Correo electrónico</label>
										<input type="email" readOnly style={readOnlyInputStyle} {...register('email')} />
										<p className="mt-2 text-xs text-slate-400">El correo no se modifica desde esta pantalla.</p>
									</div>

									<div>
										<label style={fieldLabelStyle}>Dirección</label>
										<input type="text" style={inputBaseStyle} {...register('address')} />
									</div>

									<div>
										<label style={fieldLabelStyle}>Trabajo / Ocupación</label>
										<input type="text" style={inputBaseStyle} {...register('jobName')} />
									</div>

									<div>
										<label style={fieldLabelStyle}>Ingresos mensuales</label>
										<input type="number" min="0" step="0.01" style={inputBaseStyle} {...register('income')} />
									</div>
								</div>

								<div className="flex flex-col sm:flex-row gap-3 pt-2">
									<button type="submit" style={accentButtonStyle} disabled={saving} className={saving ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-105 transition'}>
										{saving ? 'Guardando...' : 'Guardar cambios'}
									</button>
									<button type="button" style={secondaryButtonStyle} onClick={() => navigate('/AdminDashboard')}>
										Cancelar
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>
		</AdminLayout>
	);
};

export default AdminProfileSettingsView;