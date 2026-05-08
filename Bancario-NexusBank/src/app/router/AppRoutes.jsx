import { Route, Routes } from 'react-router-dom';
import Home from '../../features/main/Home.jsx';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { ProtectedRoute } from '../../shared/components/auth/ProtectedRoute.jsx';
import { ClientDashboardLayout } from '../../shared/components/layout/ClientDashboardLayout.jsx';
import { ClientDashboard } from '../../features/client/pages/ClientDashboard.jsx';
import ClientProfileSettingsView from '../../features/client/pages/ClientProfileSettingsView.jsx';
import { RegisterPage } from '../../features/auth/pages/RegisterPage.jsx';
import { VerificationPage } from '../../features/auth/pages/VerificationPage.jsx';
import AdminDashboardContainer from '../../shared/components/layout/AdminDashboardContainer.jsx';
import PendingRequestsView from '../../shared/components/layout/PendingRequestsView.jsx';
import AdminProfileSettingsView from '../../shared/components/layout/AdminProfileSettingsView.jsx';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/verify-email" element={<VerificationPage />} />
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
                <Route path="profile-settings" element={<ClientProfileSettingsView />} />
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
                path="/AdminDashboard/profile-settings"
                element={
                    <ProtectedRoute requiredRole="Admin">
                        <AdminProfileSettingsView />
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