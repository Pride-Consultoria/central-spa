import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { get, setAuthToken } from '../../services/api/client';
import { Spinner } from '../ui';

export default function RequireAuth({ children }) {
    const [checking, setChecking] = useState(true);
    const [ok, setOk] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let mounted = true;
        const check = async () => {
            try {
                await get('/me');
                if (mounted) setOk(true);
            } catch (err) {
                if (mounted) {
                    // limpa token se inválido
                    setAuthToken(null);
                    setOk(false);
                    navigate('/app/login', { replace: true, state: { from: location.pathname } });
                }
            } finally {
                if (mounted) setChecking(false);
            }
        };
        check();
        return () => {
            mounted = false;
        };
    }, [navigate, location.pathname]);

    if (checking) return <Spinner />;
    if (!ok) return null;
    return children;
}
