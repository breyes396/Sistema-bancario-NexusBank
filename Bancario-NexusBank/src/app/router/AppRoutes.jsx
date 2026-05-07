import { Route, Routes } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { ProtectedRoute } from '../../shared/components/auth/ProtectedRoute.jsx';
import { ClientDashboardLayout } from '../../shared/components/layout/ClientDashboardLayout.jsx';
import { ClientDashboard } from '../../features/client/pages/ClientDashboard.jsx';
import { RegisterPage } from '../../features/auth/pages/RegisterPage.jsx';
import AdminDashboardContainer from '../../shared/components/layout/AdminDashboardContainer.jsx';
import PendingRequestsView from '../../shared/components/layout/PendingRequestsView.jsx';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
            
            <Route
                path="/AdminDashboard"
                element={
                    <ProtectedRoute requiredRole="Admin">
                        <AdminDashboardContainer />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/AdminDashboard/requests"
                element={
                    <ProtectedRoute requiredRole="Admin">
                        <PendingRequestsView />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}