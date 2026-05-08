import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { adminProfileService } from '../../../shared/api/adminProfile.service.js';
import { axiosClient } from '../../../shared/api/api.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
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
	border: '1px solid rgba(26, 46, 82, 0.3)',
	background: 'rgba(245, 248, 252, 0.8)',
	color: '#1A2E52',
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
	background: 'rgba(230, 237, 245, 0.6)',
};

const fieldLabelStyle = {
	fontSize: 13,
	fontWeight: 600,
	color: '#1A2E52',
	marginBottom: 8,
};

const cardStyle = {
	background: 'linear-gradient(180deg, rgba(245, 248, 252, 0.96), rgba(235, 242, 250, 0.94))',
	border: '1px solid rgba(26, 46, 82, 0.15)',
	borderRadius: 18,
	boxShadow: '0 18px 40px rgba(26, 46, 82, 0.08)',
	color: '#1A2E52',
};

const accentButtonStyle = {
	background: 'linear-gradient(135deg, #C8A84B, #d7bb70)',
	color: '#fff',
	border: 'none',
	borderRadius: 12,
	padding: '12px 20px',
	fontWeight: 700,
	boxShadow: '0 10px 22px rgba(200, 168, 75, 0.28)',
};

const secondaryButtonStyle = {
	background: 'transparent',
	color: '#1A2E52',
	border: '1px solid rgba(26, 46, 82, 0.35)',
	borderRadius: 12,
	padding: '12px 20px',
	fontWeight: 700,
};

// Construye URL base SIN ningún cache-buster
const buildPhotoSrc = (url) => {
	if (!url) return '';
	// Limpiar cualquier ?t= que venga en la URL (del store o del backend)
	const cleanUrl = url.split('?')[0];
	if (cleanUrl.startsWith('http')) return cleanUrl;
	const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';
	const authOrigin = authUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
	if (cleanUrl.startsWith('/uploads')) return `${authOrigin}${cleanUrl}`;
	if (cleanUrl.startsWith('/api/v1/uploads')) return `${authOrigin}${cleanUrl.replace(/^\/api\/v1/, '')}`;
	return `${authOrigin}/${cleanUrl.replace(/^\//, '')}`;
};

export const ClientProfileSettingsView = () => {
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [profileData, setProfileData] = useState({ user: null, profile: null });
	// Timestamp local para forzar re-render del <img> — evita duplicar ?t= en la URL
	const [photoTs, setPhotoTs] = useState(() => Date.now());
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

	// Username: priorizar el store (ya actualizado) sobre el estado local
	const displayName = useMemo(() => {
		return user?.username || user?.name || profile.Username || currentUser.username || 'Usuario';
	}, [user?.username, user?.name, profile.Username, currentUser.username]);

	const displayUsername = displayName;
	const roleLabel = roleLabelMap[user?.role] || user?.role || 'Cliente';

	// Foto: priorizar el store, limpiar ?t= y agregar UNO nuevo con photoTs
	const rawPhotoUrl = user?.profilePhotoUrl || profile?.ProfilePhotoUrl || '';
	const photoBaseSrc = buildPhotoSrc(rawPhotoUrl);
	const photoSrc = photoBaseSrc ? `${photoBaseSrc}?t=${photoTs}` : '';

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
		return () => { active = false; };
	}, [reset]);

	const handlePhotoUpload = async (file) => {
		if (!file) return;

		try {
			setUploadingPhoto(true);
			const formData = new FormData();
			formData.append('photo', file);

			const response = await axiosClient.post('/auth/profile/photo', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			const returnedUrl = response.data.data.photoUrl || '';
			// Limpiar ?t= que pueda traer el backend — nosotros ponemos el nuestro
			const cleanUrl = returnedUrl.split('?')[0];
			const now = Date.now();

			// 1. Actualizar estado local del componente (foto en la tarjeta)
			setProfileData(prev => ({
				...prev,
				profile: { ...prev.profile, ProfilePhotoUrl: cleanUrl }
			}));

			// 2. Actualizar timestamp → fuerza re-render de <img> con ?t= fresco
			setPhotoTs(now);

			// 3. Guardar URL LIMPIA en el store → el navbar del cliente la lee
			//    y buildAvatarSrc en el navbar agrega su propio ?t=
			updateUserProfile({ profilePhotoUrl: cleanUrl });

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
		if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
		else if (e.type === 'dragleave') setDragActive(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		const files = e.dataTransfer.files;
		if (files && files[0]) handlePhotoUpload(files[0]);
	};

	const handleFileInputChange = (e) => {
		if (e.target.files && e.target.files[0]) handlePhotoUpload(e.target.files[0]);
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

			// Actualizar store INMEDIATAMENTE → navbar se actualiza al instante
			updateUserProfile({
				name: data.fullName,
				username: data.username,
			});

			// Actualizar estado local
			setProfileData((prev) => ({
				...prev,
				profile: {
					...prev.profile,
					Name: data.fullName,
					Username: data.username,
					Address: data.address,
					JobName: data.jobName,
					Income: data.income === '' ? prev.profile?.Income : Number(data.income),
				},
			}));

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
		const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
		return `${months[date.getMonth()]} ${date.getFullYear()}`;
	};

	const getUserCode = () => {
		return `USR-${String(profileData.user?.id || '000000').slice(0, 6).padEnd(6, '0')}`.toUpperCase();
	};

	return (
		<div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f8fc 0%, #eaf2fa 100%)' }}>
			<div className="flex">
				<div className="flex-1 pt-4 pb-6 px-6 lg:px-8 max-w-7xl mx-auto w-full">
					<div className="admin-section" style={{ gap: 14 }}>
						{/* Header */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h1 className="text-4xl font-bold text-[#1A2E52]">Ajustes de Perfil</h1>
									<div className="mt-3 h-1 w-24 bg-[#C8A84B] rounded" />
								</div>
								<button
									onClick={() => navigate('/clientdashboard')}
									className="px-4 py-2 text-[#1A2E52] font-medium hover:bg-white/50 rounded transition"
								>
									← Volver
								</button>
							</div>
							<p className="text-[#1A2E52] opacity-70">Actualiza tu información personal y mantén tu perfil al día.</p>
						</div>

						{/* Contenido Principal */}
						<div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 items-start">
							{/* Tarjeta de Perfil */}
							<div style={cardStyle} className="p-5 lg:p-6">
								<div className="flex flex-col items-center text-center gap-4">
									<div className="relative group">
										<div
											className="w-28 h-28 rounded-full border-4 border-[#C8A84B] bg-gradient-to-br from-[#dce7f0] to-[#c7d9ed] flex items-center justify-center shadow-xl overflow-hidden cursor-pointer relative"
											style={{
												backgroundColor: dragActive ? 'rgba(200, 168, 75, 0.1)' : undefined,
												borderColor: dragActive ? '#d7bb70' : '#C8A84B',
												transition: 'all 0.3s ease'
											}}
											onDragEnter={handleDrag}
											onDragLeave={handleDrag}
											onDragOver={handleDrag}
											onDrop={handleDrop}
										>
											{photoSrc ? (
												<img
													key={photoTs}
													alt={displayName}
													className="w-full h-full object-cover"
													src={photoSrc}
												/>
											) : (
												<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#1A2E52]">
													<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
													<circle cx="12" cy="7" r="4"></circle>
												</svg>
											)}
											<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<span className="text-white text-xs font-bold">Cambiar foto</span>
											</div>
										</div>

										<div
											className="absolute -right-1 bottom-2 w-9 h-9 rounded-full border-2 border-white bg-[#C8A84B] flex items-center justify-center text-white shadow-lg cursor-pointer hover:brightness-110 transition"
											onClick={() => fileInputRef.current?.click()}
										>
											<span className="text-sm font-black">✎</span>
										</div>

										<input
											type="file"
											ref={fileInputRef}
											onChange={handleFileInputChange}
											accept="image/*"
											style={{ display: 'none' }}
											disabled={uploadingPhoto}
										/>
									</div>

									<div>
										<h2 className="text-2xl font-bold text-[#1A2E52]">
											{loading ? 'Cargando...' : displayName}
										</h2>
										<p className="mt-1 text-[#C8A84B] font-semibold">{roleLabel}</p>
										{uploadingPhoto && <p className="mt-1 text-xs text-slate-500">Subiendo foto...</p>}
									</div>

									<div className="w-full rounded-xl border border-[#1A2E52]/10 bg-white/60 px-4 py-3 text-left">
										<div className="flex items-center justify-between text-sm">
											<span className="text-[#1A2E52] opacity-70">Usuario</span>
											<span className="font-semibold text-[#1A2E52]">{displayUsername}</span>
										</div>
										<div className="mt-2 flex items-center justify-between text-sm">
											<span className="text-[#1A2E52] opacity-70">Estado</span>
											<span className="font-semibold text-emerald-600">Activo</span>
										</div>
										<div className="mt-2 flex items-center justify-between text-sm">
											<span className="text-[#1A2E52] opacity-70">Miembro desde</span>
											<span className="font-semibold text-[#1A2E52]">{formatRegistrationDate()}</span>
										</div>
									</div>

									<div className="w-full rounded-xl border border-[#1A2E52]/10 bg-white/60 px-4 py-4 mt-2">
										<div className="flex flex-col gap-3">
											<div>
												<p className="text-xs text-[#1A2E52] opacity-70 font-medium">Código</p>
												<p className="mt-1 text-sm font-bold text-[#C8A84B]">{getUserCode()}</p>
											</div>
											<div>
												<p className="text-xs text-[#1A2E52] opacity-70 font-medium">Rol</p>
												<p className="mt-1 text-sm font-bold text-[#1A2E52] uppercase">{user?.role}</p>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Tarjeta de Formulario */}
							<div style={cardStyle} className="p-5 lg:p-6">
								<div className="flex items-center justify-between flex-wrap gap-4 mb-5">
									<div>
										<h3 className="text-2xl font-bold text-[#1A2E52]">Información Personal</h3>
										<div className="mt-2 h-px w-24 bg-[#C8A84B]" />
									</div>
									<div className="text-sm text-[#1A2E52] opacity-70 font-medium">Mantén tu perfil actualizado.</div>
								</div>

								{loading ? (
									<div className="py-20 flex items-center justify-center">
										<div className="w-14 h-14 rounded-full border-4 border-[#1A2E52]/10 border-t-[#C8A84B] animate-spin" />
									</div>
								) : (
									<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
											<div>
												<label style={fieldLabelStyle}>Nombre completo</label>
												<input type="text" style={inputBaseStyle} {...register('fullName', { required: 'Este campo es obligatorio' })} />
												{errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>}
											</div>
											<div>
												<label style={fieldLabelStyle}>Username</label>
												<input type="text" style={inputBaseStyle} {...register('username', { required: 'El username es obligatorio' })} />
												{errors.username && <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>}
											</div>
											<div>
												<label style={fieldLabelStyle}>Teléfono</label>
												<input type="text" readOnly style={readOnlyInputStyle} {...register('phoneNumber')} />
												<p className="mt-2 text-xs text-[#1A2E52] opacity-60">Solo lectura desde el perfil actual.</p>
											</div>
											<div>
												<label style={fieldLabelStyle}>Correo electrónico</label>
												<input type="email" readOnly style={readOnlyInputStyle} {...register('email')} />
												<p className="mt-2 text-xs text-[#1A2E52] opacity-60">El correo no se modifica desde esta pantalla.</p>
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
											<button
												type="submit"
												style={accentButtonStyle}
												disabled={saving}
												className={saving ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-105 transition'}
											>
												{saving ? 'Guardando...' : 'Guardar cambios'}
											</button>
											<button
												type="button"
												style={secondaryButtonStyle}
												onClick={() => navigate('/clientdashboard')}
											>
												Cancelar
											</button>
										</div>
									</form>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ClientProfileSettingsView;