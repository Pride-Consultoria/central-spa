import { useEffect, useState } from 'react';
import { get } from '../services/api/client';

export default function Landing() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        get('/home')
            .then((resp) => {
                if (mounted) {
                    setData(resp.data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(err.message || 'Erro ao carregar.');
                    setLoading(false);
                }
            });
        return () => { mounted = false; };
    }, []);

    if (loading) return <div className="card">Carregando...</div>;
    if (error) return <div className="card alert">Erro: {error}</div>;

    const hero = data?.hero || {};
    const steps = data?.steps || [];

    return (
        <div className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div className="brand">PRIDE <span style={{ color: '#fbbf24' }}>Central</span></div>
                <div className="cta">
                    <a className="btn secondary" href={hero.cta_panel}>Painel de Controle</a>
                    <a className="btn primary" href={hero.cta_compare}>Criar Comparação</a>
                </div>
            </header>
            <main style={{ marginTop: 24, display: 'grid', gap: 12 }}>
                <h1 className="hero-title">{hero.title}</h1>
                <p className="hero-sub">{hero.subtitle}</p>
                <div className="card" style={{ marginTop: 8 }}>
                    <div className="steps">
                        {steps.map((step, idx) => (
                            <div key={idx} className="step">
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
