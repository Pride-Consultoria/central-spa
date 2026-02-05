import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post, setAuthToken } from '../services/api/client';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [remember, setRemember] = useState(false);
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
            setSuccess(true);
            setTimeout(() => navigate('/app/dashboard'), 600);
        } catch (err) {
            setError(err.message || 'Não foi possível entrar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-board">
                <div className="login-board__illustration">
                    <img src="/storage/logo-pride-branco.svg" alt="Pride logo" className="login-logo" />
                </div>
                <section className="login-board__form">
                    <div className="login-form__header">
                        <h1>Log In</h1>
                        <p>Entre com seu e-mail e senha para continuar.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                        <div className="login-form__input">
                            <label>
                                <span>Email</span>
                                <input
                                    type="email"
                                    placeholder="exemplo@seudominio.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <div className="login-form__input">
                            <label>
                                <span>Senha</span>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <div className="login-form__actions">
                            <label className="checkbox-inline">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />
                                <span>Lembrar de mim</span>
                            </label>
                            <button type="submit" disabled={loading} className="login-submit">
                                {loading ? 'Entrando...' : 'Log in'}
                            </button>
                        </div>
                        {error && <div className="alert login-alert">{error}</div>}
                        {success && <div className="success login-alert">Login realizado. Redirecionando...</div>}
                    </form>
                    <div className="login-card__link">
                        <Link to="/register">Criar uma conta</Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
