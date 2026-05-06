import { Route, Routes } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';


export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
        </Routes>
    )
}  