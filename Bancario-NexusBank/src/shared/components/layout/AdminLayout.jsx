import React from 'react';
import AdminNavbar from './AdminNavbar.jsx';
import AdminSidebar from './AdminSidebar.jsx';

const AdminLayout = ({ children, mainClassName = '' }) => {
	return (
		<div className="admin-dashboard">
			<AdminNavbar />
			<div className="admin-container">
				<AdminSidebar />
				<main className={`admin-main ${mainClassName}`.trim()}>{children}</main>
			</div>
		</div>
	);
};

export default AdminLayout;