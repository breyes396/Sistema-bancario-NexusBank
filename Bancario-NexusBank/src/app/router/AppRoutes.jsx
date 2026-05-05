import { Route, Routes } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { SignupPage } from '../../features/auth/pages/SignupPage.jsx';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage.jsx';
import { DashboardPage } from '../../features/auth/pages/InicioSesion.jsx';
import { ClientPage } from '../../app/layouts/ClientPage.jsx';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/client" element={<ClientPage />} />
        </Routes>
    )
}  