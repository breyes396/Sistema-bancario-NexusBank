import { Route, Routes } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { ProtectedRoute } from '../../shared/components/auth/ProtectedRoute.jsx';
import { ClientDashboardLayout } from '../../shared/components/layout/ClientDashboardLayout.jsx';
import { ClientDashboard } from '../../features/client/pages/ClientDashboard.jsx';


export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route
                path="/clientdashboard"
                element={
                    <ProtectedRoute>
                        <ClientDashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<ClientDashboard />} />
            </Route>

        </Routes>
    )
}