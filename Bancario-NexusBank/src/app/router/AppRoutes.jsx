import { Route, Routes } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { CrearCuenta } from '../../features/auth/pages/CrearCuenta.jsx';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage.jsx';
import { InicioSesion } from '../../features/auth/pages/InicioSesion.jsx';
import { ClientPage } from '../../app/layouts/ClientPage.jsx';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/CrearCuenta" element={<CrearCuenta />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<InicioSesion />} />
            <Route path="/InicioSesion" element={<InicioSesion />} />
            <Route path="/client" element={<ClientPage />} />
        </Routes>
    )
}  