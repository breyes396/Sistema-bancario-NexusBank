import React from 'react';

const AdminNavbar = () => {
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
				<div style={{width:36, height:36, borderRadius:6, background:'#0b2b52', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700}}>NB</div>
				<div>
					<div style={{fontSize:14, fontWeight:700}}>NexusBank · Admin</div>
					<div style={{fontSize:12, opacity:0.8}}>Dashboard del administrador</div>
				</div>
			</div>

			<div style={{display:'flex', alignItems:'center', gap:16}}>
				<div style={{background:'#1f67b3', padding:'6px 10px', borderRadius:12, color:'#ffffff', fontSize:12}}>ROL: ADMIN</div>
				<div style={{background:'#f1f5f9', padding:'6px 8px', borderRadius:999, display:'flex', alignItems:'center', gap:8}}>
					<div style={avatarStyle}>AD</div>
					<div style={{fontSize:13, color:'#163c78'}}>Admin</div>
				</div>
			</div>
		</header>
	);
};

export default AdminNavbar;
