
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../services/api/client';
import { Spinner, EmptyState } from '../components/ui';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMe = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await get('/me');
                setUser(res.data?.user || res.data);
            } catch (err) {
                setError(err.message || 'Não autenticado');
                setTimeout(() => navigate('/app/login'), 400);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, [navigate]);

    if (loading) return <Spinner />;
    if (error) return <div className="alert">{error}</div>;
    if (!user) return <EmptyState description="Nenhum usuário carregado." />;

    return (
        <section className="card">
            <h1>Dashboard</h1>
            <p>Bem-vindo, {user.name || 'usuário'}.</p>
            <ul className="muted">
                <li>Rota protegida via /api/v1/me.</li>
                <li>Autenticação via Sanctum (cookies).</li>
            </ul>
        </section>
    );
}
