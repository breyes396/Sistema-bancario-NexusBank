import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { clientAccountService } from '../../../shared/api/clientAccount.service.js';
import axios from 'axios';
import { useAuthStore } from '../../auth/store/authStore.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import '../../../styles/adminDashboard.css';

const profilePhotoBaseURL = import.meta.env.VITE_BANKING_API_URL || import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';

const axiosProfilePhoto = axios.create({
	baseURL: profilePhotoBaseURL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosProfilePhoto.interceptors.request.use((config) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

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
	const [fraudAlerts, setFraudAlerts] = useState(true);
	// Timestamp local para forzar re-render del <img> — evita duplicar ?t= en la URL
	const [photoTs, setPhotoTs] = useState(() => Date.now());
	const fileInputRef = useRef(null);

	const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
		defaultValues: {
			fullName: '',
			username: '',
			phoneNumber: '',
			email: '',
			address: '',
			jobName: '',
			income: '',
		}
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

	// Effect to fetch initial profile data
	useEffect(() => {
		let active = true;

		const loadProfile = async () => {
			try {
				setLoading(true);
				const response = await clientAccountService.getUserProfile();
				if (!active) return;

				const nextUser = response.user || null;
				const nextProfile = response.profile || null;
				
				setProfileData({ user: nextUser, profile: nextProfile });
				setFraudAlerts(nextProfile?.FraudAlerts ?? true);
			} catch (error) {
				showError(error.response?.data?.msg || error.response?.data?.message || 'No se pudo cargar el perfil');
			} finally {
				if (active) setLoading(false);
			}
		};

		loadProfile();
		return () => { active = false; };
	}, []); // Removed reset from dependency array

	// Effect to update form values when profileData changes
	useEffect(() => {
		if (profileData.profile) {
			reset({
				fullName: profileData.profile.Name || '',
				username: profileData.profile.Username || '',
				phoneNumber: profileData.profile.PhoneNumber || '',
				email: profileData.user?.email || '',
				address: profileData.profile.Address || '',
				jobName: profileData.profile.JobName || '',
				income: profileData.profile.Income ?? '',
			});
		}
	}, [profileData, reset]);

	const handlePhotoUpload = async (file) => {
		if (!file) return;

		try {
			setUploadingPhoto(true);
			const formData = new FormData();
			formData.append('photo', file);

			const response = await axiosProfilePhoto.post('/auth/profile/photo', formData, {
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
			const payload = {
				name: data.fullName,
				username: data.username,
				address: data.address,
				jobName: data.jobName,
				income: data.income === '' ? undefined : Number(data.income),
				fraudAlerts: fraudAlerts,
				profilePhotoUrl: profile?.ProfilePhotoUrl || user?.profilePhotoUrl,
			};
			
			const response = await clientAccountService.updateUserProfile(payload);

			// Actualizar store INMEDIATAMENTE → navbar se actualiza al instante
			updateUserProfile({
				name: data.fullName,
				username: data.username,
				// Preservar la foto
				profilePhotoUrl: response?.data?.profile?.ProfilePhotoUrl || profile?.ProfilePhotoUrl || user?.profilePhotoUrl,
				FraudAlerts: fraudAlerts,
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
					ProfilePhotoUrl: response?.data?.profile?.ProfilePhotoUrl || prev.profile?.ProfilePhotoUrl,
					FraudAlerts: fraudAlerts,
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
									style={accentButtonStyle}
									onClick={() => navigate('/clientdashboard')}
								>
									Volver al Dashboard
								</button>
							</div>
							<p className="text-[#1A2E52] opacity-70">Actualiza tu información personal y mantén tu perfil al día.</p>
						</div>

						{/* Contenido Principal */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Left Column: Profile Card */}
							<div className="md:col-span-1">
								<div style={cardStyle} className="p-8 rounded-lg flex flex-col items-center text-center">
									<div
										className="relative w-40 h-40 rounded-full mb-5 cursor-pointer group"
										onClick={() => fileInputRef.current?.click()}
									>
										{photoSrc ? (
											<img
												key={photoSrc}
												src={photoSrc}
												alt="Foto de perfil"
												className="w-full h-full object-cover rounded-full"
											/>
										) : (
											<div className="w-full h-full rounded-full bg-white flex items-center justify-center border-4 border-[#C8A84B] shadow-inner">
												<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#C8A84B"/>
												</svg>
											</div>
										)}
										<div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
											<span className="text-white text-sm font-semibold text-center px-2">Cambiar foto</span>
										</div>
									</div>
									<input
										type="file"
										ref={fileInputRef}
										className="hidden"
										accept="image/png, image/jpeg"
										onChange={handleFileInputChange}
									/>
									<h2 className="text-2xl font-bold">{displayName}</h2>
									<p className="text-sm font-medium text-[#C8A84B]">{roleLabel}</p>
									<div className="w-full border-t border-gray-300 my-5" />
									<div className="w-full text-left text-sm space-y-3">
										<div className="flex justify-between"><span>Usuario:</span> <span className="font-semibold">{displayUsername}</span></div>
										<div className="flex justify-between"><span>Estado:</span> <span className="font-semibold text-green-600">Activo</span></div>
										<div className="flex justify-between"><span>Miembro desde:</span> <span className="font-semibold">{formatRegistrationDate()}</span></div>
										<div className="flex justify-between"><span>Código:</span> <span className="font-semibold text-[#C8A84B]">{getUserCode()}</span></div>
									</div>
								</div>
							</div>

							{/* Right Column: Form */}
							<div className="md:col-span-2">
								<form onSubmit={handleSubmit(onSubmit)}>
									<div style={cardStyle} className="p-8 rounded-lg">
										<h2 className="text-2xl font-bold mb-1">Información Personal</h2>
										<p className="text-sm text-gray-500 mb-6">Mantén tu perfil actualizado.</p>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
											{/* Fields here */}
											<div>
												<label htmlFor="fullName" style={fieldLabelStyle}>Nombre completo</label>
												<input id="fullName" type="text" style={inputBaseStyle} {...register('fullName')} />
											</div>
											<div>
												<label htmlFor="username" style={fieldLabelStyle}>Username</label>
												<input id="username" type="text" style={inputBaseStyle} {...register('username')} />
											</div>
											<div>
												<label htmlFor="phoneNumber" style={fieldLabelStyle}>Teléfono</label>
												<input id="phoneNumber" type="text" style={readOnlyInputStyle} {...register('phoneNumber')} readOnly />
												<p className='text-xs text-gray-400 mt-1 pl-1'>Solo lectura desde el perfil actual.</p>
											</div>
											<div>
												<label htmlFor="email" style={fieldLabelStyle}>Correo electrónico</label>
												<input id="email" type="email" style={readOnlyInputStyle} {...register('email')} readOnly />
												<p className='text-xs text-gray-400 mt-1 pl-1'>El correo no se modifica desde esta pantalla.</p>
											</div>
											<div className="md:col-span-2">
												<label htmlFor="address" style={fieldLabelStyle}>Dirección</label>
												<input id="address" type="text" style={inputBaseStyle} {...register('address')} />
											</div>
											<div>
												<label htmlFor="jobName" style={fieldLabelStyle}>Trabajo / Ocupación</label>
												<input id="jobName" type="text" style={inputBaseStyle} {...register('jobName')} />
											</div>
											<div>
												<label htmlFor="income" style={fieldLabelStyle}>Ingresos mensuales</label>
												<input id="income" type="number" style={inputBaseStyle} {...register('income')} />
											</div>
										</div>

										{/* Security Section */}
										<div className="w-full border-t border-gray-300 my-6" />
										<h3 className="text-xl font-semibold mb-4">Seguridad</h3>
										<button
											type="button"
											onClick={() => setFraudAlerts(prev => !prev)}
											className={`w-full max-w-sm mx-auto text-left p-3 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out flex items-center justify-center shadow-md transform hover:scale-105 ${
												fraudAlerts
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{fraudAlerts ? '🟢 Alertas de fraude activadas' : '🔴 Alertas de fraude desactivadas'}
										</button>
										<p className="text-xs text-gray-500 mt-3 text-center max-w-sm mx-auto">
											{fraudAlerts
												? "Recibirás notificaciones sobre actividades sospechosas."
												: "No recibirás alertas de seguridad."}
										</p>

										<div className="flex items-center justify-end mt-8 gap-4">
											<button type="button" onClick={() => reset()} style={secondaryButtonStyle}>
												Cancelar
											</button>
											<button type="submit" style={accentButtonStyle} disabled={saving || !isDirty && fraudAlerts === (profileData.profile?.FraudAlerts ?? true)}>
												{saving ? 'Guardando...' : 'Guardar cambios'}
											</button>
										</div>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ClientProfileSettingsView;