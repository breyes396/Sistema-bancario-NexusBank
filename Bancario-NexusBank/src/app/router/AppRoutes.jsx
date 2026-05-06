import { Route, Routes } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { RegisterPage } from '../../features/auth/pages/RegisterPage.jsx';
import AdminDashboardContainer from '../../shared/components/layout/AdminDashboardContainer.jsx';


export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/AdminDashboard" element={<AdminDashboardContainer />} />
        </Routes>
    )
}  