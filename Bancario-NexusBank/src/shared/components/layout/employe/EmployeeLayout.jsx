import React from 'react';
import EmployeeNavbar from './EmployeeNavbar.jsx';
import EmployeeSidebar from './EmployeeSidebar.jsx';

const EmployeeLayout = ({ children, mainClassName = '' }) => {
	return (
		<div className="admin-dashboard">
			<EmployeeNavbar />
			<div className="admin-container">
				<EmployeeSidebar />
				<main className={`admin-main ${mainClassName}`.trim()}>{children}</main>
			</div>
		</div>
	);
};

export default EmployeeLayout;