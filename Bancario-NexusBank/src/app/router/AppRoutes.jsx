import { Route, Routes } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { CrearCuenta } from '../../features/auth/pages/CrearCuenta.jsx';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage.jsx';
import { ProtectedRoute } from '../../shared/components/auth/ProtectedRoute.jsx';
import { ClientDashboardContainer } from '../../shared/components/layout/ClientDashboardContainer.jsx';
import { ClientDashboard } from '../../features/client/pages/ClientDashboard.jsx';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/CrearCuenta" element={<CrearCuenta />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
                path="/clientdashboard"
                element={
                    <ProtectedRoute>
                        <ClientDashboardContainer />
                    </ProtectedRoute>
                }
            >
                <Route index element={<ClientDashboard />} />
            </Route>
        </Routes>
    )
}