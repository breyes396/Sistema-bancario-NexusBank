import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import Logo from '../../../assets/img/Logo.jpg';
import '../../../styles/AdminNavbar.css';

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
					<img src={Logo} alt="NexusBank Logo" style={logoImg} />
				</div>

				{/* User Menu */}
				<div
					ref={userMenuRef}
					style={userContainerStyle}
					onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#062147'}
					onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0b2b52'}
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
				>
					{/* Avatar — key={rawPhotoUrl} fuerza re-render cuando la URL cambia */}
					{avatarSrc ? (
						<img
							key={rawPhotoUrl}
							src={`${avatarSrc}?t=${Date.now()}`}
							alt={displayUserName}
							style={{ width: 32, height: 32, borderRadius: 9999, objectFit: 'cover' }}
							onError={(e) => { e.currentTarget.style.display = 'none'; }}
						/>
					) : (
						<svg
							style={userIconStyle}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
							<circle cx="12" cy="7" r="4"></circle>
						</svg>
					)}

					{/* Username — reactivo directo del store */}
					<div style={userNameStyle}>{displayUserName}</div>

					{/* Flecha */}
					<svg
						style={arrowStyle}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>

					{/* Dropdown */}
					{isDropdownOpen && (
						<div style={dropdownStyle}>
							<div
								style={dropdownItemStyle}
								onClick={(e) => {
									e.stopPropagation();
									setIsDropdownOpen(false);
									navigate('/AdminDashboard/profile-settings');
								}}
								onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
								onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="12" cy="12" r="3"></circle>
									<path d="M12 1v6m0 6v6"></path>
									<path d="M4.22 4.22l4.24 4.24m4.24 0l4.24 4.24"></path>
									<path d="M1 12h6m6 0h6"></path>
									<path d="M4.22 19.78l4.24-4.24m4.24 0l4.24-4.24"></path>
								</svg>
								Ajustes del perfil
							</div>

							<div
								style={logoutItemStyle}
								onClick={(e) => {
									e.stopPropagation();
									logout();
									setIsDropdownOpen(false);
								}}
								onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
								onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
									<polyline points="16 17 21 12 16 7"></polyline>
									<line x1="21" y1="12" x2="9" y2="12"></line>
								</svg>
								Cerrar sesión
							</div>
						</div>
					)}
				</div>
			</header>
		</>
	);
};

export default AdminNavbar;