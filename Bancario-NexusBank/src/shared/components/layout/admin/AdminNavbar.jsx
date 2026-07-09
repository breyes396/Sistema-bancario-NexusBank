import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../features/auth/store/authStore.js';
import Logo from '../../../../assets/animation/Sinfondo.webm';
import AdminNotifications from './AdminNotifications.jsx';
import '../../../../styles/AdminNavbar.css';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';

const buildAvatarSrc = (url) => {
	if (!url) return null;
	const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';
	const authOrigin = authUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
	let src = url;
	if (!url.startsWith('http')) {
		if (url.startsWith('/uploads')) src = `${authOrigin}${url}`;
		else if (url.startsWith('/api/v1/uploads')) src = `${authOrigin}${url.replace(/^\/api\/v1/, '')}`;
		else src = `${authOrigin}/${url.replace(/^\//, '')}`;
	}
	// Eliminar cache-busting del useMemo — se maneja con key en el <img>
	return src;
};

const AdminNavbar = () => {
	const navigate = useNavigate();

	// Leer DIRECTAMENTE del store para reactividad inmediata
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const userMenuRef = useRef(null);

	// Estos valores se recalculan automáticamente cada vez que el store cambia
	const displayUserName = user?.username || user?.name || user?.firstName || 'Usuario';
	const rawPhotoUrl = user?.profilePhotoUrl || '';
	const avatarSrc = buildAvatarSrc(rawPhotoUrl);

	const roleMap = { Admin: 'Administrador', Employee: 'Empleado', Client: 'Cliente' };
	const userRole = roleMap[user?.role] || user?.role || 'Administrador';

	// Foto: construir igual que el Navbar del cliente
	const photoBase = avatarSrc ? avatarSrc.split('?')[0] : '';
	const photoSrc = photoBase ? `${photoBase}?t=${rawPhotoUrl.length}_${Date.now()}` : '';

	// Cerrar dropdown cuando se hace clic fuera
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const barStyle = {
		height: 64,
		background: '#163c78',
		color: '#fff',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '0 20px',
		boxShadow: '0 1px 0 rgba(0,0,0,0.06)'
	};

	const logoStyle = {
		height: '100%',
		display: 'flex',
		alignItems: 'center'
	};

	const logoImg = {
		height: 45,
		width: 'auto',
		objectFit: 'contain'
	};

	const userContainerStyle = {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		padding: '8px 12px',
		borderLeft: '1px solid rgba(255,255,255,0.08)',
		paddingLeft: 16,
		borderRadius: 6,
		cursor: 'pointer',
		userSelect: 'none',
		transition: 'background-color 0.2s ease',
		backgroundColor: '#0b2b52'
	};

	const userIconStyle = {
		width: 32,
		height: 32,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		color: '#fff',
		flexShrink: 0
	};

	const userNameStyle = {
		fontSize: 13,
		fontWeight: 500,
		whiteSpace: 'nowrap',
		color: '#fff'
	};

	const arrowStyle = {
		width: 16,
		height: 16,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 4,
		transition: 'transform 0.2s ease',
		transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
		color: '#fff',
		flexShrink: 0
	};

	const dropdownStyle = {
		position: 'absolute',
		top: '100%',
		right: 0,
		background: '#0b2b52',
		borderRadius: '0 0 6px 6px',
		boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
		minWidth: '100%',
		zIndex: 50,
		padding: '0',
		marginTop: '-1px',
		animation: 'dropdownEnter 0.2s ease-out',
		borderTop: 'none'
	};

	const dropdownItemStyle = {
		padding: '12px 16px',
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		color: '#fff',
		fontWeight: 500,
		cursor: 'pointer',
		fontSize: '14px',
		transition: 'background-color 0.15s ease',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
	};

	const logoutItemStyle = {
		...dropdownItemStyle,
		color: '#fff',
		borderBottom: 'none'
	};

	return (
		<>
			<style>{`
				@keyframes dropdownEnter {
					from { opacity: 0; transform: translateY(-8px); }
					to   { opacity: 1; transform: translateY(0); }
				}
			`}</style>

			<header style={barStyle}>
				{/* Logo */}
				<div style={logoStyle}>
					<video src={Logo} autoPlay loop muted playsInline style={logoImg} />
				</div>

				{/* Right-side (replicar Navbar del cliente) */}
				<div className="flex items-center space-x-6 relative">
					{/* Campana / notificaciones (componente) */}
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<AdminNotifications />
					</div>

					{/* Usuario */}
					<div
						className="flex items-center space-x-3 border-l pl-6 border-gray-300/50 cursor-pointer select-none"
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					>
						<div className="text-right hidden sm:block">
							<p className="text-sm font-bold text-white">{displayUserName}</p>
							<p className="text-xs text-gray-200">{userRole}</p>
						</div>

						{photoSrc ? (
							<img
								key={rawPhotoUrl}
								src={photoSrc}
								alt={displayUserName}
								className="w-10 h-10 rounded-full object-cover shadow-md hover:shadow-lg transition-shadow border-2 border-[#C8A84B]"
								onError={(e) => { e.currentTarget.style.display = 'none'; }}
							/>
						) : (
							<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2D5899] to-[#C8A84B] items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-shadow" style={{ display: 'flex' }}>
								{displayUserName.charAt(0).toUpperCase()}
							</div>
						)}
					</div>

					{/* Dropdown */}
					{isDropdownOpen && (
						<div className="absolute top-14 right-0 w-48 bg-white border border-gray-100 shadow-2xl rounded-xl py-2 z-50">
							<button
								onClick={() => { setIsDropdownOpen(false); navigate('/AdminDashboard/profile-settings'); }}
								className="w-full text-left px-4 py-2 text-sm font-semibold text-[#1A2E52] hover:bg-blue-50 transition-colors flex items-center"
							>
								<FaCog className="mr-2 text-gray-500 w-4 h-4" /> Ajustes de perfil
							</button>
							<button
								onClick={() => { setIsDropdownOpen(false); logout(); }}
								className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center"
							>
								<FaSignOutAlt className="mr-2 text-red-600 w-4 h-4" /> Cerrar Sesión
							</button>
						</div>
					)}
				</div>
			</header>
		</>
	);
};

export default AdminNavbar;