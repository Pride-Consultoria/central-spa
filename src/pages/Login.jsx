import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, setAuthToken } from '../services/api/client';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);
        try {
            const res = await post('/auth/login', { email, password });
            const token = res?.data?.token || res?.token;
            if (token) {
                setAuthToken(token);
            }
            await get('/me').catch(() => {});
            setSuccess(true);
            setTimeout(() => navigate('/app/dashboard'), 600);
        } catch (err) {
            setError(err.message || 'Não foi possível entrar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card">
            <h1>Login</h1>
            <p>Fluxo de autenticação via token Bearer (stateless).</p>
            <form onSubmit={handleSubmit} className="form">
                <label>
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>
                    <span>Senha</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                {error && <div className="alert">{error}</div>}
                {success && <div className="success">Login realizado. Redirecionando para o dashboard...</div>}
            </form>
        </section>
    );
}
