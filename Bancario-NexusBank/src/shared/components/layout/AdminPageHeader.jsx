import React from 'react';
import { Link } from 'react-router-dom';

const AdminPageHeader = ({ title, breadcrumbs = [], description = null, action = null }) => {
	return (
		<div className="flex flex-col gap-3 mb-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-3xl lg:text-4xl font-bold text-[#1A2E52]">{title}</h1>
				{description && <p className="text-sm text-slate-500 font-medium">{description}</p>}
			</div>

			<div className="flex flex-wrap items-center gap-2 text-sm font-medium">
				{breadcrumbs.map((crumb, index) => {
					const isLast = index === breadcrumbs.length - 1;
					const crumbStyle = isLast
						? 'text-[#C8A84B]'
						: 'text-slate-500 hover:text-[#2D5899] transition-colors';

					return (
						<React.Fragment key={`${crumb.label}-${index}`}>
							{crumb.to ? (
								<Link to={crumb.to} className={crumbStyle}>
									{crumb.label}
								</Link>
							) : (
								<span className={crumbStyle}>{crumb.label}</span>
							)}
							{!isLast && <span className="text-slate-400">&gt;</span>}
						</React.Fragment>
					);
				})}
			</div>

			{action && <div className="pt-1">{action}</div>}
		</div>
	);
};

export default AdminPageHeader;