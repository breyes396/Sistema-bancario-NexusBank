import React, { useState } from 'react';
import { useAuthStore } from '../../../features/auth/store/authStore.js';

const AdminNavbar = () => {
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const userName = user?.name || user?.firstName || 'Admin';
	const initials = userName.substring(0, 2).toUpperCase();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
	const brandStyle = { display: 'flex', alignItems: 'center', gap: 12 };
	const avatarStyle = { width: 36, height: 36, borderRadius: '50%', background: '#ffffff', color: '#163c78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 };

	return (
		<header style={barStyle}>
			<div style={brandStyle}>
				<div style={{ width: 36, height: 36, borderRadius: 6, background: '#0b2b52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>NB</div>
				<div>
					<div style={{ fontSize: 14, fontWeight: 700 }}>NexusBank · Admin</div>
					<div style={{ fontSize: 12, opacity: 0.8 }}>Dashboard del administrador</div>
				</div>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
				<div style={{ background: '#1f67b3', padding: '6px 10px', borderRadius: 12, color: '#ffffff', fontSize: 12 }}>ROL: {user?.role ? user.role.toUpperCase() : 'ADMIN'}</div>
				
				<div style={{ position: 'relative' }}>
					<div
						style={{ background: '#f1f5f9', padding: '6px 16px 6px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					>
						<div style={avatarStyle}>{initials}</div>
						<div style={{ fontSize: 13, color: '#163c78', fontWeight: 'bold' }}>{userName}</div>
					</div>

					{isDropdownOpen && (
						<div style={{ position: 'absolute', top: '50px', right: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '160px', zIndex: 50, padding: '8px 0' }}>
							<div
								style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
								onClick={logout}
								onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
								onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
							>
								<span>🚪</span> Cerrar sesión
							</div>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export default AdminNavbar;
