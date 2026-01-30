import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Reference from './pages/Reference';
import ComparisonPresentation from './pages/ComparisonPresentation';
import ComparisonsList from './pages/ComparisonsList';
import ComparisonCreate from './pages/ComparisonCreate';
import ComparisonEditPremium from './pages/ComparisonEditPremium';
import PublicPresentation from './pages/PublicPresentation';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import RequireAuth from './components/auth/RequireAuth';

const App = () => {
    return (
        <Routes>
            {/* Public presentation */}
            <Route
                path="/comparisons/:id/presentation"
                element={
                    <PublicLayout fullWidth>
                        <PublicPresentation />
                    </PublicLayout>
                }
            />
            <Route
                path="/p/:id"
                element={
                    <PublicLayout fullWidth>
                        <PublicPresentation />
                    </PublicLayout>
                }
            />

            {/* Auth routes */}
            <Route
                path="/app/login"
                element={
                    <AuthLayout>
                        <Login />
                    </AuthLayout>
                }
            />

            {/* Private (dashboard shell) */}
            <Route
                path="/app"
                element={
                    <RequireAuth>
                        <DashboardLayout />
                    </RequireAuth>
                }
            >
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="welcome" element={<Landing />} />
                <Route path="reference" element={<Reference />} />
                <Route path="comparisons" element={<ComparisonsList />} />
                <Route path="comparisons/create" element={<ComparisonCreate />} />
                <Route path="comparisons/:id/edit" element={<ComparisonEditPremium />} />
                <Route path="comparisons/:id/presentation" element={<ComparisonPresentation />} />
                <Route path="home" element={<Home />} />
            </Route>

            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
    );
};

export default App;
